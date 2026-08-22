# Nota Pembayaran Iuran — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Umat dan pengurus bisa mengunduh nota PDF untuk setiap pembayaran iuran yang sudah lunas.

**Architecture:** Satu nota mewakili satu transaksi pembayaran, dikenali lewat `tagihan_iuran.midtrans_order_id`. Nomor nota berurutan per tahun disimpan di tabel `nota_pembayaran` dan diberikan sekali saat nota pertama diminta. PDF dirender on-demand di route Next.js dan langsung dikirim ke klien tanpa disimpan.

**Tech Stack:** Next.js 16 (App Router, runtime nodejs), Supabase Postgres, `@react-pdf/renderer`, Expo 54 + React Native 0.81, `vitest` untuk unit test backend.

**Spec:** `docs/superpowers/specs/2026-08-22-nota-pembayaran-design.md`

## Global Constraints

- Semua endpoint mengembalikan bentuk `{ data, error }` kecuali route nota yang mengembalikan biner PDF.
- Otorisasi mengikuti `backend/src/app/api/iuran/route.ts`: `umat` hanya keluarganya sendiri, `ketua_lingkungan`/`ketua_wilayah` sebatas `auth.lingkunganIds`, `admin_paroki`/`pastor` semua.
- Semua query server memakai `createAdminClient()` dari `@/lib/supabase/admin`.
- Nomor nota berformat `NOTA/<tahun>/<6 digit>`, contoh `NOTA/2026/000123`.
- `metode` diturunkan dari awalan `order_id`: `MANUAL-` → `manual`, `LEGACY-` → `legacy`, selain itu `qris`.
- Pesan error yang dikirim ke klien memakai Bahasa Indonesia.
- Format commit: `Type[]: judul`, body Bahasa Indonesia menjelaskan APA yang berubah. Dilarang menambahkan trailer atribusi apa pun.
- Bekerja di branch `feat/nota-pembayaran`.

## File Structure

| File | Tanggung jawab |
|---|---|
| `backend/vitest.config.ts` | konfigurasi test + alias `@/` |
| `backend/src/lib/gereja.ts` | identitas gereja, satu sumber untuk nota dan `api/info-gereja` |
| `backend/src/lib/nota/tipe.ts` | tipe `NotaData` + helper murni (format nomor, metode, rupiah, periode) |
| `backend/src/lib/nota/akses.ts` | keputusan boleh/tidak, murni, tanpa DB |
| `backend/src/lib/nota/data.ts` | query Supabase, panggil `assign_nota`, rakit `NotaData` |
| `backend/src/lib/nota/template.tsx` | dokumen `@react-pdf/renderer` |
| `backend/src/app/api/iuran/nota/[orderId]/route.ts` | endpoint unduh |
| `backend/supabase/migrations/20260822000000_nota_pembayaran.sql` | tabel, RLS, fungsi, backfill |
| `backend/src/app/api/iuran/manual-pay/route.ts` | dimodifikasi: bikin `order_id` |
| `backend/src/app/admin/iuran/page.tsx` | dimodifikasi: tombol unduh |
| `services/api.ts` | dimodifikasi: `unduhNota` |
| `app/iuran/riwayat.tsx` | dimodifikasi: tombol unduh |

Dua penyimpangan dari struktur berkas di spec, keduanya disengaja:

1. `akses.ts` dipisah dari `data.ts` supaya aturan otorisasi bisa diuji tanpa
   database.
2. `lib/nota/nomor.ts` yang disebut spec tidak dibuat. Perakitan nomor
   seluruhnya terjadi di dalam fungsi `assign_nota` di database, karena di
   situlah penguncian dan penaikan penghitung berlangsung. Membuat pembungkus
   TypeScript yang hanya meneruskan panggilan RPC akan jadi lapisan kosong,
   dan menyalin format nomor ke TypeScript akan bikin dua sumber kebenaran.
   Pemanggilan `assign_nota` ada di `data.ts`.

---

### Task 1: Test harness + identitas gereja

**Files:**
- Create: `backend/vitest.config.ts`
- Create: `backend/src/lib/gereja.ts`
- Create: `backend/src/lib/gereja.test.ts`
- Modify: `backend/src/app/api/info-gereja/route.ts:1-26`

**Interfaces:**
- Consumes: tidak ada
- Produces: `INFO_GEREJA` — objek beku dengan field `nama: string`, `alamat: string`, `telepon: string`, `email: string`, `website: string`, `keuskupan_agung: string`, `uskup_agung: string`, `tahun_renovasi: string`, `pastor: { nama: string; jabatan: string }[]`, `jam_sekretariat: { hari: string; jam: string }[]`

- [ ] **Step 1: Pasang vitest**

```bash
cd backend && npm install -D vitest
```

Tambahkan ke `backend/package.json` bagian `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Bikin konfigurasi vitest**

Buat `backend/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Tulis test yang gagal**

Buat `backend/src/lib/gereja.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { INFO_GEREJA } from '@/lib/gereja'

describe('INFO_GEREJA', () => {
  it('punya nama paroki', () => {
    expect(INFO_GEREJA.nama).toBe('Gereja Katolik Santo Arnoldus Janssen Bekasi')
  })

  it('punya alamat dan telepon untuk kop nota', () => {
    expect(INFO_GEREJA.alamat).toContain('Bekasi')
    expect(INFO_GEREJA.telepon).toBe('(021) 8801763')
  })

  it('mendaftar minimal satu pastor', () => {
    expect(INFO_GEREJA.pastor.length).toBeGreaterThan(0)
    expect(INFO_GEREJA.pastor[0].jabatan).toBe('Pastor Paroki')
  })
})
```

- [ ] **Step 4: Jalankan test, pastikan gagal**

Run: `cd backend && npm test`
Expected: FAIL, `Cannot find module '@/lib/gereja'`

- [ ] **Step 5: Bikin modul gereja**

Buat `backend/src/lib/gereja.ts`, pindahkan isi objek dari `api/info-gereja/route.ts`:

```ts
export const INFO_GEREJA = {
  nama: 'Gereja Katolik Santo Arnoldus Janssen Bekasi',
  alamat:
    'Jl. Insinyur H. Juanda No.164, RT.002/RW.009, Margahayu, Kec. Bekasi Tim., Kota Bks, Jawa Barat 17113',
  telepon: '(021) 8801763',
  email: 'paroki@arnoldusjanssen.or.id',
  website: 'www.arnoldusjanssen.or.id',
  keuskupan_agung: 'Jakarta',
  uskup_agung: 'Ignatius Kardinal Suharyo',
  tahun_renovasi: '25 September 2011',
  pastor: [{ nama: 'Rm. Siprianus Wagung, SVD', jabatan: 'Pastor Paroki' }],
  jam_sekretariat: [
    { hari: 'Senin - Sabtu', jam: '08.00 - 15.00 WIB' },
    { hari: 'Minggu', jam: '07.00 - 12.00 WIB' },
  ],
} as const
```

