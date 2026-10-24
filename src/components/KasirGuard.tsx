import { Navigate, Outlet } from "react-router-dom";
import { getSession } from "../store/session";

/** Rute Kasir: wajib sesi role kasir cabang aktif. Direct URL tanpa sesi → /login. */
export default function KasirGuard() {
  const s = getSession();
  if (!s || s.role !== "kasir") return <Navigate to="/login" replace />;
  return <Outlet />;
}
