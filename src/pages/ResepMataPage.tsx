import { useState, type FormEvent } from "react";
import { CalendarDays, ChevronRight, CircleDot, Glasses, Plus, Printer, X } from "lucide-react";
import { useSharedStore } from "../store/sharedStore";
import { Avatar, Chip, PageHeader, SearchBox, StatCard, StatusPill } from "../components/ui";
import "../styles/pages.css";

type Eye = { sph: string; cyl: string; axis: string };
type FormState = { customerId: string; date: string; od: Eye; os: Eye; pd: string; add: string; note: string };

const EYE: Eye = { sph: "", cyl: "", axis: "" };
const EMPTY: FormState = { customerId: "", date: "", od: { ...EYE }, os: { ...EYE }, pd: "", add: "", note: "" };

export default function ResepMataPage() {
  const store = useSharedStore();
  const reseps = store.reseps;
  const [selected, setSelected] = useState(reseps[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Semua" | "Aktif" | "Expired">("Semua");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formError, setFormError] = useState("");

  const rows = reseps
    .filter((r) => (filter === "Semua" ? true : filter === "Aktif" ? r.status === "Aktif" : r.status !== "Aktif"))
    .filter((r) => `${r.customer} ${r.id}`.toLowerCase().includes(query.toLowerCase()));

  const rec = reseps.find((r) => r.id === selected) ?? reseps[0];

  const activeCount = reseps.filter((r) => r.status === "Aktif").length;
  const expiredCount = reseps.filter((r) => r.status !== "Aktif").length;

  function startAdd() {
    setForm({ ...EMPTY, customerId: store.customers[0]?.id ?? "", od: { ...EYE }, os: { ...EYE } });
    setFormError("");
    setOpen(true);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const err = store.createResep(form);
    if (err) {
      setFormError(err);
      return;
    }
    setOpen(false);
  }

  return (
    <div className="page">
      <PageHeader
        crumbs={
          <>
            <b>Kasir</b> › Resep Mata
          </>
        }
        overline="ARSIP RESEP"
        title="Resep Mata"
        desc="Arsip resep pelanggan untuk mempercepat pembuatan lensa."
        actions={
          <button className="btn btn-primary" onClick={startAdd}>
            <Plus size={16} />
            Tambah Resep
          </button>
        }
      />

      <div className="stat-row">
        <StatCard label="Total resep" value={String(reseps.length)} caption="Tersimpan di cabang ini" icon={<Glasses size={22} />} tone="violet" />
        <StatCard label="Resep aktif" value={String(activeCount)} caption="Masih dapat digunakan" icon={<CalendarDays size={22} />} tone="green" />
        <StatCard label="Perlu diperbarui" value={String(expiredCount)} caption="Resep kedaluwarsa" icon={<CircleDot size={22} />} tone="amber" />
      </div>

      <div className="split">
        <section className="section-block">
          <div className="section-head">
            <div>
              <h2>Daftar Resep</h2>
              <div className="section-desc">Resep terbaru per pelanggan</div>
            </div>
            <div className="section-action">
              <select className="select-pill" aria-label="Periode" defaultValue="all">
                <option value="all">Semua Periode</option>
                <option value="year">Tahun ini</option>
              </select>
            </div>
          </div>

          <div className="toolbar">
            <SearchBox placeholder="Cari nama pelanggan atau kode resep..." value={query} onChange={setQuery} />
            <div className="toolbar-chips">
              <Chip active={filter === "Semua"} onClick={() => setFilter("Semua")}>
                Semua
              </Chip>
              <Chip active={filter === "Aktif"} onClick={() => setFilter("Aktif")}>
                Aktif
              </Chip>
              <Chip active={filter === "Expired"} onClick={() => setFilter("Expired")}>
                Expired
              </Chip>
            </div>
          </div>

          <div className="table-wrap">
            <table className="tt">
              <thead>
                <tr>
                  <th>PELANGGAN</th>
                  <th>TANGGAL</th>
                  <th>OD (KANAN)</th>
                  <th>OS (KIRI)</th>
                  <th>PD</th>
                  <th className="tt-center">STATUS</th>
                  <th className="tt-right">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className={selected === r.id ? "is-active" : ""}
                    onClick={() => setSelected(r.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div className="cell-person">
                        <Avatar initials={r.initials} size={40} />
                        <span>
                          <b>{r.customer}</b>
                          <span>{r.id}</span>
                        </span>
                      </div>
                    </td>
                    <td>{r.date}</td>
                    <td>
                      <div className="tt-num" style={{ fontSize: 13 }}>
                        SPH {r.od.sph}
                      </div>
                      <div className="tt-sub">
                        CYL {r.od.cyl} · AX {r.od.axis}
                      </div>
                    </td>
                    <td>
                      <div className="tt-num" style={{ fontSize: 13 }}>
                        SPH {r.os.sph}
                      </div>
                      <div className="tt-sub">
                        CYL {r.os.cyl} · AX {r.os.axis}
                      </div>
                    </td>
                    <td>{r.pd}</td>
                    <td className="tt-center">
                      <StatusPill label={r.status} />
                    </td>
                    <td className="tt-right">
                      <span className="link-action">
                        Detail
                        <ChevronRight size={15} />
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-note">Resep tidak ditemukan.</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <div className="table-foot">
              <span className="foot-note">
                Menampilkan {rows.length} dari {reseps.length} resep · data demo
              </span>
            </div>
          </div>
        </section>

        {rec ? (
          <aside className="detail-panel">
            <div className="detail-head">
              <Avatar initials={rec.initials} size={48} />
              <div>
                <b>{rec.customer}</b>
                <span>{rec.id}</span>
              </div>
            </div>

            <div className="detail-badges">
              <StatusPill label={rec.status} />
            </div>

            <div className="detail-rows">
              <div className="detail-row">
                <span>Tanggal periksa</span>
                <b>{rec.date}</b>
              </div>
              <div className="detail-row">
                <span>PD</span>
                <b>{rec.pd}</b>
              </div>
              <div className="detail-row">
                <span>ADD</span>
                <b>{rec.add}</b>
              </div>
            </div>

            <div className="mini-label">RESEP MATA</div>
            <div className="rx-mini">
              <div className="rx-eye">
                <div className="ey-label">OD / KANAN</div>
                <b>{rec.od.sph}</b>
                <span>
                  CYL {rec.od.cyl} · AXIS {rec.od.axis}
                </span>
              </div>
              <div className="rx-eye">
                <div className="ey-label">OS / KIRI</div>
                <b>{rec.os.sph}</b>
                <span>
                  CYL {rec.os.cyl} · AXIS {rec.os.axis}
                </span>
              </div>
            </div>

            <button className="btn btn-primary full" onClick={() => window.print()}>
              <Printer size={16} />
              Cetak Resep
            </button>
          </aside>
        ) : null}
      </div>

      {open ? (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>Tambah Resep</h2>
                <div className="section-desc">Resep tersimpan di perangkat demo ini</div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="drawer-form" noValidate>
              {formError ? (
                <div className="form-error" role="alert">
                  {formError}
                </div>
              ) : null}
              <label className="afield">
                <span>Pelanggan</span>
                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                  {store.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="afield">
                <span>Tanggal periksa (opsional)</span>
                <input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="cth. 25 Okt 2026" />
              </label>
              <div className="drawer-form" style={{ padding: 0 }}>
                <div className="mini-label" style={{ padding: 0 }}>OD / KANAN</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <label className="afield">
                    <span>SPH</span>
                    <input value={form.od.sph} onChange={(e) => setForm({ ...form, od: { ...form.od, sph: e.target.value } })} placeholder="-1.50" />
                  </label>
                  <label className="afield">
                    <span>CYL</span>
                    <input value={form.od.cyl} onChange={(e) => setForm({ ...form, od: { ...form.od, cyl: e.target.value } })} placeholder="-0.75" />
                  </label>
                  <label className="afield">
                    <span>AXIS</span>
                    <input value={form.od.axis} onChange={(e) => setForm({ ...form, od: { ...form.od, axis: e.target.value } })} placeholder="180" />
                  </label>
                </div>
                <div className="mini-label" style={{ padding: 0 }}>OS / KIRI</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <label className="afield">
                    <span>SPH</span>
                    <input value={form.os.sph} onChange={(e) => setForm({ ...form, os: { ...form.os, sph: e.target.value } })} placeholder="-1.25" />
                  </label>
                  <label className="afield">
                    <span>CYL</span>
                    <input value={form.os.cyl} onChange={(e) => setForm({ ...form, os: { ...form.os, cyl: e.target.value } })} placeholder="-0.50" />
                  </label>
                  <label className="afield">
                    <span>AXIS</span>
                    <input value={form.os.axis} onChange={(e) => setForm({ ...form, os: { ...form.os, axis: e.target.value } })} placeholder="170" />
                  </label>
                </div>
              </div>
              <label className="afield">
                <span>PD</span>
                <input value={form.pd} onChange={(e) => setForm({ ...form, pd: e.target.value })} placeholder="cth. 32.0" />
              </label>
              <label className="afield">
                <span>ADD (opsional)</span>
                <input value={form.add} onChange={(e) => setForm({ ...form, add: e.target.value })} placeholder="cth. +1.00" />
              </label>
              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Resep
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
