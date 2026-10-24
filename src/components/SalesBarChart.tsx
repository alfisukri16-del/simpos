import { useEffect, useRef, useState } from "react";

/* Bar chart bergaya sumbu X/Y: garis sumbu, tick + angka di sumbu Y, gridline, judul sumbu. */

export type SalesPoint = {
  key: string;
  label: string;
  full: string;
  value: number;
  count: number;
};

type Props = {
  points: SalesPoint[];
  yTitle: string;
  xTitle: string;
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

export default function SalesBarChart({ points, yTitle, xTitle }: Props) {
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

  const W = Math.max(300, Math.round(width));
  const compact = W < 560;
  const plotWidthGuess = W - (compact ? 62 : 78) - (compact ? 20 : 28);
  const slotGuess = plotWidthGuess / Math.max(points.length, 1);
  const rotateLabels = slotGuess < 44;
  const H = compact ? (rotateLabels ? 316 : 290) : 330;
  const M = {
    left: compact ? 62 : 78,
    right: compact ? 20 : 28,
    top: 20,
    bottom: rotateLabels ? (compact ? 88 : 84) : compact ? 62 : 66,
  };

  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const baseY = M.top + plotH;

  const peak = Math.max(...points.map((p) => p.value), 0);
  const { max, step } = niceScale(peak);
  const ticks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(Number(v.toFixed(6)));

  const slot = plotW / Math.max(points.length, 1);
  const barW = Math.min(compact ? 40 : 64, slot * 0.56);
  const yOf = (v: number) => M.top + plotH * (1 - v / max);

  return (
    <div className="sales-svg-wrap" ref={box}>
      <svg
        className="sales-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Grafik ${yTitle} per ${xTitle}`}
      >
        <defs>
          <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b87ff" />
            <stop offset="100%" stopColor="#5b55fb" />
          </linearGradient>
          <marker id="axisArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" fill="#8d8eb4" />
          </marker>
        </defs>

        {/* gridline + angka sumbu Y */}
        {ticks.map((t) => {
          const y = yOf(t);
          return (
            <g key={t}>
              <line
                x1={M.left}
                y1={y}
                x2={W - M.right}
                y2={y}
                stroke="#dcddf1"
                strokeWidth={1}
                strokeDasharray="4 6"
              />
              <text x={M.left - 12} y={y} textAnchor="end" dominantBaseline="middle" className="sales-tick">
                {tickLabel(t)}
              </text>
            </g>
          );
        })}

        {/* sumbu */}
        <line
          x1={M.left}
          y1={M.top - 10}
          x2={M.left}
          y2={baseY}
          stroke="#8d8eb4"
          strokeWidth={1.4}
          markerEnd="url(#axisArrow)"
        />
        <line
          x1={M.left}
          y1={baseY}
          x2={W - M.right + 12}
          y2={baseY}
          stroke="#8d8eb4"
          strokeWidth={1.4}
          markerEnd="url(#axisArrow)"
        />

        {/* batang + label sumbu X */}
        {points.map((p, i) => {
          const cx = M.left + slot * (i + 0.5);
          const h = Math.max(baseY - yOf(p.value), 2);
          return (
            <g key={p.key} className="sales-bar-group">
              <title>{`${p.full} · ${p.count} transaksi · ${tickLabel(p.value)}`}</title>
              <rect
                x={cx - barW / 2}
                y={baseY - h}
                width={barW}
                height={h}
                rx={4}
                fill="url(#barFill)"
                className="sales-bar"
              />
              <text
                x={cx}
                y={baseY + (rotateLabels ? 20 : 24)}
                textAnchor={rotateLabels ? "end" : "middle"}
                className="sales-xlabel"
                transform={rotateLabels ? `rotate(-38 ${cx} ${baseY + 20})` : undefined}
              >
                {p.label}
              </text>
            </g>
          );
        })}

        {/* judul sumbu */}
        <text
          x={compact ? 16 : 20}
          y={M.top + plotH / 2}
          transform={`rotate(-90 ${compact ? 16 : 20} ${M.top + plotH / 2})`}
          textAnchor="middle"
          className="sales-axtitle"
        >
          {yTitle}
        </text>
        <text x={M.left + plotW / 2} y={H - 12} textAnchor="middle" className="sales-axtitle">
          {xTitle}
        </text>
      </svg>
    </div>
  );
}
