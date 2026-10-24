import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Glasses, Lock, Mail } from "lucide-react";
import { ADMIN_SESSION_KEY, DEMO_ADMIN } from "../../data/admin";
import { adminSession, setSession } from "../../store/session";
import { useSharedStore } from "../../store/sharedStore";
import "../../styles/login.css";
import "../../styles/admin.css";

/** Login Admin — struktur & login.css IDENTIK dengan Login Kasir (tidak diubah). */
export default function AdminLoginPage() {
  const navigate = useNavigate();
  const shared = useSharedStore();
  const [email, setEmail] = useState(DEMO_ADMIN.email);
  const [password, setPassword] = useState(DEMO_ADMIN.password);
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
    // Demo frontend: bukan autentikasi nyata. Hanya akun demo Admin yang diterima.
    window.setTimeout(() => {
      if (email.trim() === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
        setSession(adminSession());
        try {
          localStorage.removeItem(ADMIN_SESSION_KEY);
        } catch {
          /* abaikan */
        }
        navigate("/admin/dashboard");
        return;
      }
      const found = shared.authenticate(email, password);
      if (found && found.role === "admin") {
        setSession(found);
        navigate("/admin/dashboard");
      } else if (found) {
        setLoading(false);
        setError(`Akun ini role ${found.role === "kasir" ? "Kasir" : "Pemilik"} — masuk via halaman login yang sesuai.`);
      } else {
        setLoading(false);
        setError("Email atau password salah. Gunakan akun demo Admin di bawah.");
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

          <h2>Masuk sebagai Admin Cabang</h2>
          <p className="sub">Kelola produk, stok, dan pesanan untuk {DEMO_ADMIN.branch}.</p>

          <form onSubmit={onSubmit} noValidate>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            <div className="field">
              <label htmlFor="admin-email">Email</label>
              <div className="input-wrap">
                <Mail size={18} />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="admin-password">Password</label>
              <div className="input-wrap">
                <Lock size={18} />
                <input
                  id="admin-password"
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
              <span className="branch-chip" aria-label={`Cabang ${DEMO_ADMIN.branch}`}>
                <Glasses size={16} />
                {DEMO_ADMIN.branch} — tetap, tidak dapat diganti
              </span>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="auth-help">
            <b>Butuh bantuan masuk?</b>
            <span>Hubungi pemilik sistem atau tim IT.</span>
            <span className="demo-foot">
              Akun demo (simulasi frontend): {DEMO_ADMIN.email} / {DEMO_ADMIN.password}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