- [ ] **Step 6: Jalankan test, pastikan lulus**

Run: `cd backend && npm test`
Expected: PASS, seluruh test lulus

- [ ] **Step 7: Pakai konstanta itu di route lama**

Ganti seluruh isi `backend/src/app/api/info-gereja/route.ts` dengan:

```ts
import { INFO_GEREJA } from '@/lib/gereja'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/info-gereja — static configuration data
export async function GET(_request: NextRequest) {
  return NextResponse.json({ data: INFO_GEREJA, error: null })
}
```

- [ ] **Step 8: Pastikan tidak ada yang rusak**

Run: `cd backend && npx tsc --noEmit && npm run lint`
Expected: tidak ada error

- [ ] **Step 9: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/vitest.config.ts backend/src/lib/gereja.ts backend/src/lib/gereja.test.ts backend/src/app/api/info-gereja/route.ts
git commit -F - <<'MSG'
Chore[]: siapkan unit test dan pisahkan identitas gereja

Memasang vitest di backend supaya logika yang tidak menyentuh database
bisa diuji otomatis. Sebelumnya proyek ini belum punya test sama sekali.

Identitas gereja yang tadinya ditulis langsung di dalam endpoint
info-gereja dipindah jadi satu konstanta bersama, supaya nanti dipakai
juga sebagai kop surat nota pembayaran tanpa menulis ulang datanya.
MSG
```

---

### Task 2: Migrasi database

**Files:**
- Create: `backend/supabase/migrations/20260822000000_nota_pembayaran.sql`

**Interfaces:**
- Consumes: tabel `tagihan_iuran`, `keluarga` yang sudah ada
- Produces: tabel `nota_counter`, `nota_pembayaran`; fungsi `assign_nota(p_order_id VARCHAR) RETURNS nota_pembayaran`

- [ ] **Step 1: Tulis migrasi**

Buat `backend/supabase/migrations/20260822000000_nota_pembayaran.sql`:

```sql
-- ─── Tabel penomoran nota ────────────────────────────────────────────────────
CREATE TABLE nota_counter (
    tahun       INT PRIMARY KEY,
    last_number INT NOT NULL DEFAULT 0
);

