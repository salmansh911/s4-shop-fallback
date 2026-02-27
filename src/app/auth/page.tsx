"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase-browser";

export default function AuthPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/checkout");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const supabaseEnabled = hasSupabaseBrowserConfig();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") || "/checkout");
  }, []);

  useEffect(() => {
    if (!supabaseEnabled) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        router.replace(nextPath);
      }
    });
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
        options: { shouldCreateUser: true },
      });

      if (otpError) throw otpError;
      setStep("verify");
      setNotice("OTP sent. Check your inbox and enter the code.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    try {
      setLoading(true);
      setError("");
      if (!supabaseEnabled) {
        throw new Error("Login is not configured for this environment.");
      }
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Login is not configured for this environment.");
      }

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: "email",
      });

      if (verifyError) throw verifyError;
      if (!data.session?.user) throw new Error("Verification succeeded but session is missing");
      router.replace(nextPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to verify OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-[520px] p-3 pb-8 sm:p-6">
      <section className="lux-panel p-6">
        <h1 className="text-3xl font-semibold text-slate-900">Login / Register</h1>
        <p className="mt-2 text-sm text-slate-600">Use email OTP to continue checkout and manage orders.</p>

        <div className="mt-5 space-y-3">
          <input
            type="email"
            placeholder="you@restaurant.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
            disabled={step === "verify"}
          />

          {step === "verify" ? (
            <input
              placeholder="6-digit OTP"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          ) : null}

          {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {step === "email" ? (
            <button
              onClick={requestOtp}
              disabled={loading || !email.trim()}
              className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => {
                  setStep("email");
                  setToken("");
                }}
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
              >
                Change email
              </button>
              <button
                onClick={verifyOtp}
                disabled={loading || token.trim().length < 6}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          )}
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
