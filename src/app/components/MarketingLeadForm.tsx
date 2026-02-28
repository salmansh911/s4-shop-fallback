"use client";

import { useState } from "react";

export default function MarketingLeadForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setMessage("");
      const response = await fetch("/api/marketing/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "footer" }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || "Unable to submit");
      }
      setMessage("Thanks. We will share launch offers soon.");
      setEmail("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email for offers"
        className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Get offers"}
      </button>
      {message ? <p className="text-xs text-slate-600 sm:ml-2 sm:self-center">{message}</p> : null}
    </form>
  );
}
