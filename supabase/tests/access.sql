-- Run inside the migration transaction before COMMIT for an isolated rollback test.
create temporary table sl_test_users(a uuid,b uuid,card_a uuid,card_b uuid);
insert into sl_test_users(a,b) values(gen_random_uuid(),gen_random_uuid());
insert into auth.users(id,email) select a,'sl-test-a@example.invalid' from sl_test_users union all select b,'sl-test-b@example.invalid' from sl_test_users;
grant select,update on sl_test_users to authenticated,anon;
create function pg_temp.sl_assert(ok boolean,message text) returns void language plpgsql as $$ begin if not coalesce(ok,false) then raise exception 'FAILED: %',message; end if; end; $$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','aal','aal1')::text,true) from sl_test_users;
update sl_test_users set card_a=public.sl_create_card('Client A');
select set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated','aal','aal1')::text,true) from sl_test_users;
update sl_test_users set card_b=public.sl_create_card('Client B');
select pg_temp.sl_assert((select count(*) from public.sl_cards where name='Client A')=0,'B cannot read A draft');
select pg_temp.sl_assert((select count(*) from public.sl_access where owner_id=(select a from sl_test_users))=0,'B cannot read A ownership');
do $$ begin
 begin insert into public.sl_blocks(card_id,module,content) select card_b,'gallery','{"items":[]}'::jsonb from sl_test_users; raise exception 'FAILED: Social accepted gallery'; exception when insufficient_privilege then null; end;
 begin perform public.sl_assign_card((select card_b from sl_test_users),'entreprise','profile','published','{}'::jsonb); raise exception 'FAILED: client granted itself Enterprise'; exception when insufficient_privilege then null; end;
end $$;
update public.sl_cards set name='B updated' where id=(select card_b from sl_test_users);
select pg_temp.sl_assert(exists(select 1 from public.sl_cards where name='B updated'),'Own profile can be edited');
update public.sl_cards set name='B hacked A' where id=(select card_a from sl_test_users);
reset role;
select pg_temp.sl_assert(exists(select 1 from public.sl_cards where name='Client A'),'Cross edit did not change A');
-- Admin is only effective at aal2.
insert into sl_private.admins(user_id) select b from sl_test_users;
set local role authenticated;
select pg_temp.sl_assert(not public.sl_is_admin(),'Admin at aal1 is denied');
select set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated','aal','aal2')::text,true) from sl_test_users;
select public.sl_assign_card(card_b,'vitrine','profile','published','{}'::jsonb) from sl_test_users;
insert into public.sl_blocks(card_id,module,content) select card_b,'gallery','{"items":[]}'::jsonb from sl_test_users;
reset role;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
select pg_temp.sl_assert((select count(*) from public.sl_cards where name='Client A')=0,'Anon cannot read drafts');
select pg_temp.sl_assert((select count(*) from public.sl_cards where name='B updated')=1,'Anon reads published card');
select pg_temp.sl_assert(not has_table_privilege('anon','public.sl_access','SELECT'),'Anon cannot access ownership table');
select pg_temp.sl_assert(not has_table_privilege('authenticated','public.sl_access','UPDATE'),'Client has no rights UPDATE grant');
reset role;
select jsonb_build_object('access_tests','passed','fixtures','transaction only') as result;
