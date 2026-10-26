import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PRODUCTS } from "../data/catalog";
import { ORDERS, RESEP_RECORDS, TRANSACTIONS, type PoOrder, type PoStatus, type ResepRecord, type Transaction } from "../data/mock";
import { CUSTOMERS, RESEP_MAP, type Customer } from "../data/customers";
import { ADMIN_STORE_KEY, DEMO_ADMIN } from "../data/admin";

/* ==========================================================================
   SHARED STORE — satu sumber data lintas role (Kasir + Admin Cabang).
   - Stok: satu saldo per product+branch; berubah hanya lewat event valid.
   - Persistensi localStorage DEMO (bukan keamanan/RBAC production).
   - Idempotency: confirmReceipt & recordSale memakai kunci unik; retry/
     refresh/double-click tidak menggandakan stok (uji UAT-05, UAT-10).
   ========================================================================== */

export const SHARED_STORE_KEY = "simpos.shared.v2";
export const BRANCH_ID = "cabang-padang";

export type Branch = { id: string; name: string; type: "Pusat" | "Cabang" };

/** Lokasi demo: 1 pusat + 1 cabang (cabang kedua = keputusan terbuka). */
export const BRANCHES: Branch[] = [
  { id: "pusat", name: "Pusat", type: "Pusat" },
  { id: "cabang-padang", name: "Cabang Padang", type: "Cabang" },
];

export type ProductType = "Frame" | "Lensa" | "Aksesoris";

export type AdminProduct = {
  id: string;
  code: string;
  name: string;
  brand: string;
  type: ProductType;
  category: string;
  price: number;
  tag?: string;
  status: "Aktif" | "Nonaktif";
  branchId: string;
  updatedAt: string;
};

export type StockRow = { productId: string; branchId: string; saldo: number; minimum: number };

export type DistLine = { productId: string; qtyAlokasi: number; qtyDiterima: number };

export type Distribution = {
  id: string;
  date: string;
  from: string;
  branchId: string;
  status: "Menunggu Diterima" | "Diterima Sebagian" | "Diterima";
  lines: DistLine[];
  requestId?: string; // pengajuan terkait (bila berbasis pengajuan)
  actor?: string; // pembuat alokasi (Owner) — seed lama kosong = "Alokasi awal (seed demo)"
  note?: string;
  idemKey?: string; // idempotency alokasi Owner (internal, tidak ditampilkan)
};

export type ReceiptRecord = {
  id: string;
  distributionId: string;
  productId: string;
  qty: number;
  at: string;
  actor: string;
  branchId: string;
  idempotencyKey: string;
  note: string;
  selisih: number; // qty - qtyAlokasi sisa; >0 over, <0 kurang
};

export type StockRequest = {
  id: string;
  at: string;
  actor: string;
  branchId: string;
  productId: string;
  qty: number;
  note: string;
  status: "Diajukan";
};

export type OwnerNotice = {
  id: string;
  at: string;
  kind: "Pengajuan Stok";
  refId: string;
  summary: string;
};

export type PoTimeline = { at: string; actor: string; from: string; to: PoStatus; note: string };

export type SharedPO = PoOrder & {
  branchId: string;
  timeline: PoTimeline[];
  resepSnapshot: {
    od: { sph: string; cyl: string; axis: string };
    os: { sph: string; cyl: string; axis: string };
    pd: string;
    add: string;
    at: string;
  } | null;
};

export type Mutation = {
  id: string;
  at: string;
  productId: string;
  branchId: string;
  arah: "IN" | "OUT";
  sumber: "Penerimaan" | "Penjualan" | "Saldo Awal";
  qty: number; // bertanda: + masuk, - keluar
  sebelum: number;
  sesudah: number;
  ref: string;
  actor: string;
};

export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  branch: string;
  action: string;
  ref: string;
};

export type AppUser = {
  id: string;
  name: string;
  email: string;
  password: string; // demo frontend — bukan hash produksi
  role: "kasir" | "admin" | "pemilik";
  branchId: string; // 'all' untuk pemilik
  status: "Aktif" | "Nonaktif";
};

export type AppSettings = {
  defaultMinimum: number; // batas minimum produk baru
  storeName: string;
  storePhone: string;
  storeAddress: string;
};

type StoreShape = {
  products: AdminProduct[];
  stock: StockRow[];
  centralStock: StockRow[]; // saldo gudang pusat (read-only; pengurangan = keputusan terbuka)
  distributions: Distribution[];
  receipts: ReceiptRecord[];
  requests: StockRequest[];
  notices: OwnerNotice[];
  pos: SharedPO[];
  mutations: Mutation[];
  transactions: Transaction[];
  saleRefs: string[]; // idempotency penjualan Kasir
  allocKeys: string[]; // idempotency alokasi Owner
  appUsers: AppUser[];
  customers: Customer[];
  reseps: ResepRecord[];
  settings: AppSettings;
  audit: AuditEntry[];
};

export const FRAME_CATS = ["Full-rim", "Half-rim", "Rimless", "Round", "Square"];
export const LENSA_CATS = ["Single Vision", "Blue Control", "Progressive", "Photochromic"];

const SEED_CATEGORY: Record<string, string> = {
  "P-001": "Full-rim",
  "P-002": "Square",
  "P-003": "Round",
  "P-004": "Half-rim",
  "P-005": "Rimless",
  "P-006": "Full-rim",
  "P-007": "Single Vision",
  "P-008": "Blue Control",
  "P-009": "Progressive",
  "P-010": "Aksesoris",
  "P-011": "Aksesoris",
};

