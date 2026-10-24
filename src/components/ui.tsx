import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { formatIDR } from "../data/catalog";

/* ---------- Page header (overline + title + desc, ref-gaya) ---------- */
export function PageHeader({
  overline,
  title,
  desc,
  actions,
  crumbs,
}: {
  overline: string;
  title: string;
  desc?: string;
  actions?: ReactNode;
  crumbs?: ReactNode;
}) {
  return (
    <div className="pagehead">
      {crumbs ? <div className="crumbs">{crumbs}</div> : null}
      <div className="pagehead-main">
        <div>
          <div className="overline">{overline}</div>
          <h1>{title}</h1>
          {desc ? <p>{desc}</p> : null}
        </div>
        {actions ? <div className="pagehead-actions">{actions}</div> : null}
      </div>
    </div>
  );
}

/* ---------- Chip (tab / filter) ---------- */
export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button className={`chip ${active ? "active" : ""}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

/* ---------- Search box ---------- */
export function SearchBox({
  placeholder,
  value,
  onChange,
  width,
}: {
  placeholder: string;
  value?: string;
  onChange?: (v: string) => void;
  width?: number;
}) {
  return (
    <label className="toolbar-search" style={width ? { width } : undefined}>
      <Search size={16} />
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </label>
  );
}

/* ---------- Status chip ---------- */
const STATUS_STYLE: Record<string, [string, string]> = {
  "Sudah Datang": ["#e5f9ef", "#15803d"],
  Diproses: ["#fff4dd", "#a16207"],
  Dipesan: ["#eaf0ff", "#3a4fd0"],
  Selesai: ["#eef0f8", "#5b5f7a"],
  Lunas: ["#e2f7ec", "#1f9d63"],
  Pending: ["#fdf0d6", "#b57a12"],
  Dibatalkan: ["#fde7ea", "#d8455f"],
  Aktif: ["#e6e8fd", "#4a44ee"],
  Expired: ["#f1f0f8", "#8d8eb4"],
  Kedaluwarsa: ["#fde7ea", "#d8455f"],
  Ada: ["#e2f7ec", "#1f9d63"],
  "Belum ada": ["#eef0f8", "#8d8eb4"],
  "Stok Menipis": ["#fdf0d6", "#b57a12"],
  Aman: ["#e2f7ec", "#1f9d63"],
  "Menunggu Diterima": ["#eaf0ff", "#3a4fd0"],
  "Diterima Sebagian": ["#fdf0d6", "#b57a12"],
  Diterima: ["#e2f7ec", "#1f9d63"],
  Diajukan: ["#e6e8fd", "#4a44ee"],
  Masuk: ["#e2f7ec", "#1f9d63"],
  Keluar: ["#fde7ea", "#d8455f"],
};

export function StatusPill({ label, dot = true }: { label: string; dot?: boolean }) {
  const [bg, fg] = STATUS_STYLE[label] ?? ["#eef0f8", "#5b5f7a"];
  return (
    <span className="status-pill" style={{ background: bg, color: fg }}>
      {dot ? <i style={{ background: fg }} /> : null}
      {label}
    </span>
  );
}

/* ---------- Stat card ---------- */
export function StatCard({
  label,
  value,
  caption,
  icon,
  tone,
}: {
  label: string;
  value: string;
  caption?: string;
  icon?: ReactNode;
  tone?: "violet" | "green" | "amber" | "blue" | "neutral";
}) {
  return (
    <div className={`stat-card ${tone ? `tone-${tone}` : ""}`}>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {caption ? <div className="stat-caption">{caption}</div> : null}
      </div>
      {icon ? <span className="stat-icon">{icon}</span> : null}
    </div>
  );
}

/* ---------- Avatar initials ---------- */
export function Avatar({ initials, size = 40 }: { initials: string; size?: number }) {
  return (
    <span className="avatar-pill" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </span>
  );
}

/* ---------- Section block (title + right action) ---------- */
export function SectionBlock({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`section-block ${className}`}>
      <div className="section-head">
        <h2>{title}</h2>
        {action ? <div className="section-action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

/* ---------- Step indicator (Pilih Produk → Checkout → Selesai) ---------- */
const STEPS = ["Pilih Produk", "Checkout", "Selesai"] as const;

export function Steps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="steps" aria-label="Langkah transaksi">
      {STEPS.map((label, i) => (
        <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
          <span className={`step ${i + 1 === current ? "active" : i + 1 < current ? "done" : ""}`}>
            <i />
            {label}
          </span>
          {i < STEPS.length - 1 ? (
            <svg className="step-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          ) : null}
        </span>
      ))}
    </div>
  );
}

export { formatIDR };

/* ---------- Small money helper ---------- */
export const rp = (v: number) => formatIDR(v).replace(",00", "");