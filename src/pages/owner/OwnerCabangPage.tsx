import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Boxes, Building2, CheckCircle2, Pencil, Plus, X } from "lucide-react";
import { useSharedStore, type Branch, type BranchStatus } from "../../store/sharedStore";
import { PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

const PAGE = 5;

type BranchForm = {
  id?: string;
  name: string;
  code: string;
  city: string;
  address: string;
  phone: string;
  pic: string;
  status: BranchStatus;
};

const emptyForm = (): BranchForm => ({
  name: "",
  code: "",
  city: "",
  address: "",
  phone: "",
  pic: "",
  status: "Aktif",
});

export default function OwnerCabangPage() {
  const store = useSharedStore();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BranchForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const rows = store.branches.map((b) => {
    const stock = store.stockForBranch(b.id);
    const units = stock.reduce((a, s) => a + s.saldo, 0);
    const low = stock.filter(
      (s) => store.productOf(s.productId)?.status === "Aktif" && (store.productOf(s.productId)?.type !== "Aksesoris") && s.saldo <= s.minimum,
    ).length;
    const sales = store.transactions.filter(
      (t) => t.status === "Selesai" && (t.branchId ?? "cabang-padang") === b.id,
    );
    const po = store.pos.filter(
      (o) => (o.status === "Dipesan" || o.status === "Diproses") && o.branchId === b.id,
    );
    const req = store.requests.filter(
      (r) => r.branchId === b.id && r.status !== "Ditolak" && store.allocatedForRequest(r.id, r.productId) <= 0,
    );
    return {
      b,
      units,
      low,
      sales: sales.length,
      po: po.length,
      req: req.length,
    };
  });

  const totalCabang = store.branches.filter((b) => b.type === "Cabang").length;
  const activeCabang = store.branches.filter((b) => b.type === "Cabang" && b.status === "Aktif").length;
  const totalLow = rows.reduce((a, r) => a + r.low, 0);
  const key = q.trim().toLowerCase();
  const filtered = rows.filter(({ b }) =>
    `${b.name} ${b.code} ${b.type} ${b.city} ${b.address} ${b.pic} ${b.phone}`.toLowerCase().includes(key),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * PAGE, safePage * PAGE);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
    setOpen(true);
  }

  function openEdit(branch: Branch) {
    setEditing(branch);
    setForm({
      id: branch.id,
      name: branch.name,
      code: branch.code,
      city: branch.city,
      address: branch.address,
      phone: branch.phone === "-" ? "" : branch.phone,
      pic: branch.pic === "-" ? "" : branch.pic,
      status: branch.status,
    });
    setFormError("");
    setOpen(true);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const res = store.upsertBranch({ ...form, id: editing?.id });
    if (!res.ok) {
      setFormError(res.msg);
      return;
    }
    setOpen(false);
    setNotice(res.msg);
    setPage(1);
  }

  return (
    <div className="page">
      <PageHeader
        overline="MONITORING — CABANG"
        title="Monitoring Cabang"
        desc="Kelola profil lokasi dan pantau stok, transaksi, PO, serta pengajuan."
        actions={
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} />
            Tambah Cabang
          </button>
        }
      />

      <div className="stat-row" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <StatCard
          label="Total Cabang"
          value={String(totalCabang)}
          caption={`${store.branches.length} lokasi termasuk pusat`}
          icon={<Building2 size={22} />}
          tone="violet"
        />
        <StatCard
          label="Cabang Aktif"
          value={String(activeCabang)}
          caption="Siap melayani transaksi"
          icon={<CheckCircle2 size={22} />}
          tone="green"
        />
        <StatCard
          label="Stok Menipis"
          value={String(totalLow)}
          caption="Saldo ≤ minimum di semua lokasi"
          icon={<Boxes size={22} />}
          tone="amber"
        />
      </div>

      {notice ? (
        <div className="notice notice-ok" role="status">
          {notice}
          <button className="icon-pill" aria-label="Tutup" onClick={() => setNotice("")} style={{ marginLeft: "auto" }}>
            <X size={14} />
          </button>
        </div>
      ) : null}

      <div className="toolbar">
        <SearchBox
          placeholder="Cari nama, kode, kota, atau penanggung jawab..."
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
        />
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>NAMA CABANG</th>
              <th>LOKASI</th>
              <th>PENANGGUNG JAWAB</th>
              <th className="tt-center">STATUS</th>
              <th>RINGKASAN</th>
              <th className="tt-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ b, units, low, sales, po, req }) => (
              <tr key={b.id}>
                <td>
                  <div className="cell-person">
                    <span className="stat-icon" style={{ width: 40, height: 40, borderRadius: 13 }}>
                      <Building2 size={19} />
                    </span>
                    <span>
                      <b>{b.name}</b>
                      <span>
                        {b.code} · {b.type}
                      </span>
                    </span>
                  </div>
                </td>
                <td>
                  <div className="stock-cell">
                    <b>{b.city}</b>
                    <span>{b.address}</span>
                  </div>
                </td>
                <td>
                  <div className="stock-cell">
                    <b>{b.pic}</b>
                    <span>{b.phone}</span>
                  </div>
                </td>
                <td className="tt-center">
                  <StatusPill label={b.status} />
                </td>
                <td>
                  <div className="stock-cell">
                    <b>
                      {units} unit · {sales} transaksi
                    </b>
                    <span>
                      {po} PO aktif · {req} pengajuan baru{low > 0 ? ` · ${low} stok menipis` : ""}
                    </span>
                  </div>
                </td>
                <td className="tt-right">
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <Link className="link-action" to={`/owner/cabang/${b.id}`}>
                      Detail
                      <ArrowRight size={15} />
                    </Link>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>
                      <Pencil size={14} />
                      Ubah
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-note">Tidak ada cabang yang cocok dengan pencarian.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">
            Menampilkan {visible.length} dari {filtered.length} cabang · Halaman {safePage} dari {pages}
          </span>
          <div className="foot-actions">
            <button className="btn btn-ghost btn-sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
              Sebelumnya
            </button>
            <button className="btn btn-ghost btn-sm" disabled={safePage >= pages} onClick={() => setPage(safePage + 1)}>
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>{editing ? "Ubah Cabang" : "Tambah Cabang"}</h2>
                <div className="section-desc">
                  {editing ? `Perbarui profil ${editing.name}.` : "Cabang baru mulai tanpa saldo stok."}
                </div>
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
                <span>Nama cabang</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="cth. Cabang Bukittinggi"
                />
              </label>
              <label className="afield">
                <span>Kode cabang</span>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="cth. BKT"
                  maxLength={8}
                />
              </label>
              <label className="afield">
                <span>Kota</span>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="cth. Bukittinggi"
                />
              </label>
              <label className="afield">
                <span>Alamat</span>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Alamat operasional cabang"
                />
              </label>
              <label className="afield">
                <span>Telepon</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="cth. (0752) 123456"
                />
              </label>
              <label className="afield">
                <span>Penanggung jawab</span>
                <input
                  value={form.pic}
                  onChange={(e) => setForm({ ...form, pic: e.target.value })}
                  placeholder="Nama kepala cabang"
                />
              </label>
              <label className="afield">
                <span>Status operasional</span>
                <select
                  value={form.status}
                  disabled={editing?.type === "Pusat"}
                  onChange={(e) => setForm({ ...form, status: e.target.value as BranchStatus })}
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </label>
              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editing ? "Simpan Perubahan" : "Tambah Cabang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
