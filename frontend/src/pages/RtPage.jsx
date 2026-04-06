import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import AccountCredentialNotice from '../components/AccountCredentialNotice';
import AppPageHeader from '../components/AppPageHeader';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const emptyForm = {
  rw_id: '',
  nomor_rt: '',
  nama_ketua: '',
};

export default function RtPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [desaList, setDesaList] = useState([]);
  const [rwList, setRwList] = useState([]);
  const [selectedDesaId, setSelectedDesaId] = useState('');
  const [selectedRwId, setSelectedRwId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formDesaId, setFormDesaId] = useState('');
  const [credentialNotice, setCredentialNotice] = useState(null);

  const filteredRwOptions = user.role === 'superadmin' && selectedDesaId
    ? rwList.filter((rw) => String(rw.desa_id) === String(selectedDesaId))
    : rwList;

  const formRwOptions = user.role === 'superadmin'
    ? rwList.filter((rw) => !formDesaId || String(rw.desa_id) === String(formDesaId))
    : rwList;

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedRwId) {
      params.set('rw_id', selectedRwId);
    } else if (user.role === 'superadmin' && selectedDesaId) {
      params.set('desa_id', selectedDesaId);
    }

    const requestUrl = params.toString() ? `/rt.php?${params.toString()}` : '/rt.php';
    api.get(requestUrl).then((res) => setData(res.data)).catch(() => toast.error('Gagal memuat data')).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user.role === 'superadmin') {
      api.get('/desa.php').then((res) => setDesaList(res.data)).catch(() => {});
    }

    if (user.role === 'superadmin' || user.role === 'desa') {
      api.get('/rw.php').then((res) => setRwList(res.data)).catch(() => {});
    }
  }, [user.role]);

  useEffect(() => {
    fetchData();
  }, [user.role, selectedDesaId, selectedRwId]);

  const openCreateForm = () => {
    const preselectedRw = rwList.find((rw) => String(rw.id) === String(selectedRwId));
    setEditing(null);
    setForm({
      ...emptyForm,
      rw_id: user.role === 'rw' ? emptyForm.rw_id : selectedRwId,
    });
    setFormDesaId(user.role === 'superadmin' ? (preselectedRw ? String(preselectedRw.desa_id) : selectedDesaId) : '');
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormDesaId('');
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        const res = await api.put('/rt.php', { ...form, id: editing.id });
        toast.success(res.data?.username ? `RT berhasil diupdate. Username akun: ${res.data.username}` : 'RT berhasil diupdate');
      } else {
        const res = await api.post('/rt.php', form);
        setCredentialNotice({
          username: res.data.username,
          password: res.data.default_password,
          label: `RT ${form.nomor_rt}`,
        });
        toast.success('RT berhasil ditambahkan');
      }

      closeForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus RT ini?')) return;

    try {
      await api.delete(`/rt.php?id=${id}`);
      toast.success('RT berhasil dihapus');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus');
    }
  };

  const startEdit = (item) => {
    const linkedRw = rwList.find((rw) => String(rw.id) === String(item.rw_id));
    setEditing(item);
    setForm({
      rw_id: String(item.rw_id),
      nomor_rt: item.nomor_rt,
      nama_ketua: item.nama_ketua || '',
    });
    setFormDesaId(linkedRw ? String(linkedRw.desa_id) : '');
    setShowForm(true);
  };

  const handleSelectedDesaChange = (value) => {
    setSelectedDesaId(value);
    setSelectedRwId('');
  };

  const handleFormDesaChange = (value) => {
    setFormDesaId(value);
    setForm((current) => ({ ...current, rw_id: '' }));
  };

  const stats = [
    {
      kicker: 'Total RT',
      value: data.length,
      label: 'Seluruh RT yang aktif pada struktur wilayah yang dapat Anda kelola.',
    },
    {
      kicker: 'Ketua RT',
      value: data.filter((item) => item.nama_ketua).length,
      label: 'Jumlah RT yang sudah memiliki data ketua atau penanggung jawab.',
    },
    {
      kicker: 'Cakupan RW',
      value: new Set(data.map((item) => item.nomor_rw).filter(Boolean)).size,
      label: 'Jumlah RW yang telah memiliki data RT aktif di sistem.',
    },
  ];

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Struktur RT"
        title="Kelola Data RT"
        description="Tampilan RT kini dibuat lebih konsisten dengan halaman lainnya agar administrasi wilayah kecil tetap cepat diproses, termasuk saat diakses dari layar yang lebih sempit."
        stats={stats}
        actions={(
          <>
            <button type="button" onClick={openCreateForm} className="app-button-primary">
              <FiPlus size={18} />
              Tambah RT
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
        title="Akun admin RT berhasil dibuat"
        description="Kredensial ini dapat diberikan ke petugas RT untuk login awal. Bila terlupa, reset password tersedia di halaman Manajemen User."
        onClose={() => setCredentialNotice(null)}
      />

      {showForm && (
        <section className="app-panel">
          <div className="app-panel-header">
            <div>
              <h3 className="app-panel-title">{editing ? 'Edit Data RT' : 'Tambah RT Baru'}</h3>
              <p className="app-panel-description">Pastikan nomor RT, RW induk, dan nama ketua sudah sesuai dengan struktur wilayah terkini.</p>
            </div>
            <span className="app-chip">{editing ? 'Mode edit' : 'Form baru'}</span>
          </div>

          <div className="app-panel-body">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {user.role === 'superadmin' && (
                <div>
                  <label className="app-label">Desa *</label>
                  <select
                    value={formDesaId}
                    onChange={(e) => handleFormDesaChange(e.target.value)}
                    className="app-select uppercase"
                    required
                  >
                    <option value="">Pilih desa</option>
                    {desaList.map((desa) => (
                      <option key={desa.id} value={desa.id}>{desa.nama_desa}</option>
                    ))}
                  </select>
                </div>
              )}

              {(user.role === 'superadmin' || user.role === 'desa') && (
                <div>
                  <label className="app-label">RW *</label>
                  <select
                    value={form.rw_id}
                    onChange={(e) => setForm({ ...form, rw_id: e.target.value })}
                    className="app-select"
                    disabled={user.role === 'superadmin' && !formDesaId}
                    required
                  >
                    <option value="">{user.role === 'superadmin' && !formDesaId ? 'Pilih desa lebih dulu' : 'Pilih RW'}</option>
                    {formRwOptions.map((rw) => (
                      <option key={rw.id} value={rw.id}>RW {rw.nomor_rw} - {rw.nama_desa}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="app-label">Nomor RT *</label>
                <input
                  type="text"
                  value={form.nomor_rt}
                  onChange={(e) => setForm({ ...form, nomor_rt: e.target.value })}
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
                  placeholder="Nama ketua RT"
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
            <h3 className="app-panel-title">Daftar RT</h3>
            <p className="app-panel-description">Seluruh data RT aktif berdasarkan hak akses yang sedang digunakan.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {user.role === 'superadmin' && (
              <div className="min-w-[220px]">
                <select
                  value={selectedDesaId}
                  onChange={(e) => handleSelectedDesaChange(e.target.value)}
                  className="app-select uppercase"
                >
                  <option value="">Semua desa</option>
                  {desaList.map((desa) => (
                    <option key={desa.id} value={desa.id}>{desa.nama_desa}</option>
                  ))}
                </select>
              </div>
            )}

            {(user.role === 'superadmin' || user.role === 'desa') && (
              <div className="min-w-[220px]">
                <select
                  value={selectedRwId}
                  onChange={(e) => setSelectedRwId(e.target.value)}
                  className="app-select uppercase"
                >
                  <option value="">{user.role === 'superadmin' ? 'Semua RW' : 'Semua RW di desa ini'}</option>
                  {filteredRwOptions.map((rw) => (
                    <option key={rw.id} value={rw.id}>RW {rw.nomor_rw} - {rw.nama_desa}</option>
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
                <th>Nomor RT</th>
                <th>Nama Ketua</th>
                <th>RW</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="app-empty-row">Memuat data RT...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="5" className="app-empty-row">Belum ada data RT.</td>
                </tr>
              ) : data.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td className="font-semibold text-slate-900">RT {item.nomor_rt}</td>
                  <td>{item.nama_ketua || '-'}</td>
                  <td>
                    <span className="app-badge app-badge-neutral">RW {item.nomor_rw}</span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="app-icon-button text-sky-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                        title="Edit RT"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="app-icon-button text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        title="Hapus RT"
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
