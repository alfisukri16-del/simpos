import { useMemo, useState } from "react";
import { DEMO_ADMIN } from "../../data/admin";
import { useSharedStore } from "../../store/sharedStore";
import { Chip, PageHeader, SearchBox, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

export default function AdminMutasiPage() {
  const store = useSharedStore();
  const [q, setQ] = useState("");
  const [arah, setArah] = useState<"Semua" | "Masuk" | "Keluar">("Semua");
  const [sumber, setSumber] = useState("all");

  const rows = useMemo(
    () =>
      store.mutations
        .filter((m) => (arah === "Semua" ? true : m.arah === (arah === "Masuk" ? "IN" : "OUT")))
        .filter((m) => (sumber === "all" ? true : m.sumber === sumber))
        .filter((m) => {
          const p = store.productOf(m.productId);
          return `${m.id} ${m.ref} ${p?.code ?? ""} ${p?.name ?? ""}`.toLowerCase().includes(q.toLowerCase());
        }),
    [store, q, arah, sumber],
  );

  const masuk = store.mutations.filter((m) => m.arah === "IN").reduce((a, m) => a + m.qty, 0);
  const keluar = store.mutations.filter((m) => m.arah === "OUT").reduce((a, m) => a + m.qty, 0);

  return (
    <div className="page">
      <PageHeader
        overline="PERSEDIAAN — MUTASI"
        title="Riwayat Mutasi"
        desc={`Jejak audit perubahan stok ${DEMO_ADMIN.branch}. Riwayat hanya dapat dilihat — tidak dapat diubah atau dihapus.`}
      />

      <div className="stat-row" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <div className="stat-card tone-green">
          <div className="stat-body">
            <div className="stat-label">Total masuk</div>
            <div className="stat-value">+{masuk}</div>
            <div className="stat-caption">Penerimaan + saldo awal</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-body">
            <div className="stat-label">Total keluar</div>
            <div className="stat-value">{keluar}</div>
            <div className="stat-caption">Penjualan Kasir</div>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <SearchBox placeholder="Cari ID mutasi, referensi, kode, atau produk..." value={q} onChange={setQ} />
        <div className="toolbar-chips">
          {(["Semua", "Masuk", "Keluar"] as const).map((a) => (
            <Chip key={a} active={arah === a} onClick={() => setArah(a)}>
              {a}
            </Chip>
          ))}
        </div>
        <select className="select-pill" aria-label="Sumber" value={sumber} onChange={(e) => setSumber(e.target.value)}>
          <option value="all">Semua Sumber</option>
          <option value="Penerimaan">Penerimaan</option>
          <option value="Penjualan">Penjualan</option>
          <option value="Pembatalan">Pembatalan</option>
          <option value="Saldo Awal">Saldo Awal</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>WAKTU / ID</th>
              <th>PRODUK</th>
              <th className="tt-center">JENIS</th>
              <th>SUMBER</th>
              <th>LOKASI</th>
              <th className="tt-center">QTY</th>
              <th className="tt-center">SEBELUM → SESUDAH</th>
              <th>REFERENSI</th>
              <th>AKTOR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const p = store.productOf(m.productId);
              return (
                <tr key={m.id}>
                  <td>
                    <div className="tt-num" style={{ fontSize: 12.5 }}>
                      {m.id}
                    </div>
                    <div className="tt-sub">{m.at}</div>
                  </td>
                  <td>
                    <div className="tt-num" style={{ fontSize: 13 }}>
                      {p?.name ?? m.productId}
                    </div>
                    <div className="tt-sub">{p?.code}</div>
                  </td>
                  <td className="tt-center">
                    <StatusPill label={m.arah === "IN" ? "Masuk" : "Keluar"} />
                  </td>
                  <td>
                    <span className="type-chip">{m.sumber}</span>
                  </td>
                  <td>
                    <span className="tt-sub" style={{ marginTop: 0 }}>
                      {m.sumber === "Penerimaan" ? `Pusat → ${DEMO_ADMIN.branch}` : DEMO_ADMIN.branch}
                    </span>
                  </td>
                  <td className="tt-center tt-money" style={{ color: m.arah === "IN" ? "var(--ok-ink)" : "var(--danger-ink)" }}>
                    {m.qty > 0 ? `+${m.qty}` : m.qty}
                  </td>
                  <td className="tt-center">
                    <span className="tt-sub" style={{ marginTop: 0 }}>
                      {m.sebelum} → <b style={{ color: "var(--ink)" }}>{m.sesudah}</b>
                    </span>
                  </td>
                  <td>
                    <span className="tt-sub" style={{ marginTop: 0 }}>
                      {m.ref}
                    </span>
                  </td>
                  <td>{m.actor}</td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-note">Tidak ada mutasi yang cocok dengan filter.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">
            Menampilkan {rows.length} dari {store.mutations.length} mutasi
          </span>
        </div>
      </div>
    </div>
  );
}
