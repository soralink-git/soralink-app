begin;
create table public.sl_aliases (
 slug text primary key check(slug ~ '^[a-z0-9-]{1,64}$'),
 card_id uuid not null references public.sl_cards(id)
);
alter table public.sl_aliases enable row level security;
revoke all on public.sl_aliases from public,anon,authenticated;
grant select on public.sl_aliases to anon,authenticated;
create policy aliases_read on public.sl_aliases for select to anon,authenticated using(sl_private.published(card_id));
insert into public.sl_aliases(slug,card_id)
 select c.slug,n.id from public.cards c
 cross join lateral (select id from public.sl_cards where name=c.name and title=coalesce(c.title,'') order by created_at limit 1) n
 where c.slug='demo';
insert into public.sl_blocks(card_id,module,content)
 select a.card_id,'vcard','{}'::jsonb from public.sl_aliases a where a.slug='demo'
 union all select a.card_id,'contact_details',jsonb_build_object('phone',coalesce(c.phone,''),'email',coalesce(c.email,''),'address',coalesce(c.city,''),'maps_url',coalesce(c.maps_url,'')) from public.sl_aliases a join public.cards c on c.slug=a.slug
 union all select a.card_id,'whatsapp',jsonb_build_object('number',coalesce(c.whatsapp,'')) from public.sl_aliases a join public.cards c on c.slug=a.slug
 union all select a.card_id,'social_links',jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('label',s.key,'url',s.value)) from jsonb_each_text(coalesce(c.social_links,'{}'::jsonb)) s where s.value ~ '^https://'),'[]'::jsonb)) from public.sl_aliases a join public.cards c on c.slug=a.slug;
notify pgrst,'reload schema';
commit;
