import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { FiArrowUpRight, FiActivity, FiGrid, FiLayers, FiMap, FiUserCheck, FiUsers } from 'react-icons/fi';
import AppPageHeader from '../components/AppPageHeader';

const statIcons = {
  total_desa: FiMap,
  total_rw: FiGrid,
  total_rt: FiLayers,
  total_keluarga: FiUsers,
  total_penduduk: FiUserCheck,
  total_users: FiUsers,
};

const statLabels = {
  total_desa: 'Total Desa',
  total_rw: 'Total RW',
  total_rt: 'Total RT',
  total_keluarga: 'Total Keluarga',
  total_penduduk: 'Total Penduduk',
  total_users: 'Total Users',
};

const statColors = {
  total_desa: 'bg-emerald-100 text-emerald-700',
  total_rw: 'bg-sky-100 text-sky-700',
  total_rt: 'bg-violet-100 text-violet-700',
  total_keluarga: 'bg-amber-100 text-amber-700',
  total_penduduk: 'bg-teal-100 text-teal-700',
  total_users: 'bg-rose-100 text-rose-700',
};

const roleTitles = {
  superadmin: 'Super Admin',
  desa: 'Admin Desa',
  rw: 'Admin RW',
  rt: 'Admin RT',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard.php').then((res) => {
      setStats(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="app-panel">
        <div className="app-panel-body py-16 text-center text-sm text-slate-500">Memuat data dashboard...</div>
      </div>
    );
  }

  const statKeys = Object.keys(stats).filter((key) => key !== 'aktivitas');
  const totalAktivitas = Object.values(stats.aktivitas || {}).reduce((total, value) => total + Number(value || 0), 0);
  const heroStats = [
    {
      kicker: 'Peran',
      value: roleTitles[user?.role] || 'Operator',
      label: 'Tampilan dashboard menyesuaikan akses kerja akun yang sedang aktif.',
    },
    {
      kicker: 'Penduduk',
      value: stats.total_penduduk || 0,
      label: 'Jumlah penduduk yang saat ini tercatat di wilayah Anda.',
    },
    {
      kicker: 'Aktivitas',
      value: totalAktivitas,
      label: 'Total ringkasan peristiwa warga dari data lahir, mati, datang, dan pindah.',
    },
  ];

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Ringkasan Wilayah"
        title={`Selamat datang, ${user?.nama_lengkap || user?.username}`}
        description="Dashboard ini merangkum data inti wilayah Anda agar pengelolaan desa, RW, RT, keluarga, penduduk, dan aktivitas warga dapat dipantau lebih cepat dari satu layar kerja."
        stats={heroStats}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statKeys.map((key) => {
          const Icon = statIcons[key] || FiActivity;
          const color = statColors[key] || 'bg-slate-100 text-slate-700';

          return (
            <div key={key} className="app-stat-card flex items-center gap-4 p-4">
              <div className={`rounded-xl p-3 ${color}`}>
                <Icon size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-slate-500">{statLabels[key] || key}</p>
                <p className="font-display mt-1 text-3xl text-slate-950">{stats[key]}</p>
              </div>
            </div>
          );
        })}
      </section>

      {stats.aktivitas && (
        <section className="app-panel">
          <div className="app-panel-header">
            <div>
              <h3 className="app-panel-title">Ringkasan Aktivitas</h3>
              <p className="app-panel-description">Pantau distribusi aktivitas utama warga dari pencatatan terbaru di sistem.</p>
            </div>
            <span className="app-chip">Total {totalAktivitas} aktivitas</span>
          </div>

          <div className="app-panel-body">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {['Lahir', 'Mati', 'Pindah', 'Datang'].map((jenis) => (
              <div key={jenis} className="rounded-xl border border-slate-200/80 bg-slate-50/90 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="app-badge app-badge-neutral">{jenis}</span>
                  <FiArrowUpRight className="text-slate-400" size={18} />
                </div>
                <p className="font-display mt-4 text-3xl text-slate-950">{stats.aktivitas[jenis] || 0}</p>
              </div>
            ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
