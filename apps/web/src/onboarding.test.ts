import { describe, expect, it } from "vitest";
import {
  clearPendingOnboarding,
  discardLegacyOnboarding,
  getOrCreatePendingOnboarding,
  isDefinitiveOnboardingValidationRejection,
  loadPendingOnboarding,
  onboardingStorageKey,
  type OnboardingStorage,
} from "./onboarding";

class MemoryStorage implements OnboardingStorage {
  values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

const actorA = "10000000-0000-4000-8000-000000000001";
const actorB = "10000000-0000-4000-8000-000000000003";
const requestA = "40000000-0000-4000-8000-000000000001";

describe("pending shop onboarding", () => {
  it("rejects whitespace before persisting or locking the form", () => {
    const storage = new MemoryStorage();
    expect(() =>
      getOrCreatePendingOnboarding(storage, actorA, "   ", () => requestA),
    ).toThrow();
    expect(storage.values.size).toBe(0);
    expect(loadPendingOnboarding(storage, actorA)).toBeNull();
  });

  it("retries an uncertain request with its original UUID and canonical name", () => {
    const storage = new MemoryStorage();
    const first = getOrCreatePendingOnboarding(
      storage,
      actorA,
      "  Ade's Shop  ",
      () => requestA,
    );
    const retried = getOrCreatePendingOnboarding(
      storage,
      actorA,
      "A different value is ignored while outcome is uncertain",
      () => "40000000-0000-4000-8000-000000000099",
    );
    expect(first).toEqual({
      actor_id: actorA,
      request_id: requestA,
      name: "Ade's Shop",
    });
    expect(retried).toEqual(first);
  });

  it("keeps A's uncertain request isolated across sign-out and B's sign-in", () => {
    const storage = new MemoryStorage();
    const pendingA = getOrCreatePendingOnboarding(
      storage,
      actorA,
      "Account A Shop",
      () => requestA,
    );
    // Once B's verified identity is known, only B's key is consulted.
    expect(loadPendingOnboarding(storage, actorB)).toBeNull();
    const pendingB = getOrCreatePendingOnboarding(
      storage,
      actorB,
      "Account B Shop",
      () => "40000000-0000-4000-8000-000000000002",
    );
    expect(pendingB).toMatchObject({
      actor_id: actorB,
      request_id: "40000000-0000-4000-8000-000000000002",
      name: "Account B Shop",
    });
    expect(pendingB).not.toEqual(pendingA);
    expect(loadPendingOnboarding(storage, actorA)).toEqual(pendingA);
    expect(onboardingStorageKey(actorA)).not.toBe(onboardingStorageKey(actorB));
  });

  it("drops malformed, actor-mismatched and legacy values without submitting them", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "onboarding",
      JSON.stringify({ id: requestA, name: "Legacy" }),
    );
    storage.setItem(onboardingStorageKey(actorA), "not-json");
    expect(loadPendingOnboarding(storage, actorA)).toBeNull();
    expect(storage.getItem(onboardingStorageKey(actorA))).toBeNull();

    storage.setItem(
      onboardingStorageKey(actorB),
      JSON.stringify({
        actor_id: actorA,
        request_id: requestA,
        name: "Wrong actor",
      }),
    );
    expect(loadPendingOnboarding(storage, actorB)).toBeNull();
    discardLegacyOnboarding(storage);
    expect(storage.getItem("onboarding")).toBeNull();
  });

  it("clears only a definitive validation rejection", () => {
    const storage = new MemoryStorage();
    getOrCreatePendingOnboarding(storage, actorA, "Ade's Shop", () => requestA);
    expect(
      isDefinitiveOnboardingValidationRejection({
        status: 400,
        code: "INVALID_INPUT",
      }),
    ).toBe(true);
    expect(
      isDefinitiveOnboardingValidationRejection({
        status: 503,
        code: "DATABASE_UNAVAILABLE",
      }),
    ).toBe(false);
    expect(
      isDefinitiveOnboardingValidationRejection(new TypeError("timeout")),
    ).toBe(false);
    clearPendingOnboarding(storage, actorA);
    expect(loadPendingOnboarding(storage, actorA)).toBeNull();
  });
});
