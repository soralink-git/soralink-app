import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('Postgres grants, RLS, feature checks, client isolation and admin MFA',async()=>{
 const pg=new PGlite();try{
 await pg.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claims',true)::jsonb->>'sub','')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 grant usage on schema auth to anon,authenticated;grant execute on function auth.uid(),auth.jwt() to anon,authenticated;
 create table public.cards(slug text,name text,title text,bio text);insert into public.cards values('demo','Karim','Artisan','Démo');`);
 const migration=await readFile(new URL('../supabase/migrations/20261011170514_modular_foundation.sql',import.meta.url),'utf8');
 const tests=await readFile(new URL('../supabase/tests/access.sql',import.meta.url),'utf8');
 await pg.exec(migration.replace(/commit;\s*$/i,()=>tests+'\nrollback;'));
 const tables=await pg.query("select count(*)::int as count from information_schema.tables where table_name like 'sl_%'");assert.equal(tables.rows[0].count,0);
 }finally{await pg.close();}
});
