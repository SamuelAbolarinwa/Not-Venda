begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$select public.create_product('20000000-0000-4000-8000-000000000001', gen_random_uuid(), '{"name":"RPC invalid brand","brand":{"value":"Brand"},"base_unit":"piece","amount_kobo":"100","aliases":[],"units":[{"name":"piece","multiplier":1}]}')$$,
  '22023', null, 'RPC rejects object brand'
);
select throws_ok(
  $$select public.create_product('20000000-0000-4000-8000-000000000001', gen_random_uuid(), '{"name":"RPC invalid variant","variant":12,"base_unit":"piece","amount_kobo":"100","aliases":[],"units":[{"name":"piece","multiplier":1}]}')$$,
  '22023', null, 'RPC rejects numeric variant'
);
select throws_ok(
  $$select public.create_product('20000000-0000-4000-8000-000000000001', gen_random_uuid(), '{"name":"RPC invalid unknown","base_unit":"piece","amount_kobo":"100","aliases":[],"units":[{"name":"piece","multiplier":1}],"unexpected":true}')$$,
  '22023', null, 'RPC rejects unknown product fields'
);
select throws_ok(
  $$select public.create_product('20000000-0000-4000-8000-000000000001', gen_random_uuid(), '{"name":"RPC invalid duplicate units","base_unit":"piece","amount_kobo":"100","aliases":[],"units":[{"name":"piece","multiplier":1},{"name":"piece ","multiplier":2}]}')$$,
  '22023', null, 'RPC rejects whitespace-equivalent units'
);
select throws_ok(
  $$select public.create_product('20000000-0000-4000-8000-000000000001', gen_random_uuid(), '{"name":"RPC invalid duplicate aliases","base_unit":"piece","amount_kobo":"100","aliases":["rpc-invalid-alias"," rpc-invalid-alias "],"units":[{"name":"piece","multiplier":1}]}')$$,
  '22023', null, 'RPC rejects whitespace-equivalent aliases'
);
select throws_ok(
  $$select public.create_product('20000000-0000-4000-8000-000000000001', gen_random_uuid(), '{"name":"RPC invalid unit field","base_unit":"piece","amount_kobo":"100","aliases":[],"units":[{"name":"piece","multiplier":1,"unexpected":true}]}')$$,
  '22023', null, 'RPC rejects unknown unit fields'
);
select throws_ok(
  $$select public.create_product('20000000-0000-4000-8000-000000000001', gen_random_uuid(), '{"name":"RPC invalid multiplier","base_unit":"piece","amount_kobo":"100","aliases":[],"units":[{"name":"piece","multiplier":"1"}]}')$$,
  '22023', null, 'RPC rejects string multipliers'
);
select throws_ok(
  $$select public.create_product('20000000-0000-4000-8000-000000000001', gen_random_uuid(), '{"name":"RPC invalid alias object","base_unit":"piece","amount_kobo":"100","aliases":[{"name":"rpc-invalid-object"}],"units":[{"name":"piece","multiplier":1}]}')$$,
  '22023', null, 'RPC rejects nested alias objects'
);
select throws_ok(
  $$select public.create_product('20000000-0000-4000-8000-000000000001', gen_random_uuid(), '{"name":"RPC invalid empty brand","brand":"   ","base_unit":"piece","amount_kobo":"100","aliases":[],"units":[{"name":"piece","multiplier":1}]}')$$,
  '22023', null, 'RPC rejects optional text that normalises empty'
);

reset role;
select is(
  (select count(*)::integer from public.products where name like 'RPC invalid%'),
  0,
  'Rejected RPCs leave no products'
);
select is(
  (select count(*)::integer from public.product_aliases),
  2,
  'Rejected RPCs leave no aliases'
);
select is(
  (select count(*)::integer from public.product_units),
  4,
  'Rejected RPCs leave no units'
);
select is(
  (select count(*)::integer from public.selling_prices),
  2,
  'Rejected RPCs leave no prices'
);
select is(
  (select count(*)::integer from public.audit_records where action = 'product.created'),
  2,
  'Rejected RPCs leave no audit records'
);

set local role authenticated;
select lives_ok(
  $$select public.create_product('20000000-0000-4000-8000-000000000001', gen_random_uuid(), '{"name":"  RPC valid product  ","brand":"  Brand  ","variant":"  500 g  ","base_unit":" piece ","amount_kobo":"9007199254740993","aliases":["  rpc-valid-alias  "],"units":[{"name":" piece ","multiplier":1},{"name":" carton ","multiplier":12}]}')$$,
  'RPC accepts and canonicalises a valid direct request'
);
reset role;
select is(
  (select name || '|' || brand || '|' || variant || '|' || base_unit from public.products where name = 'RPC valid product'),
  'RPC valid product|Brand|500 g|piece',
  'RPC stores canonical product text'
);
select is(
  (select array_agg(name order by name)::text from public.product_units where product_id = (select id from public.products where name = 'RPC valid product')),
  '{carton,piece}',
  'RPC stores canonical unit names'
);
select is(
  (select alias from public.product_aliases where product_id = (select id from public.products where name = 'RPC valid product')),
  'rpc-valid-alias',
  'RPC stores canonical aliases'
);
select is(
  (select amount_kobo::text from public.selling_prices where product_id = (select id from public.products where name = 'RPC valid product')),
  '9007199254740993',
  'RPC preserves BIGINT money exactly'
);

select * from finish();
rollback;
