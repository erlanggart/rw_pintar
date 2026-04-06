import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import AccountCredentialNotice from '../components/AccountCredentialNotice';
import AppPageHeader from '../components/AppPageHeader';
import api from '../utils/api';

const emptyForm = {
  nama_desa: '',
  kode_desa: '',
  alamat: '',
  kecamatan: '',
  kabupaten: '',
  provinsi: '',
};

function toUppercase(value) {
  return value.toUpperCase();
}

export default function DesaPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [credentialNotice, setCredentialNotice] = useState(null);

  const fetchData = () => {
    setLoading(true);
    api.get('/desa.php').then((res) => setData(res.data)).catch(() => toast.error('Gagal memuat data')).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateForm = () => {
    setEditing(null);
    setForm(emptyForm);
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
        const res = await api.put('/desa.php', { ...form, id: editing.id });
        toast.success(res.data?.username ? `Desa berhasil diupdate. Username akun: ${res.data.username}` : 'Desa berhasil diupdate');
      } else {
        const res = await api.post('/desa.php', form);
        setCredentialNotice({
          username: res.data.username,
          password: res.data.default_password,
          label: `Desa ${form.nama_desa}`,
        });
        toast.success('Desa berhasil ditambahkan');
      }
      closeForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus desa ini?')) return;
    try {
      await api.delete(`/desa.php?id=${id}`);
      toast.success('Desa berhasil dihapus');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus');
    }
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      nama_desa: item.nama_desa,
      kode_desa: item.kode_desa || '',
      alamat: item.alamat || '',
      kecamatan: item.kecamatan || '',
      kabupaten: item.kabupaten || '',
      provinsi: item.provinsi || '',
    });
    setShowForm(true);
  };

  const stats = [
    {
      kicker: 'Total Desa',
      value: data.length,
      label: 'Jumlah desa yang saat ini sudah terhubung ke sistem RW Pintar.',
    },
    {
      kicker: 'Kode Desa',
      value: data.filter((item) => item.kode_desa).length,
      label: 'Data desa yang sudah memiliki kode identitas wilayah.',
    },
    {
      kicker: 'Alamat',
      value: data.filter((item) => item.alamat).length,
      label: 'Data desa yang sudah dilengkapi informasi alamat utama.',
    },
  ];

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Master Wilayah"
        title="Kelola Desa"
        description="Susun data desa sebagai fondasi struktur wilayah. Tampilan ini dibuat lebih ringkas agar proses tambah, edit, dan review data terasa lebih cepat."
        stats={stats}
        actions={(
          <>
            <button type="button" onClick={openCreateForm} className="app-button-primary">
              <FiPlus size={18} />
              Tambah Desa
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
        title="Akun admin desa berhasil dibuat"
        description="Kredensial ini dipakai untuk login pertama admin desa. Jika hilang, Anda dapat meresetnya dari halaman Manajemen User."
        onClose={() => setCredentialNotice(null)}
      />

      {showForm && (
        <section className="app-panel">
          <div className="app-panel-header">
            <div>
              <h3 className="app-panel-title">{editing ? 'Edit Data Desa' : 'Tambah Desa Baru'}</h3>
              <p className="app-panel-description">Lengkapi identitas utama desa sebelum data diteruskan ke struktur RW di bawahnya.</p>
            </div>
            <span className="app-chip">{editing ? 'Mode edit' : 'Form baru'}</span>
          </div>

          <div className="app-panel-body">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="app-label">Nama Desa *</label>
                <input
                  type="text"
                  value={form.nama_desa}
                  onChange={(e) => setForm({ ...form, nama_desa: toUppercase(e.target.value) })}
                  className="app-input uppercase"
                  required
                />
              </div>

              <div>
                <label className="app-label">Kode Desa</label>
                <input
                  type="text"
                  value={form.kode_desa}
                  onChange={(e) => setForm({ ...form, kode_desa: toUppercase(e.target.value) })}
                  className="app-input uppercase"
                  placeholder="Contoh: DSA-001"
                />
              </div>

              <div>
                <label className="app-label">Kecamatan</label>
                <input
                  type="text"
                  value={form.kecamatan}
                  onChange={(e) => setForm({ ...form, kecamatan: toUppercase(e.target.value) })}
                  className="app-input uppercase"
                />
              </div>

              <div>
                <label className="app-label">Kabupaten/Kota</label>
                <input
                  type="text"
                  value={form.kabupaten}
                  onChange={(e) => setForm({ ...form, kabupaten: toUppercase(e.target.value) })}
                  className="app-input uppercase"
                />
              </div>

              <div>
                <label className="app-label">Provinsi</label>
                <input
                  type="text"
                  value={form.provinsi}
                  onChange={(e) => setForm({ ...form, provinsi: toUppercase(e.target.value) })}
                  className="app-input uppercase"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="app-label">Alamat</label>
                <textarea
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: toUppercase(e.target.value) })}
                  className="app-textarea uppercase"
                  rows="4"
                />
              </div>

              <div className="app-inline-actions md:col-span-2 lg:col-span-3">
                <button type="submit" className="app-button-primary">
                  Simpan Data
                </button>
                <button type="button" onClick={closeForm} className="app-button-secondary">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="app-panel-title">Daftar Desa</h3>
            <p className="app-panel-description">Seluruh data desa yang aktif di sistem administrasi RW Pintar.</p>
          </div>
          <span className="app-chip">{data.length} data</span>
        </div>

        <div className="app-table-scroll">
          <table className="app-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Desa</th>
                <th>Kode</th>
                <th>Wilayah</th>
                <th>Alamat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="app-empty-row">Memuat data desa...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="app-empty-row">Belum ada data desa.</td>
                </tr>
              ) : data.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td className="font-semibold text-slate-900 uppercase">{item.nama_desa}</td>
                  <td>
                    <span className="app-badge app-badge-neutral uppercase">{item.kode_desa || '-'}</span>
                  </td>
                  <td className="max-w-[260px] leading-6 text-slate-600 uppercase">{[item.kecamatan, item.kabupaten, item.provinsi].filter(Boolean).join(' / ') || '-'}</td>
                  <td className="max-w-[320px] leading-6 text-slate-600 uppercase">{item.alamat || '-'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="app-icon-button text-sky-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                        title="Edit desa"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="app-icon-button text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        title="Hapus desa"
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
