import { Navigate } from "react-router-dom";
import { getSession } from "../store/session";

/** Rute /owner: wajib sesi role pemilik. */
export default function OwnerGuard({ children }: { children: JSX.Element }) {
  const s = getSession();
  if (!s || s.role !== "pemilik") return <Navigate to="/owner/login" replace />;
  return children;
}
