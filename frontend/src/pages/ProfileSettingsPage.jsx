import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiLock, FiSave, FiShield, FiUser } from 'react-icons/fi';
import AppPageHeader from '../components/AppPageHeader';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const emptyPasswordForm = {
  current_password: '',
  new_password: '',
  confirm_password: '',
};

const roleLabels = {
  superadmin: 'Super Admin',
  desa: 'Admin Desa',
  rw: 'Admin RW',
  rt: 'Admin RT',
};

export default function ProfileSettingsPage() {
  const { user, setCurrentUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setSavingUsername(true);

    try {
      const res = await api.put('/profile.php', { username });
      setCurrentUser(res.data.user);
      toast.success('Username berhasil diperbarui');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memperbarui username');
    } finally {
      setSavingUsername(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Konfirmasi password baru tidak cocok');
      return;
    }

    setSavingPassword(true);

    try {
      const res = await api.put('/profile.php', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setCurrentUser(res.data.user);
      setPasswordForm(emptyPasswordForm);
      toast.success('Password berhasil diperbarui');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memperbarui password');
    } finally {
      setSavingPassword(false);
    }
  };

  const stats = [
    { kicker: 'Role', value: roleLabels[user?.role] || '-' },
    { kicker: 'Username Aktif', value: user?.username || '-' },
  ];

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Akun Saya"
        title="Pengaturan Profil"
        description="Atur username login Anda sendiri dan ganti password kapan pun dibutuhkan. Username baru akan langsung diperiksa agar tidak bentrok dengan akun lain."
        stats={stats}
      />

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="app-panel-title">Informasi Akun</h3>
            <p className="app-panel-description">Profil dasar akun yang sedang aktif di sesi ini.</p>
          </div>
          <span className="app-chip">@{user?.username}</span>
        </div>

        <div className="app-panel-body grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <FiUser size={14} />
              Nama
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-950">{user?.nama_lengkap || '-'}</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <FiShield size={14} />
              Role
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-950">{roleLabels[user?.role] || '-'}</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <FiLock size={14} />
              Username
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-950">@{user?.username}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="app-panel">
          <div className="app-panel-header">
            <div>
              <h3 className="app-panel-title">Ubah Username</h3>
              <p className="app-panel-description">Username harus unik. Jika sudah dipakai akun lain, perubahan akan ditolak.</p>
            </div>
          </div>

          <div className="app-panel-body">
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label className="app-label">Username Baru</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="app-input"
                  placeholder="Masukkan username baru"
                  required
                />
              </div>

              <button type="submit" disabled={savingUsername} className="app-button-primary">
                <FiSave size={16} />
                {savingUsername ? 'Menyimpan...' : 'Simpan Username'}
              </button>
            </form>
          </div>
        </section>

        <section className="app-panel">
          <div className="app-panel-header">
            <div>
              <h3 className="app-panel-title">Ubah Password</h3>
              <p className="app-panel-description">Masukkan password saat ini untuk mengamankan perubahan password login Anda.</p>
            </div>
          </div>

          <div className="app-panel-body">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="app-label">Password Saat Ini</label>
                <PasswordInput
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm((current) => ({ ...current, current_password: e.target.value }))}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="app-label">Password Baru</label>
                <PasswordInput
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm((current) => ({ ...current, new_password: e.target.value }))}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="app-label">Konfirmasi Password Baru</label>
                <PasswordInput
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm((current) => ({ ...current, confirm_password: e.target.value }))}
                  className="app-input"
                  required
                />
              </div>

              <button type="submit" disabled={savingPassword} className="app-button-primary">
                <FiLock size={16} />
                {savingPassword ? 'Menyimpan...' : 'Simpan Password'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}