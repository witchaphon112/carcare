"use client";

import { useEffect, useMemo, useState, type SVGProps } from "react";
import packageJson from "../../../../package.json";

const API_BASE_URL = packageJson.config.apiBaseUrl;

type ShopStatus = "Open" | "Busy" | "Closed";
type QueueStatus = "Waiting" | "InProgress" | "Completed" | "Cancelled";

type QueueItem = {
  id: string;
  queueId: string;
  queueCar: string;
  waitTime: number;
  totalAmount: number;
  shopStatus: ShopStatus;
  queueStatus: QueueStatus;
};

type CreateQueuePayload = {
  queueCar: string;
  totalAmount: number;
  queueStatus?: QueueStatus;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatThb(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatQueueStatus(status: QueueStatus) {
  switch (status) {
    case "Waiting":
      return "รอคิว";
    case "InProgress":
      return "กำลังล้าง";
    case "Completed":
      return "เสร็จแล้ว";
    case "Cancelled":
      return "ยกเลิก";
    default:
      return status;
  }
}

function formatShopStatus(status: ShopStatus) {
  switch (status) {
    case "Open":
      return "เปิดร้าน";
    case "Busy":
      return "คิวแน่น";
    case "Closed":
      return "ปิดร้าน";
    default:
      return status;
  }
}

function IconCar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6.5 11.5 8.1 7.8A2.8 2.8 0 0 1 10.7 6h2.6a2.8 2.8 0 0 1 2.6 1.8l1.6 3.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M5.8 11.5h12.4A2.8 2.8 0 0 1 21 14.3V17a2 2 0 0 1-2 2h-1.2a1 1 0 0 1-1-1v-.2H7.2v.2a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-2.7a2.8 2.8 0 0 1 2.8-2.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M7.2 14.8h.01M16.8 14.8h.01"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  tone: "blue" | "green" | "slate";
}) {
  const toneStyles =
    tone === "blue"
      ? "from-sky-500/15 to-blue-500/10 text-sky-800"
      : tone === "green"
        ? "from-emerald-500/15 to-green-500/10 text-emerald-800"
        : "from-slate-400/15 to-slate-500/10 text-slate-800";

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/80 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.55)] backdrop-blur">
      <div className={cn("text-xs font-semibold tracking-[0.14em]", toneStyles)}>
        {title}
      </div>
      <div className="mt-3 text-5xl font-semibold tracking-tight text-slate-900">
        {value}
      </div>
      <div className="mt-3 text-sm text-slate-600">{subtitle}</div>
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-100/60" />
    </div>
  );
}

function StatusBadge({ status }: { status: QueueStatus }) {
  const classes =
    status === "InProgress"
      ? "bg-amber-100 text-amber-800"
      : status === "Completed"
        ? "bg-emerald-100 text-emerald-800"
        : status === "Cancelled"
          ? "bg-rose-100 text-rose-800"
          : "bg-sky-100 text-sky-800";

  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", classes)}>
      {formatQueueStatus(status)}
    </span>
  );
}