CREATE TABLE nota_pembayaran (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    VARCHAR(100) UNIQUE NOT NULL,
    nomor       VARCHAR(30)  UNIQUE NOT NULL,
    tahun       INT NOT NULL,
    keluarga_id UUID NOT NULL REFERENCES keluarga(id) ON DELETE CASCADE,
    total       INT NOT NULL,
    metode      VARCHAR(20) NOT NULL,
    paid_at     TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nota_keluarga_id ON nota_pembayaran(keluarga_id);

-- Tertutup untuk klien anon/authenticated. Seluruh akses lewat service role,
-- aturan siapa boleh lihat nota siapa hanya ada di src/lib/nota/akses.ts.
ALTER TABLE nota_counter    ENABLE ROW LEVEL SECURITY;
ALTER TABLE nota_pembayaran ENABLE ROW LEVEL SECURITY;

-- ─── Backfill: lunas lama belum punya order_id ───────────────────────────────
-- Tagihan yang dulu ditandai lunas bersamaan dikelompokkan jadi satu nota,
-- memakai keluarga + detik pembayaran yang sama sebagai kunci.
WITH grup AS (
    SELECT
        id,
        'LEGACY-' || md5(
            keluarga_id::TEXT || '|' ||
            date_trunc('second', COALESCE(paid_at, updated_at, created_at))::TEXT
        ) AS new_order_id
    FROM tagihan_iuran
    WHERE status = 'lunas' AND midtrans_order_id IS NULL
)
UPDATE tagihan_iuran t
SET midtrans_order_id = g.new_order_id
FROM grup g
WHERE t.id = g.id;

-- ─── Fungsi penomoran ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION assign_nota(p_order_id VARCHAR)
RETURNS nota_pembayaran
LANGUAGE plpgsql
AS $$
DECLARE
    v_nota          nota_pembayaran;
    v_jml_keluarga  INT;
    v_keluarga_id   UUID;
    v_total         INT;
    v_paid_at       TIMESTAMPTZ;
    v_belum_lunas   INT;
    v_baris         INT;
    v_tahun         INT;
    v_urutan        INT;
    v_metode        VARCHAR(20);
BEGIN
    -- Kunci per order supaya dua permintaan bersamaan tidak membakar dua nomor.
    PERFORM pg_advisory_xact_lock(hashtext(p_order_id));

    SELECT * INTO v_nota FROM nota_pembayaran WHERE order_id = p_order_id;
    IF FOUND THEN
        RETURN v_nota;
    END IF;

    SELECT
        COUNT(*),
        COUNT(DISTINCT keluarga_id),
        MIN(keluarga_id),
        SUM(nominal),
        MAX(COALESCE(paid_at, updated_at, created_at)),
        COUNT(*) FILTER (WHERE status <> 'lunas')
    INTO v_baris, v_jml_keluarga, v_keluarga_id, v_total, v_paid_at, v_belum_lunas
    FROM tagihan_iuran
    WHERE midtrans_order_id = p_order_id;

    IF v_baris = 0 THEN
        RAISE EXCEPTION 'ORDER_TIDAK_DITEMUKAN';
    END IF;

    IF v_belum_lunas > 0 THEN
        RAISE EXCEPTION 'ORDER_BELUM_LUNAS';
    END IF;

    IF v_jml_keluarga > 1 THEN
        RAISE EXCEPTION 'ORDER_LINTAS_KELUARGA';
    END IF;

    v_tahun := EXTRACT(YEAR FROM v_paid_at)::INT;

    INSERT INTO nota_counter (tahun, last_number)
    VALUES (v_tahun, 1)
    ON CONFLICT (tahun) DO UPDATE
        SET last_number = nota_counter.last_number + 1
    RETURNING last_number INTO v_urutan;

    v_metode := CASE
        WHEN p_order_id LIKE 'MANUAL-%' THEN 'manual'
        WHEN p_order_id LIKE 'LEGACY-%' THEN 'legacy'
        ELSE 'qris'
    END;

    INSERT INTO nota_pembayaran
        (order_id, nomor, tahun, keluarga_id, total, metode, paid_at)
    VALUES (
        p_order_id,
        'NOTA/' || v_tahun || '/' || LPAD(v_urutan::TEXT, 6, '0'),
        v_tahun, v_keluarga_id, v_total, v_metode, v_paid_at
    )
    RETURNING * INTO v_nota;

    RETURN v_nota;
END;
$$;
```

- [ ] **Step 2: Terapkan migrasi**

Run: `cd backend && supabase db push`
Expected: migrasi `20260822000000_nota_pembayaran` terpakai tanpa error.

Kalau proyek belum ter-link, jalankan `supabase link` dulu, atau tempelkan isi berkas ke SQL Editor di dashboard Supabase.

- [ ] **Step 3: Verifikasi backfill secara manual**

Tidak ada unit test di langkah ini karena butuh database sungguhan. Jalankan di SQL Editor:

```sql
-- Harus 0: tidak ada lagi lunas tanpa order_id
SELECT COUNT(*) FROM tagihan_iuran
WHERE status = 'lunas' AND midtrans_order_id IS NULL;

-- Lihat pengelompokan hasil backfill
SELECT midtrans_order_id, COUNT(*) AS jml_tagihan, SUM(nominal) AS total
FROM tagihan_iuran
WHERE midtrans_order_id LIKE 'LEGACY-%'
GROUP BY midtrans_order_id
ORDER BY jml_tagihan DESC
LIMIT 10;
```

Expected: query pertama mengembalikan 0.

- [ ] **Step 4: Verifikasi penomoran idempoten**

```sql
-- Ambil satu order lunas mana saja
SELECT midtrans_order_id FROM tagihan_iuran
WHERE status = 'lunas' AND midtrans_order_id IS NOT NULL LIMIT 1;

-- Panggil dua kali dengan order_id di atas
SELECT nomor FROM assign_nota('<order_id>');
SELECT nomor FROM assign_nota('<order_id>');

-- Nomor harus sama, dan hanya ada satu baris
SELECT COUNT(*) FROM nota_pembayaran WHERE order_id = '<order_id>';
```

Expected: dua nomor identik, `COUNT` bernilai 1.

- [ ] **Step 5: Verifikasi penolakan order belum lunas**

```sql
SELECT midtrans_order_id FROM tagihan_iuran
WHERE status = 'menunggu_pembayaran' AND midtrans_order_id IS NOT NULL LIMIT 1;

SELECT * FROM assign_nota('<order_id_belum_lunas>');
```

Expected: error `ORDER_BELUM_LUNAS`. Kalau tidak ada baris berstatus `menunggu_pembayaran`, lewati langkah ini dan catat di pesan commit.

- [ ] **Step 6: Commit**

```bash
git add backend/supabase/migrations/20260822000000_nota_pembayaran.sql
git commit -F - <<'MSG'
Feat[]: tabel dan penomoran nota pembayaran

Menambahkan penyimpanan nota pembayaran iuran. Satu nota mewakili satu
transaksi, jadi kalau umat membayar tiga bulan sekaligus tetap terbit
satu nota berisi tiga rincian.

Nomor nota berurutan per tahun dengan format NOTA/2026/000123 dan
diberikan sekali saja untuk tiap transaksi, sehingga membuka nota
berkali-kali tidak menghabiskan nomor.

Tagihan yang sudah lunas sebelum fitur ini ada ikut dirapikan agar tetap
bisa diterbitkan notanya, dengan mengelompokkan tagihan yang dulu
ditandai lunas bersamaan menjadi satu nota.
MSG
```

---

### Task 3: Helper murni dan aturan akses

**Files:**
- Create: `backend/src/lib/nota/tipe.ts`
- Create: `backend/src/lib/nota/tipe.test.ts`
- Create: `backend/src/lib/nota/akses.ts`
- Create: `backend/src/lib/nota/akses.test.ts`

**Interfaces:**
- Consumes: tidak ada
- Produces:
  - `deriveMetode(orderId: string): MetodeNota` dengan `type MetodeNota = 'qris' | 'manual' | 'legacy'`
  - `labelMetode(metode: MetodeNota): string`
  - `formatRupiah(nominal: number): string`
  - `formatPeriode(bulan: number, tahun: number): string`
  - `type BarisNota = { nama: string; bulan: number; tahun: number; nominal: number }`
  - `type NotaData = { nomor: string; metode: MetodeNota; paidAt: string; orderId: string; noKk: string; alamat: string; baris: BarisNota[]; total: number }`
  - `type ScopeAkses = { isAdmin: boolean; role: string; lingkunganIds: number[]; keluargaId: string | null }`
  - `bolehAksesNota(scope: ScopeAkses, target: { keluargaId: string; lingkunganId: number }): boolean`

- [ ] **Step 1: Tulis test helper yang gagal**

Buat `backend/src/lib/nota/tipe.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  deriveMetode,
  formatPeriode,
  formatRupiah,
  labelMetode,
} from '@/lib/nota/tipe'

describe('deriveMetode', () => {
  it('mengenali pembayaran manual', () => {
    expect(deriveMetode('MANUAL-1755123456-a3f9')).toBe('manual')
  })

  it('mengenali data lama hasil backfill', () => {
    expect(deriveMetode('LEGACY-d41d8cd98f00b204e9800998ecf8427e')).toBe('legacy')
  })

  it('menganggap sisanya pembayaran QRIS', () => {
    expect(deriveMetode('IURAN-1755123456-a3f91b2c')).toBe('qris')
  })
})

describe('labelMetode', () => {
  it('memberi label yang bisa dibaca umat', () => {
    expect(labelMetode('qris')).toBe('QRIS')
    expect(labelMetode('manual')).toBe('Tunai / Manual')
    expect(labelMetode('legacy')).toBe('Tercatat Lunas')
  })
})

describe('formatRupiah', () => {
  it('memakai pemisah ribuan Indonesia', () => {
    expect(formatRupiah(50000)).toBe('Rp 50.000')
  })

  it('menangani nol', () => {
    expect(formatRupiah(0)).toBe('Rp 0')
  })
})

describe('formatPeriode', () => {
  it('menulis nama bulan dan tahun', () => {
    expect(formatPeriode(1, 2026)).toBe('Januari 2026')
    expect(formatPeriode(12, 2026)).toBe('Desember 2026')
  })
})
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `cd backend && npm test`
Expected: FAIL, `Cannot find module '@/lib/nota/tipe'`

