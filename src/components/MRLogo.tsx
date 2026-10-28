/**
 * Logo "MR" — badge bulat navy dengan ring putih,
 * dibuat ulang secara vektor dari logo toko asli.
 */
export default function MRLogo({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Logo Optik Mekar Jaya"
      style={{ flex: "none", display: "block" }}
    >
      <circle cx="60" cy="60" r="57" fill="#ffffff" />
      <circle cx="60" cy="60" r="49" fill="#0e1a3d" />
      <circle cx="60" cy="60" r="38" fill="none" stroke="#ffffff" strokeWidth="7" />
      <text
        x="60"
        y="73"
        textAnchor="middle"
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontWeight={800}
        fontSize="36"
        letterSpacing="1"
        fill="#ffffff"
      >
        MR
      </text>
    </svg>
  );
}
