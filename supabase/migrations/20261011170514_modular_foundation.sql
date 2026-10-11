-- Additive foundation. Existing public.cards and its demo are preserved.
begin;
create schema if not exists sl_private;
revoke all on schema sl_private from public;
grant usage on schema sl_private to anon, authenticated;

create table public.sl_plans (
 code text primary key, name text not null, modules jsonb not null,
 gallery_limit integer not null default 6 check(gallery_limit between 0 and 50)
);
insert into public.sl_plans(code,name,modules) values
 ('social','Social','["identity","social_links","whatsapp"]'),
 ('pro','Pro Contact','["identity","social_links","whatsapp","contact_details","vcard"]'),
 ('vitrine','Vitrine','["identity","social_links","whatsapp","contact_details","vcard","gallery","pdf_catalog","opening_hours"]'),
 ('entreprise','Entreprise','["identity","social_links","whatsapp","contact_details","vcard","gallery","pdf_catalog","opening_hours","booking_link"]'),
 ('solution_speciale','Solution Spéciale','["identity","whatsapp"]');
create table public.sl_cards (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(name) between 1 and 120),
 title text not null default '' check(char_length(title)<=160),
 bio text not null default '' check(char_length(bio)<=2000),
 name_ar text not null default '' check(char_length(name_ar)<=120),
 title_ar text not null default '' check(char_length(title_ar)<=160),
 bio_ar text not null default '' check(char_length(bio_ar)<=2000),
 created_at timestamptz not null default now()
);
create table public.sl_access (
 card_id uuid primary key references public.sl_cards(id),
 owner_id uuid references auth.users(id) on delete restrict,
 plan_code text not null references public.sl_plans(code),
 mode text not null default 'profile' check(mode in ('profile','menu','reviews','event','product')),
 status text not null default 'draft' check(status in ('draft','published','suspended')),
 overrides jsonb not null default '{}'::jsonb check(jsonb_typeof(overrides)='object'),
 revision bigint not null default 1
);
create index sl_access_owner on public.sl_access(owner_id);
create table public.sl_blocks (
 card_id uuid not null references public.sl_cards(id),
 module text not null,
 enabled boolean not null default true,
 content jsonb not null default '{}'::jsonb check(jsonb_typeof(content)='object'),
 primary key(card_id,module)
);
create table sl_private.admins(user_id uuid primary key references auth.users(id));
create table sl_private.audit(id bigint generated always as identity primary key,actor uuid,card_id uuid,action text,created_at timestamptz not null default now());
alter table public.sl_plans enable row level security;
alter table public.sl_cards enable row level security;
alter table public.sl_access enable row level security;
alter table public.sl_blocks enable row level security;
alter table sl_private.admins enable row level security;
alter table sl_private.audit enable row level security;
revoke all on public.sl_plans,public.sl_cards,public.sl_access,public.sl_blocks from public,anon,authenticated;
revoke all on sl_private.admins,sl_private.audit from public,anon,authenticated;
grant select on public.sl_plans,public.sl_cards,public.sl_blocks to anon,authenticated;
grant select on public.sl_access to authenticated;
grant update(name,title,bio,name_ar,title_ar,bio_ar) on public.sl_cards to authenticated;
grant insert,update,select on public.sl_blocks to authenticated;

