import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient, type Session } from "@supabase/supabase-js";
import {
  catalogueList,
  createProductInput,
  formatNGN,
  meResponse,
  shopList,
  shop,
  type Me,
  type Product,
  type Shop,
} from "@retail/contracts";
import { z, createdProduct } from "@retail/contracts";
import "./style.css";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const auth = url && key ? createClient(url, key) : null;
function App() {
  const [session, setSession] = useState<Session | null>(null),
    [restoring, setRestoring] = useState(true),
    [recovery, setRecovery] = useState(
      new URLSearchParams(location.search).has("recovery"),
    );
  const [mode, setMode] = useState<"login" | "register" | "reset">("login"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [me, setMe] = useState<Me | null>(null),
    [shops, setShops] = useState<Shop[]>([]),
    [selected, setSelected] = useState(""),
    [products, setProducts] = useState<Product[]>([]),
    [catalogueScope, setCatalogueScope] = useState<string | null>(null),
    [offset, setOffset] = useState(0),
    [loading, setLoading] = useState(false),
    [hasMore, setHasMore] = useState(false),
    [refresh, setRefresh] = useState(0);
  const [shopName, setShopName] = useState(""),
    [onboarding, setOnboarding] = useState<{ id: string; name: string } | null>(
      () => {
        try {
          return JSON.parse(sessionStorage.getItem("onboarding") ?? "null");
        } catch {
          return null;
        }
      },
    );
  const [adding, setAdding] = useState(false);
  const actionInFlight = useRef(false);
  useEffect(() => {
    if (!auth) {
      setRestoring(false);
      return;
    }
    const {
      data: { subscription },
    } = auth.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (!s) {
        setMe(null);
        setShops([]);
        setProducts([]);
        setCatalogueScope(null);
        setSelected("");
      }
    });
    void auth.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        setMessage("Please sign in again.");
        await auth!.auth.signOut({ scope: "local" });
      } else if (data.session) {
        const verified = await auth!.auth.getUser();
        if (verified.error) {
          await auth!.auth.signOut({ scope: "local" });
          setMessage("Your session has expired. Please sign in again.");
        } else setSession(data.session);
      }
      setRestoring(false);
    });
    return () => subscription.unsubscribe();
  }, []);
  async function api<T>(
    path: string,
    schema: z.ZodType<T>,
    body?: unknown,
  ): Promise<T> {
    const { data } = await auth!.auth.getSession();
    if (!data.session) throw Error("Please sign in again.");
    const response = await fetch(`/v1${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 401) await auth!.auth.signOut({ scope: "local" });
      throw Error(
        `${result.message ?? "Request failed"}${result.request_id ? ` (reference ${result.request_id})` : ""}`,
      );
    }
    return schema.parse(result);
  }
  useEffect(() => {
    if (!session || recovery) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const account = await api("/me", meResponse);
      const all: Shop[] = [];
      for (let page = 0; ; page += 100) {
        const result = await api(`/shops?limit=100&offset=${page}`, shopList);
        all.push(...result.items);
        if (result.items.length < 100) break;
      }
      if (!cancelled) {
        setMe(account);
        setShops(all);
        setSelected((current) =>
          all.some((s) => s.id === current) ? current : (all[0]?.id ?? ""),
        );
      }
    })()
      .catch((e) => !cancelled && setMessage(String(e.message)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [session?.user.id, recovery, refresh]);
  useEffect(() => {
    if (!selected || !session) return;
    let cancelled = false;
    setLoading(true);
    setProducts([]);
    setCatalogueScope(null);
    const requestedScope = `${selected}:${offset}`;
    void api(
      `/shops/${selected}/catalogue?limit=30&offset=${offset}`,
      catalogueList,
    )
      .then((result) => {
        if (!cancelled) {
          setProducts(result.items);
          setCatalogueScope(requestedScope);
          setHasMore(result.items.length === 30);
        }
      })
      .catch((e) => !cancelled && setMessage(String(e.message)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selected, offset, refresh, session?.user.id]);
  async function act(work: () => Promise<void>) {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setBusy(true);
    setMessage("");
    try {
      await work();
    } catch (e) {
      setMessage(
        e instanceof z.ZodError
          ? e.issues
              .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
              .join("; ")
          : e instanceof Error
            ? e.message
            : "Please try again.",
      );
    } finally {
      actionInFlight.current = false;
      setBusy(false);
    }
  }
  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await act(async () => {
      const email = String(form.get("email") ?? ""),
        password = String(form.get("password") ?? "");
      if (recovery) {
        const { error } = await auth!.auth.updateUser({ password });
        if (error) throw error;
        setRecovery(false);
        history.replaceState(null, "", "/");
        setMessage("Password updated.");
        return;
      }
      if (mode === "reset") {
        const { error } = await auth!.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/?recovery=1`,
        });
        if (error) throw error;
        setMessage(
          "If an account exists, a password recovery email will arrive shortly.",
        );
        return;
      }
      if (mode === "register") {
        const { data, error } = await auth!.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: location.origin },
        });
        if (error) throw error;
        if (!data.session)
          setMessage(
            "Check your email to confirm your account before signing in.",
          );
        return;
      }
      const { error } = await auth!.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    });
  }
  async function createShop(e: React.FormEvent) {
    e.preventDefault();
    await act(async () => {
      const pending = onboarding ?? {
        id: crypto.randomUUID(),
        name: shopName.trim(),
      };
      setOnboarding(pending);
      sessionStorage.setItem("onboarding", JSON.stringify(pending));
      const result = await api("/shops", shop, {
        request_id: pending.id,
        name: pending.name,
      });
      sessionStorage.removeItem("onboarding");
      setOnboarding(null);
      setShopName("");
      setSelected(result.id);
      setOffset(0);
      setRefresh((v) => v + 1);
      setMessage("Shop created.");
    });
  }
  async function createProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    await act(async () => {
      const naira = String(data.get("price"));
      if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(naira))
        throw Error("Enter a price with no more than two decimal places.");
      const [whole, fraction = ""] = naira.split(".");
      const base = String(data.get("base_unit")).trim();
      const carton = String(data.get("carton")).trim();
      const input = createProductInput.parse({
        request_id: crypto.randomUUID(),
        product: {
          name: data.get("name"),
          ...(data.get("brand") ? { brand: data.get("brand") } : {}),
          ...(data.get("variant") ? { variant: data.get("variant") } : {}),
          base_unit: base,
          amount_kobo: (
            BigInt(whole) * 100n +
            BigInt(fraction.padEnd(2, "0"))
          ).toString(),
          aliases: String(data.get("aliases"))
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          units: [
            { name: base, multiplier: 1 },
            ...(carton ? [{ name: "carton", multiplier: Number(carton) }] : []),
          ],
        },
      });
      // Product creation is not replay-safe: don't automatically retry an uncertain POST.
      try {
        await api(`/shops/${selected}/products`, createdProduct, input);
      } catch (e) {
        setRefresh((v) => v + 1);
        throw Error(
          `${e instanceof Error ? e.message : "Request failed"}. Check the catalogue before resubmitting; the product may have been saved.`,
          { cause: e },
        );
      }
      form.reset();
      setAdding(false);
      setOffset(0);
      setRefresh((v) => v + 1);
      setMessage("Product added.");
    });
  }
  const owner = me?.memberships.some(
    (m) => m.shop_id === selected && m.role === "owner",
  );
  const visibleProducts =
    catalogueScope === `${selected}:${offset}` ? products : [];
  return (
    <>
      <header>
        <a className="logo" href="/">
          K<span>·</span>
        </a>
        <div>
          <strong>Kiosk</strong>
          <small>Your shop, in order</small>
        </div>
        {session && (
          <button
            className="quiet"
            disabled={busy}
            onClick={() =>
              void act(async () => {
                const { error } = await auth!.auth.signOut();
                if (error) throw error;
                sessionStorage.removeItem("onboarding");
                setOnboarding(null);
              })
            }
          >
            Log out
          </button>
        )}
      </header>
      <main>
        {!auth ? (
          <section className="panel">
            <h1>Connect your local shop</h1>
            <p>
              Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in
              apps/web/.env, then restart the web app. See the README for local
              setup.
            </p>
          </section>
        ) : restoring ? (
          <p role="status">Restoring your session…</p>
        ) : (
          <>
            {message && (
              <div role="status" className="notice">
                {message}
                <button
                  aria-label="Dismiss message"
                  onClick={() => setMessage("")}
                >
                  ×
                </button>
              </div>
            )}
            {!session || recovery ? (
              <section className="auth panel">
                <p className="eyebrow">WELCOME TO YOUR WORKDAY</p>
                <h1>
                  {recovery
                    ? "Choose a new password"
                    : mode === "register"
                      ? "Set up your account"
                      : mode === "reset"
                        ? "Reset your password"
                        : "Welcome back."}
                </h1>
                <p>Keep your catalogue ready for the day ahead.</p>
                <form onSubmit={(e) => void authenticate(e)}>
                  {!recovery && (
                    <label>
                      Email
                      <input
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                      />
                    </label>
                  )}
                  {(recovery || mode !== "reset") && (
                    <label>
                      Password
                      <input
                        name="password"
                        type="password"
                        minLength={8}
                        autoComplete={
                          mode === "login" && !recovery
                            ? "current-password"
                            : "new-password"
                        }
                        required
                      />
                    </label>
                  )}
                  <button disabled={busy}>
                    {busy
                      ? "Please wait…"
                      : recovery
                        ? "Update password"
                        : mode === "login"
                          ? "Sign in"
                          : mode === "register"
                            ? "Create account"
                            : "Send recovery email"}
                  </button>
                </form>
                {!recovery && (
                  <nav>
                    {(["login", "register", "reset"] as const)
                      .filter((m) => m !== mode)
                      .map((m) => (
                        <button
                          className="link"
                          key={m}
                          onClick={() => {
                            setMode(m);
                            setMessage("");
                          }}
                        >
                          {m === "login"
                            ? "Sign in"
                            : m === "register"
                              ? "Create an account"
                              : "Forgot password?"}
                        </button>
                      ))}
                  </nav>
                )}
                {recovery && !session && (
                  <p>Open the link in your recovery email to continue.</p>
                )}
              </section>
            ) : (
              <>
                <div className="heading">
                  <div>
                    <p className="eyebrow">SHOP WORKSPACE</p>
                    <h1>
                      {shops.find((s) => s.id === selected)?.name ??
                        "Make room for your shop."}
                    </h1>
                    <p>
                      {me?.user.email}{" "}
                      {selected && (
                        <span className="badge">
                          {owner ? "Owner" : "Salesperson"}
                        </span>
                      )}
                    </p>
                  </div>
                  {shops.length > 0 && (
                    <label>
                      Current shop
                      <select
                        value={selected}
                        onChange={(e) => {
                          setSelected(e.target.value);
                          setOffset(0);
                          setAdding(false);
                        }}
                      >
                        {shops.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                <details className="panel" open={shops.length === 0}>
                  <summary>
                    {shops.length
                      ? "Create another shop"
                      : "Create your first shop"}
                  </summary>
                  <form onSubmit={(e) => void createShop(e)} className="inline">
                    <label>
                      Shop name
                      <input
                        required
                        maxLength={120}
                        value={onboarding?.name ?? shopName}
                        disabled={!!onboarding}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="e.g. Ade's Corner Shop"
                      />
                    </label>
                    <button disabled={busy}>
                      {busy
                        ? "Creating…"
                        : onboarding
                          ? "Retry shop creation"
                          : "Create shop"}
                    </button>
                  </form>
                  <p className="muted">Nigerian naira · Africa/Lagos</p>
                  {onboarding && (
                    <p>
                      A pending request is saved. Retry it safely to recover the
                      result.
                    </p>
                  )}
                </details>
                {selected && (
                  <section>
                    <div className="section-title">
                      <div>
                        <h2>Catalogue</h2>
                        <p>Products and current prices, all in one place.</p>
                      </div>
                      {owner && (
                        <button
                          disabled={busy}
                          onClick={() => setAdding((v) => !v)}
                        >
                          {adding ? "Close form" : "+ Add product"}
                        </button>
                      )}
                    </div>
                    {adding && owner && (
                      <form
                        className="panel product-form"
                        onSubmit={(e) => void createProduct(e)}
                      >
                        <h3>Add a product</h3>
                        <div className="fields">
                          <label>
                            Product name
                            <input
                              name="name"
                              required
                              maxLength={120}
                              placeholder="Golden Morn"
                            />
                          </label>
                          <label>
                            Brand (optional)
                            <input name="brand" maxLength={120} />
                          </label>
                          <label>
                            Variant (optional)
                            <input
                              name="variant"
                              maxLength={120}
                              placeholder="500 g"
                            />
                          </label>
                          <label>
                            Base unit
                            <input
                              name="base_unit"
                              defaultValue="piece"
                              required
                              maxLength={40}
                            />
                          </label>
                          <label>
                            Selling price per base unit (₦)
                            <input
                              name="price"
                              inputMode="decimal"
                              required
                              placeholder="1500.00"
                            />
                          </label>
                          <label>
                            Pieces in a carton (optional)
                            <input
                              name="carton"
                              type="number"
                              min="1"
                              max="2147483647"
                              step="1"
                            />
                          </label>
                          <label>
                            Aliases (optional, comma separated)
                            <input
                              name="aliases"
                              placeholder="Other names customers use"
                            />
                          </label>
                        </div>
                        <button disabled={busy}>
                          {busy ? "Saving…" : "Save product"}
                        </button>
                      </form>
                    )}
                    {loading ? (
                      <p role="status">Loading your catalogue…</p>
                    ) : visibleProducts.length === 0 ? (
                      <div className="empty panel">
                        <span>▦</span>
                        <h3>
                          {offset ? "No more products" : "A fresh shelf."}
                        </h3>
                        <p>
                          {owner
                            ? "Add your products, units and selling prices to get started."
                            : "Your owner can add products to this catalogue."}
                        </p>
                      </div>
                    ) : (
                      <div className="catalogue">
                        {visibleProducts.map((p) => (
                          <article className="product" key={p.id}>
                            <div className="product-icon">
                              {p.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <h3>{p.name}</h3>
                              <p>
                                {[p.brand, p.variant]
                                  .filter(Boolean)
                                  .join(" · ") || p.base_unit}
                              </p>
                              <small>
                                {p.units
                                  .map(
                                    (u) =>
                                      `${u.name}: ${u.multiplier} ${p.base_unit}`,
                                  )
                                  .join(" · ")}
                              </small>
                            </div>
                            <strong>
                              {p.amount_kobo === null
                                ? "No current price"
                                : formatNGN(p.amount_kobo)}
                              <small>per {p.base_unit}</small>
                            </strong>
                          </article>
                        ))}
                      </div>
                    )}
                    <div className="pagination">
                      <button
                        className="quiet"
                        disabled={offset === 0 || loading}
                        onClick={() => setOffset((v) => Math.max(0, v - 30))}
                      >
                        Previous
                      </button>
                      <span>Page {offset / 30 + 1}</span>
                      <button
                        className="quiet"
                        disabled={!hasMore || loading}
                        onClick={() => setOffset((v) => v + 30)}
                      >
                        Next
                      </button>
                      <button
                        className="link"
                        disabled={loading}
                        onClick={() => setRefresh((v) => v + 1)}
                      >
                        Refresh
                      </button>
                    </div>
                  </section>
                )}
                <footer>
                  Catalogue foundation · Sales, stock and offline capture are
                  planned for later packets.
                </footer>
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
