"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase-browser";

function resolvePublicSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return window.location.origin;
}

export default function AuthPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/checkout");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const supabaseEnabled = hasSupabaseBrowserConfig();

  async function hydrateSessionFromMagicLinkHash() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return false;

    const hash = window.location.hash?.replace(/^#/, "");
    if (!hash) return false;

    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) return false;

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error || !data.session?.user) return false;

    // Keep query params like ?next=... but remove auth fragment.
    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState({}, "", cleanUrl);
    return true;
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") || "/checkout");
  }, []);

  useEffect(() => {
    if (!supabaseEnabled) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;

    const redirectIfAuthed = async () => {
      const { data } = await supabase.auth.getSession();
      if (active && data.session?.user) {
        router.replace(nextPath);
        return;
      }

      const restored = await hydrateSessionFromMagicLinkHash();
      if (active && restored) {
        router.replace(nextPath);
      }
    };

    redirectIfAuthed();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_IN" && session?.user) {
        router.replace(nextPath);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router, nextPath, supabaseEnabled]);

  async function requestOtp() {
    try {
      setLoading(true);
      setError("");
      setNotice("");
      if (!supabaseEnabled) {
        throw new Error("Login is not configured for this environment.");
      }
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Login is not configured for this environment.");
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${resolvePublicSiteUrl()}/auth?next=${encodeURIComponent(
            nextPath,
          )}`,
        },
      });

      if (otpError) throw otpError;
      setNotice("Magic link sent. Open it from your inbox to continue.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send magic link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-[520px] p-3 pb-8 sm:p-6">
      <section className="lux-panel p-6">
        <h1 className="text-3xl font-semibold text-slate-900">Login / Register</h1>
        <p className="mt-2 text-sm text-slate-600">Use a magic link to continue checkout and manage orders.</p>

        <div className="mt-5 space-y-3">
          <input
            type="email"
            placeholder="you@restaurant.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
          />

          {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            onClick={requestOtp}
            disabled={loading || !email.trim()}
            className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Sending link..." : "Send Magic Link"}
          </button>
        </div>

        <div className="mt-5">
          <Link href="/" className="text-sm font-semibold text-primary">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