const now = () =>
  `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date()
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(".", ":")}`;

const normSnap = (base: { od: { sph: string; cyl: string; axis: string }; os: { sph: string; cyl: string; axis: string }; pd: string; add?: string }, at: string) => ({
  od: base.od,
  os: base.os,
  pd: base.pd,
  add: base.add ?? "-",
  at,
});

const SNAPSHOTS: Record<string, { od: { sph: string; cyl: string; axis: string }; os: { sph: string; cyl: string; axis: string }; pd: string; add: string; at: string }> = {
  "PO-2026-0108": normSnap(RESEP_MAP["C-02"], "10 Okt 2026"),
  "PO-2026-0107": {
    od: { sph: "-1.50", cyl: "-0.75", axis: "180" },
    os: { sph: "-1.25", cyl: "-0.50", axis: "170" },
    pd: "32.0",
    add: "+1.00",
    at: "10 Okt 2026",
  },
};

function seed(): StoreShape {
  const products: AdminProduct[] = PRODUCTS.map((p, i) => ({
    id: p.id,
    code: `${p.category === "Frame" ? "FR" : p.category === "Lensa" ? "LS" : "AK"}-${String(i + 1).padStart(3, "0")}`,
    name: p.name,
    brand: p.brand,
    type: p.category as ProductType,
    category: SEED_CATEGORY[p.id] ?? p.category,
    price: p.price,
    tag: p.tag,
    status: "Aktif",
    branchId: BRANCH_ID,
    updatedAt: "10 Okt 2026",
  }));
  const saldos: Array<[string, number, number]> = [
    ["P-001", 8, 4],
    ["P-002", 6, 4],
    ["P-003", 2, 3],
    ["P-004", 9, 4],
    ["P-005", 4, 4],
    ["P-006", 5, 3],
    ["P-007", 12, 6],
    ["P-008", 3, 3],
    ["P-009", 7, 4],
  ];
  const stock: StockRow[] = saldos.map(([productId, saldo, minimum]) => ({
    productId,
    branchId: BRANCH_ID,
    saldo,
    minimum,
  }));
  const mutations: Mutation[] = stock.map((s, i) => ({
    id: `MU-${String(i + 1).padStart(4, "0")}`,
    at: "01 Okt 2026, 09:00",
    productId: s.productId,
    branchId: BRANCH_ID,
    arah: "IN",
    sumber: "Saldo Awal",
    qty: s.saldo,
    sebelum: 0,
    sesudah: s.saldo,
    ref: "OPENING/Okt-2026",
    actor: "Sistem",
  }));
  const snapOf = (o: PoOrder) => {
    if (!o.resep) return null;
    const base = SNAPSHOTS[o.id] ?? normSnap(RESEP_MAP["C-02"], o.date);
    return base;
  };
  /* Riwayat seed yang konsisten dengan status tiap PO (ilustrasi bentuk timeline). */
  const seedTimeline = (o: PoOrder): PoTimeline[] => {
    const t: PoTimeline[] = [{ at: o.createdAt, actor: "Kasir", from: "Baru", to: "Dipesan", note: "PO dibuat Kasir" }];
    if (o.status === "Dipesan") return t;
    t.push({ at: "10 Oktober 2026, 13:05", actor: "Rina Amelia", from: "Dipesan", to: "Diproses", note: "Produk disiapkan" });
    if (o.status === "Diproses") return t;
    t.push({ at: "10 Oktober 2026, 15:40", actor: "Rina Amelia", from: "Diproses", to: "Sudah Datang", note: "Barang tersedia" });
    if (o.status === "Sudah Datang") return t;
    // Seed Selesai: aktor Kasir mengikuti catatan mock; kebijakan resmi tetap terbuka (PRD).
    t.push({ at: "09 Oktober 2026, 10:02", actor: "Kasir", from: "Sudah Datang", to: "Selesai", note: "Diambil pelanggan" });
    return t;
  };
  const pos: SharedPO[] = ORDERS.map((o) => ({
    ...o,
    branchId: BRANCH_ID,
    timeline: seedTimeline(o),
    resepSnapshot: snapOf(o),
  }));
  return {
    products,
    stock,
    centralStock: [
      ["P-001", 24, 5],
      ["P-002", 18, 5],
      ["P-003", 15, 5],
      ["P-004", 20, 5],
      ["P-005", 12, 5],
      ["P-006", 10, 5],
      ["P-007", 30, 8],
      ["P-008", 22, 8],
      ["P-009", 16, 8],
    ].map(([productId, saldo, minimum]) => ({
      productId: productId as string,
      branchId: "pusat",
      saldo: saldo as number,
      minimum: minimum as number,
    })),
    distributions: [
      {
        id: "DIST-2026-021",
        date: "10 Okt 2026",
        from: "Pusat",
        branchId: BRANCH_ID,
        status: "Menunggu Diterima",
        lines: [
          { productId: "P-003", qtyAlokasi: 4, qtyDiterima: 0 },
          { productId: "P-008", qtyAlokasi: 6, qtyDiterima: 0 },
        ],
      },
      {
        id: "DIST-2026-020",
        date: "08 Okt 2026",
        from: "Pusat",
        branchId: BRANCH_ID,
        status: "Menunggu Diterima",
        lines: [{ productId: "P-005", qtyAlokasi: 3, qtyDiterima: 0 }],
      },
    ],
    receipts: [],
    requests: [],
    notices: [],
    pos,
    mutations,
    transactions: TRANSACTIONS,
    saleRefs: [],
    allocKeys: [],
    appUsers: [
      { id: "U-001", name: "Korena Saif", email: "kasir@mekarjaya.demo", password: "demo123", role: "kasir", branchId: BRANCH_ID, status: "Aktif" },
      { id: "U-002", name: "Rina Amelia", email: "admin@mekarjaya.demo", password: "demo123", role: "admin", branchId: BRANCH_ID, status: "Aktif" },
      { id: "U-003", name: "Agus Wijaya", email: "owner@mekarjaya.demo", password: "demo123", role: "pemilik", branchId: "all", status: "Aktif" },
    ],
    customers: CUSTOMERS,
    reseps: RESEP_RECORDS,
    settings: {
      defaultMinimum: 2,
      storeName: "Optik Mekar Jaya — Cabang Padang",
      storePhone: "(0751) 123456",
      storeAddress: "Jl. Contoh No. 1, Padang",
    },
    audit: [
      {
        id: "AU-001",
        at: "10 Okt 2026, 09:12",
        actor: DEMO_ADMIN.name,
        branch: DEMO_ADMIN.branch,
        action: "Inisialisasi shared store Tahap 02",
        ref: "SYSTEM/SEED",
      },
    ],
  };
}

