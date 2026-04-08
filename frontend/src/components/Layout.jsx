import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiMap, FiUsers, FiGrid, FiLayers, FiLogOut, FiMenu, FiX, FiSunrise, FiSunset, FiNavigation, FiMapPin, FiShield, FiSettings, FiFileText } from 'react-icons/fi';

const menuItems = {
  superadmin: [
    { path: '/dashboard', label: 'Dashboard', mobileLabel: 'Dashboard', icon: FiHome },
    { path: '/desa', label: 'Kelola Desa', icon: FiMap },
    { path: '/rw', label: 'Data RW', icon: FiGrid },
    { path: '/rt', label: 'Data RT', icon: FiLayers },
    { path: '/keluarga', label: 'Data Keluarga', icon: FiUsers },
    { path: '/penduduk', label: 'Data Penduduk', icon: FiUsers },
    { path: '/users', label: 'Manajemen User', icon: FiShield },
    { path: '/aktivitas/lahir', label: 'Kelahiran', mobileLabel: 'Lahir', icon: FiSunrise },
    { path: '/aktivitas/mati', label: 'Kematian', mobileLabel: 'Mati', icon: FiSunset },
    { path: '/aktivitas/pindah', label: 'Pindah', mobileLabel: 'Pindah', icon: FiNavigation },
    { path: '/aktivitas/datang', label: 'Kedatangan', mobileLabel: 'Datang', icon: FiMapPin },
  ],
  desa: [
    { path: '/dashboard', label: 'Dashboard', mobileLabel: 'Dashboard', icon: FiHome },
    { path: '/rw', label: 'Kelola RW', icon: FiGrid },
    { path: '/rt', label: 'Data RT', icon: FiLayers },
    { path: '/keluarga', label: 'Data Keluarga', icon: FiUsers },
    { path: '/penduduk', label: 'Data Penduduk', icon: FiUsers },
    { path: '/users', label: 'Manajemen User', icon: FiShield },
    { path: '/aktivitas/lahir', label: 'Kelahiran', mobileLabel: 'Lahir', icon: FiSunrise },
    { path: '/aktivitas/mati', label: 'Kematian', mobileLabel: 'Mati', icon: FiSunset },
    { path: '/aktivitas/pindah', label: 'Pindah', mobileLabel: 'Pindah', icon: FiNavigation },
    { path: '/aktivitas/datang', label: 'Kedatangan', mobileLabel: 'Datang', icon: FiMapPin },
  ],
  rw: [
    { path: '/dashboard', label: 'Dashboard', mobileLabel: 'Dashboard', icon: FiHome },
    { path: '/rt', label: 'Kelola RT', icon: FiLayers },
    { path: '/keluarga', label: 'Data Keluarga', icon: FiUsers },
    { path: '/penduduk', label: 'Data Penduduk', icon: FiUsers },
    { path: '/users', label: 'Manajemen User', icon: FiShield },
    { path: '/aktivitas/lahir', label: 'Kelahiran', mobileLabel: 'Lahir', icon: FiSunrise },
    { path: '/aktivitas/mati', label: 'Kematian', mobileLabel: 'Mati', icon: FiSunset },
    { path: '/aktivitas/pindah', label: 'Pindah', mobileLabel: 'Pindah', icon: FiNavigation },
    { path: '/aktivitas/datang', label: 'Kedatangan', mobileLabel: 'Datang', icon: FiMapPin },
  ],
  rt: [
    { path: '/dashboard', label: 'Dashboard', mobileLabel: 'Dashboard', icon: FiHome },
    { path: '/keluarga', label: 'Data Keluarga', icon: FiUsers },
    { path: '/penduduk', label: 'Data Penduduk', icon: FiUsers },
    { path: '/surat-pengantar', label: 'Surat Pengantar', mobileLabel: 'Surat', icon: FiFileText },
    { path: '/aktivitas/lahir', label: 'Kelahiran', mobileLabel: 'Lahir', icon: FiSunrise },
    { path: '/aktivitas/mati', label: 'Kematian', mobileLabel: 'Mati', icon: FiSunset },
    { path: '/aktivitas/pindah', label: 'Pindah', mobileLabel: 'Pindah', icon: FiNavigation },
    { path: '/aktivitas/datang', label: 'Kedatangan', mobileLabel: 'Datang', icon: FiMapPin },
  ],
};

const roleLabels = {
  superadmin: 'Super Admin',
  desa: 'Admin Desa',
  rw: 'Admin RW',
  rt: 'Admin RT',
};

const mobilePrimaryOrder = [
  '/aktivitas/lahir',
  '/aktivitas/mati',
  '/dashboard',
  '/aktivitas/pindah',
  '/aktivitas/datang',
];

