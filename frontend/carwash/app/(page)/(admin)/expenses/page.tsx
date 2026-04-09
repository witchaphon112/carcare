"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type ExpenseCategory = "ค่าน้ำ" | "ค่าไฟ" | "ค่าน้ำยา" | "อื่น ๆ";

type ExpenseKind = "variable" | "fixed";

type ExpenseStatus = "completed" | "pending";

type ExpenseEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  kind: ExpenseKind;
  note: string;
  amount: number;
  status: ExpenseStatus;
};

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function toYyyyMmDd(value: Date) {
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, "0");
  const dd = String(value.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toYyyyMm(value: Date) {
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function formatMonthLabel(yyyyMm: string) {
  const [yyyy, mm] = yyyyMm.split("-").map((part) => Number(part));
  if (!yyyy || !mm) return yyyyMm;
  return new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" })
    .format(new Date(yyyy, mm - 1, 1))
    .replace("พ.ศ.", "พ.ศ. ");
}

function formatThb(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

function monthKeyFromDate(yyyyMmDd: string) {
  return yyyyMmDd.slice(0, 7);
}

function shiftMonth(yyyyMm: string, deltaMonths: number) {
  const [yyyy, mm] = yyyyMm.split("-").map((part) => Number(part));
  if (!yyyy || !mm) return yyyyMm;
  const base = new Date(yyyy, mm - 1, 1);
  base.setMonth(base.getMonth() + deltaMonths);
  const outY = base.getFullYear();
  const outM = String(base.getMonth() + 1).padStart(2, "0");
  return `${outY}-${outM}`;
}

function formatMonthShort(yyyyMm: string) {
  const [yyyy, mm] = yyyyMm.split("-").map((part) => Number(part));
  if (!yyyy || !mm) return yyyyMm;
  return new Intl.DateTimeFormat("th-TH", { month: "short" }).format(
    new Date(yyyy, mm - 1, 1),
  );
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-999, Math.min(999, value));
}

function percentChange(current: number, previous: number) {
  if (previous <= 0) return null;
  return clampPercent(((current - previous) / previous) * 100);
}

function statusLabel(status: ExpenseStatus) {
  return status === "completed" ? "บันทึกแล้ว" : "รอดำเนินการ";
}

function statusClasses(status: ExpenseStatus) {
  return status === "completed"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-sky-100 text-sky-800";
}

function kindLabel(kind: ExpenseKind) {
  return kind === "variable" ? "ผันแปร" : "คงที่";
}

function kindPillClasses(kind: ExpenseKind) {
  return kind === "variable"
    ? "bg-slate-100 text-slate-700"
    : "bg-white text-slate-700 border border-slate-200";
}

export default function ExpensesPage() {
  const storageKey = "carwash.expenses.entries.v1";
  const now = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState(() => toYyyyMm(now));
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);

  const [newDate, setNewDate] = useState(() => toYyyyMmDd(now));
  const [newCategory, setNewCategory] = useState<ExpenseCategory>("ค่าน้ำยา");
  const [newKind, setNewKind] = useState<ExpenseKind>("variable");
  const [newNote, setNewNote] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newStatus, setNewStatus] = useState<ExpenseStatus>("completed");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">(
    "all",
  );
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const raw = globalThis.localStorage?.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          const migrated = parsed
            .map((entry) => {
              const anyEntry = entry as Partial<ExpenseEntry> & {
                kind?: ExpenseKind;
                status?: ExpenseStatus;
              };
              if (!anyEntry.id || !anyEntry.date || !anyEntry.category) return null;
              return {
                id: anyEntry.id,
                date: anyEntry.date,
                category: anyEntry.category as ExpenseCategory,
                kind: anyEntry.kind ?? "variable",
                note: anyEntry.note ?? "",
                amount: Number(anyEntry.amount ?? 0),
                status: anyEntry.status ?? "completed",
              } satisfies ExpenseEntry;
            })
            .filter(Boolean) as ExpenseEntry[];

          setEntries(migrated);
          globalThis.localStorage?.setItem(storageKey, JSON.stringify(migrated));
          return;
        }
      } catch {
        // ignore
      }
    }

    const seedDate = toYyyyMmDd(new Date());
    const seeded: ExpenseEntry[] = [
      {
        id: makeId(),
        date: seedDate,
        category: "ค่าไฟ",
        kind: "fixed",
        note: "ค่าไฟหน้าร้าน",
        amount: 1200,
        status: "completed",
      },
      {
        id: makeId(),
        date: seedDate,
        category: "ค่าน้ำยา",
        kind: "variable",
        note: "แชมพู/โฟม",
        amount: 650,
        status: "completed",
      },
    ];
    setEntries(seeded);
    globalThis.localStorage?.setItem(storageKey, JSON.stringify(seeded));
  }, [storageKey]);

  const monthEntries = useMemo(() => {
    return entries
      .filter((entry) => monthKeyFromDate(entry.date) === selectedMonth)
      .filter((entry) =>
        categoryFilter === "all" ? true : entry.category === categoryFilter,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [categoryFilter, entries, selectedMonth]);

  const monthTotal = useMemo(() => {
    return monthEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }, [monthEntries]);

  const lastMonthTotal = useMemo(() => {
    const lastMonth = shiftMonth(selectedMonth, -1);
    return entries
      .filter((entry) => monthKeyFromDate(entry.date) === lastMonth)
      .filter((entry) =>
        categoryFilter === "all" ? true : entry.category === categoryFilter,
      )
      .reduce((sum, entry) => sum + entry.amount, 0);
  }, [categoryFilter, entries, selectedMonth]);

  const variableTotal = useMemo(() => {
    return monthEntries
      .filter((entry) => entry.kind === "variable")
      .reduce((sum, entry) => sum + entry.amount, 0);
  }, [monthEntries]);

  const fixedTotal = useMemo(() => {
    return monthEntries
      .filter((entry) => entry.kind === "fixed")
      .reduce((sum, entry) => sum + entry.amount, 0);
  }, [monthEntries]);

  const byCategory = useMemo(() => {
    const buckets: Record<ExpenseCategory, number> = {
      "ค่าน้ำ": 0,
      "ค่าไฟ": 0,
      "ค่าน้ำยา": 0,
      "อื่น ๆ": 0,
    };
    for (const entry of monthEntries) buckets[entry.category] += entry.amount;
    return buckets;
  }, [monthEntries]);

  const trendMonths = useMemo(() => {
    return Array.from({ length: 6 }).map((_, idx) =>
      shiftMonth(selectedMonth, idx - 5),
    );
  }, [selectedMonth]);

  const trends = useMemo(() => {
    const totals = trendMonths.map((month) => {
      const total = entries
        .filter((entry) => monthKeyFromDate(entry.date) === month)
        .filter((entry) =>
          categoryFilter === "all" ? true : entry.category === categoryFilter,
        )
        .reduce((sum, entry) => sum + entry.amount, 0);
      return { month, total };
    });
    const max = Math.max(1, ...totals.map((t) => t.total));
    return { totals, max };
  }, [categoryFilter, entries, trendMonths]);

  const categoryRows = useMemo(() => {
    const rows = (Object.keys(byCategory) as ExpenseCategory[])
      .map((category) => ({ category, amount: byCategory[category] }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    return rows;
  }, [byCategory]);

  const donut = useMemo(() => {
    if (monthTotal <= 0) return null;
    const top = categoryRows[0];
    if (!top) return null;
    const pct = Math.round((top.amount / monthTotal) * 100);
    return { category: top.category, pct };
  }, [categoryRows, monthTotal]);

  function persist(next: ExpenseEntry[]) {
    setEntries(next);
    globalThis.localStorage?.setItem(storageKey, JSON.stringify(next));
  }

  function onAddEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(newAmount);
    if (!newDate || !Number.isFinite(amount) || amount <= 0) return;

    const next: ExpenseEntry[] = [
      {
        id: makeId(),
        date: newDate,
        category: newCategory,
        kind: newKind,
        note: newNote.trim(),
        amount,
        status: newStatus,
      },
      ...entries,
    ];
    persist(next);
    setNewNote("");
    setNewAmount("");
    setNewStatus("completed");
    setNewKind("variable");
    setShowAdd(false);
  }

  function onRemoveEntry(id: string) {
    persist(entries.filter((entry) => entry.id !== id));
  }

  const totalChangePct = useMemo(() => {
    return percentChange(monthTotal, lastMonthTotal);
  }, [lastMonthTotal, monthTotal]);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            รายจ่ายรายเดือน
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            สรุปค่าใช้จ่ายของเดือนที่เลือก พร้อมแนวโน้มและหมวดค่าใช้จ่าย
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <label className="text-sm font-semibold text-slate-600">
            เดือน
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="ml-2 h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm outline-none"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            หมวด
            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(
                  (e.target.value as ExpenseCategory | "all") ?? "all",
                )
              }
              className="ml-2 h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm outline-none"
              aria-label="ตัวกรองหมวด"
            >
              <option value="all">ทั้งหมด</option>
              <option value="ค่าไฟ">ค่าไฟ</option>
              <option value="ค่าน้ำ">ค่าน้ำ</option>
              <option value="ค่าน้ำยา">ค่าน้ำยา</option>
              <option value="อื่น ๆ">อื่น ๆ</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/70 px-7 py-6 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="text-xs font-semibold tracking-[0.14em] text-rose-700">
            รายจ่ายรวมของเดือนนี้
          </div>
          <div className="mt-3 text-5xl font-semibold tracking-tight text-slate-900">
            {formatThb(monthTotal)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <span className="h-2 w-2 rounded-full bg-rose-300" />
            <span>
              {totalChangePct === null ? (
                "ยังไม่มีข้อมูลเดือนก่อน"
              ) : (
                <>
                  {totalChangePct >= 0 ? "+" : ""}
                  {totalChangePct.toFixed(1)}% จากเดือนก่อน
                </>
              )}
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/70 px-7 py-6 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="text-xs font-semibold tracking-[0.14em] text-slate-700">
            รายจ่ายผันแปร
          </div>
          <div className="mt-3 text-5xl font-semibold tracking-tight text-slate-900">
            {formatThb(variableTotal)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            <span>ค่าน้ำ/ค่าน้ำยา/อื่น ๆ</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/70 px-7 py-6 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="text-xs font-semibold tracking-[0.14em] text-sky-700">
            รายจ่ายคงที่
          </div>
          <div className="mt-3 text-5xl font-semibold tracking-tight text-slate-900">
            {formatThb(fixedTotal)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <span className="h-2 w-2 rounded-full bg-sky-300" />
            <span>เช่น ค่าไฟ/ค่าเช่า/ค่าคงที่อื่น ๆ</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-[26px] border border-white/70 bg-white/70 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.55)] backdrop-blur lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              แนวโน้มรายจ่าย (6 เดือน)
            </h2>
            <div className="text-sm font-semibold text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                รายจ่าย
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-6 items-end gap-3">
            {trends.totals.map((item) => {
              const heightPct = Math.round((item.total / trends.max) * 100);
              const isCurrent = item.month === selectedMonth;
              return (
                <div key={item.month} className="flex flex-col items-center gap-3">
                  <div className="w-full">
                    <div className="h-36 w-full rounded-2xl bg-slate-100 p-1">
                      <div
                        className={cn(
                          "w-full rounded-[14px]",
                          isCurrent ? "bg-rose-600" : "bg-slate-300",
                        )}
                        style={{ height: `${Math.max(6, heightPct)}%` }}
                        aria-label={`${item.month} ${formatThb(item.total)}`}
                      />
                    </div>
                  </div>
                  <div className={cn("text-xs font-semibold", isCurrent ? "text-rose-700" : "text-slate-500")}>
                    {formatMonthShort(item.month)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[26px] border border-white/70 bg-white/70 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.55)] backdrop-blur">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            แยกตามหมวด
          </h2>

          <div className="mt-6 flex items-center gap-5">
            <div className="relative h-[140px] w-[140px]">
              {donut ? (
                <svg viewBox="0 0 120 120" className="h-full w-full">
                  <circle
                    cx="60"
                    cy="60"
                    r="44"
                    fill="none"
                    stroke="rgb(226 232 240)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="44"
                    fill="none"
                    stroke="rgb(244 63 94)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(donut.pct / 100) * 276} 276`}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
                  ไม่มีข้อมูล
                </div>
              )}
              {donut ? (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-semibold text-slate-900">
                    {donut.pct}%
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    {donut.category}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              {categoryRows.length === 0 ? (
                <div className="text-sm text-slate-600">ยังไม่มีรายการ</div>
              ) : (
                <div className="space-y-3">
                  {categoryRows.map((row) => (
                    <div key={row.category} className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-700">
                        {row.category}
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {formatThb(row.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[26px] border border-white/70 bg-white/70 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.55)] backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              รายการล่าสุด
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              เดือน {formatMonthLabel(selectedMonth)} •{" "}
              {categoryFilter === "all" ? "ทุกหมวด" : categoryFilter} •{" "}
              {String(monthEntries.length).padStart(2, "0")} รายการ
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex h-11 items-center justify-center rounded-full bg-rose-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-rose-800"
          >
            {showAdd ? "ปิดฟอร์ม" : "เพิ่มรายการ"}
          </button>
        </div>

        {showAdd ? (
          <form
            onSubmit={onAddEntry}
            className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-12"
          >
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none md:col-span-3"
              aria-label="วันที่"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as ExpenseCategory)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm outline-none md:col-span-3"
              aria-label="หมวดรายจ่าย"
            >
              <option value="ค่าไฟ">ค่าไฟ</option>
              <option value="ค่าน้ำ">ค่าน้ำ</option>
              <option value="ค่าน้ำยา">ค่าน้ำยา</option>
              <option value="อื่น ๆ">อื่น ๆ</option>
            </select>
            <select
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as ExpenseKind)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm outline-none md:col-span-3"
              aria-label="ประเภทค่าใช้จ่าย"
            >
              <option value="variable">ผันแปร</option>
              <option value="fixed">คงที่</option>
            </select>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ExpenseStatus)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm outline-none md:col-span-3"
              aria-label="สถานะ"
            >
              <option value="completed">บันทึกแล้ว</option>
              <option value="pending">รอดำเนินการ</option>
            </select>
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-7"
              placeholder="รายละเอียด/หมายเหตุ"
              aria-label="รายละเอียด"
            />
            <input
              inputMode="numeric"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-3"
              placeholder="ยอด (บาท)"
              aria-label="ยอดเงิน"
            />
            <button
              type="submit"
              className="h-11 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 md:col-span-2 md:justify-self-end"
            >
              บันทึก
            </button>
          </form>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-sm">
          <div className="hidden grid-cols-12 gap-3 px-6 py-4 text-xs font-semibold tracking-[0.14em] text-slate-400 md:grid">
            <div className="col-span-2">วันที่</div>
            <div className="col-span-4">รายละเอียด</div>
            <div className="col-span-2">หมวด</div>
            <div className="col-span-2 text-right">ยอด</div>
            <div className="col-span-1 text-right">สถานะ</div>
            <div className="col-span-1 text-right">ลบ</div>
          </div>

          {monthEntries.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">
              ยังไม่มีรายการในเดือนนี้
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {monthEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-12 md:items-center md:px-6"
                >
                  <div className="text-sm font-semibold text-slate-700 md:col-span-2">
                    {entry.date}
                  </div>
                  <div className="min-w-0 md:col-span-4">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {entry.note || entry.category}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-1 font-semibold",
                          kindPillClasses(entry.kind),
                        )}
                      >
                        {kindLabel(entry.kind)}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>{entry.category}</span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 md:col-span-2">
                    {entry.category}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 md:col-span-2 md:text-right">
                    {formatThb(entry.amount)}
                  </div>
                  <div className="md:col-span-1 md:text-right">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                        statusClasses(entry.status),
                      )}
                    >
                      {statusLabel(entry.status)}
                    </span>
                  </div>
                  <div className="md:col-span-1 md:text-right">
                    <button
                      type="button"
                      onClick={() => onRemoveEntry(entry.id)}
                      className="inline-flex h-9 items-center justify-center rounded-full bg-slate-100 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      aria-label="ลบรายการ"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