/** Migrasi satu-kali dari store Tahap-01 (produk & minimum & draf) agar tak hilang. */
function migrateOld(base: StoreShape): StoreShape {
  try {
    const raw = localStorage.getItem(ADMIN_STORE_KEY);
    if (!raw) return base;
    const old = JSON.parse(raw) as {
      products?: Array<{ id: string; name: string; brand: string; category: string; price: number; status: "Aktif" | "Nonaktif" }>;
      stock?: Array<{ productId: string; minimum: number }>;
      drafts?: Array<{ id: string; at: string; productId: string; qty: number; note: string }>;
    };
    if (!old.products) return base;
    const products = base.products.map((p) => {
      const o = old.products!.find((x) => x.id === p.id);
      return o ? { ...p, name: o.name, brand: o.brand, category: o.category, price: o.price, status: o.status } : p;
    });
    // produk baru Tahap-01 (id P-F*/P-L*) ikut terbawa
    for (const o of old.products) {
      if (!products.some((p) => p.id === o.id)) {
        products.push({
          id: o.id, code: o.id.startsWith("P-L") ? `LS-X${o.id.slice(-2)}` : `FR-X${o.id.slice(-2)}`,
          name: o.name, brand: o.brand, type: o.id.startsWith("P-L") ? "Lensa" : "Frame",
          category: o.category, price: o.price, status: o.status, branchId: BRANCH_ID, updatedAt: "Tahap 01",
        });
      }
    }
    const stock = base.stock.map((s) => {
      const o = old.stock?.find((x) => x.productId === s.productId);
      return o ? { ...s, minimum: o.minimum } : s;
    });
    const requests: StockRequest[] = (old.drafts ?? []).map((d, i) => ({
      id: `REQ-2026-${String(i + 1).padStart(3, "0")}`,
      at: d.at,
      actor: DEMO_ADMIN.name,
      branchId: BRANCH_ID,
      productId: d.productId,
      qty: d.qty,
      note: d.note,
      status: "Diajukan",
    }));
    return { ...base, products, stock, requests };
  } catch {
    return base;
  }
}

function load(): StoreShape {
  try {
    const raw = localStorage.getItem(SHARED_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreShape;
      if (Array.isArray(parsed.products) && Array.isArray(parsed.pos)) {
        // Backfill aditif Tahap 04 (tanpa bump key / tanpa hapus data pengguna).
        if (!Array.isArray(parsed.centralStock)) parsed.centralStock = seed().centralStock;
        if (!Array.isArray(parsed.allocKeys)) parsed.allocKeys = [];
        if (!Array.isArray(parsed.appUsers)) parsed.appUsers = seed().appUsers;
        if (!Array.isArray(parsed.customers)) parsed.customers = seed().customers;
        if (!Array.isArray(parsed.reseps)) parsed.reseps = seed().reseps;
        if (!parsed.settings) parsed.settings = seed().settings;
        if (Array.isArray(parsed.transactions)) {
          for (const t of parsed.transactions) {
            if (!(t as { branchId?: string }).branchId) (t as { branchId?: string }).branchId = BRANCH_ID;
          }
          /* Riwayat demo tambahan (id H*) untuk grafik periode sebelumnya — hanya menambah. */
          const known = new Set(parsed.transactions.map((t) => t.id));
          const history = TRANSACTIONS.filter((t) => t.id.startsWith("H") && !known.has(t.id));
          if (history.length) parsed.transactions = [...parsed.transactions, ...history];
        }
        return parsed;
      }
    }
  } catch {
    /* pakai seed */
  }
  return migrateOld(seed());
}