- [ ] **Step 3: Bikin modul tipe**

Buat `backend/src/lib/nota/tipe.ts`:

```ts
export type MetodeNota = 'qris' | 'manual' | 'legacy'

export type BarisNota = {
  nama: string
  bulan: number
  tahun: number
  nominal: number
}

export type NotaData = {
  nomor: string
  metode: MetodeNota
  paidAt: string
  orderId: string
  noKk: string
  alamat: string
  baris: BarisNota[]
  total: number
}

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function deriveMetode(orderId: string): MetodeNota {
  if (orderId.startsWith('MANUAL-')) return 'manual'
  if (orderId.startsWith('LEGACY-')) return 'legacy'
  return 'qris'
}

export function labelMetode(metode: MetodeNota): string {
  switch (metode) {
    case 'manual':
      return 'Tunai / Manual'
    case 'legacy':
      return 'Tercatat Lunas'
    default:
      return 'QRIS'
  }
}

export function formatRupiah(nominal: number): string {
  return 'Rp ' + nominal.toLocaleString('id-ID')
}

export function formatPeriode(bulan: number, tahun: number): string {
  return `${BULAN[bulan - 1]} ${tahun}`
}
```

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `cd backend && npm test`
Expected: PASS

- [ ] **Step 5: Tulis test aturan akses yang gagal**

Buat `backend/src/lib/nota/akses.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { bolehAksesNota, type ScopeAkses } from '@/lib/nota/akses'

const TARGET = { keluargaId: 'kel-1', lingkunganId: 7 }

const scope = (over: Partial<ScopeAkses>): ScopeAkses => ({
  isAdmin: false,
  role: 'umat',
  lingkunganIds: [],
  keluargaId: null,
  ...over,
})

describe('bolehAksesNota', () => {
  it('mengizinkan admin paroki', () => {
    expect(bolehAksesNota(scope({ isAdmin: true, role: 'admin_paroki' }), TARGET)).toBe(true)
  })

  it('mengizinkan umat atas nota keluarganya sendiri', () => {
    expect(bolehAksesNota(scope({ keluargaId: 'kel-1' }), TARGET)).toBe(true)
  })

  it('menolak umat atas nota keluarga lain', () => {
    expect(bolehAksesNota(scope({ keluargaId: 'kel-2' }), TARGET)).toBe(false)
  })

  it('menolak umat yang belum tertaut ke keluarga mana pun', () => {
    expect(bolehAksesNota(scope({ keluargaId: null }), TARGET)).toBe(false)
  })

  it('mengizinkan ketua lingkungan atas lingkungan yang diampu', () => {
    expect(
      bolehAksesNota(scope({ role: 'ketua_lingkungan', lingkunganIds: [7, 9] }), TARGET)
    ).toBe(true)
  })

  it('menolak ketua lingkungan di luar lingkungannya', () => {
    expect(
      bolehAksesNota(scope({ role: 'ketua_lingkungan', lingkunganIds: [9] }), TARGET)
    ).toBe(false)
  })

  it('mengizinkan ketua wilayah atas lingkungan di wilayahnya', () => {
    expect(
      bolehAksesNota(scope({ role: 'ketua_wilayah', lingkunganIds: [7] }), TARGET)
    ).toBe(true)
  })

  it('menolak ketua tanpa lingkungan sama sekali', () => {
    expect(
      bolehAksesNota(scope({ role: 'ketua_lingkungan', lingkunganIds: [] }), TARGET)
    ).toBe(false)
  })
})
```

- [ ] **Step 6: Jalankan test, pastikan gagal**

Run: `cd backend && npm test`
Expected: FAIL, `Cannot find module '@/lib/nota/akses'`

- [ ] **Step 7: Bikin modul akses**

Buat `backend/src/lib/nota/akses.ts`:

```ts
export type ScopeAkses = {
  isAdmin: boolean
  role: string
  lingkunganIds: number[]
  keluargaId: string | null
}

export function bolehAksesNota(
  scope: ScopeAkses,
  target: { keluargaId: string; lingkunganId: number }
): boolean {
  if (scope.isAdmin) return true

  if (scope.role === 'ketua_lingkungan' || scope.role === 'ketua_wilayah') {
    return scope.lingkunganIds.includes(target.lingkunganId)
  }

  if (scope.role === 'umat') {
    return scope.keluargaId !== null && scope.keluargaId === target.keluargaId
  }

  return false
}
```

- [ ] **Step 8: Jalankan test, pastikan lulus**

Run: `cd backend && npm test`
Expected: PASS, seluruh test lulus

- [ ] **Step 9: Commit**

```bash
git add backend/src/lib/nota/tipe.ts backend/src/lib/nota/tipe.test.ts backend/src/lib/nota/akses.ts backend/src/lib/nota/akses.test.ts
git commit -F - <<'MSG'
Feat[]: aturan tampilan dan hak akses nota

Menambahkan aturan penulisan nomor nota, nama bulan, format rupiah, dan
label cara pembayaran, supaya tampilan nota seragam di mana pun dipakai.

Menambahkan aturan siapa boleh membuka nota siapa: umat hanya bisa
membuka nota keluarganya sendiri, ketua lingkungan dan ketua wilayah
sebatas lingkungan yang diampu, admin paroki dan pastor semuanya.
Aturan ini ditulis terpisah dari akses database supaya bisa diuji dan
tidak tercecer di banyak tempat.
MSG
```

---

### Task 4: Pengambilan data nota

**Files:**
- Create: `backend/src/lib/nota/data.ts`

**Interfaces:**
- Consumes: `NotaData`, `BarisNota`, `deriveMetode`, `formatPeriode` dari `@/lib/nota/tipe`; `bolehAksesNota`, `ScopeAkses` dari `@/lib/nota/akses`; `createAdminClient` dari `@/lib/supabase/admin`; `getAuthUserWithRole` dari `@/lib/supabase/auth-helper`
- Produces:
  - `type HasilNota = { ok: true; nota: NotaData } | { ok: false; status: 400 | 403 | 404 | 500; pesan: string }`
  - `ambilNota(request: NextRequest, orderId: string): Promise<HasilNota>`

- [ ] **Step 1: Bikin modul data**

Buat `backend/src/lib/nota/data.ts`:

