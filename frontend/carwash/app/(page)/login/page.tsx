import type { Metadata } from "next";
import type { SVGProps } from "react";
import LoginForm from "./login-form";

function IconDroplet(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2.5c2.5 3 6.5 7.3 6.5 11.2A6.5 6.5 0 1 1 5.5 13.7C5.5 9.8 9.5 5.5 12 2.5Z"
        fill="currentColor"
      />
      <path
        d="M9.2 14.2c.4 1.6 1.7 2.9 3.3 3.3"
        stroke="white"
        strokeOpacity="0.85"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "Admin Access",
  description: "Sign in to manage the queue",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-sky-200 via-sky-50 to-white px-4 py-10">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.18),transparent_45%),radial-gradient(circle_at_70%_10%,rgba(14,165,233,0.20),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(56,189,248,0.16),transparent_50%)]" />

      <main className="relative w-full max-w-[420px]">
        <div className="rounded-[28px] border border-white/70 bg-white/70 p-7 shadow-[0_30px_80px_-40px_rgba(2,132,199,0.55)] backdrop-blur">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 shadow-inner">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-200 text-sky-700">
                <IconDroplet className="h-6 w-6" />
              </div>
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">
              Admin Access
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Please sign in to manage the queue
            </p>
          </div>

          <div className="mt-7">
            <LoginForm />
          </div>

          <div className="mt-7 flex flex-col items-center gap-3 text-[11px] tracking-[0.18em] text-slate-400">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            <div className="flex items-center gap-4">
              <span>© {new Date().getFullYear()} CARCARE</span>
              <span className="h-3 w-px bg-slate-200" />
              <span>PRIVACY</span>
              <span>TERMS</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
