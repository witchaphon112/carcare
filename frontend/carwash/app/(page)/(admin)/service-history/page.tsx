"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type ServiceStatus = "completed" | "in_progress" | "canceled";

type ServiceRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  plate: string;
  model: string;
  service: string;
  staff: string;
  amount: number;
  status: ServiceStatus;
  note: string;
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

function statusLabel(status: ServiceStatus) {
  if (status === "completed") return "เสร็จแล้ว";
  if (status === "in_progress") return "กำลังล้าง";
  return "ยกเลิก";
}

function statusClasses(status: ServiceStatus) {
  if (status === "completed") return "bg-emerald-100 text-emerald-800";
  if (status === "in_progress") return "bg-sky-100 text-sky-800";
  return "bg-rose-100 text-rose-800";
}

export default function ServiceHistoryPage() {
  const storageKey = "carwash.serviceHistory.records.v1";
  const now = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState(() => toYyyyMm(now));
  const [records, setRecords] = useState<ServiceRecord[]>([]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | "all">("all");
  const [showAdd, setShowAdd] = useState(false);

  const [newDate, setNewDate] = useState(() => toYyyyMmDd(now));
  const [newPlate, setNewPlate] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newService, setNewService] = useState("");
  const [newStaff, setNewStaff] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newStatus, setNewStatus] = useState<ServiceStatus>("completed");
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    const raw = globalThis.localStorage?.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          const migrated = parsed
            .map((r) => {
              const any = r as Partial<ServiceRecord>;
              if (!any.id || !any.date) return null;
              return {
                id: any.id,
                date: any.date,
                plate: any.plate ?? "",
                model: any.model ?? "",
                service: any.service ?? "",
                staff: any.staff ?? "",
                amount: Number(any.amount ?? 0),
                status: (any.status as ServiceStatus) ?? "completed",
                note: any.note ?? "",
              } satisfies ServiceRecord;
            })
            .filter(Boolean) as ServiceRecord[];
          setRecords(migrated);
          globalThis.localStorage?.setItem(storageKey, JSON.stringify(migrated));
          return;
        }
      } catch {
        // ignore
      }
    }

    const seedDate = toYyyyMmDd(new Date());
    const seeded: ServiceRecord[] = [
      {
        id: makeId(),
        date: seedDate,
        plate: "กข-1234",
        model: "Toyota Yaris",
        service: "ล้างภายนอก",
        staff: "ช่างล้าง 2",
        amount: 200,
        status: "completed",
        note: "",
      },
      {
        id: makeId(),
        date: seedDate,
        plate: "1กก-8888",
        model: "Honda Civic",
        service: "ล้าง+เคลือบ",
        staff: "ช่างล้าง 1",
        amount: 450,
        status: "completed",
        note: "เพิ่มเคลือบยาง",
      },
    ];
    setRecords(seeded);
    globalThis.localStorage?.setItem(storageKey, JSON.stringify(seeded));
  }, [storageKey]);

  function persist(next: ServiceRecord[]) {
    setRecords(next);
    globalThis.localStorage?.setItem(storageKey, JSON.stringify(next));
  }

  function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(newAmount);
    if (!newDate) return;
    if (!newPlate.trim()) return;
    if (!Number.isFinite(amount) || amount < 0) return;

    const next: ServiceRecord[] = [
      {
        id: makeId(),
        date: newDate,
        plate: newPlate.trim(),
        model: newModel.trim(),
        service: newService.trim(),
        staff: newStaff.trim(),
        amount,
        status: newStatus,
        note: newNote.trim(),
      },
      ...records,
    ];
    persist(next);

    setNewPlate("");
    setNewModel("");
    setNewService("");
    setNewStaff("");
    setNewAmount("");
    setNewStatus("completed");
    setNewNote("");
    setShowAdd(false);
  }

  function onRemove(id: string) {
    persist(records.filter((r) => r.id !== id));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records
      .filter((r) => r.date.startsWith(`${selectedMonth}-`))
      .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter))
      .filter((r) => {
        if (!q) return true;
        return (
          r.plate.toLowerCase().includes(q) ||
          r.model.toLowerCase().includes(q) ||
          r.service.toLowerCase().includes(q) ||
          r.staff.toLowerCase().includes(q) ||
          r.note.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [query, records, selectedMonth, statusFilter]);

  const completed = useMemo(() => {
    return filtered.filter((r) => r.status === "completed");
  }, [filtered]);

  const totalRevenue = useMemo(() => {
    return completed.reduce((sum, r) => sum + r.amount, 0);
  }, [completed]);

  const avgTicket = useMemo(() => {
    if (completed.length === 0) return 0;
    return Math.round(totalRevenue / completed.length);
  }, [completed.length, totalRevenue]);

  const [page, setPage] = useState(1);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [selectedMonth, query, statusFilter]);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            ประวัติการล้างรถ
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            เก็บประวัติการให้บริการ ค้นหา/กรอง และสรุปรายได้จากงานที่เสร็จแล้ว
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
            สถานะ
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter((e.target.value as ServiceStatus | "all") ?? "all")
              }
              className="ml-2 h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm outline-none"
            >
              <option value="all">ทั้งหมด</option>
              <option value="completed">เสร็จแล้ว</option>
              <option value="in_progress">กำลังล้าง</option>
              <option value="canceled">ยกเลิก</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/70 px-7 py-6 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="text-xs font-semibold tracking-[0.14em] text-sky-700">
            จำนวนงาน (เดือนนี้)
          </div>
          <div className="mt-3 text-5xl font-semibold tracking-tight text-slate-900">
            {String(filtered.length).padStart(2, "0")}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <span className="h-2 w-2 rounded-full bg-sky-300" />
            <span>{formatMonthLabel(selectedMonth)}</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/70 px-7 py-6 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="text-xs font-semibold tracking-[0.14em] text-emerald-700">
            รายได้จากงานที่เสร็จแล้ว
          </div>
          <div className="mt-3 text-5xl font-semibold tracking-tight text-slate-900">
            {formatThb(totalRevenue)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            <span>งานเสร็จแล้ว {completed.length} รายการ</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/70 px-7 py-6 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="text-xs font-semibold tracking-[0.14em] text-slate-700">
            เฉลี่ยต่อคัน
          </div>
          <div className="mt-3 text-5xl font-semibold tracking-tight text-slate-900">
            {formatThb(avgTicket)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            <span>คำนวณจากงานที่เสร็จแล้ว</span>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[26px] border border-white/70 bg-white/70 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.55)] backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              รายการย้อนหลัง
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              เก็บข้อมูลไว้ในเครื่อง (localStorage)
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 sm:w-[320px]"
              placeholder="ค้นหา: ทะเบียน / รุ่นรถ / บริการ / พนักงาน / หมายเหตุ"
              aria-label="ค้นหา"
            />
            <button
              type="button"
              onClick={() => setShowAdd((v) => !v)}
              className="inline-flex h-11 items-center justify-center rounded-full bg-sky-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-sky-800"
            >
              {showAdd ? "ปิดฟอร์ม" : "เพิ่มรายการ"}
            </button>
          </div>
        </div>

        {showAdd ? (
          <form
            onSubmit={onAdd}
            className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-12"
          >
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none md:col-span-3"
              aria-label="วันที่"
            />
            <input
              value={newPlate}
              onChange={(e) => setNewPlate(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-3"
              placeholder="ทะเบียนรถ *"
              aria-label="ทะเบียนรถ"
            />
            <input
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-6"
              placeholder="รุ่นรถ (ถ้ามี)"
              aria-label="รุ่นรถ"
            />
            <input
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-5"
              placeholder="บริการ (เช่น ล้าง+เคลือบ)"
              aria-label="บริการ"
            />
            <input
              value={newStaff}
              onChange={(e) => setNewStaff(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-3"
              placeholder="พนักงาน (ถ้ามี)"
              aria-label="พนักงาน"
            />
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ServiceStatus)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm outline-none md:col-span-2"
              aria-label="สถานะ"
            >
              <option value="completed">เสร็จแล้ว</option>
              <option value="in_progress">กำลังล้าง</option>
              <option value="canceled">ยกเลิก</option>
            </select>
            <input
              inputMode="numeric"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-2"
              placeholder="ยอด (บาท)"
              aria-label="ยอดเงิน"
            />
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 md:col-span-10"
              placeholder="หมายเหตุ (ถ้ามี)"
              aria-label="หมายเหตุ"
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
            <div className="col-span-3">ทะเบียน / รุ่นรถ</div>
            <div className="col-span-3">บริการ</div>
            <div className="col-span-2">พนักงาน</div>
            <div className="col-span-1 text-right">ยอด</div>
            <div className="col-span-1 text-right">สถานะ</div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">ยังไม่มีรายการ</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pageItems.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-12 md:items-center md:px-6"
                >
                  <div className="text-sm font-semibold text-slate-700 md:col-span-2">
                    {r.date}
                  </div>
                  <div className="min-w-0 md:col-span-3">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {r.plate}
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-500">
                      {r.model || "—"}
                    </div>
                  </div>
                  <div className="min-w-0 md:col-span-3">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {r.service || "—"}
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-500">
                      {r.note || " "}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 md:col-span-2">
                    {r.staff || "—"}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 md:col-span-1 md:text-right">
                    {formatThb(r.amount)}
                  </div>
                  <div className="flex items-center justify-between gap-3 md:col-span-1 md:justify-end">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                        statusClasses(r.status),
                      )}
                    >
                      {statusLabel(r.status)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemove(r.id)}
                      className="inline-flex h-9 items-center justify-center rounded-full bg-slate-100 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-200 md:hidden"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
          <div>
            หน้า {page} / {totalPages}
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
    </div>
  );
}
