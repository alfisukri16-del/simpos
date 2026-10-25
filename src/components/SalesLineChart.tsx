import { useEffect, useRef, useState } from "react";

/* Line chart dua seri: periode ini (garis penuh + titik) vs periode sebelumnya (garis putus-putus). */

export type TrendPoint = {
  key: string;
  label: string;
  full: string;
  value: number;
  count: number;
};

type Props = {
  points: TrendPoint[];
  /** Nilai periode sebelumnya, sejajar indeks dengan points. null = tidak ada data. */
  previous: Array<number | null>;
};

/** Batas atas + langkah tick yang "bulat" supaya angka sumbu enak dibaca. */
function niceScale(maxValue: number) {
  if (maxValue <= 0) return { max: 1, step: 1 };
  const raw = maxValue / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  return { max: Math.ceil(maxValue / step) * step, step };
}

function tickLabel(v: number) {
  if (v === 0) return "0";
  if (v >= 1_000_000) {
    const n = v / 1_000_000;
    return `${n.toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  }
  if (v >= 1_000) return `${Math.round(v / 1_000)} rb`;
  return String(v);
}

/** Kurva halus (cardinal spline) supaya garis tidak terlihat kaku. */
function smoothPath(pts: Array<{ x: number; y: number }>) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  const t = 0.2;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C ${p1.x + (p2.x - p0.x) * t} ${p1.y + (p2.y - p0.y) * t}, ${
      p2.x - (p3.x - p1.x) * t
    } ${p2.y - (p3.y - p1.y) * t}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function SalesLineChart({ points, previous }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const W = Math.max(280, Math.round(width));
  const compact = W < 560;
  const H = compact ? 240 : 290;
  const M = { left: compact ? 48 : 58, right: compact ? 12 : 18, top: 14, bottom: 30 };

  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const baseY = M.top + plotH;

  const all = [...points.map((p) => p.value), ...previous.filter((v): v is number => v != null)];
  const peak = Math.max(...all, 0);
  const { max, step } = niceScale(peak);
  const ticks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(Number(v.toFixed(6)));

  const n = points.length;
  const xOf = (i: number) => (n === 1 ? M.left + plotW / 2 : M.left + (plotW * i) / (n - 1));
  const yOf = (v: number) => M.top + plotH * (1 - v / max);

  const curPts = points.map((p, i) => ({ x: xOf(i), y: yOf(p.value) }));
  const prevPts = points
    .map((_, i) => {
      const v = previous[i];
      return v == null ? null : { x: xOf(i), y: yOf(v) };
    })
    .filter((p): p is { x: number; y: number } => p !== null);

  const labelStep = Math.max(1, Math.ceil(n / (compact ? 3 : 4)));

  return (
    <div className="sales-svg-wrap" ref={box}>
      <svg
        className="sales-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Grafik tren penjualan: periode ini dibanding periode sebelumnya"
      >
        {/* gridline + angka sumbu Y */}
        {ticks.map((t) => {
          const y = yOf(t);
          return (
            <g key={t}>
              <line x1={M.left} y1={y} x2={W - M.right} y2={y} stroke="#eef0fb" strokeWidth={1} />
              <text x={M.left - 10} y={y} textAnchor="end" dominantBaseline="middle" className="sales-tick">
                {tickLabel(t)}
              </text>
            </g>
          );
        })}

        {/* periode sebelumnya */}
        {prevPts.length > 1 && (
          <path
            d={smoothPath(prevPts)}
            fill="none"
            stroke="#b7b5e4"
            strokeWidth={2}
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
        )}

        {/* periode ini */}
        <path d={smoothPath(curPts)} fill="none" stroke="var(--accent)" strokeWidth={2.6} strokeLinecap="round" />

        {/* titik + label sumbu X */}
        {curPts.map((p, i) => (
          <g key={points[i].key} className="sales-dot-group">
            <title>{`${points[i].full} · ${points[i].count} transaksi · ${tickLabel(points[i].value)}`}</title>
            <circle cx={p.x} cy={p.y} r={9} fill="transparent" />
            <circle cx={p.x} cy={p.y} r={3.4} fill="var(--accent)" stroke="#fff" strokeWidth={1.5} className="sales-dot" />
            {i % labelStep === 0 && (
              <text x={p.x} y={baseY + 20} textAnchor="middle" className="sales-xlabel">
                {points[i].label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
