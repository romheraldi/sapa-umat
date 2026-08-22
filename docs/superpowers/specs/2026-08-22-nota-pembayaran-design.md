# Nota Pembayaran Iuran — Desain

Tanggal: 2026-08-22
Status: disetujui, siap masuk rencana implementasi

## Masalah

Umat yang sudah melunasi iuran tidak punya bukti bayar yang bisa disimpan atau
ditunjukkan. Pengurus juga tidak punya dokumen untuk diarsipkan bendahara.
Yang ada saat ini hanya badge "Lunas" di layar riwayat dan di tabel admin.

## Keputusan

| Pertanyaan | Keputusan |
|---|---|
| Satu nota mewakili apa | Satu transaksi pembayaran, bukan satu baris tagihan |
| Cara generate | PDF dibuat on-demand di server, tidak disimpan |
| Nomor nota | Nomor urut resmi per tahun: `NOTA/2026/000123` |
| Cakupan data | Semua tagihan lunas dapat nota, termasuk pembayaran manual dan data lama |

## Konteks kode yang relevan

- `backend/src/app/api/iuran/bayar/route.ts:79` — satu `orderId` dibuat untuk
  seluruh array `tagihan_ids`, lalu ditulis ke kolom `midtrans_order_id` di
  semua baris tagihan tersebut. Jadi satu transaksi bisa mencakup banyak bulan.
- `backend/src/app/api/iuran/manual-pay/route.ts:33` — hanya mengubah `status`,
  `midtrans_transaction_id='MANUAL'`, dan `paid_at`. `midtrans_order_id`
  dibiarkan NULL, sehingga pembayaran manual tidak punya kunci pengelompokan.
- `backend/supabase/migrations/20260704000000_add_iuran_bulanan.sql:26` — tabel
  `tagihan_iuran` tidak punya kolom apa pun untuk nomor nota.
- `backend/src/app/api/iuran/route.ts:31` — aturan akses per role yang akan
  dicontek ulang oleh endpoint nota.
- `backend/src/app/api/info-gereja/route.ts:6` — identitas gereja masih
  hardcoded di dalam handler.

## Arsitektur

### Data model

Migrasi baru `backend/supabase/migrations/20260822000000_nota_pembayaran.sql`.

```sql
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

ALTER TABLE nota_counter     ENABLE ROW LEVEL SECURITY;
ALTER TABLE nota_pembayaran  ENABLE ROW LEVEL SECURITY;
```

RLS dinyalakan tanpa policy apa pun, jadi kedua tabel tertutup untuk klien
anon dan authenticated. Semua akses lewat `createAdminClient()` di server, sama
seperti route iuran yang sudah ada. Ini disengaja: aturan siapa boleh melihat
nota siapa hanya ada di satu tempat, yaitu `lib/nota/data.ts`.

`metode` bernilai `qris`, `manual`, atau `legacy`, diturunkan dari awalan
`order_id`: `IURAN-` menjadi `qris`, `MANUAL-` menjadi `manual`, `LEGACY-`
menjadi `legacy`.

`total` diisi jumlah `nominal` seluruh baris `tagihan_iuran` dalam order itu.

`paid_at` pada nota diisi `MAX(paid_at)` dari baris-baris tagihan dalam order
tersebut, dan tahun nomor nota diambil dari nilai itu. Dengan begitu nota lama
yang baru diunduh tahun depan tetap bernomor tahun pembayarannya.

Tabel terpisah dipilih, bukan kolom tambahan di `tagihan_iuran`, karena satu
nota memetakan ke banyak baris tagihan. Menaruh nomor di `tagihan_iuran` akan
menduplikasi nomor yang sama di setiap baris.

### Penomoran

Fungsi PL/pgSQL `assign_nota(p_order_id VARCHAR)` mengembalikan baris
`nota_pembayaran`, dengan sifat:

1. Kalau nota untuk `order_id` itu sudah ada, kembalikan yang lama. Idempoten —
   unduh berkali-kali tidak membuat nomor baru.
2. Kalau belum ada, naikkan `nota_counter.last_number` untuk tahun `paid_at`
   lewat `INSERT ... ON CONFLICT (tahun) DO UPDATE SET last_number =
   nota_counter.last_number + 1 RETURNING last_number`, lalu format
   `NOTA/<tahun>/<6 digit>`.

Keduanya berjalan dalam satu transaksi, sehingga dua permintaan bersamaan tidak
menghasilkan nomor kembar dan tidak meninggalkan nomor bolong.

Nomor diberikan saat nota **pertama kali diminta**, bukan saat tagihan lunas.
Kalau diberikan saat lunas, nota yang tidak pernah diunduh tetap memakan nomor
dan membuat lubang di buku bendahara.

### Perbaikan sumber data

