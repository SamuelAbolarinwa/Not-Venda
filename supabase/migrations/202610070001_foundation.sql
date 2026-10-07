begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check (length(display_name)<=120),
 created_at timestamptz not null default now()
);
create table public.shops (
 id uuid primary key default gen_random_uuid(), name text not null check (length(btrim(name)) between 1 and 120),
 currency text not null default 'NGN' check(currency='NGN'), timezone text not null default 'Africa/Lagos' check(timezone='Africa/Lagos'),
 created_at timestamptz not null default now()
);
create table public.memberships (
 shop_id uuid not null references public.shops(id), user_id uuid not null references public.profiles(id),
 role text not null check(role in ('owner','salesperson')), active boolean not null default true,
 created_at timestamptz not null default now(), primary key(shop_id,user_id)
);
create index memberships_user on public.memberships(user_id,shop_id) where active;
create table public.products (
 id uuid primary key default gen_random_uuid(), shop_id uuid not null references public.shops(id),
 name text not null check(length(btrim(name)) between 1 and 120), brand text check(length(brand)<=120), variant text check(length(variant)<=120),
 base_unit text not null check(length(btrim(base_unit)) between 1 and 40), archived boolean not null default false,
 version integer not null default 1 check(version>0), created_at timestamptz not null default now(), unique(shop_id,id)
);
create index products_shop_order on public.products(shop_id,created_at,id);
create table public.product_aliases (
 id uuid primary key default gen_random_uuid(), shop_id uuid not null, product_id uuid not null,
 alias text not null check(length(btrim(alias)) between 1 and 120), created_at timestamptz not null default now(),
 foreign key(shop_id,product_id) references public.products(shop_id,id), unique(shop_id,product_id,alias)
);
create table public.product_units (
 id uuid primary key default gen_random_uuid(), shop_id uuid not null, product_id uuid not null,
 name text not null check(length(btrim(name)) between 1 and 40), multiplier integer not null check(multiplier>0),
 created_at timestamptz not null default now(), foreign key(shop_id,product_id) references public.products(shop_id,id), unique(shop_id,product_id,name)
);
create table public.selling_prices (
 id uuid primary key default gen_random_uuid(), shop_id uuid not null, product_id uuid not null,
 amount_kobo bigint not null check(amount_kobo>=0), effective_at timestamptz not null default now(), version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(), foreign key(shop_id,product_id) references public.products(shop_id,id), unique(shop_id,product_id,version)
);
create table public.audit_records (
 id uuid primary key default gen_random_uuid(), shop_id uuid not null references public.shops(id), actor_id uuid not null references public.profiles(id),
 action text not null, entity_id uuid not null, request_id uuid not null, created_at timestamptz not null default now(), details jsonb not null default '{}'
);
create index audit_shop on public.audit_records(shop_id,created_at,id);
create table private.onboarding_requests (
 actor_id uuid not null references public.profiles(id), request_id uuid not null, shop_name text not null,
 shop_id uuid not null references public.shops(id), primary key(actor_id,request_id)
);
create function private.new_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id) values(new.id); return new; end $$;
revoke all on function private.new_profile() from public,anon,authenticated;
create trigger auth_profile after insert on auth.users for each row execute function private.new_profile();
create function private.is_member(target uuid, owner_only boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.memberships m where m.shop_id=target and m.user_id=auth.uid() and m.active and (not owner_only or m.role='owner'))
$$;
revoke all on function private.is_member(uuid,boolean) from public,anon,authenticated;
grant execute on function private.is_member(uuid,boolean) to authenticated;
-- No direct application writes: narrow transactional RPCs are the only mutation surface.
revoke all on all tables in schema public from anon,authenticated;
grant select on public.profiles,public.shops,public.memberships,public.products,public.product_aliases,public.product_units,public.selling_prices,public.audit_records to authenticated;
alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.memberships enable row level security;
alter table public.products enable row level security;
alter table public.product_aliases enable row level security;
alter table public.product_units enable row level security;
alter table public.selling_prices enable row level security;
alter table public.audit_records enable row level security;
create policy own_profile on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy member_shops on public.shops for select to authenticated using(private.is_member(id));
create policy own_memberships on public.memberships for select to authenticated using(user_id=(select auth.uid()) and active);
create policy member_products on public.products for select to authenticated using(private.is_member(shop_id));
create policy member_aliases on public.product_aliases for select to authenticated using(private.is_member(shop_id));
create policy member_units on public.product_units for select to authenticated using(private.is_member(shop_id));
create policy member_prices on public.selling_prices for select to authenticated using(private.is_member(shop_id));
create policy owner_audit on public.audit_records for select to authenticated using(private.is_member(shop_id,true));
create function private.immutable_audit() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'Audit records are append only' using errcode='42501'; end $$;
revoke all on function private.immutable_audit() from public,anon,authenticated;
create trigger immutable_audit before update or delete on public.audit_records for each row execute function private.immutable_audit();
create function public.create_shop(p_request_id uuid,p_name text) returns public.shops language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); prior private.onboarding_requests; result public.shops;
begin
 if actor is null then raise exception 'Unauthenticated' using errcode='42501'; end if;
 if p_request_id is null or p_name is null or length(btrim(p_name)) not between 1 and 120 then raise exception 'Invalid input' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||p_request_id::text,0));
 select * into prior from private.onboarding_requests where actor_id=actor and request_id=p_request_id;
 if found then
  if prior.shop_name<>btrim(p_name) then raise exception 'Idempotency conflict' using errcode='PT409'; end if;
  if not private.is_member(prior.shop_id) then raise exception 'Forbidden' using errcode='42501'; end if;
  select * into result from public.shops where id=prior.shop_id; return result;
 end if;
 insert into public.shops(name) values(btrim(p_name)) returning * into result;
 insert into public.memberships(shop_id,user_id,role) values(result.id,actor,'owner');
 insert into private.onboarding_requests values(actor,p_request_id,btrim(p_name),result.id);
 insert into public.audit_records(shop_id,actor_id,action,entity_id,request_id) values(result.id,actor,'shop.created',result.id,p_request_id);
 return result;
