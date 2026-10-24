import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  ShoppingCart,
  ClipboardList,
  History,
  CreditCard,
  Users,
  Glasses,
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutGrid },
  { label: "Transaksi Baru", to: "/transaksi-baru", icon: ShoppingCart },
  { label: "Pemesanan (PO)", to: "/pemesanan", icon: ClipboardList },
  { label: "Riwayat Transaksi", to: "/riwayat-transaksi", icon: History },
  { label: "Pembayaran", to: "/pembayaran", icon: CreditCard },
];

export const SECONDARY_NAV: NavItem[] = [
  { label: "Pelanggan", to: "/pelanggan", icon: Users },
  { label: "Resep Mata", to: "/resep-mata", icon: Glasses },
];

/** Demo session data — clearly labelled demo, not verified business data. */
export const DEMO_SESSION = {
  cashierName: "Korena Saif",
  initials: "KS",
  role: "Kasir",
  branch: "Cabang Padang",
};
