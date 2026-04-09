import Link from "next/link";

export default function GuestPortalPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-10 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Guest portal
      </h1>
      <p className="mt-2 max-w-md text-sm text-zinc-600">
        หน้านี้ยังเป็น placeholder — ถ้าต้องการให้ทำหน้า Guest (เช็คคิว/จองคิว)
        บอก flow ที่อยากได้ได้เลย
      </p>
      <Link
        href="/login"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
      >
        Back to admin login
      </Link>
    </div>
  );
}

