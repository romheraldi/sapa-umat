# Registrasi Umat → Tagihan Iuran Otomatis

Tanggal: 2026-07-30

## Masalah

`POST /api/auth/register` hanya membuat baris `auth.users` dan `users_roles`. Tidak ada
baris `umat`, tidak ada `keluarga`, tidak ada `tagihan_iuran`.

`tagihan_iuran` dikunci oleh `keluarga_id`, dan `GET /api/iuran` mencari keluarga lewat
`umat.user_id = auth.uid()` (`src/app/api/iuran/route.ts:26-34`). Akibatnya akun hasil
registrasi mobile selalu menerima `[]` sampai admin menautkannya secara manual lewat
dropdown "Tautkan Akun Pengguna (Opsional)" di `src/app/admin/umat/page.tsx:333`.

Jalur admin sudah lengkap: `POST /api/umat/keluarga` membuat keluarga sekaligus
menggenerate 12 bulan tagihan tahun berjalan (`src/app/api/umat/keluarga/route.ts:129-152`).
Yang hilang adalah jembatan antara lapisan akun (mobile) dan lapisan data umat (admin).

## Tujuan

Umat yang mendaftar lewat mobile langsung memiliki keluarga dan tagihan iuran
12 bulan tahun berjalan, tanpa menunggu admin.

## Keputusan Desain

| Keputusan | Pilihan |
|---|---|
| Cara user terhubung ke keluarga | Dua mode: klaim keluarga existing, atau daftar keluarga baru |
| Scope tagihan | 12 bulan tahun berjalan, sama untuk jalur mobile dan admin |
| Duplikat tagihan | Idempotent — baca yang sudah ada, insert yang kurang |
| Klaim keluarga existing | User pilih namanya dari daftar anggota keluarga tersebut |
| Verifikasi klaim | Cocokkan tanggal lahir dengan `umat.tanggal_lahir` |
| Keluarga baru dari mobile | Langsung jadi, ditandai `is_verified = false` untuk direview admin |
| No. KK Katolik keluarga baru | Digenerate backend dari sequence |
| Step data keluarga | Boleh dilewati, dilengkapi belakangan dari dalam app |
| Letak logic | Endpoint terpisah `POST /api/umat/klaim`, bukan di dalam `register` |

### Kenapa endpoint terpisah, bukan di dalam `register`

Karena step data keluarga boleh dilewati, tetap dibutuhkan endpoint yang bisa dipanggil
belakangan. Menaruh logic di `register` berarti logic yang sama ditulis dua kali.

Selain itu `register` yang gemuk memaksa rollback `auth.admin.deleteUser()` setiap kali
step keluarga gagal — rawan meninggalkan akun yatim. Dengan endpoint terpisah, kegagalan
klaim tidak merusak akun; user cukup mengulang dari layar lengkapi data.

Alternatif trigger database (auto-generate tagihan saat `umat.user_id` di-set) ditolak:
logic bisnis tersembunyi di DB, sulit di-debug, dan tidak menutup kasus keluarga baru.

## Arsitektur

```
Mobile                          Backend
──────                          ───────
register.tsx
  └─ POST /api/auth/register    → auth.users + users_roles        (tidak berubah)
  └─ auto-login                 → token
  └─ pilih mode
       ├─ "Nanti saja"          → selesai
       └─ klaim.tsx
            ├─ GET  /api/umat/keluarga/lookup?no_kk=…
            └─ POST /api/umat/klaim
                                → lib/iuran/generate-tagihan.ts
                                     └─ tagihan_iuran (12 bulan)

Admin panel
  └─ POST /api/umat/keluarga    → lib/iuran/generate-tagihan.ts   (di-refactor)
```

## Komponen

### 1. Migration

File: `backend/supabase/migrations/20260730000000_registrasi_keluarga_mandiri.sql`

```sql
ALTER TABLE keluarga
  ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN created_by  UUID REFERENCES users_roles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX uq_umat_user_id ON umat(user_id) WHERE user_id IS NOT NULL;

CREATE SEQUENCE seq_no_kk_katolik;
```

`is_verified` default `true` supaya baris lama dan jalur admin tidak berubah perilaku.
Jalur mobile mengeset `false` secara eksplisit.

Unique index parsial pada `umat.user_id` menjamin satu akun hanya menaut ke satu anggota.
`GET /api/iuran` dan `GET /api/umat/keluarga` sudah memakai `.limit(1).single()` dengan
asumsi ini, tapi selama ini tidak dijamin oleh skema.

### 2. `lib/iuran/generate-tagihan.ts`

Satu sumber kebenaran untuk pembuatan tagihan.

