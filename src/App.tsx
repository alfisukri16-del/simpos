import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TransaksiBaruPage from "./pages/TransaksiBaruPage";
import CheckoutPage from "./pages/CheckoutPage";
import TransaksiBerhasilPage from "./pages/TransaksiBerhasilPage";
import PemesananPage from "./pages/PemesananPage";
import DetailPoPage from "./pages/DetailPoPage";
import RiwayatPage from "./pages/RiwayatPage";
import PelangganPage from "./pages/PelangganPage";
import ResepMataPage from "./pages/ResepMataPage";
import PembayaranPage from "./pages/PembayaranPage";
import AppLayout from "./components/AppLayout";
import KasirGuard from "./components/KasirGuard";
import AdminLayout from "./components/AdminLayout";
import AdminGuard from "./components/AdminGuard";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminProdukPage from "./pages/admin/AdminProdukPage";
import AdminStokPage from "./pages/admin/AdminStokPage";
import AdminPenerimaanPage from "./pages/admin/AdminPenerimaanPage";
import AdminPengajuanPage from "./pages/admin/AdminPengajuanPage";
import AdminPemesananPage from "./pages/admin/AdminPemesananPage";
import AdminDetailPoPage from "./pages/admin/AdminDetailPoPage";
import AdminMutasiPage from "./pages/admin/AdminMutasiPage";
import OwnerGuard from "./components/OwnerGuard";
import OwnerLayout from "./components/OwnerLayout";
import OwnerLoginPage from "./pages/owner/OwnerLoginPage";
import OwnerDashboardPage from "./pages/owner/OwnerDashboardPage";
import OwnerCabangPage from "./pages/owner/OwnerCabangPage";
import OwnerCabangDetailPage from "./pages/owner/OwnerCabangDetailPage";
import OwnerStokPage from "./pages/owner/OwnerStokPage";
import OwnerPengajuanPage from "./pages/owner/OwnerPengajuanPage";
import OwnerAlokasiPage from "./pages/owner/OwnerAlokasiPage";
import OwnerMutasiPage from "./pages/owner/OwnerMutasiPage";
import OwnerTransaksiPage from "./pages/owner/OwnerTransaksiPage";
import OwnerPOPage from "./pages/owner/OwnerPOPage";
import OwnerLaporanPage from "./pages/owner/OwnerLaporanPage";
import OwnerPengaturanPage from "./pages/owner/OwnerPengaturanPage";
import TitleSync from "./components/TitleSync";
import { CartProvider } from "./context/CartContext";
import { SharedProvider } from "./store/sharedStore";

export default function App() {
  return (
    <SharedProvider>
      <CartProvider>
        <TitleSync />
        <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<KasirGuard />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transaksi-baru" element={<TransaksiBaruPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/transaksi-berhasil" element={<TransaksiBerhasilPage />} />
            <Route path="/pemesanan" element={<PemesananPage />} />
            <Route path="/pemesanan/:id" element={<DetailPoPage />} />
            <Route path="/riwayat-transaksi" element={<RiwayatPage />} />
            <Route path="/pelanggan" element={<PelangganPage />} />
            <Route path="/resep-mata" element={<ResepMataPage />} />
            <Route path="/pembayaran" element={<PembayaranPage />} />
          </Route>
        </Route>
        {/* ADMIN CABANG — Tahap 01. Rute Kasir di atas tidak diubah. */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/produk/frame" element={<AdminProdukPage type="Frame" />} />
          <Route path="/admin/produk/lensa" element={<AdminProdukPage type="Lensa" />} />
          <Route path="/admin/stok" element={<AdminStokPage />} />
          <Route path="/admin/penerimaan" element={<AdminPenerimaanPage />} />
          <Route path="/admin/pengajuan" element={<AdminPengajuanPage />} />
          <Route path="/admin/pemesanan" element={<AdminPemesananPage />} />
          <Route path="/admin/pemesanan/:id" element={<AdminDetailPoPage />} />
          <Route path="/admin/mutasi" element={<AdminMutasiPage />} />
        </Route>
        {/* PEMILIK — Tahap 04 Checkpoint 1. Rute Kasir & Admin di atas tidak diubah. */}
        <Route path="/owner/login" element={<OwnerLoginPage />} />
        <Route
          element={
            <OwnerGuard>
              <OwnerLayout />
            </OwnerGuard>
          }
        >
          <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
          <Route path="/owner/cabang" element={<OwnerCabangPage />} />
          <Route path="/owner/cabang/:id" element={<OwnerCabangDetailPage />} />
          <Route path="/owner/stok" element={<OwnerStokPage />} />
          <Route path="/owner/pengajuan" element={<OwnerPengajuanPage />} />
          <Route path="/owner/alokasi" element={<OwnerAlokasiPage />} />
          <Route path="/owner/mutasi" element={<OwnerMutasiPage />} />
          <Route path="/owner/transaksi" element={<OwnerTransaksiPage />} />
          <Route path="/owner/pemesanan" element={<OwnerPOPage />} />
          <Route path="/owner/laporan" element={<OwnerLaporanPage />} />
          <Route path="/owner/pengaturan" element={<OwnerPengaturanPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </CartProvider>
    </SharedProvider>
  );
}
