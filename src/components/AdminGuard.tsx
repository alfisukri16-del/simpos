import { Navigate } from "react-router-dom";
import { getSession } from "../store/session";

/** Penjaga rute /admin — demo frontend: sesi lokal, bukan RBAC server. */
export default function AdminGuard({ children }: { children: JSX.Element }) {
  const s = getSession();
  if (!s || s.role !== "admin") return <Navigate to="/admin/login" replace />;
  return children;
}