export default function DashboardPage() {
  const [queueCar, setQueueCar] = useState("");
  const [totalAmount, setTotalAmount] = useState("200");
  const [shopStatus, setShopStatus] = useState<ShopStatus>("Open");
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchQueues() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/queue`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("โหลดข้อมูลคิวไม่สำเร็จ");
      }

      const data = (await response.json()) as QueueItem[];
      const sorted = [...data].sort((a, b) => a.queueId.localeCompare(b.queueId));
      setQueues(sorted);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchQueues();
  }, []);

  const activeQueues = useMemo(
    () => queues.filter((item) => item.queueStatus === "Waiting" || item.queueStatus === "InProgress"),
    [queues],
  );

  const finishedToday = useMemo(
    () => queues.filter((item) => item.queueStatus === "Completed").length,
    [queues],
  );

  const totalRevenue = useMemo(
    () => queues.reduce((sum, item) => sum + item.totalAmount, 0),
    [queues],
  );

  const currentShopStatus = useMemo<ShopStatus>(() => {
    return queues[0]?.shopStatus ?? shopStatus;
  }, [queues, shopStatus]);

  async function createQueue() {
    const amount = Number(totalAmount);
    if (!queueCar.trim() || !Number.isFinite(amount) || amount < 0) {
      setError("กรอกชื่อรถ/ทะเบียน และยอดเงินให้ถูกต้อง");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateQueuePayload = {
        queueCar: queueCar.trim(),
        totalAmount: amount,
      };

      const response = await fetch(`${API_BASE_URL}/api/queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("เพิ่มคิวไม่สำเร็จ");
      }

      setQueueCar("");
      setTotalAmount("200");
      await fetchQueues();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateQueueStatus(id: string, nextStatus: QueueStatus) {
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/queue/${id}/queue-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ queueStatus: nextStatus }),
      });

      if (!response.ok) {
        throw new Error("อัปเดตสถานะคิวไม่สำเร็จ");
      }

      await fetchQueues();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "เกิดข้อผิดพลาด");
    }
  }

  async function updateShopStatus(nextStatus: ShopStatus) {
    setShopStatus(nextStatus);
    setError(null);

    if (queues.length === 0) {
      return;
    }

    try {
      await Promise.all(
        queues.map(async (item) => {
          const response = await fetch(`${API_BASE_URL}/api/queue/${item.id}/shop-status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ shopStatus: nextStatus }),
          });

          if (!response.ok) {
            throw new Error("อัปเดตสถานะร้านไม่สำเร็จ");
          }
        }),
      );

      await fetchQueues();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "เกิดข้อผิดพลาด");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">แดชบอร์ดคิวรถ</h1>
          <p className="mt-2 text-sm text-slate-600">
            เพิ่มคิวรถ, อัปเดตสถานะคิว, และคุมสถานะร้านจาก API จริง
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["Open", "Busy", "Closed"] as ShopStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => void updateShopStatus(status)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                currentShopStatus === status
                  ? status === "Open"
                    ? "bg-emerald-600 text-white"
                    : status === "Busy"
                      ? "bg-amber-500 text-white"
                      : "bg-rose-600 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {formatShopStatus(status)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <StatCard
          title="คิวที่ยังทำอยู่"
          value={String(activeQueues.length).padStart(2, "0")}
          subtitle="รวมคิวรอและกำลังล้าง"
          tone="blue"
        />
        <StatCard
          title="งานเสร็จแล้ว"
          value={String(finishedToday).padStart(2, "0")}
          subtitle="คิวที่อัปเดตเป็นเสร็จแล้ว"
          tone="green"
        />
        <StatCard
          title="ยอดรวม"
          value={formatThb(totalRevenue)}
          subtitle="รวมจากทุกคิวในระบบ"
          tone="slate"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-[26px] border border-white/70 bg-white/80 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.55)] backdrop-blur">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">เพิ่มคิวใหม่</h2>
          <p className="mt-1 text-sm text-slate-500">ส่งเข้า `POST /api/queue` โดยตรง</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">รถ / ทะเบียน</label>
              <input
                value={queueCar}
                onChange={(event) => setQueueCar(event.target.value)}
                placeholder="เช่น กข-1234 หรือ Civic สีขาว"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">ยอดเงิน</label>
              <input
                inputMode="numeric"
                value={totalAmount}
                onChange={(event) => setTotalAmount(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => void createQueue()}
              disabled={submitting}
              className="h-12 w-full rounded-2xl bg-sky-700 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "กำลังเพิ่มคิว..." : "เพิ่มคิวรถ"}
            </button>

            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          </div>
        </section>

        <section className="rounded-[26px] border border-white/70 bg-white/80 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">คิวทั้งหมด</h2>
              <p className="mt-1 text-sm text-slate-500">ดึงจาก `GET /api/queue`</p>
            </div>
            <button
              type="button"
              onClick={() => void fetchQueues()}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              รีเฟรช
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                กำลังโหลดข้อมูลคิว...
              </div>
            ) : queues.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                ยังไม่มีคิวในระบบ
              </div>
            ) : (
              queues.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[22px] border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                        <IconCar className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold tracking-[0.14em] text-slate-400">
                          {item.queueId}
                        </div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">{item.queueCar}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-4">
                      <div>
                        <div className="text-xs font-semibold tracking-[0.14em] text-slate-400">เวลารอ</div>
                        <div className="mt-1 font-semibold text-slate-900">{item.waitTime} นาที</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold tracking-[0.14em] text-slate-400">ราคา</div>
                        <div className="mt-1 font-semibold text-slate-900">{formatThb(item.totalAmount)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold tracking-[0.14em] text-slate-400">ร้าน</div>
                        <div className="mt-1 font-semibold text-slate-900">{formatShopStatus(item.shopStatus)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold tracking-[0.14em] text-slate-400">สถานะคิว</div>
                        <div className="mt-1">
                          <StatusBadge status={item.queueStatus} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void updateQueueStatus(item.id, "Waiting")}
                      className="rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-200"
                    >
                      รอคิว
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateQueueStatus(item.id, "InProgress")}
                      className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-200"
                    >
                      เริ่มล้าง
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateQueueStatus(item.id, "Completed")}
                      className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-200"
                    >
                      เสร็จแล้ว
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateQueueStatus(item.id, "Cancelled")}
                      className="rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-200"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
