"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase-browser";

export default function AuthButton() {
  const [email, setEmail] = useState<string | null>(null);
  const supabaseEnabled = hasSupabaseBrowserConfig();

  useEffect(() => {
    if (!supabaseEnabled) return;
    let mounted = true;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.session?.user?.email ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabaseEnabled]);

  const shortEmail = useMemo(() => {
    if (!email) return null;
    return email.length > 24 ? `${email.slice(0, 21)}...` : email;
  }, [email]);

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  if (!email) {
    return (
      <Link
        href="/auth?next=/"
        className="btn-secondary"
      >
        Login
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/orders"
        className="btn-secondary"
      >
        My Orders
      </Link>
      <span className="max-w-[180px] truncate rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
        {shortEmail}
      </span>
      <button onClick={signOut} className="btn-ghost">
        Logout
      </button>
    </div>
  );
}
