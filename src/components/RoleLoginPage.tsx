import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowBigUp, Eye, EyeOff, Lock, User } from "lucide-react";
import MRLogo from "./MRLogo";
import { ADMIN_SESSION_KEY, DEMO_ADMIN } from "../data/admin";
import {
  DEMO_KASIR,
  DEMO_OWNER,
  adminSession,
  ownerSession,
  setSession,
  type Role,
  type Session,
} from "../store/session";
import { BRANCH_ID, useSharedStore } from "../store/sharedStore";
import "../styles/login.css";

/**
 * Satu halaman login untuk Kasir, Admin Cabang, dan Pemilik.
 * Struktur, ukuran, dan isi visual sama; yang berbeda hanya role,
 * kredensial demo, dan tujuan setelah masuk.
 */

const ROLE_LABEL: Record<Role, string> = {
  kasir: "Kasir",
  admin: "Admin Cabang",
  pemilik: "Pemilik",
};

const LOGIN_PATH: Record<Role, string> = {
  kasir: "/login",
  admin: "/admin/login",
  pemilik: "/owner/login",
};

type LoginConfig = {
  demoEmail: string;
  demoPassword: string;
  home: string;
  buildSession: () => Session;
  afterDemoLogin?: () => void;
};

const LOGIN_CONFIG: Record<Role, LoginConfig> = {
  kasir: {
    demoEmail: DEMO_KASIR.email,
    demoPassword: DEMO_KASIR.password,
    home: "/dashboard",
    buildSession: () => ({
      role: "kasir",
      name: DEMO_KASIR.name,
      initials: DEMO_KASIR.initials,
      branch: DEMO_KASIR.branch,
      branchId: BRANCH_ID,
      email: DEMO_KASIR.email,
    }),
  },
  admin: {
    demoEmail: DEMO_ADMIN.email,
    demoPassword: DEMO_ADMIN.password,
    home: "/admin/dashboard",
    buildSession: adminSession,
    afterDemoLogin: () => {
      try {
        localStorage.removeItem(ADMIN_SESSION_KEY);
      } catch {
        /* abaikan */
      }
    },
  },
  pemilik: {
    demoEmail: DEMO_OWNER.email,
    demoPassword: DEMO_OWNER.password,
    home: "/owner/dashboard",
    buildSession: ownerSession,
  },
};

export default function RoleLoginPage({ role }: { role: Role }) {
  const navigate = useNavigate();
  const shared = useSharedStore();
  const config = LOGIN_CONFIG[role];
  const [email, setEmail] = useState(config.demoEmail);
  const [password, setPassword] = useState(config.demoPassword);
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function cekCaps(e: KeyboardEvent<HTMLInputElement>) {
    setCapsOn(e.getModifierState("CapsLock"));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi.");
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      const demoMatch =
        email.trim().toLowerCase() === config.demoEmail.toLowerCase() &&
        password === config.demoPassword;

      if (demoMatch) {
        setSession(config.buildSession());
        config.afterDemoLogin?.();
        navigate(config.home);
        return;
      }

      const found = shared.authenticate(email, password);
      if (found && found.role === role) {
        setSession(found);
        navigate(config.home);
        return;
      }

      setLoading(false);
      if (found) {
        setError(
          `Akun ini terdaftar sebagai ${ROLE_LABEL[found.role]}. Masuk melalui halaman login ${ROLE_LABEL[found.role]} (${LOGIN_PATH[found.role]}).`,
        );
      } else {
        setError("Email atau password salah. Periksa kembali email dan password Anda.");
      }
    }, 700);
  }

  return (
    <div className="page-bg auth">
      <div className="auth-card" data-role={role}>
        <section className="auth-visual">
          <img src="/assets/login-approved-visual.jpg" alt="Koleksi kacamata Optik Mekar Jaya" />
          <div className="tint" />
          <div className="auth-copy">
            <h1>
              Solusi Penglihatan untuk Hidup yang <em>Lebih Baik</em>
            </h1>
            <p>
              Layanan optik modern dengan produk berkualitas dan pelayanan profesional untuk setiap gaya Anda.
            </p>
          </div>
          <div className="auth-tags" aria-hidden="true">
            <span>FRAME</span>
            <span>LENSA</span>
            <span>GAYA</span>
          </div>
        </section>

        <section className="auth-form">
          <div className="form-brand">
            <MRLogo size={46} />
            <b>Optik Mekar Jaya</b>
          </div>

          <h2>Selamat Datang</h2>
          <p className="sub">
            Silakan masuk untuk mengakses sistem Optik Mekar Jaya sebagai <b>{ROLE_LABEL[role]}</b>.
          </p>

          <form onSubmit={onSubmit} noValidate>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            <div className="field">
              <label htmlFor="login-email">Email</label>
              <div className="input-wrap">
                <User size={18} />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Masukkan email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="login-password">Password</label>
              <div className="input-wrap">
                <Lock size={18} />
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan password anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={cekCaps}
                  onKeyUp={cekCaps}
                  onBlur={() => setCapsOn(false)}
                />
                <button
                  type="button"
                  className="toggle"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span className={`caps-warn${capsOn ? " is-on" : ""}`}>
                <ArrowBigUp size={14} />
                Caps Lock aktif
              </span>
            </div>

            <div className="form-row">
              <label className="check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Ingat saya
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="auth-help">
            <b>Butuh bantuan masuk?</b>
            <span>Hubungi admin di cabang atau tim IT.</span>
            <span className="demo-foot">
              Akses {ROLE_LABEL[role]}: {config.demoEmail} / {config.demoPassword}
            </span>
          </div>

          <div className="brand-foot">v1.0 — © 2026 Optik Mekar Jaya</div>
        </section>
      </div>
    </div>
  );
}