```ts
generateTagihanTahunBerjalan(
  db: SupabaseClient,
  keluargaId: string,
): Promise<{ created: number; skipped: number }>
```

Perilaku: untuk setiap `iuran_config` dengan `is_active = true`, pastikan ada tagihan
bulan 1–12 tahun `new Date().getFullYear()`. Baca dulu tagihan yang sudah ada untuk
keluarga + tahun tersebut, insert hanya yang belum ada. Pola dedup mengikuti
`POST /api/iuran`, karena Supabase JS tidak mendukung `ON CONFLICT` pada kolom non-PK.

Konsumen: `POST /api/umat/klaim` (baru) dan `POST /api/umat/keluarga` (refactor).

Refactor `POST /api/umat/keluarga` sekaligus memperbaiki bug: insert di sana tidak
memeriksa tagihan existing, sehingga pelanggaran unique constraint tertelan diam-diam
oleh `catch` yang hanya `console.error` — keluarga terbuat tanpa tagihan dan admin tidak
tahu. Setelah refactor, kegagalan generate tagihan dikembalikan dalam response sebagai
peringatan, bukan didiamkan.

### 3. `GET /api/umat/keluarga/lookup?no_kk=…`

Dipakai step klaim untuk menampilkan pilihan nama.

Response:
```json
{
  "data": {
    "no_kk_katolik": "KK-2026-0001",
    "lingkungan": { "nama": "…", "wilayah": { "nama": "…" } },
    "anggota_tersedia": [{ "id": "uuid", "nama_lengkap": "…" }]
  },
  "error": null
}
```

`anggota_tersedia` hanya berisi anggota dengan `user_id IS NULL`. Field yang dikirim
dibatasi pada `id` dan `nama_lengkap` — tanggal lahir, alamat, dan telepon tidak ikut
karena tanggal lahir dipakai sebagai faktor verifikasi.

Keluarga tidak ditemukan → 404. Keluarga ada tapi semua anggota sudah tertaut →
`anggota_tersedia: []`, mobile menampilkan pesan agar user menghubungi admin.

Nama ditampilkan apa adanya, tidak disamarkan: user harus bisa mengenali dirinya, dan
nama tanpa tanggal lahir tidak cukup untuk mengambil alih akun.

### 4. `POST /api/umat/klaim`

Wajib autentikasi. Ditolak jika role bukan `umat`, atau jika user sudah punya baris `umat`
(409, `"Akun Anda sudah tertaut ke sebuah keluarga."`).

**Mode `existing`** — body `{ mode: "existing", umat_id, tanggal_lahir }`

1. Ambil baris `umat` by id. Tidak ada, atau `user_id` sudah terisi → 400.
2. Bandingkan `tanggal_lahir`. Beda → 400.
3. `UPDATE umat SET user_id = <uid> WHERE id = <umat_id> AND user_id IS NULL`.
   Nol baris terpengaruh → 409 (ada yang mengklaim duluan).
4. `generateTagihanTahunBerjalan(db, umat.keluarga_id)`.

Semua kegagalan validasi memakai pesan generik `"Data tidak cocok."` — tidak menyebut
field mana yang salah, supaya No. KK tidak bisa dipakai menebak tanggal lahir anggota.

**Mode `new`** — body:
```json
{
  "mode": "new",
  "keluarga": { "lingkungan_id": 1, "alamat_lengkap": "…", "no_telepon": "…" },
  "data_diri": {
    "tempat_lahir": "…", "tanggal_lahir": "1990-01-01",
    "jenis_kelamin": "L", "status_dalam_keluarga": "Suami",
    "status_perkawinan": "Menikah Katolik",
    "status_baptis": true, "status_krisma": false
  }
}
```

1. `no_kk_katolik` = `KK-{tahun}-{nextval('seq_no_kk_katolik') dipad 4 digit}`.
2. Insert `keluarga` dengan `is_verified: false`, `created_by: <uid>`.
3. Insert `umat` — `keluarga_id` dari langkah 2, `user_id` = uid, `nama_lengkap` diambil
   dari `users_roles.nama_lengkap`, sisanya dari `data_diri`.
4. `UPDATE keluarga SET kepala_keluarga_id = <umat.id>`.
5. `generateTagihanTahunBerjalan(db, keluarga.id)`.
6. Gagal di langkah 3 atau 4: hapus `umat` lalu `keluarga` yang baru dibuat. Akun tidak
   disentuh. Kegagalan di langkah 5 tidak memicu rollback — lihat Penanganan Error.

`status_dalam_keluarga` diisi user lewat dropdown, tidak dipaksa `'Suami'`, karena kepala
keluarga bisa perempuan atau belum menikah.

