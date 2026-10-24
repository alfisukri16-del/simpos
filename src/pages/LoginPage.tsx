import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Glasses, Mail, Lock, ChevronDown, ArrowRight } from "lucide-react";
import { DEMO_KASIR, setSession } from "../store/session";
import { useSharedStore } from "../store/sharedStore";
import "../styles/login.css";

/** Clearly-labelled DEMO credentials — not a real secure login. */
const DEMO_EMAIL = DEMO_KASIR.email;
const DEMO_PASSWORD = DEMO_KASIR.password;

export default function LoginPage() {
  const navigate = useNavigate();
  const shared = useSharedStore();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [branch, setBranch] = useState("Cabang Padang");
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi.");
      return;
    }
    setLoading(true);
    // Frontend demo only: no real authentication. Accepts the demo credential.
    window.setTimeout(() => {
      if (email.trim() === DEMO_EMAIL && password === DEMO_PASSWORD) {
        // Sesi bersama lintas-role (demo); cabang mengikuti akun.
        setSession({
          role: "kasir",
          name: DEMO_KASIR.name,
          initials: DEMO_KASIR.initials,
          branch: DEMO_KASIR.branch,
          branchId: "cabang-padang",
          email: DEMO_EMAIL,
        });
        navigate("/dashboard");
        return;
      }
      const found = shared.authenticate(email, password);
      if (found && found.role === "kasir") {
        setSession(found);
        navigate("/dashboard");
      } else if (found) {
        setLoading(false);
        setError(`Akun ini role ${found.role === "admin" ? "Admin" : "Pemilik"} — masuk via halaman login ${found.role === "admin" ? "Admin (/admin/login)" : "Pemilik (/owner/login)"}.`);
      } else {
        setLoading(false);
        setError("Email atau password salah. Gunakan akun demo di bawah.");
      }
    }, 700);
  }

  return (
    <div className="page-bg auth">
      <div className="auth-card">
        <section className="auth-visual">
          <img src="/assets/login-approved-visual.jpg" alt="Koleksi kacamata Optik Mekar Jaya" />
          <div className="tint" />
          <div className="auth-copy">
            <span className="overline">OPTIK MEKAR JAYA</span>
            <h1>
              Solusi Penglihatan untuk Hidup yang <em>Lebih Baik</em>
            </h1>
            <p>
              Layanan optik modern dengan produk berkualitas dan pelayanan profesional untuk setiap gaya Anda.
            </p>
            <button type="button" className="btn btn-primary">
              Lihat Koleksi
              <ArrowRight size={18} />
            </button>
          </div>
          <div className="auth-tags" aria-hidden="true">
            <span>FRAME</span>
            <span>LENSA</span>
            <span>GAYA</span>
            <span>KEPERCAYAAN</span>
          </div>
        </section>

        <section className="auth-form">
          <div className="brand-row">
            <span className="brand-badge-lg">
              <Glasses size={26} strokeWidth={2.1} />
            </span>
            <b>Optik Mekar Jaya</b>
            <span>Sistem Informasi Optik</span>
          </div>

          <h2>Selamat Datang</h2>
          <p className="sub">Silakan masuk untuk mengakses sistem kasir Optik Mekar Jaya.</p>

          <form onSubmit={onSubmit} noValidate>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email</label>
              <div className="input-wrap">
                <Mail size={18} />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <Lock size={18} />
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan password anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            <div className="field">
              <label htmlFor="branch">Pilih Cabang</label>
              <div className="input-wrap">
                <select id="branch" value={branch} onChange={(e) => setBranch(e.target.value)}>
                  <option>Cabang Padang</option>
                  <option>Cabang Bukittinggi</option>
                </select>
                <span className="chev">
                  <ChevronDown size={18} />
                </span>
              </div>
            </div>

            <div className="form-row">
              <label className="check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Ingat saya
              </label>
              <a className="link-accent" href="#lupa" onClick={(e) => e.preventDefault()}>
                Lupa password?
              </a>
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
              Akun demo (simulasi frontend): {DEMO_EMAIL} / {DEMO_PASSWORD}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
