import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('Postgres grants, RLS, feature checks, client isolation and admin MFA',async()=>{
 const pg=new PGlite();try{
 await pg.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claims',true)::jsonb->>'sub','')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 grant usage on schema auth to anon,authenticated;grant execute on function auth.uid(),auth.jwt() to anon,authenticated;
 create table public.cards(slug text,name text,title text,bio text,phone text,email text,whatsapp text,city text,maps_url text,social_links jsonb);insert into public.cards(slug,name,title,bio) values('demo','Karim','Artisan','Démo');`);
 await pg.exec(`create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to anon,authenticated;grant select,insert on storage.objects to anon,authenticated;create function storage.allow_any_operation(text[]) returns boolean language sql as $$select true$$;`);
 const migration=await readFile(new URL('../supabase/migrations/20261011170514_modular_foundation.sql',import.meta.url),'utf8');
 const tests=await readFile(new URL('../supabase/tests/access.sql',import.meta.url),'utf8');
 await pg.exec(migration);
 await pg.exec(await readFile(new URL('../supabase/migrations/20261011182639_permanent_aliases.sql',import.meta.url),'utf8'));
 await pg.exec(await readFile(new URL('../supabase/migrations/20261011221553_protected_media_uploads.sql',import.meta.url),'utf8'));
 await pg.exec('begin;'+await readFile(new URL('../supabase/tests/media.sql',import.meta.url),'utf8')+'\nrollback;');
 await pg.exec('begin;'+tests+'\nrollback;');
 const accounts=await pg.query('select count(*)::int as count from auth.users');assert.equal(accounts.rows[0].count,0);
 const aliases=await pg.query("select count(*)::int as count from public.sl_aliases where slug='demo'");assert.equal(aliases.rows[0].count,1);
 }finally{await pg.close();}
});