-- Private, fixed SQL helpers. Not exposed as REST schemas. No user_metadata auth.
create function sl_private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.jwt()->>'aal')='aal2' and exists(select 1 from sl_private.admins where user_id=(select auth.uid()));
$$;
create function sl_private.owns(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.sl_access where card_id=target and owner_id=(select auth.uid()));
$$;
create function sl_private.published(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.sl_access where card_id=target and status='published');
$$;
create function sl_private.modules_for(target uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
 declare a public.sl_access; mods jsonb; k text; v jsonb;
 begin
 select * into a from public.sl_access where card_id=target;
 if not found then return '[]'::jsonb; end if;
 select modules into mods from public.sl_plans where code=a.plan_code;
 if a.plan_code='solution_speciale' then
 mods:=mods || case a.mode when 'menu' then '["restaurant_menu","opening_hours"]'::jsonb when 'reviews' then '["reviews_link"]'::jsonb when 'event' then '["event_program"]'::jsonb when 'product' then '["product_listing","gallery","contact_details"]'::jsonb else '[]'::jsonb end;
 end if;
 for k,v in select * from jsonb_each(a.overrides) loop
 if v='false'::jsonb then mods:=mods-k; elsif v='true'::jsonb and not mods ? k then mods:=mods||jsonb_build_array(k); end if;
 end loop;
 return mods;
 end;
$$;
create function sl_private.allowed(target uuid, feature text) returns boolean language sql stable security definer set search_path='' as $$
 select sl_private.modules_for(target) ? feature;
$$;
revoke all on function sl_private.is_admin(),sl_private.owns(uuid),sl_private.published(uuid),sl_private.modules_for(uuid),sl_private.allowed(uuid,text) from public;
grant execute on function sl_private.is_admin(),sl_private.owns(uuid) to authenticated;
grant execute on function sl_private.published(uuid),sl_private.allowed(uuid,text) to anon,authenticated;
-- modules_for is used internally by privileged functions, not granted to clients.
create policy plan_read on public.sl_plans for select to anon,authenticated using(true);
create policy card_read_public on public.sl_cards for select to anon using(sl_private.published(id));
create policy card_read_client on public.sl_cards for select to authenticated using(sl_private.published(id) or sl_private.owns(id) or sl_private.is_admin());
create policy card_edit on public.sl_cards for update to authenticated using(sl_private.owns(id) or sl_private.is_admin()) with check(sl_private.owns(id) or sl_private.is_admin());
create policy access_read on public.sl_access for select to authenticated using(owner_id=(select auth.uid()) or sl_private.is_admin());
create policy block_read_public on public.sl_blocks for select to anon using(enabled and sl_private.published(card_id) and sl_private.allowed(card_id,module));
create policy block_read_client on public.sl_blocks for select to authenticated using(sl_private.owns(card_id) or sl_private.is_admin() or (enabled and sl_private.published(card_id) and sl_private.allowed(card_id,module)));
create policy block_insert on public.sl_blocks for insert to authenticated with check((sl_private.owns(card_id) or sl_private.is_admin()) and sl_private.allowed(card_id,module));
create policy block_update on public.sl_blocks for update to authenticated using(sl_private.owns(card_id) or sl_private.is_admin()) with check((sl_private.owns(card_id) or sl_private.is_admin()) and sl_private.allowed(card_id,module));

-- Enforce delivered module registry and DB limits even via direct REST writes.
create function sl_private.validate_block() returns trigger language plpgsql security definer set search_path='' as $$
 declare max_images integer;
 begin
 if new.module not in ('identity','social_links','whatsapp','contact_details','vcard','gallery','pdf_catalog','opening_hours','booking_link','restaurant_menu','reviews_link','event_program','product_listing') then raise exception 'Module unavailable'; end if;
 if octet_length(new.content::text)>32000 then raise exception 'Content too large'; end if;
 if new.module='gallery' then
 select p.gallery_limit into max_images from public.sl_access a join public.sl_plans p on p.code=a.plan_code where a.card_id=new.card_id;
 if jsonb_typeof(new.content->'items') is distinct from 'array' or jsonb_array_length(new.content->'items')>max_images then raise exception 'Gallery limit exceeded'; end if;
 end if;
 if new.module='restaurant_menu' and (jsonb_typeof(new.content->'items') is distinct from 'array' or jsonb_array_length(new.content->'items')>100) then raise exception 'Menu limit exceeded'; end if;
 return new;
 end;
$$;
revoke all on function sl_private.validate_block() from public,anon,authenticated;
create trigger sl_validate_block before insert or update on public.sl_blocks for each row execute function sl_private.validate_block();

create function sl_private.create_card(display_name text) returns uuid language plpgsql security definer set search_path='' as $$
 declare result uuid;
 begin
 if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
 -- Serialize per owner, so simultaneous requests cannot bypass the one-card pilot limit.
 perform pg_advisory_xact_lock(hashtextextended((select auth.uid())::text,0));
 if exists(select 1 from public.sl_access where owner_id=(select auth.uid())) then raise exception 'A card already exists'; end if;
 insert into public.sl_cards(name) values(display_name) returning id into result;
 insert into public.sl_access(card_id,owner_id,plan_code) values(result,(select auth.uid()),'social');
 return result;
 end;
$$;
create function public.sl_create_card(display_name text) returns uuid language sql security invoker set search_path='' as $$ select sl_private.create_card(display_name); $$;
create function sl_private.my_rights(target uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
 declare a public.sl_access;
 begin
 if not sl_private.owns(target) and not sl_private.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 select * into a from public.sl_access where card_id=target;
 return jsonb_build_object('plan',a.plan_code,'status',a.status,'mode',a.mode,'modules',sl_private.modules_for(target),'revision',a.revision);
 end;
$$;
create function public.sl_my_rights(target uuid) returns jsonb language sql security invoker set search_path='' as $$ select sl_private.my_rights(target); $$;
create function public.sl_is_admin() returns boolean language sql security invoker set search_path='' as $$ select sl_private.is_admin(); $$;
create function sl_private.assign_card(target uuid,new_plan text,new_mode text,new_status text,new_overrides jsonb) returns void language plpgsql security definer set search_path='' as $$
 declare k text;v jsonb;
 begin
 if not sl_private.is_admin() then raise exception 'Administrator with MFA required' using errcode='42501'; end if;
 if jsonb_typeof(new_overrides) is distinct from 'object' then raise exception 'Invalid overrides'; end if;
 for k,v in select * from jsonb_each(new_overrides) loop
 if k not in ('identity','social_links','whatsapp','contact_details','vcard','gallery','pdf_catalog','opening_hours','booking_link','restaurant_menu','reviews_link','event_program','product_listing') or v not in ('true'::jsonb,'false'::jsonb) then raise exception 'Invalid module override'; end if;
 end loop;
 if new_plan<>'solution_speciale' and new_mode<>'profile' then raise exception 'Invalid plan/mode'; end if;
 update public.sl_access set plan_code=new_plan,mode=new_mode,status=new_status,overrides=new_overrides,revision=revision+1 where card_id=target;
 if not found then raise exception 'Card not found'; end if;
 insert into sl_private.audit(actor,card_id,action) values((select auth.uid()),target,'assign:'||new_plan||':'||new_status);
 end;
$$;
create function public.sl_assign_card(target uuid,new_plan text,new_mode text,new_status text,new_overrides jsonb default '{}'::jsonb) returns void language sql security invoker set search_path='' as $$ select sl_private.assign_card(target,new_plan,new_mode,new_status,new_overrides); $$;
revoke all on function public.sl_create_card(text), public.sl_my_rights(uuid), public.sl_is_admin(), public.sl_assign_card(uuid,text,text,text,jsonb) from public,anon,authenticated;
revoke all on function sl_private.create_card(text),sl_private.my_rights(uuid),sl_private.assign_card(uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.sl_create_card(text),public.sl_my_rights(uuid),public.sl_is_admin(),public.sl_assign_card(uuid,text,text,text,jsonb) to authenticated;
grant execute on function sl_private.create_card(text),sl_private.my_rights(uuid),sl_private.assign_card(uuid,text,text,text,jsonb) to authenticated;

-- Copy only the existing public demonstration, with a new permanent identifier.
with demo as (
 insert into public.sl_cards(name,title,bio)
 select name,coalesce(title,''),coalesce(bio,'') from public.cards where slug='demo'
 returning id
)
insert into public.sl_access(card_id,plan_code,status) select id,'vitrine','published' from demo;
notify pgrst,'reload schema';
commit;
