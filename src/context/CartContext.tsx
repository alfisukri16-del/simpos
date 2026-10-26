import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Customer } from "../data/customers";
import type { PaymentMethod } from "../data/mock";

export type CartItem = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  qty: number;
};

/** Ringkasan transaksi yang baru diselesaikan (dipakai halaman "Transaksi Berhasil"). */
export type Receipt = {
  no: string;
  date: string;
  time: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountPercent: number;
  total: number;
  customer: Customer | null;
  method: PaymentMethod;
};

type CartValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  discount: number;
  discountPercent: number;
  discountInput: string;
  setDiscountPercent: (value: string) => void;
  total: number;
  add: (p: { id: string; name: string; brand: string; category: string; price: number }) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  customer: Customer | null;
  setCustomer: (c: Customer | null) => void;
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
  receipt: Receipt | null;
  complete: () => Receipt;
};

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("Tunai");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [discountInput, setDiscountInput] = useState("0");

  const add = (p: { id: string; name: string; brand: string; category: string; price: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === p.id);
      if (existing) return prev.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const setQty = (id: string, qty: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)));

  const clear = () => {
    setItems([]);
    setCustomer(null);
    setMethod("Tunai");
    setDiscountInput("0");
  };

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const discountPercent = useMemo(() => {
    const n = Number(discountInput.replace(",", "."));
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
  }, [discountInput]);
  const discount = Math.round((subtotal * discountPercent) / 100);
  const total = Math.max(0, subtotal - discount);

  /** Diskon dalam persen; hanya angka (0–100) yang diterima. */
  const setDiscountPercent = (value: string) => {
    const clean = value.replace(",", ".").replace(/[^\d.]/g, "");
    const n = Number(clean);
    if (clean !== "" && Number.isFinite(n) && n > 100) {
      setDiscountInput("100");
      return;
    }
    setDiscountInput(clean);
  };

  /** Finalisasi transaksi: simpan struk lalu kosongkan keranjang. */
  const complete = (): Receipt => {
    const now = new Date();
    const trxNo = `TRX-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate(),
    ).padStart(2, "0")}-${String(Math.floor(Math.random() * 900) + 100)}`;
    const snapshot: Receipt = {
      no: trxNo,
      date: now.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
      time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":"),
      items,
      subtotal,
      discount,
      discountPercent,
      total,
      customer,
      method,
    };
    setReceipt(snapshot);
    clear();
    return snapshot;
  };

  const value: CartValue = {
    items, count, subtotal, discount, discountPercent, discountInput, setDiscountPercent, total,
    add, remove, setQty, clear, complete,
    customer, setCustomer, method, setMethod, receipt,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
