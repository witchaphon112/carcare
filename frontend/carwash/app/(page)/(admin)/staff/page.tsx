"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type PayType = "monthly" | "hourly";

type StaffMember = {
  id: string;
  name: string;
  role: string;
  payType: PayType;
  rate: number; // monthly salary or hourly wage
  commissionPerWash: number; // THB per wash (optional)
};

type WorkLog = {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  hours: number;
  washes: number;
  commission: number; // manual commission / tips / bonus
  deduction: number; // late / breakage / etc.
  note: string;
};

type PayrollStore = {
  members: StaffMember[];
  logs: WorkLog[];
  confirmed?: Record<string, Record<string, true>>; // month -> staffId -> true
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

function loadStore(storageKey: string): PayrollStore | null {
  const raw = globalThis.localStorage?.getItem(storageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const store = parsed as PayrollStore;
    if (!Array.isArray(store.members) || !Array.isArray(store.logs)) return null;

    // Migrate older shapes safely (e.g., previous `bonus` field).
    const migratedMembers: StaffMember[] = store.members.map((m) => ({
      id: (m as StaffMember).id,
      name: (m as StaffMember).name,
      role: (m as StaffMember).role ?? "พนักงานล้างรถ",
      payType: (m as StaffMember).payType,
      rate: Number((m as StaffMember).rate ?? 0),
      commissionPerWash: Number((m as StaffMember).commissionPerWash ?? 0),
    }));

    const migratedLogs: WorkLog[] = store.logs.map((l) => {
      const anyLog = l as unknown as {
        id: string;
        staffId: string;
        date: string;
        hours?: number;
        washes?: number;
        commission?: number;
        deduction?: number;
        note?: string;
        bonus?: number;
      };
      return {
        id: anyLog.id,
        staffId: anyLog.staffId,
        date: anyLog.date,
        hours: Number(anyLog.hours ?? 0),
        washes: Number(anyLog.washes ?? 0),
        commission: Number(anyLog.commission ?? anyLog.bonus ?? 0),
        deduction: Number(anyLog.deduction ?? 0),
        note: anyLog.note ?? "",
      };
    });

    return {
      members: migratedMembers,
      logs: migratedLogs,
      confirmed: store.confirmed ?? {},
    };
  } catch {
    return null;
  }
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
}

export default function StaffPage() {
  const storageKey = "carwash.staff.payroll.v1";
  const now = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState(() => toYyyyMm(now));
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [confirmed, setConfirmed] = useState<Record<string, Record<string, true>>>(
    {},
  );

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [newPayType, setNewPayType] = useState<PayType>("monthly");
  const [newRate, setNewRate] = useState("");
  const [newCommissionPerWash, setNewCommissionPerWash] = useState("");

  const [logStaffId, setLogStaffId] = useState("");
  const [logDate, setLogDate] = useState(() => toYyyyMmDd(now));
  const [logHours, setLogHours] = useState("");
  const [logWashes, setLogWashes] = useState("");
  const [logCommission, setLogCommission] = useState("");
  const [logDeduction, setLogDeduction] = useState("");
  const [logNote, setLogNote] = useState("");

  useEffect(() => {
    const existing = loadStore(storageKey);
    if (existing) {
      setMembers(existing.members);
      setLogs(existing.logs);
      setConfirmed(existing.confirmed ?? {});
      return;
    }

    const seededMembers: StaffMember[] = [
      {
        id: makeId(),
        name: "ช่างล้าง 1",
        role: "หัวหน้าช่าง",
        payType: "monthly",
        rate: 12000,
        commissionPerWash: 5,
      },
      {
        id: makeId(),
        name: "ช่างล้าง 2",
        role: "ช่างล้างรถ",
        payType: "hourly",
        rate: 80,
        commissionPerWash: 3,
      },
    ];
    const seededLogs: WorkLog[] = [
      {
        id: makeId(),
        staffId: seededMembers[1]!.id,
        date: toYyyyMmDd(new Date()),
        hours: 8,
        washes: 6,
        commission: 100,
        deduction: 0,
        note: "ทิป/คอมมิชชั่น",
      },
    ];
    setMembers(seededMembers);
    setLogs(seededLogs);
    setConfirmed({});
    globalThis.localStorage?.setItem(
      storageKey,
      JSON.stringify({ members: seededMembers, logs: seededLogs, confirmed: {} }),
    );
  }, [storageKey]);

  function persist(
    nextMembers: StaffMember[],
    nextLogs: WorkLog[],
    nextConfirmed: Record<string, Record<string, true>>,
  ) {
    setMembers(nextMembers);
    setLogs(nextLogs);
    setConfirmed(nextConfirmed);
    globalThis.localStorage?.setItem(
      storageKey,
      JSON.stringify({
        members: nextMembers,
        logs: nextLogs,
        confirmed: nextConfirmed,
      }),
    );
  }

  const monthLogs = useMemo(() => {
    return logs.filter((log) => log.date.startsWith(`${selectedMonth}-`));
  }, [logs, selectedMonth]);

  const payrollRows = useMemo(() => {
    return members.map((member) => {
      const staffLogs = monthLogs.filter((log) => log.staffId === member.id);
      const totalHours = staffLogs.reduce((sum, log) => sum + log.hours, 0);
      const daysWorked = new Set(staffLogs.map((log) => log.date)).size;
      const totalWashes = staffLogs.reduce((sum, log) => sum + log.washes, 0);
      const commissionFromWashes = totalWashes * member.commissionPerWash;
      const totalCommission =
        staffLogs.reduce((sum, log) => sum + log.commission, 0) +
        commissionFromWashes;
      const totalDeduction = staffLogs.reduce((sum, log) => sum + log.deduction, 0);
      const base =
        member.payType === "monthly"
          ? daysWorked > 0
            ? member.rate
            : 0
          : totalHours * member.rate;
      const net = base + totalCommission - totalDeduction;
      const isConfirmed = Boolean(confirmed[selectedMonth]?.[member.id]);
      return {
        member,
        staffLogs,
        daysWorked,
        totalHours,
        totalWashes,
        base,
        totalCommission,
        totalDeduction,
        net,
        isConfirmed,
      };
    });
  }, [confirmed, members, monthLogs, selectedMonth]);

  const totalPayroll = useMemo(() => {
    return payrollRows.reduce((sum, row) => sum + row.base, 0);
  }, [payrollRows]);

  const totalCommissions = useMemo(() => {
    return payrollRows.reduce((sum, row) => sum + row.totalCommission, 0);
  }, [payrollRows]);

  const totalDeductions = useMemo(() => {
    return payrollRows.reduce((sum, row) => sum + row.totalDeduction, 0);
  }, [payrollRows]);

  const totalNetPayout = useMemo(() => {
    return payrollRows.reduce((sum, row) => sum + row.net, 0);
  }, [payrollRows]);

  const totalWashesLogged = useMemo(() => {
    return payrollRows.reduce((sum, row) => sum + row.totalWashes, 0);
  }, [payrollRows]);

  function onAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rate = Number(newRate);
    const commissionPerWash = Number(newCommissionPerWash || 0);
    if (!newMemberName.trim() || !Number.isFinite(rate) || rate <= 0) return;
    if (!Number.isFinite(commissionPerWash) || commissionPerWash < 0) return;

    const nextMembers: StaffMember[] = [
      ...members,
      {
        id: makeId(),
        name: newMemberName.trim(),
        role: newMemberRole.trim() || "พนักงานล้างรถ",
        payType: newPayType,
        rate,
        commissionPerWash,
      },
    ];
    persist(nextMembers, logs, confirmed);
    setNewMemberName("");
    setNewMemberRole("");
    setNewRate("");
    setNewCommissionPerWash("");
    setNewPayType("monthly");
  }

  function onRemoveMember(id: string) {
    const nextMembers = members.filter((m) => m.id !== id);
    const nextLogs = logs.filter((log) => log.staffId !== id);
    const nextConfirmed = { ...confirmed };
    if (nextConfirmed[selectedMonth]) {
      const monthMap = { ...nextConfirmed[selectedMonth] };
      delete monthMap[id];
      nextConfirmed[selectedMonth] = monthMap;
    }
    persist(nextMembers, nextLogs, nextConfirmed);
    if (logStaffId === id) setLogStaffId("");
  }

  function onAddLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!logStaffId) return;
    const hours = Number(logHours || 0);
    const washes = Number(logWashes || 0);
    const commission = Number(logCommission || 0);
    const deduction = Number(logDeduction || 0);
    if (!logDate || !Number.isFinite(hours) || hours < 0) return;
    if (!Number.isFinite(washes) || washes < 0) return;
    if (!Number.isFinite(commission) || commission < 0) return;
    if (!Number.isFinite(deduction) || deduction < 0) return;

    const nextLogs: WorkLog[] = [
      {
        id: makeId(),
        staffId: logStaffId,
        date: logDate,
        hours,
        washes,
        commission,
        deduction,
        note: logNote.trim(),
      },
      ...logs,
    ];
    persist(members, nextLogs, confirmed);
    setLogHours("");
    setLogWashes("");
    setLogCommission("");
    setLogDeduction("");
    setLogNote("");
  }

  function onRemoveLog(id: string) {
    persist(members, logs.filter((log) => log.id !== id), confirmed);
  }

  function setMemberConfirmed(staffId: string, value: boolean) {
    const monthMap = confirmed[selectedMonth] ?? {};
    const nextMonthMap = { ...monthMap };
    if (value) nextMonthMap[staffId] = true;
    else delete nextMonthMap[staffId];
    const nextConfirmed = { ...confirmed, [selectedMonth]: nextMonthMap };
    persist(members, logs, nextConfirmed);
  }

  function runBatchPayroll() {
    const nextMonthMap: Record<string, true> = {};
    for (const member of members) nextMonthMap[member.id] = true;
    const nextConfirmed = { ...confirmed, [selectedMonth]: nextMonthMap };
    persist(members, logs, nextConfirmed);
  }

  function exportCsv() {
    const headers = [
      "เดือน",
      "พนักงาน",
      "ตำแหน่ง",
      "ฐานเงินเดือน/ค่าแรง",
      "คอมมิชชั่น",
      "หัก",
      "สุทธิ",
      "ยืนยันแล้ว",
    ];
    const lines = payrollRows.map((row) => [
      selectedMonth,
      row.member.name,
      row.member.role,
      String(row.base),
      String(row.totalCommission),
      String(row.totalDeduction),
      String(row.net),
      row.isConfirmed ? "yes" : "no",
    ]);
    const csv = [headers, ...lines]
      .map((cols) =>
        cols
          .map((col) => `"${String(col).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll-${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const [page, setPage] = useState(1);
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(payrollRows.length / pageSize));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return payrollRows.slice(start, start + pageSize);
  }, [page, payrollRows]);

  useEffect(() => {
    setPage(1);
  }, [selectedMonth]);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            พนักงาน (คำนวณเงินเดือน)
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            สรุปฐานเงินเดือน + คอมมิชชั่น + หัก และยอดจ่ายสุทธิของเดือนนี้
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-600">
            เดือน
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="ml-2 h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm outline-none"
            />
          </label>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/70 px-7 py-6 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="text-xs font-semibold tracking-[0.14em] text-slate-700">
            ค่าแรงรวม (ฐาน)
          </div>
          <div className="mt-3 text-5xl font-semibold tracking-tight text-slate-900">
            {formatThb(totalPayroll)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            <span>{formatMonthLabel(selectedMonth)} • {totalWashesLogged} งานที่บันทึก</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/70 px-7 py-6 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="text-xs font-semibold tracking-[0.14em] text-emerald-700">
            คอมมิชชั่นรวม
          </div>
          <div className="mt-3 text-5xl font-semibold tracking-tight text-slate-900">
            {formatThb(totalCommissions)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            <span>หักรวม {formatThb(totalDeductions)}</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/70 px-7 py-6 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="text-xs font-semibold tracking-[0.14em] text-sky-700">
            จ่ายสุทธิ
          </div>
          <div className="mt-3 text-5xl font-semibold tracking-tight text-slate-900">
            {formatThb(totalNetPayout)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <span className="h-2 w-2 rounded-full bg-sky-300" />
            <span>พนักงาน {String(members.length).padStart(2, "0")} คน</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold text-slate-900">
            รายละเอียดการจ่ายเงินพนักงาน
          </div>
          <div className="mt-1 text-sm text-slate-500">
            คำนวณจากรายการทำงานในเดือนที่เลือก และบันทึกไว้ในเครื่อง (localStorage)
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={runBatchPayroll}
            className="inline-flex h-11 items-center justify-center rounded-full bg-sky-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-sky-800"
          >
            Run Batch Payroll
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[26px] border border-white/70 bg-white/70 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.55)] backdrop-blur">
        <div className="hidden grid-cols-12 gap-3 px-6 py-4 text-xs font-semibold tracking-[0.14em] text-slate-400 md:grid">
          <div className="col-span-4">พนักงาน</div>
          <div className="col-span-2 text-right">ฐาน</div>
          <div className="col-span-2 text-right">คอมมิชชั่น</div>
          <div className="col-span-2 text-right">หัก</div>
          <div className="col-span-1 text-right">สุทธิ</div>
          <div className="col-span-1 text-right">ยืนยัน</div>
        </div>

        <div className="divide-y divide-white/70">
          {pagedRows.map((row) => (
            <div key={row.member.id} className="bg-white px-5 py-4 md:px-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-center">
                <div className="md:col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-bold text-slate-700 ring-2 ring-white">
                      {initials(row.member.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {row.member.name}
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500">
                        {row.member.role} •{" "}
                        {row.member.payType === "monthly"
                          ? `รายเดือน ${formatThb(row.member.rate)}`
                          : `รายชั่วโมง ${formatThb(row.member.rate)}/ชม.`}
                        {" • "}
                        {row.member.payType === "monthly"
                          ? `${row.daysWorked} วัน`
                          : `${row.totalHours} ชม.`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 md:text-right">
                  <div className="text-sm font-semibold text-slate-900">
                    {formatThb(row.base)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    งาน {row.totalWashes} ครั้ง
                  </div>
                </div>

                <div className="md:col-span-2 md:text-right">
                  <div className="text-sm font-semibold text-emerald-700">
                    +{formatThb(row.totalCommission)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {row.member.commissionPerWash > 0
                      ? `${formatThb(row.member.commissionPerWash)}/งาน`
                      : "—"}
                  </div>
                </div>

                <div className="md:col-span-2 md:text-right">
                  <div className="text-sm font-semibold text-rose-700">
                    -{formatThb(row.totalDeduction)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">—</div>
                </div>

                <div className="md:col-span-1 md:text-right">
                  <div className="text-sm font-semibold text-sky-700">
                    {formatThb(row.net)}
                  </div>
                </div>

                <div className="md:col-span-1 md:text-right">
                  <button
                    type="button"
                    onClick={() => setMemberConfirmed(row.member.id, !row.isConfirmed)}
                    className={cn(
                      "inline-flex h-10 w-full items-center justify-center rounded-full px-4 text-sm font-semibold shadow-sm md:w-auto",
                      row.isConfirmed
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-slate-900 text-white hover:bg-slate-800",
                    )}
                  >
                    {row.isConfirmed ? "Confirmed" : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between bg-white px-5 py-4 text-sm text-slate-500 md:px-6">
          <div>
            แสดง {Math.min((page - 1) * pageSize + 1, payrollRows.length)} จาก{" "}
            {payrollRows.length} คน
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={cn(
                "h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm",
                page <= 1 ? "opacity-50" : "hover:bg-slate-50",
              )}
              aria-label="ก่อนหน้า"
            >
              ‹
            </button>
            <div className="inline-flex h-9 items-center rounded-full bg-slate-50 px-4 text-sm font-semibold text-slate-700">
              {page} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={cn(
                "h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm",
                page >= totalPages ? "opacity-50" : "hover:bg-slate-50",
              )}
              aria-label="ถัดไป"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-[26px] border border-white/70 bg-white/70 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.55)] backdrop-blur">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            เพิ่มพนักงาน
          </h2>
          <form
            onSubmit={onAddMember}
            className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-12"
          >
            <input
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-5"
              placeholder="ชื่อพนักงาน"
              aria-label="ชื่อพนักงาน"
            />
            <input
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-7"
              placeholder="ตำแหน่ง (เช่น ช่างล้างรถ)"
              aria-label="ตำแหน่ง"
            />
            <select
              value={newPayType}
              onChange={(e) => setNewPayType(e.target.value as PayType)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm outline-none md:col-span-4"
              aria-label="ประเภทค่าแรง"
            >
              <option value="monthly">รายเดือน</option>
              <option value="hourly">รายชั่วโมง</option>
            </select>
            <input
              inputMode="numeric"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-3"
              placeholder={newPayType === "monthly" ? "เงินเดือน" : "ค่าแรง/ชม."}
              aria-label="อัตราค่าจ้าง"
            />
            <input
              inputMode="numeric"
              value={newCommissionPerWash}
              onChange={(e) => setNewCommissionPerWash(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-5"
              placeholder="คอมมิชชั่น/งาน (บาท) (ถ้ามี)"
              aria-label="คอมมิชชั่นต่อหนึ่งงาน"
            />
            <button
              type="submit"
              className="h-11 rounded-full bg-sky-700 px-6 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 md:col-span-12 md:justify-self-end"
            >
              เพิ่มพนักงาน
            </button>
          </form>
        </div>

        <div className="rounded-[26px] border border-white/70 bg-white/70 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.55)] backdrop-blur">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            บันทึกงาน (ชั่วโมง/คอมมิชชั่น/หัก)
          </h2>
          <form
            onSubmit={onAddLog}
            className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-12"
          >
            <select
              value={logStaffId}
              onChange={(e) => setLogStaffId(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm outline-none md:col-span-5"
              aria-label="เลือกพนักงาน"
            >
              <option value="">เลือกพนักงาน</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none md:col-span-3"
              aria-label="วันที่"
            />
            <input
              inputMode="numeric"
              value={logHours}
              onChange={(e) => setLogHours(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-2"
              placeholder="ชั่วโมง"
              aria-label="ชั่วโมงทำงาน"
            />
            <input
              inputMode="numeric"
              value={logWashes}
              onChange={(e) => setLogWashes(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-2"
              placeholder="จำนวนงาน"
              aria-label="จำนวนงาน"
            />
            <input
              inputMode="numeric"
              value={logCommission}
              onChange={(e) => setLogCommission(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-2"
              placeholder="คอมมิชชั่น"
              aria-label="คอมมิชชั่น"
            />
            <input
              inputMode="numeric"
              value={logDeduction}
              onChange={(e) => setLogDeduction(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-2"
              placeholder="หัก"
              aria-label="ยอดหัก"
            />
            <input
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-12"
              placeholder="หมายเหตุ (ถ้ามี)"
              aria-label="หมายเหตุ"
            />
            <button
              type="submit"
              disabled={!logStaffId}
              className={cn(
                "h-11 rounded-full px-6 text-sm font-semibold text-white shadow-sm md:col-span-12 md:justify-self-end",
                logStaffId ? "bg-sky-700 hover:bg-sky-800" : "bg-slate-300",
              )}
            >
              เพิ่มรายการ
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 rounded-[26px] border border-white/70 bg-white/70 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.55)] backdrop-blur">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          รายการทำงาน ({formatMonthLabel(selectedMonth)})
        </h2>
        <div className="mt-5 overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-sm">
          {monthLogs.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">
              ยังไม่มีรายการของเดือนนี้
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {monthLogs
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((log) => {
                  const member = members.find((m) => m.id === log.staffId);
                  return (
                    <div
                      key={log.id}
                      className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">
                          {member?.name ?? "พนักงานที่ถูกลบ"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          วันที่ {log.date} • ชั่วโมง {log.hours} • งาน {log.washes} • คอมมิชชั่น{" "}
                          {formatThb(log.commission)} • หัก {formatThb(log.deduction)}
                          {log.note ? ` • ${log.note}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onRemoveLog(log.id)}
                          className="h-9 rounded-full bg-slate-100 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
