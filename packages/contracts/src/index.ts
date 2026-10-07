import { z } from "zod";
export const uuid = z.uuid();
export const money = z
  .string()
  .regex(/^(0|[1-9][0-9]{0,18})$/)
  .refine(
    (v) =>
      /^(0|[1-9][0-9]{0,18})$/.test(v) && BigInt(v) <= 9223372036854775807n,
    "Amount exceeds BIGINT",
  );
const name = z.string().trim().min(1).max(120);
export const shopInput = z.object({ request_id: uuid, name }).strict();
export const productInput = z
  .object({
    name,
    brand: name.optional(),
    variant: name.optional(),
    base_unit: z.string().trim().min(1).max(40),
    amount_kobo: money,
    aliases: z.array(name).max(20),
    units: z
      .array(
        z
          .object({
            name: z.string().trim().min(1).max(40),
            multiplier: z.number().int().positive().max(2147483647),
          })
          .strict(),
      )
      .min(1)
      .max(20),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (!v.units.some((u) => u.name === v.base_unit && u.multiplier === 1))
      ctx.addIssue({
        code: "custom",
        message: "Include the base unit with multiplier 1",
        path: ["units"],
      });
    if (new Set(v.units.map((u) => u.name)).size !== v.units.length)
      ctx.addIssue({
        code: "custom",
        message: "Unit names must be unique",
        path: ["units"],
      });
    if (new Set(v.aliases).size !== v.aliases.length)
      ctx.addIssue({
        code: "custom",
        message: "Aliases must be unique",
        path: ["aliases"],
      });
  });
export const createProductInput = z
  .object({ request_id: uuid, product: productInput })
  .strict();
export const pagination = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(30),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
  })
  .strict();
export const shop = z.object({
  id: uuid,
  name,
  currency: z.literal("NGN"),
  timezone: z.literal("Africa/Lagos"),
  created_at: z.string(),
});
export const membership = z.object({
  shop_id: uuid,
  user_id: uuid,
  role: z.enum(["owner", "salesperson"]),
  active: z.boolean(),
  created_at: z.string(),
});
export const meResponse = z.object({
  user: z.object({ id: uuid, email: z.string().nullable() }),
  profile: z.object({
    id: uuid,
    display_name: z.string(),
    created_at: z.string(),
  }),
  memberships: z.array(membership),
});
export const product = z.object({
  id: uuid,
  shop_id: uuid,
  name,
  brand: z.string().nullable(),
  variant: z.string().nullable(),
  base_unit: z.string(),
  archived: z.boolean(),
  version: z.number().int().positive(),
  created_at: z.string(),
  amount_kobo: money.nullable(),
  aliases: z.array(z.object({ alias: z.string() })),
  units: z.array(
    z.object({ name: z.string(), multiplier: z.number().int().positive() }),
  ),
});
export const shopList = z.object({
  items: z.array(shop),
  limit: z.number(),
  offset: z.number(),
});
export const catalogueList = z.object({
  items: z.array(product),
  limit: z.number(),
  offset: z.number(),
});
export const errorEnvelope = z.object({
  code: z.string(),
  message: z.string(),
  request_id: uuid,
  details: z.unknown().optional(),
});
export type ProductInput = z.infer<typeof productInput>;
export type Product = z.infer<typeof product>;
export type Shop = z.infer<typeof shop>;
export type Me = z.infer<typeof meResponse>;
export function formatNGN(kobo: string) {
  const n = BigInt(kobo);
  return `₦${(n / 100n).toLocaleString("en-NG")}.${(n % 100n).toString().padStart(2, "0")}`;
}

export { z };
export const createdProduct = z.object({ id: uuid });
