"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
};

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function IconStation(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5.5 20.5v-12a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 20.5v-4a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 9.5h.01M12 9.5h.01M15 9.5h.01"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M9 12.5h.01M12 12.5h.01M15 12.5h.01"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconQueue(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8.5 6.5h9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M8.5 11h9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M8.5 15.5h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6.2 7.1 4.8 8.5 3.8 7.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 11.6 4.8 13 3.8 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 16.1 4.8 17.5 3.8 16.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHistory(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 7H3.8V3.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.8 7a9 9 0 1 1-1 4.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 7.5v5l3.3 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M16.8 19.5c0-2.2-2.2-4-4.8-4s-4.8 1.8-4.8 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 12.8a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M19.5 19.5c0-1.7-1.1-3.2-2.7-3.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16.7 6.3a3 3 0 0 1 0 5.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconReceipt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 3.8h10a2 2 0 0 1 2 2V21l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2V5.8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 8.5h7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M8.5 12h7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M8.5 15.5h4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPackage(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20 7.8 12 3.5 4 7.8v8.4l8 4.3 8-4.3V7.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 3.5v17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M20 7.8 12 12 4 7.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSupport(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4.5 12a7.5 7.5 0 1 1 15 0v4a2.5 2.5 0 0 1-2.5 2.5H13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4.5 12v3a2 2 0 0 0 2 2h.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M7 11.2v4.6a1.3 1.3 0 0 1-1.3 1.3H5.2A1.7 1.7 0 0 1 3.5 15.4v-3.2A1.7 1.7 0 0 1 5.2 10.5h.5A1.3 1.3 0 0 1 7 11.8Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path
        d="M21 11.2v4.6a1.3 1.3 0 0 1-1.3 1.3h-.5a1.7 1.7 0 0 1-1.7-1.7v-3.2a1.7 1.7 0 0 1 1.7-1.7h.5A1.3 1.3 0 0 1 21 11.8Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path
        d="M12.2 19.2h1.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChevron(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m10 7 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: IconQueue },
  { href: "/staff", label: "เงินเดือนพนักงาน", icon: IconUsers },
  { href: "/expenses", label: "รายจ่ายเดือนนี้", icon: IconReceipt },
  { href: "/service-history", label: "ประวัติการล้าง", icon: IconHistory },
  { href: "/wash-packages", label: "แพ็กเกจล้างรถ", icon: IconPackage },
  { href: "/customer-support", label: "ศูนย์ช่วยเหลือ", icon: IconSupport },
];

export default function Sidebar({
  className,
  stationName = "สถานีหลัก",
  stationSub = "ช่องบริการ A-1",
  collapsed = false,
  onToggleCollapsed,
  onItemClick,
}: {
  className?: string;
  stationName?: string;
  stationSub?: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-screen flex-col", className)}>
      <div
        className={cn(
          "relative flex flex-1 flex-col rounded-none border-r border-slate-200 bg-white shadow-none",
          collapsed ? "p-4" : "p-5",
        )}
      >
        {onToggleCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "ขยายแถบเมนู" : "ย่อแถบเมนู"}
            aria-pressed={collapsed}
            className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
          >
            <IconChevron
              className={cn(
                "h-5 w-5 transition-transform",
                collapsed ? "rotate-0" : "rotate-180",
              )}
            />
          </button>
        ) : null}

        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-3",
          )}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <IconStation className="h-6 w-6" />
          </div>
          <div className={cn(collapsed ? "sr-only" : "")}>
            <div className="text-sm font-semibold text-slate-900">
              {stationName}
            </div>
            <div className="text-xs text-slate-500">{stationSub}</div>
          </div>
        </div>

        <nav className={cn("mt-5 space-y-1", collapsed ? "mt-4" : "")}>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                onClick={onItemClick}
                className={cn(
                  "group flex items-center gap-3 rounded-full text-sm font-medium transition",
                  collapsed ? "justify-center px-3 py-2.5" : "px-4 py-3",
                  isActive
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl transition",
                    isActive
                      ? "bg-sky-100 text-sky-700"
                      : "bg-slate-50 text-slate-500 group-hover:bg-white",
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                </span>
                <span className={cn(collapsed ? "sr-only" : "")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />
      </div>
    </div>
  );
}
