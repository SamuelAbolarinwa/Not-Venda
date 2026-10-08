import { shopInput, uuid, z } from "@retail/contracts";

const pendingOnboarding = z
  .object({
    actor_id: uuid,
    request_id: uuid,
    name: shopInput.shape.name,
  })
  .strict();

export type PendingOnboarding = z.infer<typeof pendingOnboarding>;

export interface OnboardingStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const prefix = "onboarding:v1:";

export function onboardingStorageKey(actorId: string) {
  return `${prefix}${uuid.parse(actorId)}`;
}

export function discardLegacyOnboarding(storage: OnboardingStorage) {
  storage.removeItem("onboarding");
}

export function loadPendingOnboarding(
  storage: OnboardingStorage,
  actorId: string,
): PendingOnboarding | null {
  const key = onboardingStorageKey(actorId);
  const raw = storage.getItem(key);
  if (raw === null) return null;
  try {
    const pending = pendingOnboarding.parse(JSON.parse(raw));
    if (pending.actor_id !== actorId) {
      storage.removeItem(key);
      return null;
    }
    return pending;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

export function getOrCreatePendingOnboarding(
  storage: OnboardingStorage,
  actorId: string,
  candidateName: string,
  createRequestId: () => string,
): PendingOnboarding {
  const existing = loadPendingOnboarding(storage, actorId);
  if (existing) return existing;

  // Parse first: invalid input must never become durable pending state.
  const canonical = shopInput.parse({
    request_id: createRequestId(),
    name: candidateName,
  });
  const pending = pendingOnboarding.parse({ actor_id: actorId, ...canonical });
  storage.setItem(onboardingStorageKey(actorId), JSON.stringify(pending));
  return pending;
}

export function clearPendingOnboarding(
  storage: OnboardingStorage,
  actorId: string,
) {
  storage.removeItem(onboardingStorageKey(actorId));
}

export function isDefinitiveOnboardingValidationRejection(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { status?: unknown; code?: unknown };
  return candidate.status === 400 && candidate.code === "INVALID_INPUT";
}
