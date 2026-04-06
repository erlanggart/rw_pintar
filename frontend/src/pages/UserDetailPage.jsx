import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiKey, FiPower, FiSave, FiShield, FiUser } from 'react-icons/fi';
import AccountCredentialNotice from '../components/AccountCredentialNotice';
import AppPageHeader from '../components/AppPageHeader';
import PasswordInput from '../components/PasswordInput';
import api from '../utils/api';

const roleBadgeClass = {
  desa: 'app-badge-amber',
  rw: 'app-badge-sky',
  rt: 'app-badge-emerald',
};

export default function UserDetailPage() {
  const { id } = useParams();
  const [userDetail, setUserDetail] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [credentialNotice, setCredentialNotice] = useState(null);

  const fetchDetail = () => {
    setLoading(true);
    api.get(`/users.php?id=${id}`)
      .then((res) => {
        setUserDetail(res.data);
        setUsername(res.data.username);
      })
      .catch((err) => toast.error(err.response?.data?.error || 'Gagal memuat detail user'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    setSaving(true);

    try {
      const payload = { id: Number(id), username };
      if (password) {
        payload.password = password;
      }

      const res = await api.put('/users.php', payload);
      setUserDetail(res.data.user);
      setUsername(res.data.user.username);
      setPassword('');
      setConfirmPassword('');
      toast.success('Kredensial user berhasil diperbarui');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memperbarui user');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userDetail || !confirm(`Reset password untuk akun ${userDetail.username}?`)) {
      return;
    }

    try {
      const res = await api.post('/users.php', {
        action: 'reset_password',
        id: Number(id),
      });
      setCredentialNotice({
        username: userDetail.username,
        password: res.data.default_password,
        label: `${userDetail.role_label} - ${userDetail.wilayah_label}`,
      });
      toast.success('Password user berhasil direset');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mereset password');
    }
  };

  const handleToggleStatus = async () => {
    if (!userDetail) {
      return;
    }

    const nextStatus = !userDetail.is_active;
    const actionLabel = nextStatus ? 'mengaktifkan' : 'menonaktifkan';
    if (!confirm(`Yakin ingin ${actionLabel} akun ${userDetail.username}?`)) {
      return;
    }

    try {
      await api.put('/users.php', { id: Number(id), is_active: nextStatus });
      setUserDetail((current) => ({ ...current, is_active: nextStatus }));
      toast.success(nextStatus ? 'Akun berhasil diaktifkan' : 'Akun berhasil dinonaktifkan');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memperbarui status user');
    }
  };

  const stats = userDetail ? [
    { kicker: 'Role', value: userDetail.role_label },
    { kicker: 'Status', value: userDetail.is_active ? 'Aktif' : 'Nonaktif' },
  ] : [];

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Detail User"
        title={loading ? 'Memuat data user...' : `Kelola @${userDetail?.username}`}
        description="Superadmin dan admin desa dapat mengubah username, mengganti password manual, atau mereset password akun wilayah dari halaman detail ini."
        stats={stats}
        actions={(
          <Link to="/users" className="app-button-secondary">
            <FiArrowLeft size={16} />
            Kembali ke Daftar
          </Link>
        )}
      />

      <AccountCredentialNotice
        account={credentialNotice}
        title="Password user berhasil direset"
        description="Bagikan kembali kredensial berikut ke pengguna terkait. Password reset selalu kembali ke nilai default sistem."
        onClose={() => setCredentialNotice(null)}
      />

      {loading ? (
        <section className="app-panel">
          <div className="app-panel-body text-center text-sm text-slate-500">Memuat detail user...</div>
        </section>
      ) : userDetail ? (
        <>
          <section className="app-panel">
            <div className="app-panel-header">
              <div>
                <h3 className="app-panel-title">Ringkasan Akun</h3>
                <p className="app-panel-description">Informasi akun wilayah yang sedang Anda kelola.</p>
              </div>
              <span className={`app-badge ${roleBadgeClass[userDetail.role] || 'app-badge-neutral'}`}>{userDetail.role_label}</span>
            </div>

            <div className="app-panel-body grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <FiUser size={14} />
                  Nama Lengkap
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-950">{userDetail.nama_lengkap}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <FiShield size={14} />
                  Wilayah
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-950">{userDetail.wilayah_label}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <FiPower size={14} />
                  Status
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-950">{userDetail.is_active ? 'Aktif' : 'Nonaktif'}</p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="app-panel">
              <div className="app-panel-header">
                <div>
                  <h3 className="app-panel-title">Ubah Username dan Password</h3>
                  <p className="app-panel-description">Kosongkan password jika Anda hanya ingin mengganti username. Username yang sudah dipakai akan ditolak otomatis.</p>
                </div>
              </div>

              <div className="app-panel-body">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="app-label">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="app-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="app-label">Password Baru</label>
                    <PasswordInput
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="app-input"
                      placeholder="Kosongkan jika tidak diubah"
                    />
                  </div>

                  <div>
                    <label className="app-label">Konfirmasi Password Baru</label>
                    <PasswordInput
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="app-input"
                      placeholder="Kosongkan jika tidak diubah"
                    />
                  </div>

                  <button type="submit" disabled={saving} className="app-button-primary">
                    <FiSave size={16} />
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </form>
              </div>
            </section>

            <section className="app-panel">
              <div className="app-panel-header">
                <div>
                  <h3 className="app-panel-title">Tindakan Cepat</h3>
                  <p className="app-panel-description">Reset password ke default atau atur status aktif akun dari panel ini.</p>
                </div>
              </div>

              <div className="app-panel-body space-y-3">
                <button type="button" onClick={handleResetPassword} className="app-button-secondary w-full justify-center">
                  <FiKey size={16} />
                  Reset Password Default
                </button>
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  className={`app-button-secondary w-full justify-center ${userDetail.is_active ? 'border-rose-200 text-rose-700 hover:border-rose-300 hover:text-rose-800' : 'border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:text-emerald-800'}`}
                >
                  <FiPower size={16} />
                  {userDetail.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                </button>
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}