import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiLock, FiShield, FiUsers } from 'react-icons/fi';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Username dan password harus diisi');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Login berhasil!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-navy)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="landing-grid absolute inset-0 opacity-15" />
      <div className="landing-orb landing-orb-sand -left-16 top-16 h-52 w-52" />
      <div className="landing-orb landing-orb-teal -right-14 bottom-12 h-64 w-64" />

      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-white/10 bg-white/10 shadow-[0_32px_100px_-48px_rgba(15,23,42,0.9)] backdrop-blur-sm lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden lg:flex flex-col justify-between bg-slate-950/40 p-10 text-white">
            <div>
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                Portal Administrasi
              </span>
              <h1 className="font-display mt-6 text-5xl leading-tight text-white">
                Kelola data warga dengan alur yang lebih tertata.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
                RW Pintar menyatukan pengelolaan desa, RW, RT, keluarga, penduduk, dan aktivitas warga dalam satu dashboard yang mudah dipantau.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: FiShield, title: 'Hak akses berjenjang', description: 'Setiap admin hanya melihat modul yang relevan dengan wilayah kerjanya.' },
                { icon: FiUsers, title: 'Data lebih konsisten', description: 'Pendataan keluarga dan penduduk tersimpan lebih rapi dan mudah ditelusuri.' },
                { icon: FiLock, title: 'Masuk dengan aman', description: 'Akses aplikasi terfokus untuk operator yang memang berwenang.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-3xl border border-white/10 bg-white/10 p-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-white/10 p-3 text-amber-300">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-white">{item.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-300">{item.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[var(--color-paper)] px-6 py-8 sm:px-10 lg:px-12 lg:py-10">
            <div className="mb-8 flex items-center justify-between">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                <FiArrowLeft size={16} />
                Kembali
              </Link>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Akses Admin
              </span>
            </div>

            <div className="mb-8 lg:hidden">
              <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                RW Pintar
              </span>
              <h1 className="font-display mt-4 text-4xl text-slate-950">Masuk ke dashboard warga</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Gunakan akun admin Anda untuk mulai mengelola data wilayah dan aktivitas penduduk.
              </p>
            </div>

            <div className="mb-8 hidden lg:block">
              <h1 className="font-display text-4xl text-slate-950">Masuk ke RW Pintar</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Akses dashboard untuk mengelola data wilayah, keluarga, penduduk, dan aktivitas harian warga.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-amber-100"
                  placeholder="Masukkan username"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-amber-100"
                  placeholder="Masukkan password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
              </button>
            </form>

            {/* <div className="mt-6 rounded-3xl bg-slate-900 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Akun Demo
              </p>
              <p className="mt-2 text-sm text-slate-200">
                Gunakan password: <span className="font-semibold text-white">password123</span>
              </p>
              <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/5 px-4 py-3">Super Admin: <span className="font-semibold text-white">superadmin</span></div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">Admin Desa: <span className="font-semibold text-white">admin_desa</span></div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">Admin RW: <span className="font-semibold text-white">admin_rw</span></div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">Admin RT: <span className="font-semibold text-white">admin_rt</span></div>
              </div>
            </div> */}

            {/* <p className="mt-5 text-xs leading-5 text-slate-500">
              Hanya operator yang berwenang yang diperkenankan mengakses dashboard administrasi.
            </p> */}
          </div>
        </div>
      </div>
    </div>
  );
}
