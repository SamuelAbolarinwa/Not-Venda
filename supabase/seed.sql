begin;
-- Disposable local fixtures only. These accounts and password must never be deployed.
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,confirmation_token,recovery_token,email_change,email_change_token_new,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',id::uuid,'authenticated','authenticated',email,extensions.crypt('LocalDemoOnly123!',extensions.gen_salt('bf')),'','','','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()
from (values
('10000000-0000-4000-8000-000000000001','owner.a@example.test'),
('10000000-0000-4000-8000-000000000002','staff.a@example.test'),
('10000000-0000-4000-8000-000000000003','owner.b@example.test'),
('10000000-0000-4000-8000-000000000004','staff.b@example.test'),
('10000000-0000-4000-8000-000000000005','inactive@example.test')) as fixture(id,email);
insert into auth.identities(id,user_id,provider_id,identity_data,provider,created_at,updated_at)
select gen_random_uuid(),id,id::text,jsonb_build_object('sub',id::text,'email',email,'email_verified',true),'email',now(),now() from auth.users where email like '%@example.test';
insert into public.shops(id,name) values('20000000-0000-4000-8000-000000000001','Ade’s Corner Shop'),('20000000-0000-4000-8000-000000000002','Bisi’s Kiosk');
insert into public.memberships(shop_id,user_id,role,active) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','owner',true),
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','salesperson',true),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003','owner',true),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000004','salesperson',true),
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000005','salesperson',false);
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.create_product('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','{"name":"Golden Morn","brand":"Nestlé","variant":"500 g","base_unit":"piece","amount_kobo":"150000","aliases":["cereal"],"units":[{"name":"piece","multiplier":1},{"name":"carton","multiplier":12}]}');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
select public.create_product('20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','{"name":"Golden Morn","brand":"Nestlé","variant":"500 g","base_unit":"piece","amount_kobo":"165000","aliases":["cereal"],"units":[{"name":"piece","multiplier":1},{"name":"carton","multiplier":12}]}');
reset role;

commit;