type SharedStore = StoreShape & {
  lowStock: Array<{ product: AdminProduct; saldo: number; minimum: number }>;
  productOf: (id: string) => AdminProduct | undefined;
  stockOf: (id: string) => StockRow | undefined;
  upsertProduct: (input: Omit<AdminProduct, "id" | "code" | "updatedAt" | "branchId"> & { id?: string }) => string | null;
  deactivateProduct: (id: string) => void;
  setMinimum: (productId: string, minimum: number) => void;
  createRequest: (productId: string, qty: number, note: string) => void;
  addDraft: (productId: string, qty: number, note: string) => void;
  createPO: (input: { customerId: string; productId: string; qty: number; note: string; actor: string }) => { ok: boolean; msg: string; id?: string };
  /** Alokasi Owner: reservation tanpa debit fisik pusat (keputusan terbuka). */
  availableToAllocate: (productId: string) => { onHand: number; reserved: number; available: number };
  allocatedForRequest: (requestId: string, productId: string) => number;
  outstandingForRequest: (requestId: string, productId: string) => number;
  createAllocation: (input: {
    requestId?: string;
    branchId: string;
    productId: string;
    qty: number;
    note: string;
    actor: string;
    key: string; // idempotency per-buka-form
  }) => { ok: boolean; msg: string; id?: string };
  upsertUser: (input: { id?: string; name: string; email: string; password: string; role: "kasir" | "admin" | "pemilik"; branchId: string }) => string | null;
  setUserStatus: (id: string, status: "Aktif" | "Nonaktif") => string | null;
  upsertCustomer: (input: {
    id?: string;
    name: string;
    phone: string;
    email: string;
    tier: Customer["tier"];
  }) => string | null;
  createResep: (input: {
    customerId: string;
    date: string;
    od: { sph: string; cyl: string; axis: string };
    os: { sph: string; cyl: string; axis: string };
    pd: string;
    add: string;
    note: string;
  }) => string | null;
  saveSettings: (input: AppSettings) => string | null;
  authenticate: (email: string, password: string) => { role: "kasir" | "admin" | "pemilik"; name: string; initials: string; branch: string; branchId: string; email: string } | null;
  confirmReceipt: (
    distributionId: string,
    productId: string,
    qty: number,
    note: string,
  ) => { ok: boolean; msg: string };
  transitionPO: (id: string, to: PoStatus, note: string, actor: string) => { ok: boolean; msg: string };
  recordSale: (
    items: Array<{ id: string; name: string; brand: string; qty: number; price: number }>,
    refNo: string,
    actor: string,
    method?: string,
  ) => boolean;
};

const Ctx = createContext<SharedStore | null>(null);

const PO_NEXT: Record<string, PoStatus> = { Dipesan: "Diproses", Diproses: "Sudah Datang" };

