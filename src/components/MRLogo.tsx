/**
 * Logo "MR" — badge bulat biru dengan monogram putih,
 * memakai aset gambar logo toko.
 */
export default function MRLogo({ size = 44 }: { size?: number }) {
  return (
    <img
      src="/assets/logo-mk.png"
      width={size}
      height={size}
      alt="Logo Optik Mekar Jaya"
      style={{ flex: "none", display: "block" }}
    />
  );
}
