import Link from "next/link";

export default function CustomerSupportPage() {
  return (
    <div className="rounded-[26px] border border-white/70 bg-white/70 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.55)] backdrop-blur">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Customer support
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Placeholder — เดี๋ยวค่อยทำหน้าช่องทางช่วยเหลือ/ติดต่อ
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
