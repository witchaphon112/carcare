"use client";

import { useEffect, useState } from "react";
import Header from "../layout/header";
import Sidebar from "../layout/sidebar";

const STORAGE_KEY = "carcare.admin.sidebarCollapsed";

export default function AdminShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_30%_12%,rgba(59,130,246,0.12),transparent_45%),radial-gradient(circle_at_72%_10%,rgba(14,165,233,0.14),transparent_40%),radial-gradient(circle_at_55%_80%,rgba(56,189,248,0.10),transparent_55%)]" />

      <div
        className={[
          "relative grid w-full grid-cols-1 gap-0 md:transition-[grid-template-columns] md:duration-300 md:ease-in-out",
          collapsed ? "md:grid-cols-[92px_1fr]" : "md:grid-cols-[280px_1fr]",
        ].join(" ")}
      >
        <aside className="hidden md:block">
          <Sidebar
            className="sticky top-0"
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((v) => !v)}
          />
        </aside>

        <div className="flex min-w-0 flex-col">
          <Header
            className="sticky top-0 z-10"
            onOpenMobileNav={() => setMobileOpen(true)}
          />
          <main className="px-4 py-6 md:px-6">{children}</main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-900/30"
          />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[360px]">
            <Sidebar
              className="h-full"
              onItemClick={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