```ts
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUserWithRole } from '@/lib/supabase/auth-helper'
import { bolehAksesNota, type ScopeAkses } from '@/lib/nota/akses'
import { deriveMetode, type BarisNota, type NotaData } from '@/lib/nota/tipe'

export type HasilNota =
  | { ok: true; nota: NotaData }
  | { ok: false; status: 400 | 403 | 404 | 500; pesan: string }

export async function ambilNota(
  request: NextRequest,
  orderId: string
): Promise<HasilNota> {
  const auth = await getAuthUserWithRole(request)
  if (!auth) {
    return { ok: false, status: 403, pesan: 'Anda harus masuk untuk mengunduh nota.' }
  }

  const db = createAdminClient()

  const { data: tagihans, error: tagihanError } = await db
    .from('tagihan_iuran')
    .select('id, bulan, tahun, nominal, status, keluarga_id, iuran_config(nama)')
    .eq('midtrans_order_id', orderId)
    .order('tahun', { ascending: true })
    .order('bulan', { ascending: true })

  if (tagihanError) {
    console.error('[ambilNota] Query tagihan gagal:', tagihanError.message)
    return { ok: false, status: 500, pesan: 'Gagal mengambil data tagihan.' }
  }

  if (!tagihans || tagihans.length === 0) {
    return { ok: false, status: 404, pesan: 'Nota tidak ditemukan.' }
  }

  if (tagihans.some(t => t.status !== 'lunas')) {
    return { ok: false, status: 400, pesan: 'Nota hanya tersedia untuk pembayaran yang sudah lunas.' }
  }

  const keluargaId = tagihans[0].keluarga_id
  if (tagihans.some(t => t.keluarga_id !== keluargaId)) {
    console.error('[ambilNota] Order lintas keluarga:', orderId)
    return { ok: false, status: 500, pesan: 'Data pembayaran tidak konsisten.' }
  }

  const { data: keluarga, error: keluargaError } = await db
    .from('keluarga')
    .select('no_kk_katolik, alamat_lengkap, lingkungan_id')
    .eq('id', keluargaId)
    .single()

  if (keluargaError || !keluarga) {
    return { ok: false, status: 404, pesan: 'Data keluarga tidak ditemukan.' }
  }

  // Umat perlu keluarga_id miliknya sendiri untuk dibandingkan.
  let keluargaMilikPengguna: string | null = null
  if (auth.role === 'umat') {
    const { data: umatRow } = await db
      .from('umat')
      .select('keluarga_id')
      .eq('user_id', auth.user.id)
      .limit(1)
      .maybeSingle()
    keluargaMilikPengguna = umatRow?.keluarga_id ?? null
  }

  const scope: ScopeAkses = {
    isAdmin: auth.isAdmin,
    role: auth.role,
    lingkunganIds: auth.lingkunganIds,
    keluargaId: keluargaMilikPengguna,
  }

  if (!bolehAksesNota(scope, { keluargaId, lingkunganId: keluarga.lingkungan_id })) {
    return { ok: false, status: 403, pesan: 'Anda tidak berhak mengunduh nota ini.' }
  }

  const { data: notaRow, error: notaError } = await db
    .rpc('assign_nota', { p_order_id: orderId })
    .single()

  if (notaError || !notaRow) {
    console.error('[ambilNota] assign_nota gagal:', notaError?.message)
    return { ok: false, status: 500, pesan: 'Gagal menerbitkan nomor nota.' }
  }

  const baris: BarisNota[] = tagihans.map(t => ({
    nama: (t.iuran_config as { nama?: string } | null)?.nama ?? 'Iuran Bulanan',
    bulan: t.bulan,
    tahun: t.tahun,
    nominal: t.nominal,
  }))

  return {
    ok: true,
    nota: {
      nomor: notaRow.nomor,
      metode: deriveMetode(orderId),
      paidAt: notaRow.paid_at,
      orderId,
      noKk: keluarga.no_kk_katolik,
      alamat: keluarga.alamat_lengkap,
      baris,
      total: baris.reduce((sum, b) => sum + b.nominal, 0),
    },
  }
}
```

- [ ] **Step 2: Pastikan tipe cocok**

Run: `cd backend && npx tsc --noEmit`
Expected: tidak ada error

Kalau `db.rpc(...).single()` mengeluh soal tipe, beri anotasi eksplisit:
`const { data: notaRow, error: notaError } = await db.rpc('assign_nota', { p_order_id: orderId }).single<{ nomor: string; paid_at: string }>()`

- [ ] **Step 3: Jalankan seluruh test**

Run: `cd backend && npm test`
Expected: PASS, tidak ada regresi

Tidak ada unit test baru di task ini: seluruh isinya adalah percakapan dengan Supabase, dan bagian yang bisa diuji murni sudah diuji di Task 3.

- [ ] **Step 4: Commit**

```bash
git add backend/src/lib/nota/data.ts
git commit -F - <<'MSG'
Feat[]: pengambilan data nota dari satu transaksi

Menyusun isi nota dari seluruh tagihan yang dibayar dalam satu
transaksi, lengkap dengan nomor KK, alamat keluarga, rincian tiap bulan,
dan totalnya.

Permintaan ditolak kalau ada tagihan yang belum lunas, kalau
transaksinya tidak ditemukan, atau kalau pemintanya tidak berhak atas
nota tersebut.
MSG
```

---

### Task 5: Template PDF

**Files:**
- Create: `backend/src/lib/nota/template.tsx`
- Create: `backend/src/lib/nota/template.test.ts`

**Interfaces:**
- Consumes: `NotaData` dari `@/lib/nota/tipe`; `INFO_GEREJA` dari `@/lib/gereja`
- Produces: `renderNotaPdf(nota: NotaData): Promise<Buffer>`, `namaBerkasNota(nomor: string): string`

- [ ] **Step 1: Pasang @react-pdf/renderer**

```bash
cd backend && npm install @react-pdf/renderer
```

- [ ] **Step 2: Tulis test yang gagal**