export function SharedProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreShape>(load);

  useEffect(() => {
    try {
      localStorage.setItem(SHARED_STORE_KEY, JSON.stringify(state));
    } catch {
      /* demo tetap jalan in-memory */
    }
  }, [state]);

  const value = useMemo<SharedStore>(() => {
    const productOf = (id: string) => state.products.find((p) => p.id === id);
    const stockOf = (id: string) => state.stock.find((s) => s.productId === id);
    const lowStock = state.stock
      .filter((s) => {
        const p = productOf(s.productId);
        return p && p.status === "Aktif" && p.type !== "Aksesoris" && s.saldo <= s.minimum;
      })
      .map((s) => ({ product: productOf(s.productId)!, saldo: s.saldo, minimum: s.minimum }));

    const audit = (prev: StoreShape, action: string, ref: string): AuditEntry[] => [
      {
        id: `AU-${String(prev.audit.length + 1).padStart(3, "0")}`,
        at: now(),
        actor: DEMO_ADMIN.name,
        branch: DEMO_ADMIN.branch,
        action,
        ref,
      },
      ...prev.audit,
    ];

    return {
      ...state,
      lowStock,
      productOf,
      stockOf,

      upsertProduct: (input) => {
        if (!input.name.trim() || !input.brand.trim()) return "Nama dan merek wajib diisi.";
        if (!Number.isFinite(input.price) || input.price <= 0) return "Harga jual harus lebih dari Rp 0.";
        setState((prev) => {
          if (input.id) {
            const code = prev.products.find((p) => p.id === input.id)?.code ?? "";
            return {
              ...prev,
              products: prev.products.map((p) =>
                p.id === input.id ? { ...p, ...input, id: p.id, code: p.code, branchId: BRANCH_ID, updatedAt: now().split(",")[0] } : p,
              ),
              audit: audit(prev, `Ubah produk ${code}`, `PRODUK/${code}`),
            };
          }
          const n = prev.products.filter((p) => p.type === input.type).length + 1;
          const pre = input.type === "Frame" ? "FR" : input.type === "Lensa" ? "LS" : "AK";
          const code = `${pre}-${String(n).padStart(3, "0")}`;
          const id = `P-${input.type === "Frame" ? "F" : input.type === "Lensa" ? "L" : "A"}${Date.now().toString().slice(-4)}`;
          const np: AdminProduct = { ...input, id, code, branchId: BRANCH_ID, updatedAt: now().split(",")[0] };
          return {
            ...prev,
            products: [...prev.products, np],
            stock: input.type === "Aksesoris" ? prev.stock : [...prev.stock, { productId: id, branchId: BRANCH_ID, saldo: 0, minimum: state.settings.defaultMinimum }],
            audit: audit(prev, `Tambah produk ${code}`, `PRODUK/${code}`),
          };
        });
        return null;
      },

      deactivateProduct: (id) => {
        setState((prev) => {
          const code = prev.products.find((p) => p.id === id)?.code ?? id;
          return {
            ...prev,
            products: prev.products.map((p) => (p.id === id ? { ...p, status: "Nonaktif", updatedAt: now().split(",")[0] } : p)),
            audit: audit(prev, `Nonaktifkan produk ${code} (soft delete)`, `PRODUK/${code}`),
          };
        });
      },

      setMinimum: (productId, minimum) => {
        setState((prev) => ({
          ...prev,
          stock: prev.stock.map((s) => (s.productId === productId ? { ...s, minimum } : s)),
          audit: audit(prev, `Tetapkan minimum ${prev.products.find((p) => p.id === productId)?.code} = ${minimum}`, `STOK/${productId}`),
        }));
      },

      createRequest: (productId, qty, note) => {
        setState((prev) => {
          const p = prev.products.find((x) => x.id === productId);
          const id = `REQ-2026-${String(prev.requests.length + 1).padStart(3, "0")}`;
          const at = now();
          return {
            ...prev,
            requests: [{ id, at, actor: DEMO_ADMIN.name, branchId: BRANCH_ID, productId, qty, note, status: "Diajukan" }, ...prev.requests],
            notices: [
              { id: `NT-${String(prev.notices.length + 1).padStart(3, "0")}`, at, kind: "Pengajuan Stok" as const, refId: id, summary: `${p?.code ?? productId} × ${qty} dari ${DEMO_ADMIN.branch}` },
              ...prev.notices,
            ],
            audit: audit(prev, `Buat pengajuan ${id} (${p?.code} × ${qty})`, `PENGAJUAN/${id}`),
          };
        });
      },

      addDraft: (productId, qty, note) => {
        setState((prev) => {
          const p = prev.products.find((x) => x.id === productId);
          const id = `REQ-2026-${String(prev.requests.length + 1).padStart(3, "0")}`;
          return {
            ...prev,
            requests: [{ id, at: now(), actor: DEMO_ADMIN.name, branchId: BRANCH_ID, productId, qty, note, status: "Diajukan" }, ...prev.requests],
            audit: audit(prev, `Buat pengajuan ${id} (${p?.code} × ${qty})`, `PENGAJUAN/${id}`),
          };
        });
      },

      createPO: ({ customerId, productId, qty, note, actor }) => {
        if (!Number.isInteger(qty) || qty <= 0) return { ok: false, msg: "Jumlah harus bilangan bulat lebih dari 0." };
        const cust = CUSTOMERS.find((c) => c.id === customerId);
        const prod = state.products.find((p) => p.id === productId && p.status === "Aktif");
        if (!cust) return { ok: false, msg: "Pelanggan tidak valid." };
        if (!prod) return { ok: false, msg: "Produk tidak valid / nonaktif." };
        const at = now();
        const seq = state.pos.length + 109;
        const id = `PO-2026-0${seq}`;
        const base = prod.type === "Lensa" ? RESEP_MAP[customerId] : undefined;
        const snap = base ? normSnap(base, at.split(",")[0]) : null;
        const po: SharedPO = {
          id,
          number: id,
          date: at.split(",")[0],
          customer: cust.name,
          initials: cust.initials,
          phone: cust.phone,
          products: [prod.name, `${prod.type} · ${prod.brand}`],
          productLabel: prod.name,
          status: "Dipesan",
          createdAt: `${at} WIB`,
          note: note.trim() || "Menunggu pemrosesan admin cabang.",
          items: [{ name: prod.name, sub: `${prod.type} · ${prod.brand}`, qty }],
          resep: snap !== null,
          branchId: BRANCH_ID,
          timeline: [{ at: `${at} WIB`, actor, from: "Baru", to: "Dipesan", note: "PO dibuat Kasir" }],
          resepSnapshot: snap,
        };
        setState((prev) => ({
          ...prev,
          pos: [po, ...prev.pos],
          audit: audit(prev, `Buat PO ${id} (${cust.name} · ${prod.name} × ${qty})`, `PO/${id}`),
        }));
        return { ok: true, msg: `PO ${id} tercatat dengan status Dipesan.`, id };
      },

      availableToAllocate: (productId) => {
        const onHand = state.centralStock.find((s) => s.productId === productId)?.saldo ?? 0;
        const reserved = state.distributions
          .filter((d) => d.status !== "Diterima")
          .flatMap((d) => d.lines)
          .filter((l) => l.productId === productId)
          .reduce((a, l) => a + Math.max(0, l.qtyAlokasi - l.qtyDiterima), 0);
        return { onHand, reserved, available: Math.max(0, onHand - reserved) };
      },

      allocatedForRequest: (requestId, productId) =>
        state.distributions
          .filter((d) => d.requestId === requestId)
          .flatMap((d) => d.lines)
          .filter((l) => l.productId === productId)
          .reduce((a, l) => a + l.qtyAlokasi, 0),

      outstandingForRequest: (requestId, productId) => {
        const req = state.requests.find((r) => r.id === requestId && r.productId === productId);
        if (!req) return 0;
        const allocated = state.distributions
          .filter((d) => d.requestId === requestId)
          .flatMap((d) => d.lines)
          .filter((l) => l.productId === productId)
          .reduce((a, l) => a + l.qtyAlokasi, 0);
        return Math.max(0, req.qty - allocated);
      },

      createAllocation: ({ requestId, branchId, productId, qty, note, actor, key }) => {
        if (state.allocKeys.includes(key)) {
          const dup = state.distributions.find((d) => d.idemKey === key);
          return { ok: false, msg: `Alokasi ganda ditolak (sudah tercatat${dup ? ` sebagai ${dup.id}` : ""}).` };
        }
        if (!Number.isInteger(qty) || qty <= 0) return { ok: false, msg: "Jumlah alokasi harus bilangan bulat lebih dari 0." };
        if (branchId === "pusat") return { ok: false, msg: "Cabang tujuan tidak boleh Pusat." };
        if (!BRANCHES.some((b) => b.id === branchId && b.type === "Cabang"))
          return { ok: false, msg: "Cabang tujuan tidak valid." };
        const prod = state.products.find((p) => p.id === productId && p.status === "Aktif");
        if (!prod || prod.type === "Aksesoris") return { ok: false, msg: "Produk tidak valid / nonaktif." };
        const central = state.centralStock.find((s) => s.productId === productId);
        const onHand = central?.saldo ?? 0;
        const reserved = state.distributions
          .filter((d) => d.status !== "Diterima")
          .flatMap((d) => d.lines)
          .filter((l) => l.productId === productId)
          .reduce((a, l) => a + Math.max(0, l.qtyAlokasi - l.qtyDiterima), 0);
        if (qty > Math.max(0, onHand - reserved))
          return { ok: false, msg: `Melebihi yang bisa dialokasikan (tersedia ${Math.max(0, onHand - reserved)} dari stok pusat ${onHand}, reservasi ${reserved}).` };
        if (requestId) {
          const req = state.requests.find((r) => r.id === requestId && r.productId === productId);
          if (!req) return { ok: false, msg: "Pengajuan terkait tidak ditemukan." };
          if (req.branchId !== branchId) return { ok: false, msg: "Cabang pengajuan dan tujuan tidak sama." };
          const allocated = state.distributions
            .filter((d) => d.requestId === requestId)
            .flatMap((d) => d.lines)
            .filter((l) => l.productId === productId)
            .reduce((a, l) => a + l.qtyAlokasi, 0);
          if (qty > Math.max(0, req.qty - allocated))
            return { ok: false, msg: `Melebihi sisa pengajuan (diminta ${req.qty}, sudah dialokasikan ${allocated}).` };
        }
        const seq = state.distributions.length + 22;
        const id = `DIST-2026-0${seq}`;
        const at = now();
        setState((prev) => ({
          ...prev,
          distributions: [
            {
              id, date: at.split(",")[0], from: "Pusat", branchId, status: "Menunggu Diterima",
              lines: [{ productId, qtyAlokasi: qty, qtyDiterima: 0 }],
              requestId, actor, note: note.trim(), idemKey: key,
            },
            ...prev.distributions,
          ],
          allocKeys: [...prev.allocKeys, key],
          audit: audit(prev, `Alokasi ${id} (Pusat → ${branchId}, ${prod.code} × ${qty})`, `ALOKASI/${id}`),
        }));
        return { ok: true, msg: `Alokasi ${id} tercatat (reservasi, menunggu penerimaan Admin).`, id };
      },

      confirmReceipt: (distributionId, productId, qty, note) => {
        if (!Number.isInteger(qty) || qty <= 0) return { ok: false, msg: "Jumlah diterima harus bilangan bulat lebih dari 0." };
        const key = `${distributionId}::${productId}`;
        if (state.receipts.some((r) => r.idempotencyKey === key))
          return { ok: false, msg: "Penerimaan ini sudah dicatat (duplikat ditolak)." };
        const dist = state.distributions.find((d) => d.id === distributionId);
        if (!dist || dist.branchId !== BRANCH_ID) return { ok: false, msg: "Distribusi tidak ditemukan untuk cabang ini." };
        const line = dist.lines.find((l) => l.productId === productId);
        if (!line) return { ok: false, msg: "Produk tidak termasuk dalam distribusi ini." };
        const sisa = line.qtyAlokasi - line.qtyDiterima;
        if (qty > sisa)
          return { ok: false, msg: `Melebihi sisa alokasi (${sisa}). Selisih/over-delivery butuh keputusan bisnis — belum diproses.` };
        setState((prev) => {
          const s = prev.stock.find((x) => x.productId === productId);
          if (!s) return prev;
          const sebelum = s.saldo;
          const sesudah = sebelum + qty;
          const id = `RC-2026-${String(prev.receipts.length + 1).padStart(3, "0")}`;
          const p = prev.products.find((x) => x.id === productId);
          const distributions = prev.distributions.map((d) => {
            if (d.id !== distributionId) return d;
            const lines = d.lines.map((l) => (l.productId === productId ? { ...l, qtyDiterima: l.qtyDiterima + qty } : l));
            const done = lines.every((l) => l.qtyDiterima >= l.qtyAlokasi);
            const part = lines.some((l) => l.qtyDiterima > 0);
            return { ...d, lines, status: done ? ("Diterima" as const) : part ? ("Diterima Sebagian" as const) : d.status };
          });
          const mu: Mutation = {
            id: `MU-${String(prev.mutations.length + 1).padStart(4, "0")}`,
            at: now(), productId, branchId: BRANCH_ID, arah: "IN", sumber: "Penerimaan",
            qty, sebelum, sesudah, ref: id, actor: DEMO_ADMIN.name,
          };
          return {
            ...prev,
            stock: prev.stock.map((x) => (x.productId === productId ? { ...x, saldo: sesudah } : x)),
            distributions,
            receipts: [{ id, distributionId, productId, qty, at: now(), actor: DEMO_ADMIN.name, branchId: BRANCH_ID, idempotencyKey: key, note, selisih: qty - sisa }, ...prev.receipts],
            mutations: [mu, ...prev.mutations],
            audit: audit(prev, `Konfirmasi penerimaan ${id} (${p?.code} +${qty})`, `PENERIMAAN/${id}`),
          };
        });
        return { ok: true, msg: "Penerimaan tercatat. Stok bertambah tepat satu kali." };
      },

      transitionPO: (id, to, note, actor) => {
        const po = state.pos.find((p) => p.id === id);
        if (!po || po.branchId !== BRANCH_ID) return { ok: false, msg: "PO tidak ditemukan di cabang ini." };
        if (to === "Selesai")
          return { ok: false, msg: "Transisi ke Selesai belum diputuskan (PRD terbuka) — aksi dinonaktifkan." };
        if (PO_NEXT[po.status] !== to)
          return { ok: false, msg: `Transisi ${po.status} → ${to} tidak diizinkan. Jalur sah: Dipesan → Diproses → Sudah Datang.` };
        setState((prev) => ({
          ...prev,
          pos: prev.pos.map((p) =>
            p.id === id
              ? { ...p, status: to, timeline: [...p.timeline, { at: now(), actor, from: p.status, to, note }] }
              : p,
          ),
          audit: audit(prev, `PO ${po.number}: ${po.status} → ${to}`, `PO/${id}`),
        }));
        return { ok: true, msg: `Status PO menjadi ${to}.` };
      },

      recordSale: (items, refNo, actor, method = "—") => {
        if (state.saleRefs.includes(refNo)) return false; // idempotent
        setState((prev) => {
          if (prev.saleRefs.includes(refNo)) return prev;
          let mutations = prev.mutations;
          let stock = prev.stock;
          let seq = prev.mutations.length;
          const at = now();
          for (const it of items) {
            const s = stock.find((x) => x.productId === it.id);
            if (!s) continue; // tanpa baris stok (mis. aksesoris) → lewati, tanpa error
            const deduct = Math.min(s.saldo, it.qty); // stok tidak boleh negatif
            if (deduct <= 0) continue;
            seq += 1;
            mutations = [
              { id: `MU-${String(seq).padStart(4, "0")}`, at, productId: it.id, branchId: BRANCH_ID, arah: "OUT", sumber: "Penjualan", qty: -deduct, sebelum: s.saldo, sesudah: s.saldo - deduct, ref: refNo, actor },
              ...mutations,
            ];
            stock = stock.map((x) => (x.productId === it.id ? { ...x, saldo: x.saldo - deduct } : x));
          }
          const first = items[0];
          const trx: Transaction = {
            id: `T-${refNo}`, no: refNo, date: at.split(",")[0], time: at.split(",")[1]?.trim() ?? "",
            customer: "Pelanggan Kasir", phone: "-", type: "Pembelian", total: items.reduce((a, i) => a + i.price * i.qty, 0),
            status: "Selesai", branchId: BRANCH_ID, method,
            products: items.map((i) => ({ name: i.name, brand: i.brand, qty: i.qty, price: i.price })),
          };
          void first;
          return {
            ...prev,
            stock,
            mutations,
            saleRefs: [...prev.saleRefs, refNo],
            transactions: [trx, ...prev.transactions],
            audit: audit(prev, `Penjualan Kasir ${refNo} (${items.reduce((a, i) => a + i.qty, 0)} item)`, `JUAL/${refNo}`),
          };
        });
        return true;
      },

      upsertUser: ({ id, name, email, password, role, branchId }) => {
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanName) return "Nama wajib diisi.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return "Format email tidak valid.";
        if (!id && password.length < 6) return "Password minimal 6 karakter.";
        if (id && password && password.length < 6) return "Password minimal 6 karakter.";
        if (role !== "pemilik" && branchId !== BRANCH_ID) return "Cabang tidak valid (demo satu cabang).";
        const dupe = state.appUsers.some((u) => u.email.toLowerCase() === cleanEmail && u.id !== id);
        if (dupe) return "Email sudah dipakai pengguna lain.";
        if (id) {
          const target = state.appUsers.find((u) => u.id === id);
          if (!target) return "Pengguna tidak ditemukan.";
          if (target.role === "pemilik" && role !== "pemilik") {
            const otherOwners = state.appUsers.filter((u) => u.id !== id && u.role === "pemilik" && u.status === "Aktif");
            if (otherOwners.length === 0) return "Minimal satu Pemilik aktif harus tersisa.";
          }
          setState((prev) => ({
            ...prev,
            appUsers: prev.appUsers.map((u) =>
              u.id === id
                ? { ...u, name: cleanName, email: cleanEmail, ...(password ? { password } : {}), role, branchId: role === "pemilik" ? "all" : BRANCH_ID }
                : u,
            ),
            audit: audit(prev, `Ubah pengguna ${cleanEmail}`, `USER/${id}`),
          }));
        } else {
          const nid = `U-${Date.now().toString().slice(-5)}`;
          setState((prev) => ({
            ...prev,
            appUsers: [
              ...prev.appUsers,
              { id: nid, name: cleanName, email: cleanEmail, password, role, branchId: role === "pemilik" ? "all" : BRANCH_ID, status: "Aktif" },
            ],
            audit: audit(prev, `Tambah pengguna ${cleanEmail} (${role})`, `USER/${nid}`),
          }));
        }
        return null;
      },

      setUserStatus: (uid, status) => {
        const target = state.appUsers.find((u) => u.id === uid);
        if (!target) return "Pengguna tidak ditemukan.";
        if (status === "Nonaktif" && target.role === "pemilik") {
          const otherOwners = state.appUsers.filter((u) => u.id !== uid && u.role === "pemilik" && u.status === "Aktif");
          if (otherOwners.length === 0) return "Minimal satu Pemilik aktif harus tersisa.";
        }
        setState((prev) => ({
          ...prev,
          appUsers: prev.appUsers.map((u) => (u.id === uid ? { ...u, status } : u)),
          audit: audit(prev, `${status === "Aktif" ? "Aktifkan" : "Nonaktifkan"} pengguna ${target.email}`, `USER/${uid}`),
        }));
        return null;
      },

      upsertCustomer: ({ id, name, phone, email, tier }) => {
        const cleanName = name.trim();
        const digits = phone.replace(/[^0-9]/g, "");
        if (!cleanName) return "Nama pelanggan wajib diisi.";
        if (digits.length < 8 || digits.length > 15) return "Nomor HP harus 8–15 digit angka.";
        const cleanEmail = email.trim();
        if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return "Format email tidak valid.";
        const initials = cleanName
          .split(/\s+/)
          .map((w) => w[0] ?? "")
          .join("")
          .slice(0, 2)
          .toUpperCase() || "PL";
        setState((prev) => {
          if (id) {
            const existing = prev.customers.find((c) => c.id === id);
            if (!existing) return prev;
            return {
              ...prev,
              customers: prev.customers.map((c) =>
                c.id === id ? { ...c, name: cleanName, phone: phone.trim(), email: cleanEmail, tier, initials } : c,
              ),
              audit: audit(prev, `Ubah pelanggan ${existing.code}`, `PELANGGAN/${existing.code}`),
            };
          }
          const n = prev.customers.length + 1;
          const code = `PLG-${String(n).padStart(4, "0")}`;
          const cid = `C-${Date.now().toString().slice(-5)}`;
          const next: Customer = {
            id: cid,
            code,
            name: cleanName,
            initials,
            phone: phone.trim(),
            email: cleanEmail,
            tier,
            hasResep: false,
            poActive: 0,
            branch: "Padang",
          };
          return {
            ...prev,
            customers: [...prev.customers, next],
            audit: audit(prev, `Tambah pelanggan ${cleanName}`, `PELANGGAN/${code}`),
          };
        });
        return null;
      },

      createResep: ({ customerId, date, od, os, pd, add }) => {
        const customer = state.customers.find((c) => c.id === customerId);
        if (!customer) return "Pelanggan wajib dipilih.";
        if (!od.sph.trim() || !os.sph.trim()) return "SPH OD dan OS wajib diisi.";
        if (!pd.trim()) return "PD wajib diisi.";
        setState((prev) => {
          const ids = prev.reseps
            .map((r) => Number(r.id.replace(/[^0-9]/g, "")))
            .filter((x) => Number.isFinite(x));
          const nextId = `RX-${String(Math.max(0, ...ids) + 1).padStart(3, "0")}`;
          const record: ResepRecord = {
            id: nextId,
            customer: customer.name,
            initials: customer.initials,
            date: date.trim() || now().split(",")[0],
            od,
            os,
            pd: pd.trim(),
            add: add.trim() || "-",
            status: "Aktif",
          };
          return {
            ...prev,
            reseps: [record, ...prev.reseps],
            customers: prev.customers.map((c) => (c.id === customerId ? { ...c, hasResep: true } : c)),
            audit: audit(prev, `Tambah resep ${nextId} (${customer.name})`, `RESEP/${nextId}`),
          };
        });
        return null;
      },

      saveSettings: (input) => {
        if (!Number.isInteger(input.defaultMinimum) || input.defaultMinimum < 0) return "Minimum default harus bilangan bulat ≥ 0.";
        if (!input.storeName.trim()) return "Nama toko wajib diisi.";
        setState((prev) => ({
          ...prev,
          settings: {
            defaultMinimum: input.defaultMinimum,
            storeName: input.storeName.trim(),
            storePhone: input.storePhone.trim(),
            storeAddress: input.storeAddress.trim(),
          },
          audit: audit(prev, "Ubah pengaturan toko", "PENGATURAN/TOKO"),
        }));
        return null;
      },

      authenticate: (email, password) => {
        const u = state.appUsers.find(
          (x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password && x.status === "Aktif",
        );
        if (!u) return null;
        const initials = u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        return {
          role: u.role,
          name: u.name,
          initials,
          branch: u.role === "pemilik" ? "Seluruh Cabang" : "Cabang Padang",
          branchId: u.branchId,
          email: u.email,
        };
      },
    };
  }, [state]);

  // Hook uji DEV (otomasi QA): ekspos aksi tulis agar idempotency/konkurensi
  // dapat diuji langsung. Tidak dipakai kode produksi.
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as unknown as { __simpos?: unknown }).__simpos = {
        recordSale: value.recordSale,
        createAllocation: value.createAllocation,
        availableToAllocate: value.availableToAllocate,
        transitionPO: value.transitionPO,
        confirmReceipt: value.confirmReceipt,
        createPO: value.createPO,
      };
    }
  }, [value]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSharedStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSharedStore must be used within SharedProvider");
  return ctx;
}

/** Alias kompatibilitas Tahap-01. */
export const useAdminStore = useSharedStore;
