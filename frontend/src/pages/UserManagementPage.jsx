import { useDeferredValue, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { FiKey, FiPower, FiRefreshCw, FiSearch, FiShield } from 'react-icons/fi';
import AccountCredentialNotice from '../components/AccountCredentialNotice';
import AppPageHeader from '../components/AppPageHeader';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const roleBadgeClass = {
  desa: 'app-badge-amber',
  rw: 'app-badge-sky',
  rt: 'app-badge-emerald',
};

const roleFilterOptions = {
  superadmin: [
    { value: 'all', label: 'Semua' },
    { value: 'desa', label: 'Admin Desa' },
    { value: 'rw', label: 'Admin RW' },
    { value: 'rt', label: 'Admin RT' },
  ],
  desa: [
    { value: 'all', label: 'Semua' },
    { value: 'rw', label: 'Admin RW' },
    { value: 'rt', label: 'Admin RT' },
  ],
  rw: [
    { value: 'all', label: 'Semua' },
    { value: 'rt', label: 'Admin RT' },
  ],
};

function UserRowActions({ item, currentRole, onResetPassword, onToggleActive }) {
  return (
    <div className="flex flex-wrap gap-2">
      {currentRole !== 'rw' && (
        <Link to={`/users/${item.id}`} className="app-button-secondary px-4 py-2.5 text-xs sm:text-sm">
          Detail User
        </Link>
      )}
      <button
        type="button"
        onClick={() => onResetPassword(item)}
        className="app-button-secondary px-4 py-2.5 text-xs sm:text-sm"
      >
        <FiKey size={15} />
        Reset Password
      </button>
      <button
        type="button"
        onClick={() => onToggleActive(item)}
        className={`app-button-secondary px-4 py-2.5 text-xs sm:text-sm ${item.is_active ? 'border-rose-200 text-rose-700 hover:border-rose-300 hover:text-rose-800' : 'border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:text-emerald-800'}`}
      >
        <FiPower size={15} />
        {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
      </button>
    </div>
  );
}

export default function UserManagementPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [credentialNotice, setCredentialNotice] = useState(null);
  const deferredSearch = useDeferredValue(search);
  const filters = roleFilterOptions[user?.role] || roleFilterOptions.rw;

  const fetchData = () => {
    setLoading(true);
    api
      .get('/users.php')
      .then((res) => setData(res.data))
      .catch(() => toast.error('Gagal memuat data pengguna'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredData = data.filter((item) => {
    const matchesRole = roleFilter === 'all' || item.role === roleFilter;
    const matchesSearch =
      normalizedSearch === '' ||
      item.username.toLowerCase().includes(normalizedSearch) ||
      item.nama_lengkap.toLowerCase().includes(normalizedSearch) ||
      item.wilayah_label.toLowerCase().includes(normalizedSearch);

    return matchesRole && matchesSearch;
  });

  const stats = [
    {
      kicker: 'Total Akun',
      value: data.length,
    },
    {
      kicker: 'Akun Aktif',
      value: data.filter((item) => item.is_active).length,
    },
    {
      kicker: 'Akun Nonaktif',
      value: data.filter((item) => !item.is_active).length,
    },
  ];

  const handleResetPassword = async (item) => {
    if (!confirm(`Reset password untuk akun ${item.username}?`)) {
      return;
    }

    try {
      const res = await api.post('/users.php', {
        action: 'reset_password',
        id: item.id,
      });

      setCredentialNotice({
        username: item.username,
        password: res.data.default_password,
        label: `${item.role_label} - ${item.wilayah_label}`,
      });
      toast.success(`Password ${item.username} berhasil direset`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mereset password');
    }
  };

  const handleToggleActive = async (item) => {
    const nextStatus = !item.is_active;
    const actionLabel = nextStatus ? 'mengaktifkan' : 'menonaktifkan';

    if (!confirm(`Yakin ingin ${actionLabel} akun ${item.username}?`)) {
      return;
    }

    try {
      await api.put('/users.php', {
        id: item.id,
        is_active: nextStatus,
      });
      toast.success(nextStatus ? 'Akun berhasil diaktifkan' : 'Akun berhasil dinonaktifkan');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memperbarui status akun');
    }
  };

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Manajemen Akses"
        title="Kelola Akun Wilayah"
        description="Akun desa, RW, dan RT dibuat otomatis saat struktur wilayah ditambahkan. Halaman ini dipakai untuk meninjau akun, mereset password, dan mengatur status aktif sesuai wilayah yang Anda kelola."
        stats={stats}
        actions={(
          <button type="button" onClick={fetchData} className="app-button-secondary">
            <FiRefreshCw size={17} />
            Muat Ulang
          </button>
        )}
      />

      <AccountCredentialNotice
        account={credentialNotice}
        title="Password akun berhasil direset"
        description="Sampaikan kembali kredensial ini ke petugas terkait. Password reset selalu kembali ke nilai standar sistem."
        onClose={() => setCredentialNotice(null)}
      />

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="app-panel-title">Alur Pembuatan Akun</h3>
            <p className="app-panel-description">Tidak perlu membuat akun RW atau RT secara manual. Tambah data wilayah terlebih dahulu, lalu akun login akan dibuat otomatis oleh sistem.</p>
          </div>
          <span className="app-chip">Password default: password123</span>
        </div>

        <div className="app-panel-body grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tambah Wilayah</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Saat desa, RW, atau RT baru disimpan, sistem langsung membuat akun login yang terhubung ke wilayah tersebut.</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sinkron Otomatis</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Perubahan nama atau nomor wilayah akan ikut memperbarui username akun terkait agar tetap konsisten.</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Kontrol Akses</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Jika akun bermasalah, Anda bisa reset password ke nilai standar atau nonaktifkan akses tanpa menghapus struktur wilayahnya.</p>
          </div>
        </div>
      </section>

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="app-panel-title">Daftar Akun</h3>
            <p className="app-panel-description">Gunakan pencarian dan filter role untuk menemukan akun wilayah yang perlu ditindaklanjuti.</p>
          </div>
          <span className="app-chip">{filteredData.length} akun</span>
        </div>

        <div className="app-panel-body space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full lg:max-w-md">
              <FiSearch size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari username, nama lengkap, atau wilayah"
                className="app-search pl-11"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {filters.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRoleFilter(option.value)}
                  className={`app-filter-button ${roleFilter === option.value ? 'app-filter-button-active' : 'app-filter-button-idle'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 lg:hidden">
            {loading ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-8 text-center text-sm text-slate-500">
                Memuat data akun...
              </div>
            ) : filteredData.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-8 text-center text-sm text-slate-500">
                Tidak ada akun yang sesuai dengan filter saat ini.
              </div>
            ) : (
              filteredData.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-950">{item.username}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.nama_lengkap}</p>
                    </div>
                    <span className={`app-badge ${roleBadgeClass[item.role] || 'app-badge-neutral'}`}>
                      {item.role_label}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Wilayah</p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">{item.wilayah_label}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p>
                      <div className="mt-1">
                        <span className={`app-badge ${item.is_active ? 'app-badge-emerald' : 'app-badge-rose'}`}>
                          {item.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <UserRowActions item={item} currentRole={user?.role} onResetPassword={handleResetPassword} onToggleActive={handleToggleActive} />
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="hidden lg:block app-table-shell">
            <div className="app-table-scroll">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Nama Lengkap</th>
                    <th>Role</th>
                    <th>Wilayah</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="app-empty-row">Memuat data akun...</td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="app-empty-row">Tidak ada akun yang sesuai dengan filter saat ini.</td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.id}>
                        <td className="font-semibold text-slate-950">{item.username}</td>
                        <td>{item.nama_lengkap}</td>
                        <td>
                          <span className={`app-badge ${roleBadgeClass[item.role] || 'app-badge-neutral'}`}>
                            {item.role_label}
                          </span>
                        </td>
                        <td className="max-w-[280px] leading-6 text-slate-600">{item.wilayah_label}</td>
                        <td>
                          <span className={`app-badge ${item.is_active ? 'app-badge-emerald' : 'app-badge-rose'}`}>
                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td>
                          <UserRowActions item={item} currentRole={user?.role} onResetPassword={handleResetPassword} onToggleActive={handleToggleActive} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}