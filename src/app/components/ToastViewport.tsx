"use client";

import { useToastStore } from "@/lib/toast-store";

export default function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-4 z-50 space-y-2 sm:inset-x-auto sm:right-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-lg sm:max-w-[380px]"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