Buat `backend/src/lib/nota/template.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { namaBerkasNota, renderNotaPdf } from '@/lib/nota/template'
import type { NotaData } from '@/lib/nota/tipe'

const NOTA: NotaData = {
  nomor: 'NOTA/2026/000123',
  metode: 'qris',
  paidAt: '2026-08-20T07:01:20.000Z',
  orderId: 'IURAN-1755123456-a3f91b2c',
  noKk: '3275-0001',
  alamat: 'Jl. Melati No. 10, Bekasi',
  baris: [
    { nama: 'Iuran Bulanan', bulan: 1, tahun: 2026, nominal: 50000 },
    { nama: 'Iuran Bulanan', bulan: 2, tahun: 2026, nominal: 50000 },
  ],
  total: 100000,
}

describe('namaBerkasNota', () => {
  it('mengganti garis miring supaya aman jadi nama berkas', () => {
    expect(namaBerkasNota('NOTA/2026/000123')).toBe('NOTA-2026-000123.pdf')
  })
})

describe('renderNotaPdf', () => {
  it('menghasilkan berkas PDF yang sah', async () => {
    const buffer = await renderNotaPdf(NOTA)
    expect(buffer.length).toBeGreaterThan(1000)
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  }, 30000)

  it('tetap jalan untuk nota satu baris', async () => {
    const buffer = await renderNotaPdf({ ...NOTA, baris: [NOTA.baris[0]], total: 50000 })
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  }, 30000)
})
```

- [ ] **Step 3: Jalankan test, pastikan gagal**

Run: `cd backend && npm test`
Expected: FAIL, `Cannot find module '@/lib/nota/template'`

- [ ] **Step 4: Bikin template**

Buat `backend/src/lib/nota/template.tsx`:

```tsx
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer'
import { INFO_GEREJA } from '@/lib/gereja'
import {
  formatPeriode,
  formatRupiah,
  labelMetode,
  type NotaData,
} from '@/lib/nota/tipe'

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#111827' },
  kop: { borderBottomWidth: 2, borderBottomColor: '#111827', paddingBottom: 10, marginBottom: 18 },
  namaGereja: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  kopKecil: { fontSize: 8, color: '#4B5563', marginTop: 2 },
  judul: { fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 14 },
  barisInfo: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 110, color: '#4B5563' },
  nilai: { flex: 1 },
  tabelKepala: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 16,
    fontFamily: 'Helvetica-Bold',
  },
  tabelBaris: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  kolNama: { flex: 2 },
  kolPeriode: { flex: 2 },
  kolNominal: { flex: 1, textAlign: 'right' },
  totalBaris: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontFamily: 'Helvetica-Bold',
  },
  catatan: { marginTop: 28, fontSize: 8, color: '#6B7280', textAlign: 'center' },
})

function tanggalIndonesia(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function namaBerkasNota(nomor: string): string {
  return nomor.replace(/\//g, '-') + '.pdf'
}

function NotaDokumen({ nota }: { nota: NotaData }) {
  return (
    <Document title={nota.nomor}>
      <Page size="A4" style={s.page}>
        <View style={s.kop}>
          <Text style={s.namaGereja}>{INFO_GEREJA.nama}</Text>
          <Text style={s.kopKecil}>{INFO_GEREJA.alamat}</Text>
          <Text style={s.kopKecil}>
            Telp. {INFO_GEREJA.telepon} · {INFO_GEREJA.email}
          </Text>
        </View>

        <Text style={s.judul}>NOTA PEMBAYARAN IURAN</Text>

        <View style={s.barisInfo}>
          <Text style={s.label}>Nomor Nota</Text>
          <Text style={s.nilai}>{nota.nomor}</Text>
        </View>
        <View style={s.barisInfo}>
          <Text style={s.label}>Tanggal Bayar</Text>
          <Text style={s.nilai}>{tanggalIndonesia(nota.paidAt)}</Text>
        </View>
        <View style={s.barisInfo}>
          <Text style={s.label}>Nomor KK</Text>
          <Text style={s.nilai}>{nota.noKk}</Text>
        </View>
        <View style={s.barisInfo}>
          <Text style={s.label}>Alamat</Text>
          <Text style={s.nilai}>{nota.alamat}</Text>
        </View>
        <View style={s.barisInfo}>
          <Text style={s.label}>Cara Bayar</Text>
          <Text style={s.nilai}>{labelMetode(nota.metode)}</Text>
        </View>

        <View style={s.tabelKepala}>
          <Text style={s.kolNama}>Jenis Iuran</Text>
          <Text style={s.kolPeriode}>Periode</Text>
          <Text style={s.kolNominal}>Nominal</Text>
        </View>

        {nota.baris.map((b, i) => (
          <View key={i} style={s.tabelBaris}>
            <Text style={s.kolNama}>{b.nama}</Text>
            <Text style={s.kolPeriode}>{formatPeriode(b.bulan, b.tahun)}</Text>
            <Text style={s.kolNominal}>{formatRupiah(b.nominal)}</Text>
          </View>
        ))}

        <View style={s.totalBaris}>
          <Text style={s.kolNama}>Total</Text>
          <Text style={s.kolPeriode}> </Text>
          <Text style={s.kolNominal}>{formatRupiah(nota.total)}</Text>
        </View>

        <Text style={s.catatan}>
          Dokumen ini dicetak otomatis oleh sistem dan sah tanpa tanda tangan.
        </Text>
        <Text style={s.catatan}>Ref: {nota.orderId}</Text>
      </Page>
    </Document>
  )
}

export async function renderNotaPdf(nota: NotaData): Promise<Buffer> {
  return renderToBuffer(<NotaDokumen nota={nota} />)
}
```

- [ ] **Step 5: Jalankan test, pastikan lulus**

Run: `cd backend && npm test`
Expected: PASS

Kalau vitest gagal memproses JSX di berkas `.tsx`, tambahkan `esbuild: { jsx: 'automatic' }` ke `backend/vitest.config.ts`.

- [ ] **Step 6: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/lib/nota/template.tsx backend/src/lib/nota/template.test.ts backend/vitest.config.ts
git commit -F - <<'MSG'
Feat[]: tampilan berkas nota pembayaran

Menyusun bentuk nota dalam berkas PDF: kop gereja, nomor nota, tanggal
bayar, nomor KK dan alamat keluarga, rincian tiap bulan yang dibayar,
lalu totalnya.

Di bagian bawah ada keterangan bahwa dokumen dicetak otomatis dan sah
tanpa tanda tangan, serta kode transaksi kecil untuk pencocokan kalau
ada selisih pembayaran.
MSG
```

---

### Task 6: Endpoint unduh nota

**Files:**
- Create: `backend/src/app/api/iuran/nota/[orderId]/route.ts`

**Interfaces:**
- Consumes: `ambilNota` dari `@/lib/nota/data`; `renderNotaPdf`, `namaBerkasNota` dari `@/lib/nota/template`
- Produces: `GET /api/iuran/nota/[orderId]`

- [ ] **Step 1: Bikin route**

Buat `backend/src/app/api/iuran/nota/[orderId]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { ambilNota } from '@/lib/nota/data'
import { namaBerkasNota, renderNotaPdf } from '@/lib/nota/template'

