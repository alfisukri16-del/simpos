import { BRANCH_ID } from "./sharedStore";
import { DEMO_ADMIN } from "../data/admin";

/* Sesi bersama Kasir + Admin + Pemilik (demo frontend — bukan auth/RBAC production). */

export type Role = "kasir" | "admin" | "pemilik";

export type Session = {
  role: Role;
  name: string;
  initials: string;
  branch: string;
  branchId: string; // 'cabang-padang' untuk Kasir/Admin; 'all' untuk Pemilik
  email: string;
};

export const SESSION_KEY = "simpos.session";
export const DEMO_KASIR = {
  email: "kasir@mekarjaya.demo",
  password: "demo123",
  name: "Korena Saif",
  initials: "KS",
  role: "Kasir",
  branch: "Cabang Padang",
};

export const DEMO_OWNER = {
  email: "owner@mekarjaya.demo",
  password: "demo123",
  name: "Agus Wijaya",
  initials: "AW",
  role: "Pemilik",
  branch: "Seluruh Cabang",
};

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (s.role !== "kasir" && s.role !== "admin" && s.role !== "pemilik") return null;
    if (s.role === "pemilik") {
      if (s.branchId !== "all") return null;
      return s;
    }
    if (s.branchId !== BRANCH_ID) return null;
    return s;
  } catch {
    return null;
  }
}

export function setSession(s: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function adminSession(): Session {
  return {
    role: "admin",
    name: DEMO_ADMIN.name,
    initials: DEMO_ADMIN.initials,
    branch: DEMO_ADMIN.branch,
    branchId: BRANCH_ID,
    email: DEMO_ADMIN.email,
  };
}

export function ownerSession(): Session {
  return {
    role: "pemilik",
    name: DEMO_OWNER.name,
    initials: DEMO_OWNER.initials,
    branch: DEMO_OWNER.branch,
    branchId: "all",
    email: DEMO_OWNER.email,
  };
}
