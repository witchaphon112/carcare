"use client";

import Link from "next/link";
import type { SVGProps } from "react";
import { useMemo, useState } from "react";

function IconMail(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M4.5 7.5h15v9a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m5.5 8.5 6.5 5 6.5-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M7 11V8.5a5 5 0 0 1 10 0V11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6.5 11h11a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0;
  }, [email, password]);

  return (
    <form
      className="flex w-full flex-col"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);

        if (!canSubmit) {
          setError("กรุณากรอกอีเมลและรหัสผ่าน");
          return;
        }

        setSubmitting(true);
        try {
          // TODO: เชื่อม API จริง (เช่น POST /auth/login) แล้วเก็บ token/session
          await new Promise((resolve) => setTimeout(resolve, 500));
          setError("ยังไม่ได้เชื่อมระบบล็อกอินกับ API");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <label className="text-[11px] font-semibold tracking-[0.14em] text-slate-600">
        EMAIL ADDRESS
      </label>
      <div className="mt-2 relative">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
          <IconMail className="h-5 w-5" />
        </div>
        <input
          className="h-12 w-full rounded-full border border-white/60 bg-white/70 pl-12 pr-4 text-[15px] text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-sky-200 focus:bg-white focus:shadow-md focus:shadow-sky-100"
          placeholder="name@carcare.com"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <label className="mt-5 text-[11px] font-semibold tracking-[0.14em] text-slate-600">
        PASSWORD
      </label>
      <div className="mt-2 relative">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
          <IconLock className="h-5 w-5" />
        </div>
        <input
          className="h-12 w-full rounded-full border border-white/60 bg-white/70 pl-12 pr-4 text-[15px] text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-sky-200 focus:bg-white focus:shadow-md focus:shadow-sky-100"
          placeholder="••••••••"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="mt-3 flex items-center justify-end">
        <Link
          href="/forgot-password"
          className="text-xs font-semibold tracking-wide text-sky-600 hover:text-sky-700"
        >
          FORGOT PASSWORD?
        </Link>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-sky-600 to-blue-500 px-5 text-[15px] font-semibold text-white shadow-lg shadow-sky-200 transition hover:from-sky-700 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Signing In..." : "Sign In"}
      </button>

      <div className="mt-7 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <p className="mt-5 text-center text-sm text-slate-600">
        Not an admin?{" "}
        <Link
          href="/guest"
          className="font-semibold text-sky-600 hover:text-sky-700"
        >
          Return to Guest Portal
        </Link>
      </p>
    </form>
  );
}