`manual-pay` diubah agar membuat `MANUAL-<timestamp>-<hex>` per batch
`tagihan_ids`, lalu menuliskannya ke `midtrans_order_id` di semua baris batch
tersebut. Ini yang membuat pembayaran tunai ke pengurus lingkungan bisa
menghasilkan nota.

Backfill di migrasi yang sama: baris `status='lunas'` dengan
`midtrans_order_id IS NULL` dikelompokkan per
`(keluarga_id, date_trunc('second', COALESCE(paid_at, updated_at, created_at)))`
dan tiap kelompok diberi `LEGACY-<uuid>`. Tagihan yang dulu ditandai lunas
bersamaan tetap menjadi satu nota.

### Endpoint

`GET /api/iuran/nota/[orderId]` mengembalikan `application/pdf` dengan header
`Content-Disposition: attachment; filename="NOTA-2026-000123.pdf"`.
Route memakai `export const runtime = 'nodejs'`.

Aturan akses mencontek `api/iuran/route.ts` agar tidak ada aturan versi kedua:

| Role | Boleh mengakses |
|---|---|
| `umat` | hanya kalau seluruh tagihan di order itu milik `keluarga_id` miliknya |
| `ketua_lingkungan`, `ketua_wilayah` | keluarga yang ada di `auth.lingkunganIds` |
| `admin_paroki`, `pastor` | semua |

Order yang salah satu tagihannya belum `lunas` menghasilkan 400, bukan PDF
setengah jadi. Order yang tidak ditemukan menghasilkan 404.

### Modul

```
backend/src/lib/gereja.ts          identitas gereja, dipakai bersama api/info-gereja
backend/src/lib/nota/nomor.ts      pembungkus assign_nota
backend/src/lib/nota/data.ts       query + otorisasi, mengembalikan objek nota
backend/src/lib/nota/template.tsx  dokumen @react-pdf/renderer
```

Dipisah supaya template bisa diubah tanpa menyentuh aturan akses, dan aturan
akses bisa diuji tanpa membuat PDF.

### Isi nota

Kop gereja, nomor nota, tanggal bayar, nomor KK dan alamat keluarga, tabel
rincian berisi jenis iuran / periode / nominal per baris tagihan, total, metode
bayar, `order_id` kecil di footer untuk rekonsiliasi dengan dashboard Midtrans,
dan catatan bahwa dokumen dicetak otomatis dan sah tanpa tanda tangan.

### UI

Admin — `backend/src/app/admin/iuran/page.tsx:247` sudah punya kolom Aksi.
Tambahkan tombol "Unduh Nota" yang muncul saat `status === 'lunas'`. Halaman
admin satu origin dan `getAuthUserWithRole` membaca cookie, jadi cukup tautan
biasa tanpa fetch blob.

Mobile — `app/iuran/riwayat.tsx:180`, tombol "Unduh Nota" di setiap baris lunas.
Karena satu nota bisa mencakup beberapa bulan, beberapa baris akan mengunduh
berkas yang sama; tombol diberi label nomor nota supaya pengguna paham itu satu
nota. Alternatif yang ditolak untuk sekarang: layar "Riwayat Transaksi" terpisah
yang dikelompokkan per order, lebih benar secara konsep tapi menambah layar baru.

### Dependency baru

- Backend: `@react-pdf/renderer`. JS murni, jalan di serverless, tidak butuh
  headless Chrome.
- Mobile: `expo-file-system` dan `expo-sharing`. Dibutuhkan karena endpoint
  memerlukan header `Authorization`, sehingga `Linking.openURL` tidak cukup.
  Alurnya: fetch dengan Bearer, tulis ke direktori cache, buka share sheet.
  Alternatif "token di query string" ditolak karena menaruh kredensial di URL.

## Penanganan error

- Tagihan di satu order punya `keluarga_id` berbeda: tolak dengan 500 dan catat
  log, karena itu berarti data rusak.
- `paid_at` NULL pada baris lunas: pakai `updated_at`, lalu `created_at`.
- Kegagalan render PDF: kembalikan 500 dengan pesan generik, jangan bocorkan
  jejak internal.
- Di mobile, kegagalan unduh memunculkan Alert dan tombol kembali aktif.

## Pengujian

- Penomoran: dua panggilan dengan `order_id` sama menghasilkan nomor identik;
  dua order berbeda secara bersamaan tidak bertabrakan.
- Matriks otorisasi: umat keluarga lain 403, ketua di luar lingkungannya 403,
  admin 200.
- Order yang belum lunas 400.
- Backfill: baris lunas yang ditandai bersamaan jatuh ke satu nota.
- Manual: buka PDF hasil unduhan di perangkat.

## Di luar cakupan

Kirim nota via email, unduh massal seluruh nota, pratinjau PDF di dalam aplikasi,
dan logo gambar di kop surat. Kop memakai teks dulu.