**Response sukses (kedua mode):**
```json
{
  "data": {
    "keluarga_id": "uuid",
    "no_kk_katolik": "KK-2026-0001",
    "tagihan": { "created": 12, "skipped": 0 }
  },
  "error": null
}
```

### 5. Mobile

**`app/register.tsx`** — setelah akun terbuat dan auto-login sukses, lanjut ke step pilih
mode: *Sudah terdaftar di paroki* / *Keluarga baru* / *Nanti saja*. Layar sukses yang ada
sekarang menjadi step terakhir. *Nanti saja* langsung ke `/(tabs)` seperti perilaku
sekarang.

**`app/data-umat/klaim.tsx`** (baru) — dipakai dari registrasi maupun dari banner
"lengkapi data", sehingga alurnya identik di kedua pintu masuk.

- Mode existing: input No. KK → `lookup` → pilih nama dari daftar → isi tanggal lahir → submit
- Mode new: dropdown lingkungan (`GET /api/umat/lingkungan`) + alamat + telepon opsional,
  lalu data diri (tempat lahir, tanggal lahir, jenis kelamin, status dalam keluarga,
  status perkawinan, baptis, krisma)

**Banner** di tab iuran: muncul saat `getTagihanIuran` mengembalikan array kosong dan user
belum punya keluarga → tombol menuju layar klaim.

**`services/api.ts`** — tambah `lookupKeluarga(noKk)` dan `klaimKeluarga(payload, token)`,
mengikuti pola `fetchApi` yang ada.

### 6. Admin panel

`src/app/admin/umat/page.tsx`: badge "Belum Diverifikasi" pada keluarga dengan
`is_verified = false`, dan tombol Verifikasi yang memanggil `PUT /api/umat/keluarga/:no_kk`
(handler update keluarga yang sudah ada; `PATCH` di route yang sama dipakai untuk menambah
anggota) dengan `{ is_verified: true }`. Tanpa ini penanda `is_verified` tidak ada gunanya.

## Penanganan Error

| Kondisi | Kode | Pesan |
|---|---|---|
| No. KK tidak ditemukan | 404 | No. KK Katolik tidak ditemukan. |
| Semua anggota sudah tertaut | 200 | (daftar kosong, mobile arahkan hubungi admin) |
| Tanggal lahir tidak cocok / anggota sudah tertaut | 400 | Data tidak cocok. |
| Balapan klaim | 409 | Anggota ini baru saja ditautkan ke akun lain. |
| User sudah punya keluarga | 409 | Akun Anda sudah tertaut ke sebuah keluarga. |
| Role bukan umat | 403 | Fitur ini hanya untuk akun umat. |
| Lingkungan tidak valid | 400 | Lingkungan tidak valid. |
| Generate tagihan gagal | 201 | Sukses, dengan field peringatan di response |

Klaim yang sukses tapi tagihannya gagal digenerate tetap dianggap sukses — tautan
keluarga adalah hasil utamanya, dan tagihan bisa disusul cron atau `POST /api/iuran`.

## Testing

**`generateTagihanTahunBerjalan`** — keluarga kosong menghasilkan 12 tagihan per config
aktif; dipanggil dua kali menghasilkan `created: 0` pada panggilan kedua; sebagian tagihan
sudah ada (skenario cron) hanya mengisi kekurangannya; tidak ada config aktif
menghasilkan `created: 0` tanpa error.

**`POST /api/umat/klaim` mode existing** — happy path menaut dan menggenerate 12 tagihan;
tanggal lahir salah ditolak 400 tanpa mengubah baris `umat`; anggota yang sudah tertaut
ditolak; user yang sudah punya keluarga ditolak 409.

**`POST /api/umat/klaim` mode new** — membuat keluarga + umat + 12 tagihan, dengan
`is_verified = false` dan `kepala_keluarga_id` terisi; kegagalan di tengah tidak
meninggalkan keluarga tanpa anggota; No. KK yang dihasilkan unik pada pemanggilan
berurutan.

**Regresi** — `POST /api/umat/keluarga` tetap menghasilkan 12 tagihan setelah refactor;
`GET /api/iuran` untuk umat yang baru klaim mengembalikan 12 tagihan.

## Di Luar Lingkup

- Alur approval admin untuk klaim (verifikasi cukup lewat tanggal lahir)
- Notifikasi ke admin saat ada keluarga baru dari mobile
- Mengubah scope cron bulanan atau `generate-tagihan.mjs`
- Menaut akun yang sudah terlanjur nyangkut (tanpa keluarga) secara massal