end $$;
create function public.create_product(p_shop_id uuid,p_request_id uuid,p_product jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; unit jsonb; alias_value text;
begin
 if auth.uid() is null then raise exception 'Unauthenticated' using errcode='42501'; end if;
 -- Lock membership through transaction so concurrent revocation cannot race a mutation.
 perform 1 from public.memberships where shop_id=p_shop_id and user_id=auth.uid() and active and role='owner' for share;
 if not found then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_request_id is null or p_product is null or jsonb_typeof(p_product)<>'object'
 or not (p_product ?& array['name','base_unit','amount_kobo','units','aliases'])
 or jsonb_typeof(p_product->'name')<>'string' or jsonb_typeof(p_product->'base_unit')<>'string'
 or jsonb_typeof(p_product->'amount_kobo')<>'string'
 or (p_product->>'amount_kobo') !~ '^(0|[1-9][0-9]{0,18})$'
 or jsonb_typeof(p_product->'units')<>'array' or jsonb_array_length(p_product->'units') not between 1 and 20
 or jsonb_typeof(p_product->'aliases')<>'array' or jsonb_array_length(p_product->'aliases')>20
 then raise exception 'Invalid product' using errcode='22023'; end if;
 if not exists(select 1 from jsonb_array_elements(p_product->'units') u where u->>'name'=p_product->>'base_unit' and u->>'multiplier'='1') then raise exception 'Base unit required' using errcode='22023'; end if;
 insert into public.products(shop_id,name,brand,variant,base_unit) values(p_shop_id,p_product->>'name',p_product->>'brand',p_product->>'variant',p_product->>'base_unit') returning id into result;
 for unit in select value from jsonb_array_elements(p_product->'units') loop
  if jsonb_typeof(unit->'name') is distinct from 'string' or jsonb_typeof(unit->'multiplier') is distinct from 'number' or (unit->>'multiplier') !~ '^[1-9][0-9]*$' then raise exception 'Invalid multiplier' using errcode='22023'; end if;
  insert into public.product_units(shop_id,product_id,name,multiplier) values(p_shop_id,result,unit->>'name',(unit->>'multiplier')::integer);
 end loop;
 if exists(select 1 from jsonb_array_elements(p_product->'aliases') a where jsonb_typeof(a)<>'string') then raise exception 'Invalid alias' using errcode='22023'; end if;
 for alias_value in select jsonb_array_elements_text(p_product->'aliases') loop
  insert into public.product_aliases(shop_id,product_id,alias) values(p_shop_id,result,alias_value);
 end loop;
 insert into public.selling_prices(shop_id,product_id,amount_kobo) values(p_shop_id,result,(p_product->>'amount_kobo')::bigint);
 insert into public.audit_records(shop_id,actor_id,action,entity_id,request_id,details) values(p_shop_id,auth.uid(),'product.created',result,p_request_id,jsonb_build_object('version',1));
 return result;
end $$;
-- Cast money before PostgREST JSON encoding; never round a BIGINT through JavaScript.
create view public.catalogue with (security_invoker=true) as
 select p.*, coalesce((select jsonb_agg(jsonb_build_object('alias',a.alias) order by a.alias) from public.product_aliases a where a.shop_id=p.shop_id and a.product_id=p.id),'[]'::jsonb) as aliases,
 coalesce((select jsonb_agg(jsonb_build_object('name',u.name,'multiplier',u.multiplier) order by u.multiplier,u.name) from public.product_units u where u.shop_id=p.shop_id and u.product_id=p.id),'[]'::jsonb) as units,
 (select s.amount_kobo::text from public.selling_prices s where s.shop_id=p.shop_id and s.product_id=p.id and s.effective_at<=now() order by s.version desc limit 1) as amount_kobo
 from public.products p;
grant select on public.catalogue to authenticated;
revoke all on function public.create_shop(uuid,text),public.create_product(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.create_shop(uuid,text),public.create_product(uuid,uuid,jsonb) to authenticated;
commit;
