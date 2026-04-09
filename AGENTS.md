# CarCare (Monorepo) — Agent Notes

## Product overview (Car Wash Queue)

โปรเจคนี้คือระบบสำหรับ **ร้านล้างรถ**:

- **UserLine / ลูกค้า**: เอาไว้ดู “คิวรถ” (สถานะคิว/ลำดับคิว/เวลาประมาณการ) และติดตามความคืบหน้า
- **Admin**: จัดการคิว (เพิ่ม/เลื่อน/อัปเดตสถานะ), และ **จดบันทึกรายวัน** สรุปเป็น **รายเดือน** (ยอด/จำนวนคัน/หมายเหตุ/อัปเดตคิวรถต่าง ๆ)

This repo contains **two apps**:

- `frontend/carwash/` — Next.js App Router (Next `16.x`), React `19`, Tailwind `v4`
- `backend/carwash.API/` — ASP.NET Core (`net9.0`) minimal API (currently template code)

## Frontend quick start

- Dev: `cd frontend/carwash && npm run dev` (uses `--webpack`)
- Build: `cd frontend/carwash && npm run build` (uses `--webpack`)

## Frontend routing / file locations

- All user-facing pages are grouped under `frontend/carwash/app/(page)/`
  - Login: `frontend/carwash/app/(page)/login/page.tsx`
  - Home (`/`) redirects to `/login`: `frontend/carwash/app/(page)/page.tsx`

## Constraints / conventions

- Prefer Tailwind utility classes (no UI kit installed).
- Avoid `next/font/google` (build environments may not allow fetching Google Fonts).
- Keep changes scoped; don’t refactor unrelated areas.

## Core features (target)

- Queue board: รายการคิวรถ + สถานะ (รอ/กำลังล้าง/เสร็จ/ยกเลิก) + หมายเหตุ
- Admin daily log: บันทึกงานรายวัน (และรวมเป็นรายเดือน)
- Authentication/roles: แยกสิทธิ์ `admin` vs `userline` (ลูกค้า/หน้าดูคิว)

## Backend quick start

- Run: `cd backend/carwash.API && dotnet run`
- Default endpoint (template): `/weatherforecast`
