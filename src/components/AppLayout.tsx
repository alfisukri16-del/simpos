import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, Glasses, LogOut, Search, Menu as MenuIcon } from "lucide-react";
import { DEMO_SESSION, PRIMARY_NAV, SECONDARY_NAV } from "../data/nav";
import { clearSession, getSession } from "../store/session";
import "../styles/layout.css";
import "../styles/admin.css";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  // Search topbar hanya di Dashboard & Transaksi Baru; halaman Kasir lain disembunyikan.
  const showSearch = location.pathname === "/dashboard" || location.pathname === "/transaksi-baru";

  const logout = () => {
    clearSession();
    navigate("/login");
  };
  const session = getSession();

  return (
    <div className="page-bg app-shell">
      <div className={`scrim ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <div className="app-grid">
        <aside className={`sidebar ${open ? "open" : ""}`}>
          <div className="sidebar-brand">
            <span className="brand-badge">
              <Glasses size={24} strokeWidth={2.1} />
            </span>
            <span className="brand-text">
              <b>Optik Mekar Jaya</b>
              <span>Sistem Informasi Optik</span>
            </span>
          </div>

          <nav className="sidebar-nav">
            {PRIMARY_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <item.icon size={19} strokeWidth={2} />
                {item.label}
              </NavLink>
            ))}

            <div className="nav-sep">LAINNYA</div>

            {SECONDARY_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <item.icon size={19} strokeWidth={2} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-foot">
            <b>{DEMO_SESSION.branch}</b>
            <span>{DEMO_SESSION.role}</span>
            <button className="link-action admin-logout" onClick={logout}>
              <LogOut size={14} />
              Keluar
            </button>
          </div>
        </aside>

        <main className="mainpanel">
          <header className="topbar">
            <button className="burger" aria-label="Buka menu" onClick={() => setOpen(true)}>
              <MenuIcon size={20} />
            </button>

            {showSearch ? (
              <label className="search-field">
                <Search size={18} />
                <input type="search" placeholder="Cari produk, pelanggan, atau transaksi..." aria-label="Pencarian" />
                <span className="kbd">Ctrl + K</span>
              </label>
            ) : null}

            <div className="topbar-right">
              <button className="icon-pill" aria-label="Notifikasi">
                <Bell size={19} />
                <span className="dot" />
              </button>
              <div className="profile">
                <span className="avatar">{session?.initials ?? DEMO_SESSION.initials}</span>
                <span className="profile-text">
                  <b>{session?.name ?? DEMO_SESSION.cashierName}</b>
                  <span>{DEMO_SESSION.role}</span>
                </span>
              </div>
            </div>
          </header>

          <div className="main-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
