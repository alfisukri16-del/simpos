import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Glasses, MessageSquare, UserPlus, Users, X } from "lucide-react";
import { RESEP_MAP, type Customer } from "../data/customers";
import { useSharedStore } from "../store/sharedStore";
import { Avatar, Chip, PageHeader, SearchBox, StatCard, StatusPill } from "../components/ui";
import "../styles/pages.css";

type FormState = { name: string; phone: string; email: string; tier: Customer["tier"] };

const EMPTY: FormState = { name: "", phone: "", email: "", tier: "Reguler" };

export default function PelangganPage() {
  const store = useSharedStore();
  const customers = store.customers;
  const [selected, setSelected] = useState(customers[1]?.id ?? customers[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<"all" | Customer["tier"]>("all");
  const [filter, setFilter] = useState<"Semua" | "Resep" | "PO">("Semua");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formError, setFormError] = useState("");

  const rows = customers
    .filter((c) => (tier === "all" ? true : c.tier === tier))
    .filter((c) => {
      if (filter === "Resep" && !c.hasResep) return false;
      if (filter === "PO" && c.poActive === 0) return false;
      return `${c.name} ${c.phone} ${c.code}`.toLowerCase().includes(query.toLowerCase());
    });

  const cust = customers.find((c) => c.id === selected) ?? customers[0];
  const latestResep = store.reseps.find((r) => store.customers.find((c) => c.id === cust?.id)?.name === r.customer);
  const resep = latestResep ?? (cust ? RESEP_MAP[cust.id] : undefined);
  const withResep = customers.filter((c) => c.hasResep).length;
  const withPo = customers.filter((c) => c.poActive > 0).length;

  function startAdd() {
    setEditing(null);
    setForm(EMPTY);
    setFormError("");
    setOpen(true);
  }

  function startEdit() {
    if (!cust) return;
    setEditing(cust.id);
    setForm({ name: cust.name, phone: cust.phone, email: cust.email, tier: cust.tier });
    setFormError("");
    setOpen(true);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const err = store.upsertCustomer({ id: editing ?? undefined, ...form });
    if (err) {
      setFormError(err);
      return;
    }
    setOpen(false);
  }

  if (!cust) return <div className="page"><div className="empty-note">Belum ada pelanggan.</div></div>;

  return (
    <div className="page">
      <PageHeader
        crumbs={
          <>
            <b>Kasir</b> › Pelanggan
          </>
        }
        overline="PENGELOLAAN PELANGGAN"
        title="Data Pelanggan"
        desc="Cari informasi pelanggan dan kelola riwayat resep untuk pelayanan yang lebih cepat."
        actions={
          <button className="btn btn-primary" onClick={startAdd}>
            <UserPlus size={16} />
            Tambah Pelanggan
          </button>
        }
      />

      <div className="stat-row">
        <StatCard label="Total pelanggan" value={String(customers.length)} caption="Terdaftar di cabang ini" icon={<Users size={22} />} tone="violet" />
        <StatCard label="Pelanggan dengan resep" value={String(withResep)} caption="Memiliki arsip resep" icon={<Glasses size={22} />} tone="blue" />
        <StatCard label="Pelanggan dengan PO aktif" value={String(withPo)} caption="Pesanan belum selesai" icon={<MessageSquare size={22} />} tone="amber" />
      </div>

      <div className="split">
        <section className="section-block">
          <div className="section-head">
            <div>
              <h2>Daftar Pelanggan</h2>
              <div className="section-desc">Informasi pelanggan dan ringkasan aktivitas</div>
            </div>
            <div className="section-action">
              <span className="foot-note" style={{ color: "var(--muted)", fontSize: 12.5, fontWeight: 700 }}>
                {rows.length} dari {customers.length} data
              </span>
              <select
                className="select-pill"
                aria-label="Jenis pelanggan"
                value={tier}
                onChange={(e) => setTier(e.target.value as typeof tier)}
              >
                <option value="all">Semua Pelanggan</option>
                <option value="Member">Member</option>
                <option value="Reguler">Reguler</option>
              </select>
            </div>
          </div>

          <div className="toolbar">
            <SearchBox placeholder="Cari nama atau nomor HP pelanggan..." value={query} onChange={setQuery} />
            <div className="toolbar-chips">
              <Chip active={filter === "Semua"} onClick={() => setFilter("Semua")}>
                Semua
              </Chip>
              <Chip active={filter === "Resep"} onClick={() => setFilter("Resep")}>
                Punya resep
              </Chip>
              <Chip active={filter === "PO"} onClick={() => setFilter("PO")}>
                PO aktif
              </Chip>
            </div>
          </div>

          <div className="table-wrap">
            <table className="tt">
              <thead>
                <tr>
                  <th>NAMA PELANGGAN</th>
                  <th>NOMOR HP</th>
                  <th className="tt-center">RESEP</th>
                  <th>PO AKTIF</th>
                  <th className="tt-right">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    className={selected === c.id ? "is-active" : ""}
                    onClick={() => setSelected(c.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div className="cell-person">
                        <Avatar initials={c.initials} size={40} />
                        <span>
                          <b>{c.name}</b>
                          <span>{c.code}</span>
                        </span>
                      </div>
                    </td>
                    <td>{c.phone}</td>
                    <td className="tt-center">
                      <StatusPill label={c.hasResep ? "Ada" : "Belum ada"} />
                    </td>
                    <td>
                      <span className="tt-sub" style={{ marginTop: 0 }}>
                        {c.poActive > 0 ? `${c.poActive} pesanan` : "Tidak ada"}
                      </span>
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
                    <td colSpan={5}>
                      <div className="empty-note">Pelanggan tidak ditemukan.</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="detail-panel">
          <div className="detail-head">
            <Avatar initials={cust.initials} size={48} />
            <div>
              <b>{cust.name}</b>
              <span>{cust.code}</span>
            </div>
          </div>

          <div className="detail-badges">
            <span className="tag-mini">Pelanggan terdaftar</span>
            <span className="tag-mini">{cust.tier}</span>
            {cust.poActive > 0 ? <span className="tag-mini">{cust.poActive} PO aktif</span> : null}
          </div>

          <div className="detail-rows">
            <div className="detail-row">
              <span>Nomor HP</span>
              <b>{cust.phone}</b>
            </div>
            <div className="detail-row">
              <span>Email</span>
              <b>{cust.email || "-"}</b>
            </div>
            <div className="detail-row">
              <span>Cabang</span>
              <b>{cust.branch}</b>
            </div>
          </div>

          <button className="btn btn-ghost full" onClick={startEdit}>
            Edit Data
          </button>

          <div className="mini-label">DATA PELANGGAN</div>

          <div>
            <div className="mini-label" style={{ color: "var(--accent-ink)" }}>
              RESEP MATA TERAKHIR
            </div>
            <div className="detail-row">
              <span>Resep {latestResep?.date ?? cust.resepDate ?? "-"}</span>
              <StatusPill label={cust.hasResep ? "Tercatat" : "Belum ada"} dot={false} />
            </div>
          </div>

          {resep ? (
            <div className="rx-mini">
              <div className="rx-eye">
                <div className="ey-label">OD / KANAN</div>
                <b>{resep.od.sph}</b>
                <span>
                  CYL {resep.od.cyl} · AXIS {resep.od.axis}
                </span>
              </div>
              <div className="rx-eye">
                <div className="ey-label">OS / KIRI</div>
                <b>{resep.os.sph}</b>
                <span>
                  CYL {resep.os.cyl} · AXIS {resep.os.axis}
                </span>
              </div>
            </div>
          ) : (
            <div className="empty-note">Belum ada resep tersimpan.</div>
          )}

          <Link className="btn btn-ghost full" to="/resep-mata">
            Lihat Riwayat Resep
          </Link>

          <div className="mini-label">AKTIVITAS TERKAIT</div>
          <div>
            <div className="act-line">
              <b>PO #PO-1024 — Diproses</b>
              <span>Menunggu ketersediaan lensa pesanan</span>
            </div>
            <div className="act-line">
              <b>Transaksi terakhir</b>
              <span>12 Agu 2026 · Rp 800.000</span>
            </div>
          </div>
        </aside>
      </div>

      {open ? (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>{editing ? "Ubah Pelanggan" : "Tambah Pelanggan"}</h2>
                <div className="section-desc">Data tersimpan di perangkat demo ini</div>
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
                <span>Nama pelanggan</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="cth. Siti Rahma" />
              </label>
              <label className="afield">
                <span>Nomor HP / WhatsApp</span>
                <input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="cth. 0812 3456 7890" />
              </label>
              <label className="afield">
                <span>Email (opsional)</span>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" />
              </label>
              <label className="afield">
                <span>Jenis pelanggan</span>
                <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as Customer["tier"] })}>
                  <option value="Reguler">Reguler</option>
                  <option value="Member">Member</option>
                </select>
              </label>
              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