export const runtime = 'nodejs'

// GET /api/iuran/nota/[orderId] — unduh nota PDF untuk satu transaksi lunas
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { data: null, error: 'Parameter orderId wajib diisi.' },
        { status: 400 }
      )
    }

    const hasil = await ambilNota(request, orderId)
    if (!hasil.ok) {
      return NextResponse.json(
        { data: null, error: hasil.pesan },
        { status: hasil.status }
      )
    }

    const pdf = await renderNotaPdf(hasil.nota)

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(pdf.length),
        'Content-Disposition': `attachment; filename="${namaBerkasNota(hasil.nota.nomor)}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    const pesan = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    console.error('[GET /api/iuran/nota] Caught error:', pesan)
    return NextResponse.json(
      { data: null, error: 'Gagal membuat nota.' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Periksa tipe dan lint**

Run: `cd backend && npx tsc --noEmit && npm run lint`
Expected: tidak ada error

- [ ] **Step 3: Uji manual lewat server dev**

```bash
cd backend && npm run dev
```

Ambil satu `midtrans_order_id` milik tagihan lunas dari SQL Editor, lalu di browser (sudah login sebagai admin) buka:

```
http://localhost:3000/api/iuran/nota/<order_id>
```

Expected: berkas `NOTA-2026-000001.pdf` terunduh dan bisa dibuka.

Uji juga jalur gagalnya:
- `http://localhost:3000/api/iuran/nota/tidak-ada` → JSON 404 `Nota tidak ditemukan.`
- order dengan status `menunggu_pembayaran` → JSON 400
- buka dalam mode penyamaran tanpa login → JSON 403

- [ ] **Step 4: Commit**

```bash
git add backend/src/app/api/iuran/nota
git commit -F - <<'MSG'
Feat[]: alamat unduh nota pembayaran

Menambahkan alamat unduh nota untuk satu transaksi pembayaran yang sudah
lunas. Berkas dikirim langsung sebagai PDF dan tidak disimpan di server,
jadi isinya selalu mengikuti data terbaru.

Permintaan yang tidak berhak, transaksi yang belum lunas, dan transaksi
yang tidak ada sama-sama ditolak dengan keterangan berbahasa Indonesia.
MSG
```

---

### Task 7: Pembayaran manual dapat kode transaksi

**Files:**
- Modify: `backend/src/app/api/iuran/manual-pay/route.ts:26-45`

**Interfaces:**
- Consumes: tidak ada yang baru
- Produces: baris `tagihan_iuran` hasil `manual-pay` selalu punya `midtrans_order_id` berawalan `MANUAL-`

- [ ] **Step 1: Ubah route**

Di `backend/src/app/api/iuran/manual-pay/route.ts`, tambahkan impor di bagian atas:

```ts
import crypto from 'crypto'
```

Ganti blok `const db = createAdminClient()` sampai penutup `if (updateError) { ... }` dengan:

```ts
    const db = createAdminClient()

    // Satu batch penandaan lunas = satu transaksi = satu nota.
    const orderId = `MANUAL-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`

    const { error: updateError } = await db
      .from('tagihan_iuran')
      .update({
        status: 'lunas',
        midtrans_order_id: orderId,
        midtrans_transaction_id: 'MANUAL',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', tagihan_ids)

    if (updateError) {
      console.error('[POST /api/iuran/manual-pay] Update error:', updateError.message)
      return NextResponse.json(
        { data: null, error: 'Gagal memperbarui status tagihan menjadi lunas.' },
        { status: 500 }
      )
    }
```

Ganti juga balasan suksesnya supaya klien tahu kode transaksinya:

```ts
    return NextResponse.json({ data: { order_id: orderId }, error: null })
```

- [ ] **Step 2: Periksa pemakai lama tidak rusak**

Run: `cd backend && grep -rn "manual-pay" src --include=*.tsx --include=*.ts`
Expected: hanya `src/app/admin/iuran/page.tsx:122`, yang cuma mengecek `json.error` dan tidak membaca `json.data`, jadi aman.

- [ ] **Step 3: Periksa tipe dan lint**

Run: `cd backend && npx tsc --noEmit && npm run lint`
Expected: tidak ada error

- [ ] **Step 4: Uji manual**

Dengan server dev jalan, di halaman `/admin/iuran` tandai satu tagihan lunas secara manual. Lalu di SQL Editor:

```sql
SELECT midtrans_order_id, status FROM tagihan_iuran WHERE id = '<id_tagihan>';
```

Expected: `midtrans_order_id` berawalan `MANUAL-`, `status` bernilai `lunas`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/app/api/iuran/manual-pay/route.ts
git commit -F - <<'MSG'
Feat[]: pembayaran tunai ikut punya kode transaksi

Penandaan lunas secara manual sekarang membuat kode transaksi sendiri.
Sebelumnya pembayaran tunai ke pengurus tidak punya penanda apa pun,
sehingga tidak bisa diterbitkan notanya.

Tagihan yang ditandai lunas dalam satu kali proses dianggap satu
transaksi, jadi terbit satu nota berisi seluruh tagihan tersebut.
MSG
```

---

### Task 8: Tombol unduh di halaman admin

**Files:**
- Modify: `backend/src/app/admin/iuran/page.tsx:247-258`

**Interfaces:**
- Consumes: `GET /api/iuran/nota/[orderId]`
- Produces: tidak ada

- [ ] **Step 1: Pastikan tipe baris tabel punya order id**

Run: `cd backend && grep -n "midtrans_order_id\|type Tagihan\|interface Tagihan" src/app/admin/iuran/page.tsx`

Kalau tipe barisnya belum punya `midtrans_order_id`, tambahkan field `midtrans_order_id: string | null` ke deklarasi tipe di berkas itu. Endpoint `GET /api/iuran` sudah memakai `select('*')`, jadi datanya sudah ikut terkirim dan tidak perlu mengubah API.

- [ ] **Step 2: Tambahkan tombol di kolom Aksi**

Di dalam `<td className="px-6 py-4 text-right">`, di sebelah tombol "Tandai Lunas" yang sudah ada, tambahkan:

```tsx
{tagihan.status === 'lunas' && tagihan.midtrans_order_id && (
  <a
    href={`/api/iuran/nota/${tagihan.midtrans_order_id}`}
    className="text-blue-600 hover:text-blue-800 font-medium ml-3"
  >
    Unduh Nota
  </a>
)}
```

Tombol sengaja berupa tautan biasa, bukan `fetch`: halaman admin satu asal dengan API dan `getAuthUserWithRole` membaca cookie sesi, jadi browser sudah membawa kredensialnya sendiri.

- [ ] **Step 3: Periksa tipe dan lint**

Run: `cd backend && npx tsc --noEmit && npm run lint`
Expected: tidak ada error

- [ ] **Step 4: Uji manual**

Buka `/admin/iuran` dengan server dev jalan.

Expected:
- baris berstatus Lunas menampilkan tautan "Unduh Nota", baris lain tidak
- mengklik tautan itu mengunduh berkas PDF
- membuka nota yang sama dua kali menghasilkan nomor nota yang sama

- [ ] **Step 5: Commit**

```bash
git add backend/src/app/admin/iuran/page.tsx
git commit -F - <<'MSG'
Feat[]: tombol unduh nota di halaman iuran admin

