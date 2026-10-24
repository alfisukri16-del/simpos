# SIMPOS — Optik Mekar Jaya

Prototype sistem informasi penjualan optik dengan tiga peran: **Kasir**, **Admin Cabang**, dan **Pemilik**.
Frontend demo (React + TypeScript + Vite), data disimpan di `localStorage` — bukan backend produksi.

## Menjalankan

```sh
npm install
npm run dev        # http://localhost:5173
npm run build
npm run typecheck
```

## Akun demo

| Peran | Halaman masuk | Email | Password |
| --- | --- | --- | --- |
| Kasir | `/login` | `kasir@mekarjaya.demo` | `demo123` |
| Admin Cabang | `/admin/login` | `admin@mekarjaya.demo` | `demo123` |
| Pemilik | `/owner/login` | `owner@mekarjaya.demo` | `demo123` |

## Peta halaman

**Kasir** — `/dashboard`, `/transaksi-baru`, `/checkout`, `/transaksi-berhasil`, `/pemesanan`, `/riwayat-transaksi`, `/pelanggan`, `/resep-mata`, `/pembayaran`

**Admin Cabang** — `/admin/dashboard`, `/admin/produk/frame`, `/admin/produk/lensa`, `/admin/stok`, `/admin/penerimaan`, `/admin/distribusi`, `/admin/pengajuan`, `/admin/pemesanan`, `/admin/mutasi`

**Pemilik** — `/owner/dashboard`, `/owner/cabang`, `/owner/stok`, `/owner/pengajuan`, `/owner/alokasi`, `/owner/mutasi`, `/owner/transaksi`, `/owner/pemesanan`, `/owner/laporan`, `/owner/pengaturan`

## Struktur

```
src/
├─ components/   layout per peran, guard rute, komponen UI
├─ pages/        halaman Kasir, admin/, owner/
├─ store/        sharedStore (state lintas peran) + session
├─ context/      keranjang & perhitungan checkout
├─ data/         data demo (produk, pelanggan, PO, navigasi)
└─ styles/       tokens, layout, halaman
qa/              skrip uji Playwright per tahap
docs/            catatan audit, keputusan, dan laporan QA
figma-kit-export/ paket desain untuk Figma (screenshot + plugin importer)
```

## Catatan

- Autentikasi dan otorisasi hanya simulasi frontend. Jangan pakai kredensial nyata.
- Data contoh (produk, stok, transaksi) ikut ter-reset bila `localStorage` dibersihkan.
- Pengaturan Pemilik (`/owner/pengaturan`) mengubah pengguna, tarif PPN, dan batas minimum default secara nyata di demo.
