"use client";

import type { SVGProps } from "react";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function IconSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M16.5 16.5 21 21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBell(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 22a2.3 2.3 0 0 0 2.2-1.7H9.8A2.3 2.3 0 0 0 12 22Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <path
        d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 8.7 0 .7.6 1.3 1.3 1.3h15.4c.7 0 1.3-.6 1.3-1.3C21 16 18 16 18 9Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGear(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M19.4 12a7.7 7.7 0 0 0-.1-1l2-1.6-2-3.4-2.5 1a8.6 8.6 0 0 0-1.7-1l-.4-2.6H9.3L8.9 6a8.6 8.6 0 0 0-1.7 1l-2.5-1-2 3.4 2 1.6a7.7 7.7 0 0 0-.1 1c0 .3 0 .7.1 1l-2 1.6 2 3.4 2.5-1c.5.4 1.1.7 1.7 1l.4 2.6h5.4l.4-2.6c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.4-2-1.6c.1-.3.1-.6.1-1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4.5 7h15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4.5 12h15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4.5 17h15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Header({
  className,
  searchPlaceholder = "ค้นหาทะเบียนรถ...",
  onOpenMobileNav,
}: {
  className?: string;
  searchPlaceholder?: string;
  onOpenMobileNav?: () => void;
}) {
  return (
    <header
      className={cn(
        "w-full rounded-none border-0 bg-white px-5 py-4 shadow-none",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {onOpenMobileNav ? (
            <button
              type="button"
              onClick={onOpenMobileNav}
              aria-label="เปิดเมนู"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
            >
              <IconMenu className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden w-[340px] md:block">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <IconSearch className="h-4 w-4" />
            </div>
            <input
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:bg-white"
              placeholder={searchPlaceholder}
            />
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label="การแจ้งเตือน"
          >
            <IconBell className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label="ตั้งค่า"
          >
            <IconGear className="h-5 w-5" />
          </button>
          <div
            className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 ring-2 ring-white"
            aria-hidden="true"
          />
        </div>
      </div>
    </header>
  );
}
