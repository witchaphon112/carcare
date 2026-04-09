import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-10 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Forgot password
      </h1>
      <p className="mt-2 max-w-md text-sm text-zinc-600">
        หน้านี้ยังเป็น placeholder — เดี๋ยวค่อยต่อ flow รีเซ็ตรหัสผ่านกับ API/อีเมล
      </p>
      <Link
        href="/login"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
      >
        Back to login
      </Link>
    </div>
  );
}

