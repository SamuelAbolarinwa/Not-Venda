import { describe, it, expect } from "vitest";
import { money, productInput, pagination, formatNGN } from "./index";
describe("money boundary", () => {
  it("preserves amounts above Number.MAX_SAFE_INTEGER", () => {
    expect(money.parse("9223372036854775807")).toBe("9223372036854775807");
    expect(formatNGN("9007199254740993")).toBe("₦90,071,992,547,409.93");
  });
  it.each(["-1", "1.2", "01", "1e3", "9223372036854775808", "", 1, null])(
    "rejects %s",
    (value) => expect(money.safeParse(value).success).toBe(false),
  );
});
const valid = {
  name: "Rice",
  base_unit: "piece",
  amount_kobo: "10000",
  aliases: [],
  units: [{ name: "piece", multiplier: 1 }],
};
it("requires a base unit and integer conversions", () => {
  expect(productInput.safeParse(valid).success).toBe(true);
  for (const multiplier of [0, -1, 1.5, 2147483648])
    expect(
      productInput.safeParse({
        ...valid,
        units: [{ name: "piece", multiplier }],
      }).success,
    ).toBe(false);
});
it("rejects duplicate units and aliases", () => {
  expect(
    productInput.safeParse({
      ...valid,
      units: [...valid.units, ...valid.units],
    }).success,
  ).toBe(false);
  expect(
    productInput.safeParse({ ...valid, aliases: ["rice", "rice"] }).success,
  ).toBe(false);
});
it("bounds pagination", () => {
  expect(pagination.parse({})).toEqual({ limit: 30, offset: 0 });
  expect(pagination.safeParse({ limit: 101 }).success).toBe(false);
});
