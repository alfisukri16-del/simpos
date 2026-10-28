import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Glasses, MessageSquare, UserPlus, Users, X } from "lucide-react";
import { RESEP_MAP, type Customer } from "../data/customers";
import { useSharedStore } from "../store/sharedStore";
import { Avatar, Chip, PageHeader, SearchBox, StatCard, StatusPill } from "../components/ui";
import "../styles/pages.css";
import "../styles/admin.css";

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

  const poCountOf = (name: string) =>
    store.pos.filter((o) => o.customer === name && o.status !== "Selesai" && o.status !== "Dibatalkan").length;

  const hasResepOf = (c: Customer) =>
    c.hasResep || store.reseps.some((r) => r.customer === c.name);

  const rows = customers
    .filter((c) => (tier === "all" ? true : c.tier === tier))
    .filter((c) => {
      if (filter === "Resep" && !hasResepOf(c)) return false;
      if (filter === "PO" && poCountOf(c.name) === 0) return false;
      return `${c.name} ${c.phone} ${c.code}`.toLowerCase().includes(query.toLowerCase());
    });

  const cust = rows.find((c) => c.id === selected) ?? rows[0] ?? customers[0];
  const custReseps = store.reseps.filter((r) => cust && r.customer === cust.name);
  const latestResep = custReseps[0];
  const resep = latestResep ?? (cust ? RESEP_MAP[cust.id] : undefined);
  const withResep = customers.filter((c) => hasResepOf(c)).length;
  const withPo = customers.filter((c) => poCountOf(c.name) > 0).length;

  const custActivePo = cust ? poCountOf(cust.name) : 0;

  const editingCustomer = editing ? customers.find((c) => c.id === editing) : null;
  const previewCode =
    editingCustomer?.code ?? `PLG-${String(41 + customers.length).padStart(4, "0")}`;

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
    const r = store.upsertCustomer({ id: editing ?? undefined, ...form });
    if (!r.ok) {
      setFormError(r.msg);
      return;
    }
    if (r.customer) setSelected(r.customer.id);
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
        desc="Cari pelanggan berdasarkan nama atau nomor HP, kelola data pelanggan, dan catat riwayat resep."
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
            <SearchBox placeholder="Cari nama, kode, atau nomor HP pelanggan..." value={query} onChange={setQuery} />
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
                {rows.map((c) => {
                  const activePo = poCountOf(c.name);
                  const hasRx = hasResepOf(c);
                  return (
                    <tr
                      key={c.id}
                      className={cust.id === c.id ? "is-active" : ""}
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
                        <StatusPill label={hasRx ? "Ada" : "Belum ada"} />
                      </td>
                      <td>
                        <span className="tt-sub" style={{ marginTop: 0 }}>
                          {activePo > 0 ? `${activePo} pesanan` : "Tidak ada"}
                        </span>
                      </td>
                      <td className="tt-right">
                        <span className="link-action">
                          Detail
                          <ChevronRight size={15} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
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

        {rows.length === 0 ? (
          <aside className="detail-panel">
            <div className="empty-note">Tidak ada pelanggan yang cocok dengan filter.</div>
          </aside>
        ) : (
        <aside className="detail-panel" key={cust.id}>
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
            {custActivePo > 0 ? <span className="tag-mini">{custActivePo} PO aktif</span> : null}
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
            Edit Data Pelanggan
          </button>

          <div>
            <div className="mini-label" style={{ color: "var(--accent-ink)" }}>
              RIWAYAT RESEP MATA ({custReseps.length > 0 ? `${custReseps.length} arsip` : hasResepOf(cust) ? "1 arsip" : "0 arsip"})
            </div>
            <div className="detail-row">
              <span>Pemeriksaan terakhir: {latestResep?.date ?? cust.resepDate ?? "-"}</span>
              <StatusPill label={hasResepOf(cust) ? "Tercatat" : "Belum ada"} dot={false} />
            </div>
          </div>

          {resep ? (
            <div className="rx-mini">
              <div className="rx-eye">
                <div className="ey-label">OD / KANAN</div>
                <b>{resep.od.sph}</b>
                <span>
                  CYL {resep.od.cyl || "0.00"} · AXIS {resep.od.axis || "-"}
                </span>
              </div>
              <div className="rx-eye">
                <div className="ey-label">OS / KIRI</div>
                <b>{resep.os.sph}</b>
                <span>
                  CYL {resep.os.cyl || "0.00"} · AXIS {resep.os.axis || "-"}
                </span>
              </div>
            </div>
          ) : (
            <div className="empty-note">Belum ada resep tersimpan untuk pelanggan ini.</div>
          )}

          <Link className="btn btn-ghost full" to="/resep-mata">
            Lihat Riwayat Resep
          </Link>
        </aside>
        )}
      </div>

      {open ? (
        <div className="overlay po-modal-overlay" onClick={() => setOpen(false)}>
          <div className="drawer simple-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="simple-modal-head">
              <div className="smh-left">
                <div className="smh-ico">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2>{editing ? "Ubah Data Pelanggan" : "Tambah Pelanggan"}</h2>
                  <p>Lengkapi nama dan nomor kontak pelanggan ({previewCode})</p>
                </div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="drawer-form simple-modal-form" noValidate>
              {formError ? (
                <div className="form-error" role="alert">
                  {formError}
                </div>
              ) : null}

              <label className="afield">
                <span>Nama Pelanggan *</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="cth. Siti Rahma"
                />
              </label>

              <div className="simple-two-col">
                <label className="afield">
                  <span>Nomor HP / WhatsApp *</span>
                  <input
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="cth. 0812 3456 7890"
                  />
                </label>

                <label className="afield">
                  <span>Email (opsional)</span>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="nama@email.com"
                  />
                </label>
              </div>

              <div className="afield">
                <span>Jenis Pelanggan</span>
                <div className="tier-choice-grid">
                  {(
                    [
                      {
                        key: "Reguler",
                        title: "Reguler",
                        desc: "Pelanggan umum transaksi harian",
                      },
                      {
                        key: "Member",
                        title: "Member",
                        desc: "Pelanggan tetap cabang optik",
                      },
                    ] as const
                  ).map((opt) => {
                    const active = form.tier === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        className={`tier-choice-card ${active ? "is-active" : ""}`}
                        onClick={() => setForm({ ...form, tier: opt.key })}
                      >
                        <div className="tcc-head">
                          <b>{opt.title}</b>
                          <span className="tcc-dot" />
                        </div>
                        <p>{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <UserPlus size={16} />
                  {editing ? "Simpan Perubahan" : "Simpan Pelanggan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
