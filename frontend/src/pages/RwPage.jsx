import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import AccountCredentialNotice from '../components/AccountCredentialNotice';
import AppPageHeader from '../components/AppPageHeader';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const emptyForm = {
  desa_id: '',
  nomor_rw: '',
  nama_ketua: '',
};

export default function RwPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [desaList, setDesaList] = useState([]);
  const [selectedDesaId, setSelectedDesaId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [credentialNotice, setCredentialNotice] = useState(null);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (user.role === 'superadmin' && selectedDesaId) {
      params.set('desa_id', selectedDesaId);
    }

    const requestUrl = params.toString() ? `/rw.php?${params.toString()}` : '/rw.php';
    api.get(requestUrl).then((res) => setData(res.data)).catch(() => toast.error('Gagal memuat data')).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user.role === 'superadmin') {
      api.get('/desa.php').then((res) => setDesaList(res.data)).catch(() => {});
    }
  }, [user.role]);

  useEffect(() => {
    fetchData();
  }, [user.role, selectedDesaId]);

  const openCreateForm = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      desa_id: user.role === 'superadmin' ? selectedDesaId : emptyForm.desa_id,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        const res = await api.put('/rw.php', { ...form, id: editing.id });
        toast.success(res.data?.username ? `RW berhasil diupdate. Username akun: ${res.data.username}` : 'RW berhasil diupdate');
      } else {
        const res = await api.post('/rw.php', form);
        setCredentialNotice({
          username: res.data.username,
          password: res.data.default_password,
          label: `RW ${form.nomor_rw}`,
        });
        toast.success('RW berhasil ditambahkan');
      }

      closeForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus RW ini?')) return;

    try {
      await api.delete(`/rw.php?id=${id}`);
      toast.success('RW berhasil dihapus');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus');
    }
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      desa_id: String(item.desa_id),
      nomor_rw: item.nomor_rw,
      nama_ketua: item.nama_ketua || '',
    });
    setShowForm(true);
  };

  const stats = [
    {
      kicker: 'Total RW',
      value: data.length,
      label: 'Seluruh RW yang telah tersusun pada wilayah aktif di sistem.',
    },
    {
      kicker: 'Ketua RW',
      value: data.filter((item) => item.nama_ketua).length,
      label: 'RW yang sudah memiliki data ketua atau penanggung jawab wilayah.',
    },
    {
      kicker: 'Cakupan Desa',
      value: new Set(data.map((item) => item.nama_desa).filter(Boolean)).size,
      label: 'Jumlah desa yang saat ini memiliki struktur RW tercatat.',
    },
  ];

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Struktur RW"
        title="Kelola Data RW"
        description="Atur susunan RW per desa dengan tampilan yang lebih tenang dan mudah dipantau, termasuk identitas ketua wilayah dan keterhubungan ke desa induk."
        stats={stats}
        actions={(
          <>
            <button type="button" onClick={openCreateForm} className="app-button-primary">
              <FiPlus size={18} />
              Tambah RW
            </button>
            {showForm && (
              <button type="button" onClick={closeForm} className="app-button-secondary">
                <FiX size={18} />
                Tutup Form
              </button>
            )}
          </>
        )}
      />

      <AccountCredentialNotice
        account={credentialNotice}
        title="Akun admin RW berhasil dibuat"
        description="Simpan kredensial ini untuk petugas RW. Password awal bisa direset kembali dari halaman Manajemen User jika diperlukan."
        onClose={() => setCredentialNotice(null)}
      />

      {showForm && (
        <section className="app-panel">
          <div className="app-panel-header">
            <div>
              <h3 className="app-panel-title">{editing ? 'Edit Data RW' : 'Tambah RW Baru'}</h3>
              <p className="app-panel-description">Lengkapi informasi wilayah RW dan pastikan relasi ke desa sudah benar sebelum data disimpan.</p>
            </div>
            <span className="app-chip">{editing ? 'Mode edit' : 'Form baru'}</span>
          </div>

          <div className="app-panel-body">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {user.role === 'superadmin' && (
                <div>
                  <label className="app-label">Desa *</label>
                  <select
                    value={form.desa_id}
                    onChange={(e) => setForm({ ...form, desa_id: e.target.value })}
                    className="app-select"
                    required
                  >
                    <option value="">Pilih desa</option>
                    {desaList.map((desa) => (
                      <option key={desa.id} value={desa.id}>{desa.nama_desa}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="app-label">Nomor RW *</label>
                <input
                  type="text"
                  value={form.nomor_rw}
                  onChange={(e) => setForm({ ...form, nomor_rw: e.target.value })}
                  className="app-input"
                  placeholder="001"
                  required
                />
              </div>

              <div>
                <label className="app-label">Nama Ketua</label>
                <input
                  type="text"
                  value={form.nama_ketua}
                  onChange={(e) => setForm({ ...form, nama_ketua: e.target.value })}
                  className="app-input"
                  placeholder="Nama ketua RW"
                />
              </div>

              <div className="app-inline-actions md:col-span-3">
                <button type="submit" className="app-button-primary">Simpan Data</button>
                <button type="button" onClick={closeForm} className="app-button-secondary">Batal</button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="app-panel-title">Daftar RW</h3>
            <p className="app-panel-description">Daftar RW yang dapat Anda kelola sesuai akses peran yang sedang aktif.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {user.role === 'superadmin' && (
              <div className="min-w-[220px]">
                <select
                  value={selectedDesaId}
                  onChange={(e) => setSelectedDesaId(e.target.value)}
                  className="app-select uppercase"
                >
                  <option value="">Semua desa</option>
                  {desaList.map((desa) => (
                    <option key={desa.id} value={desa.id}>{desa.nama_desa}</option>
                  ))}
                </select>
              </div>
            )}
            <span className="app-chip">{data.length} data</span>
          </div>
        </div>

        <div className="app-table-scroll">
          <table className="app-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nomor RW</th>
                <th>Nama Ketua</th>
                <th>Desa</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="app-empty-row">Memuat data RW...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="5" className="app-empty-row">Belum ada data RW.</td>
                </tr>
              ) : data.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td className="font-semibold text-slate-900">RW {item.nomor_rw}</td>
                  <td>{item.nama_ketua || '-'}</td>
                  <td>
                    <span className="app-badge app-badge-neutral">{item.nama_desa}</span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="app-icon-button text-sky-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                        title="Edit RW"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="app-icon-button text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        title="Hapus RW"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
