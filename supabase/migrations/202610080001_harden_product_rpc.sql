begin;

create or replace function public.create_product(
  p_shop_id uuid,
  p_request_id uuid,
  p_product jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  result uuid;
  unit jsonb;
  canonical_name text;
  canonical_brand text;
  canonical_variant text;
  canonical_base_unit text;
  canonical_unit_name text;
  canonical_alias text;
  unit_multiplier numeric;
begin
  if auth.uid() is null then
    raise exception 'Unauthenticated' using errcode = '42501';
  end if;

  -- Keep the membership row locked until this mutation commits so revocation
  -- cannot race an authorised catalogue write.
  perform 1
    from public.memberships
   where shop_id = p_shop_id
     and user_id = auth.uid()
     and active
     and role = 'owner'
   for share;
  if not found then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  if p_request_id is null
     or p_product is null
     or jsonb_typeof(p_product) <> 'object' then
    raise exception 'Invalid product' using errcode = '22023';
  end if;

  if exists (
    select 1
      from jsonb_object_keys(p_product) as supplied(key_name)
     where key_name <> all (
       array['name', 'brand', 'variant', 'base_unit', 'amount_kobo', 'aliases', 'units']::text[]
     )
  ) then
    raise exception 'Unknown product field' using errcode = '22023';
  end if;

  if not (p_product ?& array['name', 'base_unit', 'amount_kobo', 'aliases', 'units'])
     or jsonb_typeof(p_product -> 'name') <> 'string'
     or jsonb_typeof(p_product -> 'base_unit') <> 'string'
     or jsonb_typeof(p_product -> 'amount_kobo') <> 'string'
     or (p_product ? 'brand' and jsonb_typeof(p_product -> 'brand') <> 'string')
     or (p_product ? 'variant' and jsonb_typeof(p_product -> 'variant') <> 'string') then
    raise exception 'Invalid product fields' using errcode = '22023';
  end if;

  canonical_name := btrim(p_product ->> 'name');
  canonical_brand := case when p_product ? 'brand' then btrim(p_product ->> 'brand') end;
  canonical_variant := case when p_product ? 'variant' then btrim(p_product ->> 'variant') end;
  canonical_base_unit := btrim(p_product ->> 'base_unit');

  if length(canonical_name) not between 1 and 120
     or length(canonical_base_unit) not between 1 and 40
     or (canonical_brand is not null and length(canonical_brand) not between 1 and 120)
     or (canonical_variant is not null and length(canonical_variant) not between 1 and 120) then
    raise exception 'Invalid product text' using errcode = '22023';
  end if;

  if (p_product ->> 'amount_kobo') !~ '^(0|[1-9][0-9]{0,18})$' then
    raise exception 'Invalid amount' using errcode = '22023';
  end if;
  if (p_product ->> 'amount_kobo')::numeric > 9223372036854775807 then
    raise exception 'Invalid amount' using errcode = '22023';
  end if;

  if jsonb_typeof(p_product -> 'units') <> 'array'
     or jsonb_typeof(p_product -> 'aliases') <> 'array' then
    raise exception 'Invalid product collections' using errcode = '22023';
  end if;
  if jsonb_array_length(p_product -> 'units') not between 1 and 20
     or jsonb_array_length(p_product -> 'aliases') > 20 then
    raise exception 'Invalid product collections' using errcode = '22023';
  end if;

  for unit in select value from jsonb_array_elements(p_product -> 'units') loop
    if jsonb_typeof(unit) <> 'object' then
      raise exception 'Invalid unit' using errcode = '22023';
    end if;
    if not (unit ?& array['name', 'multiplier']) then
      raise exception 'Invalid unit' using errcode = '22023';
    end if;
    if exists (
      select 1
        from jsonb_object_keys(unit) as supplied(key_name)
       where key_name <> all (array['name', 'multiplier']::text[])
    ) then
      raise exception 'Unknown unit field' using errcode = '22023';
    end if;
    if jsonb_typeof(unit -> 'name') <> 'string'
       or jsonb_typeof(unit -> 'multiplier') <> 'number' then
      raise exception 'Invalid unit values' using errcode = '22023';
    end if;

    canonical_unit_name := btrim(unit ->> 'name');
    unit_multiplier := (unit ->> 'multiplier')::numeric;
    if length(canonical_unit_name) not between 1 and 40
       or unit_multiplier <> trunc(unit_multiplier)
       or unit_multiplier < 1
       or unit_multiplier > 2147483647 then
      raise exception 'Invalid unit values' using errcode = '22023';
    end if;
  end loop;

  if exists (
    select 1
      from (
        select btrim(value ->> 'name') as canonical_name, count(*)
          from jsonb_array_elements(p_product -> 'units')
         group by btrim(value ->> 'name')
        having count(*) > 1
      ) duplicates
  ) then
    raise exception 'Duplicate unit' using errcode = '22023';
  end if;

  if not exists (
    select 1
      from jsonb_array_elements(p_product -> 'units') as candidates(candidate)
     where btrim(candidate ->> 'name') = canonical_base_unit
       and (candidate ->> 'multiplier')::numeric = 1
  ) then
    raise exception 'Base unit required' using errcode = '22023';
  end if;

  if exists (
    select 1
      from jsonb_array_elements(p_product -> 'aliases') as aliases(alias_json)
     where jsonb_typeof(alias_json) <> 'string'
  ) then
    raise exception 'Invalid alias' using errcode = '22023';
  end if;

  for canonical_alias in
    select btrim(value) from jsonb_array_elements_text(p_product -> 'aliases')
  loop
    if length(canonical_alias) not between 1 and 120 then
      raise exception 'Invalid alias' using errcode = '22023';
    end if;
  end loop;

  if exists (
    select 1
      from (
        select btrim(value) as canonical_alias, count(*)
          from jsonb_array_elements_text(p_product -> 'aliases')
         group by btrim(value)
        having count(*) > 1
      ) duplicates
  ) then
    raise exception 'Duplicate alias' using errcode = '22023';
  end if;

  insert into public.products(shop_id, name, brand, variant, base_unit)
  values (
    p_shop_id,
    canonical_name,
    canonical_brand,
    canonical_variant,
    canonical_base_unit
  )
  returning id into result;

  for unit in select value from jsonb_array_elements(p_product -> 'units') loop
    insert into public.product_units(shop_id, product_id, name, multiplier)
    values (
      p_shop_id,
      result,
      btrim(unit ->> 'name'),
      ((unit ->> 'multiplier')::numeric)::integer
    );
  end loop;

  for canonical_alias in
    select btrim(value) from jsonb_array_elements_text(p_product -> 'aliases')
  loop
    insert into public.product_aliases(shop_id, product_id, alias)
    values (p_shop_id, result, canonical_alias);
  end loop;

  insert into public.selling_prices(shop_id, product_id, amount_kobo)
  values (p_shop_id, result, (p_product ->> 'amount_kobo')::bigint);

  insert into public.audit_records(
    shop_id,
    actor_id,
    action,
    entity_id,
    request_id,
    details
  ) values (
    p_shop_id,
    auth.uid(),
    'product.created',
    result,
    p_request_id,
    jsonb_build_object('version', 1)
  );

  return result;
end
$$;

revoke all on function public.create_product(uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_product(uuid, uuid, jsonb)
  to authenticated;

commit;