function isItemActive(pathname, itemPath) {
  if (itemPath === '/dashboard') {
    return pathname === itemPath;
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

function NavLinkItem({ item, pathname, onClick, compact = false }) {
  const Icon = item.icon;
  const active = isItemActive(pathname, item.path);

  if (compact) {
    return (
      <Link
        to={item.path}
        onClick={onClick}
        className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[22px] px-2 py-2.5 text-[11px] font-semibold transition ${active ? 'bg-slate-950 text-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.75)]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <span className={`grid h-9 w-9 place-items-center rounded-full ${active ? 'bg-white/12 text-white' : 'bg-slate-100 text-slate-600'}`}>
          <Icon size={17} />
        </span>
        <span className="truncate">{item.mobileLabel || item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${active ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/10' : 'text-slate-700 hover:bg-white/85 hover:text-slate-950'}`}
    >
      <div className={`rounded-xl p-2 ${active ? 'bg-white/12 text-white' : 'bg-white text-slate-600 shadow-sm group-hover:bg-slate-100 group-hover:text-slate-900'}`}>
        <Icon size={16} />
      </div>
      <span>{item.label}</span>
    </Link>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const items = menuItems[user?.role] || [];
  const desktopItems = items.filter((item) => item.path === '/dashboard' || !mobilePrimaryOrder.includes(item.path));
  const activityItems = items.filter((item) => item.path.startsWith('/aktivitas'));
  const mobilePrimaryItems = mobilePrimaryOrder
    .map((path) => items.find((item) => item.path === path))
    .filter(Boolean);
  const mobileDrawerItems = desktopItems.filter((item) => item.path !== '/dashboard');

  return (
    <div className="relative min-h-screen text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(13,148,136,0.1),transparent_32%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 landing-grid opacity-20" />

      <aside className={`fixed inset-y-3 left-3 z-40 flex w-[286px] flex-col overflow-hidden rounded-[32px] border border-slate-200/70 bg-[rgba(255,250,240,0.92)] text-slate-900 shadow-[0_32px_90px_-45px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
        <div className="border-b border-slate-200/70 px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-sm font-bold text-amber-600">
                RW
              </div>
              <div>
                <h1 className="font-display text-2xl text-slate-950">RW Pintar</h1>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">{roleLabels[user?.role]}</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 lg:hidden"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="hidden lg:block">
            <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Menu</div>
            <div className="space-y-1.5">
              {desktopItems.map((item) => (
                <NavLinkItem key={item.path} item={item} pathname={location.pathname} onClick={() => setSidebarOpen(false)} />
              ))}
            </div>

            <div className="mb-3 mt-5 px-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Aktivitas Warga</div>
            <div className="space-y-1.5">
              {activityItems.map((item) => (
                <NavLinkItem key={item.path} item={item} pathname={location.pathname} onClick={() => setSidebarOpen(false)} />
              ))}
            </div>
          </div>

          <div className="lg:hidden">
            <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Fitur Lainnya</div>
            <div className="space-y-1.5">
              {mobileDrawerItems.length > 0 ? (
                mobileDrawerItems.map((item) => (
                  <NavLinkItem key={item.path} item={item} pathname={location.pathname} onClick={() => setSidebarOpen(false)} />
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 text-sm text-slate-600">
                  Tidak ada menu tambahan untuk peran ini.
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="border-t border-slate-200/70 p-4">
          <div className="mb-4 rounded-[24px] border border-slate-200 bg-white/80 p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">{user?.nama_lengkap || user?.username}</p>
            <p className="mt-1 text-sm text-slate-600">{roleLabels[user?.role]}</p>
            <p className="mt-1 text-sm text-slate-500">@{user?.username}</p>
            <Link to="/profile" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950">
              <FiSettings size={15} />
              Ubah profil
            </Link>
          </div>
          <button onClick={logout} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white">
            <span className="flex items-center gap-3">
              <FiLogOut size={18} />
              Keluar
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Exit</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex min-h-screen flex-col lg:pl-[306px]">
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-[rgba(255,253,248,0.8)] backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden">
                <FiMenu size={20} />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{roleLabels[user?.role]}</p>
                <h1 className="font-display text-2xl text-slate-950">Dashboard Operasional</h1>
              </div>
            </div>

            <div className="hidden rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm sm:inline-flex">
              {user?.nama_lengkap || user?.username}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 pb-28 sm:px-6 sm:pb-32 lg:px-8 lg:py-8 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>

        <nav className="fixed inset-x-3 bottom-3 z-30 lg:hidden">
          <div className="grid grid-cols-5 gap-2 rounded-[30px] border border-white/70 bg-[rgba(255,253,248,0.94)] p-2 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.4)] backdrop-blur-xl">
            {mobilePrimaryItems.map((item) => (
              <NavLinkItem
                key={item.path}
                item={item}
                pathname={location.pathname}
                onClick={() => setSidebarOpen(false)}
                compact
              />
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