Baris tagihan yang sudah lunas kini menampilkan tautan untuk mengunduh
notanya, sehingga pengurus bisa mencetak bukti bayar milik umat tanpa
perlu membuka aplikasi.

Tautan hanya muncul pada tagihan yang benar-benar lunas.
MSG
```

---

### Task 9: Tombol unduh di aplikasi umat

**Files:**
- Modify: `services/api.ts:88-115`
- Modify: `app/iuran/riwayat.tsx:1-20, 180-200`
- Modify: `types/database.ts` (tambah `midtrans_order_id` pada `TagihanIuran` kalau belum ada)

**Interfaces:**
- Consumes: `GET /api/iuran/nota/[orderId]`
- Produces: `api.unduhNota(orderId: string, token?: string): Promise<string>` yang mengembalikan URI berkas lokal

- [ ] **Step 1: Pasang dependensi Expo**

```bash
npx expo install expo-file-system expo-sharing
```

- [ ] **Step 2: Pastikan tipe tagihan punya order id**

Run: `grep -n "midtrans_order_id" types/database.ts`

Kalau belum ada, tambahkan `midtrans_order_id: string | null;` ke tipe `TagihanIuran`.

- [ ] **Step 3: Tambah fungsi unduh di klien API**

Di `services/api.ts`, tambahkan impor di bagian atas berkas:

```ts
import * as FileSystem from 'expo-file-system';
```

Lalu tambahkan method ini di dalam objek `api`, setelah `cekStatusPembayaran`:

```ts
    // Mengunduh nota PDF, mengembalikan URI berkas lokal.
    // Tidak lewat fetchApi karena balasannya biner, bukan JSON.
    unduhNota: async (orderId: string, token?: string): Promise<string> => {
        const tujuan = `${FileSystem.cacheDirectory}nota-${orderId}.pdf`;
        const hasil = await FileSystem.downloadAsync(
            `${API_BASE_URL}/iuran/nota/${orderId}`,
            tujuan,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );

        if (hasil.status !== 200) {
            throw new Error('Gagal mengunduh nota. Coba lagi nanti.');
        }

        return hasil.uri;
    },
```

- [ ] **Step 4: Tambah tombol di layar riwayat**

Di `app/iuran/riwayat.tsx`, tambahkan impor:

```tsx
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
```

Tambahkan state dan handler di dalam komponen, tepat setelah baris `const tagihanList = response?.data || [];`:

```tsx
    const [unduhAktif, setUnduhAktif] = useState<string | null>(null);

    const handleUnduhNota = async (orderId: string) => {
        setUnduhAktif(orderId);
        try {
            const uri = await api.unduhNota(orderId, token ?? undefined);
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Simpan atau bagikan nota',
                });
            } else {
                Alert.alert('Nota tersimpan', 'Berkas nota sudah diunduh ke perangkat.');
            }
        } catch (err) {
            Alert.alert(
                'Gagal mengunduh',
                err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunduh nota.'
            );
        } finally {
            setUnduhAktif(null);
        }
    };
```

Di dalam blok `{tagihan.status === 'lunas' && tagihan.paid_at && (...)}` yang sudah ada, tambahkan tombol setelah teks "Dibayar ...":

```tsx
    {tagihan.midtrans_order_id && (
        <Pressable
            onPress={() => handleUnduhNota(tagihan.midtrans_order_id!)}
            disabled={unduhAktif === tagihan.midtrans_order_id}
            style={{ marginTop: Spacing.xs, alignSelf: 'flex-start' }}>
            <ThemedText type="smallMedium" style={{ color: colors.primary }}>
                {unduhAktif === tagihan.midtrans_order_id ? 'Menyiapkan…' : '⬇ Unduh Nota'}
            </ThemedText>
        </Pressable>
    )}
```

- [ ] **Step 5: Periksa lint**

Run: `npm run lint`
Expected: tidak ada error

- [ ] **Step 6: Uji manual di perangkat**

```bash
npx expo start
```

Masuk sebagai umat yang punya tagihan lunas, buka Riwayat Iuran.

Expected:
- tombol "⬇ Unduh Nota" muncul di bawah keterangan "Dibayar ..." pada baris lunas
- menekannya memunculkan lembar berbagi berisi berkas PDF
- nota bisa dibuka dan isinya cocok dengan tagihan tersebut
- kalau satu transaksi mencakup beberapa bulan, tiap baris mengunduh berkas yang sama dengan nomor nota yang sama

Kalau `API_BASE_URL` masih menunjuk localhost, ganti ke IP komputer sesuai catatan di `services/api.ts:3`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json services/api.ts app/iuran/riwayat.tsx types/database.ts
git commit -F - <<'MSG'
Feat[]: umat bisa mengunduh nota dari riwayat iuran

Setiap pembayaran yang sudah lunas kini punya tombol unduh nota di layar
riwayat iuran. Berkasnya berbentuk PDF dan langsung dibuka lewat lembar
berbagi bawaan perangkat, jadi bisa disimpan atau dikirim ke orang lain.

Kalau satu kali pembayaran mencakup beberapa bulan, seluruh bulan itu
ada di dalam satu nota yang sama.
MSG
```

---

## Catatan verifikasi

Task 2, 6, 7, 8, dan 9 tidak punya test otomatis karena butuh database sungguhan, sesi login, atau perangkat. Langkah verifikasi manualnya ditulis eksplisit di masing-masing task dan harus benar-benar dijalankan, bukan diasumsikan lulus.

Test otomatis yang ada menutupi: format nomor nota, penurunan cara bayar, format rupiah dan periode, seluruh matriks hak akses, dan bahwa berkas PDF yang dihasilkan sah.
