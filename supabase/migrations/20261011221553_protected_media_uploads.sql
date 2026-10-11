-- Private bucket; published assets remain governed by current card rights.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('soralink-media','soralink-media',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do nothing;
create function sl_private.media_parts(path text) returns text[] language plpgsql immutable set search_path='' as $$
begin
 if path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(identity|gallery|pdf_catalog)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|pdf)$' then return null;end if;
 if (split_part(path,'/',2)='pdf_catalog') is distinct from (path like '%.pdf') then return null;end if;
 return string_to_array(path,'/');
end;$$;
create function sl_private.media_owner(path text) returns boolean language plpgsql stable security definer set search_path='' as $$
declare parts text[]:=sl_private.media_parts(path);
begin
 if parts is null then return false;end if;
 return sl_private.owns(parts[1]::uuid) or sl_private.is_admin();
end;$$;
create function sl_private.media_upload_allowed(path text) returns boolean language plpgsql stable security definer set search_path='' as $$
declare parts text[]:=sl_private.media_parts(path);objects_count bigint;
begin
 if parts is null or not sl_private.media_owner(path) then return false;end if;
 if not sl_private.allowed(parts[1]::uuid,parts[2]) then return false;end if;
 select count(*) into objects_count from storage.objects where bucket_id='soralink-media' and name like parts[1]||'/%';
 return objects_count<40;
end;$$;
create function sl_private.media_published(path text) returns boolean language plpgsql stable security definer set search_path='' as $$
declare parts text[]:=sl_private.media_parts(path);
begin
 if parts is null then return false;end if;
 if not sl_private.published(parts[1]::uuid) or not sl_private.allowed(parts[1]::uuid,parts[2]) then return false;end if;
 return exists(select 1 from public.sl_blocks b where b.card_id=parts[1]::uuid and b.module=parts[2] and b.enabled and
 ((parts[2]='identity' and b.content->>'image'='/media/'||path)
 or (parts[2]='pdf_catalog' and b.content->>'url'='/media/'||path)
 or (parts[2]='gallery' and exists(select 1 from jsonb_array_elements(coalesce(b.content->'items','[]'::jsonb)) item where item->>'url'='/media/'||path))));
end;$$;
revoke all on function sl_private.media_parts(text),sl_private.media_owner(text),sl_private.media_upload_allowed(text),sl_private.media_published(text) from public,anon,authenticated;
grant execute on function sl_private.media_owner(text),sl_private.media_upload_allowed(text) to authenticated;
grant execute on function sl_private.media_published(text) to anon,authenticated;
create policy sl_media_upload on storage.objects for insert to authenticated with check(bucket_id='soralink-media' and sl_private.media_upload_allowed(name));
create policy sl_media_owner_read on storage.objects for select to authenticated using(bucket_id='soralink-media' and sl_private.media_owner(name));
create policy sl_media_public_read on storage.objects for select to anon,authenticated using(bucket_id='soralink-media' and storage.allow_any_operation(array['object.get_authenticated_info','object.get_authenticated']) and sl_private.media_published(name));
-- Immutable uploads: replacements receive a new random name. No UPDATE grant.
