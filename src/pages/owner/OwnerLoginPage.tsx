import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Glasses, Lock, Mail } from "lucide-react";
import { DEMO_OWNER, ownerSession, setSession } from "../../store/session";
import { useSharedStore } from "../../store/sharedStore";
import "../../styles/login.css";
import "../../styles/admin.css";

/** Login Pemilik — struktur & login.css IDENTIK dengan Login Kasir/Admin. */
export default function OwnerLoginPage() {
  const navigate = useNavigate();
  const shared = useSharedStore();
  const [email, setEmail] = useState(DEMO_OWNER.email);
  const [password, setPassword] = useState(DEMO_OWNER.password);
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
    // Demo frontend: bukan autentikasi nyata. Hanya akun demo Pemilik yang diterima.
    window.setTimeout(() => {
      if (email.trim() === DEMO_OWNER.email && password === DEMO_OWNER.password) {
        setSession(ownerSession());
        navigate("/owner/dashboard");
        return;
      }
      const found = shared.authenticate(email, password);
      if (found && found.role === "pemilik") {
        setSession(found);
        navigate("/owner/dashboard");
      } else if (found) {
        setLoading(false);
        setError(`Akun ini role ${found.role === "kasir" ? "Kasir" : "Admin"} — masuk via halaman login yang sesuai.`);
      } else {
        setLoading(false);
        setError("Email atau password salah. Gunakan akun demo Pemilik di bawah.");
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

          <h2>Masuk sebagai Pemilik</h2>
          <p className="sub">Pantau seluruh lokasi dan tentukan alokasi distribusi.</p>

          <form onSubmit={onSubmit} noValidate>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            <div className="field">
              <label htmlFor="owner-email">Email</label>
              <div className="input-wrap">
                <Mail size={18} />
                <input
                  id="owner-email"
                  type="email"
                  autoComplete="username"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="owner-password">Password</label>
              <div className="input-wrap">
                <Lock size={18} />
                <input
                  id="owner-password"
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
              <span className="branch-chip" aria-label="Akses seluruh cabang dan pusat">
                <Glasses size={16} />
                Seluruh cabang + Pusat — tanpa batas lokasi
              </span>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="auth-help">
            <b>Butuh bantuan masuk?</b>
            <span>Hubungi tim IT.</span>
            <span className="demo-foot">
              Akun demo (simulasi frontend): {DEMO_OWNER.email} / {DEMO_OWNER.password}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
