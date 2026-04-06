import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import AppPageHeader from '../components/AppPageHeader';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const jenisAktivitas = ['Lahir', 'Mati', 'Pindah', 'Datang'];
const jenisColors = {
  Lahir: 'app-badge-emerald',
  Mati: 'app-badge-rose',
  Pindah: 'app-badge-amber',
  Datang: 'app-badge-sky',
};

const createEmptyForm = () => ({
  penduduk_id: '',
  keluarga_id: '',
  jenis_aktivitas: '',
  tanggal_aktivitas: '',
  keterangan: '',
  nama_bayi: '',
  jenis_kelamin_bayi: '',
  penyebab_kematian: '',
  alamat_tujuan: '',
  alasan_pindah: '',
  alamat_asal: '',
});

export default function AktivitasPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [pendudukList, setPendudukList] = useState([]);
  const [keluargaList, setKeluargaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterJenis, setFilterJenis] = useState('');
  const [form, setForm] = useState(createEmptyForm());

  const fetchData = () => {
    setLoading(true);
    const params = filterJenis ? `?jenis=${filterJenis}` : '';
    api.get(`/aktivitas.php${params}`).then((res) => setData(res.data)).catch(() => toast.error('Gagal memuat data')).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [filterJenis]);

  useEffect(() => {
    api.get('/penduduk.php').then((res) => setPendudukList(res.data)).catch(() => {});
    api.get('/keluarga.php').then((res) => setKeluargaList(res.data)).catch(() => {});
  }, []);

  const openCreateForm = () => {
    setForm(createEmptyForm());
    setShowForm(true);
  };

  const closeForm = () => {
    setForm(createEmptyForm());
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post('/aktivitas.php', form);
      toast.success('Aktivitas berhasil dicatat');
      closeForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mencatat aktivitas');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus aktivitas ini?')) return;

    try {
      await api.delete(`/aktivitas.php?id=${id}`);
      toast.success('Aktivitas berhasil dihapus');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus');
    }
  };

  const heroStats = [
    {
      kicker: 'Catatan Aktif',
      value: data.length,
      label: 'Jumlah aktivitas yang tampil pada daftar sesuai filter yang sedang digunakan.',
    },
    {
      kicker: 'Filter',
      value: filterJenis || 'Semua',
      label: 'Jenis aktivitas yang saat ini sedang dipakai untuk memfilter daftar aktivitas.',
    },
    {
      kicker: 'Penduduk',
      value: pendudukList.length,
      label: 'Penduduk yang dapat dipilih untuk aktivitas terkait individu.',
    },
    {
      kicker: 'Kartu Keluarga',
      value: keluargaList.length,
      label: 'Data keluarga yang tersedia untuk aktivitas berbasis KK seperti kelahiran.',
    },
  ];

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Aktivitas Warga"
        title="Catatan Aktivitas Penduduk"
        description={`Pencatatan aktivitas untuk akun ${user?.role} kini dibuat lebih terstruktur agar perubahan data warga seperti lahir, mati, pindah, dan datang bisa dicatat tanpa alur yang membingungkan.`}
        stats={heroStats}
        actions={(
          <>
            <button type="button" onClick={openCreateForm} className="app-button-primary">
              <FiPlus size={18} />
              Catat Aktivitas
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

      {showForm && (
        <section className="app-panel">
          <div className="app-panel-header">
            <div>
              <h3 className="app-panel-title">Catat Aktivitas Penduduk</h3>
              <p className="app-panel-description">Pilih jenis aktivitas terlebih dahulu, lalu lengkapi field tambahan yang muncul sesuai konteks kejadian.</p>
            </div>
            <span className="app-chip">Form aktivitas</span>
          </div>

          <div className="app-panel-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="app-label">Jenis Aktivitas *</label>
                  <select value={form.jenis_aktivitas} onChange={(e) => setForm({ ...form, jenis_aktivitas: e.target.value })} className="app-select" required>
                    <option value="">Pilih jenis</option>
                    {jenisAktivitas.map((jenis) => (
                      <option key={jenis} value={jenis}>{jenis}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="app-label">Tanggal *</label>
                  <input type="date" value={form.tanggal_aktivitas} onChange={(e) => setForm({ ...form, tanggal_aktivitas: e.target.value })} className="app-input" required />
                </div>
                <div>
                  <label className="app-label">Keluarga (KK)</label>
                  <select value={form.keluarga_id} onChange={(e) => setForm({ ...form, keluarga_id: e.target.value })} className="app-select">
                    <option value="">Pilih keluarga</option>
                    {keluargaList.map((keluarga) => (
                      <option key={keluarga.id} value={keluarga.id}>{keluarga.no_kk} - {keluarga.kepala_keluarga}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(form.jenis_aktivitas === 'Mati' || form.jenis_aktivitas === 'Pindah') && (
                <div>
                  <label className="app-label">Penduduk Terkait</label>
                  <select value={form.penduduk_id} onChange={(e) => setForm({ ...form, penduduk_id: e.target.value })} className="app-select">
                    <option value="">Pilih penduduk</option>
                    {pendudukList.map((penduduk) => (
                      <option key={penduduk.id} value={penduduk.id}>{penduduk.nik} - {penduduk.nama_lengkap}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.jenis_aktivitas === 'Lahir' && (
                <div className="grid grid-cols-1 gap-4 rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-4 md:grid-cols-2">
                  <div>
                    <label className="app-label">Nama Bayi</label>
                    <input type="text" value={form.nama_bayi} onChange={(e) => setForm({ ...form, nama_bayi: e.target.value })} className="app-input" />
                  </div>
                  <div>
                    <label className="app-label">Jenis Kelamin Bayi</label>
                    <select value={form.jenis_kelamin_bayi} onChange={(e) => setForm({ ...form, jenis_kelamin_bayi: e.target.value })} className="app-select">
                      <option value="">Pilih</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                </div>
              )}

              {form.jenis_aktivitas === 'Mati' && (
                <div className="rounded-[24px] border border-rose-100 bg-rose-50/80 p-4">
                  <label className="app-label">Penyebab Kematian</label>
                  <input type="text" value={form.penyebab_kematian} onChange={(e) => setForm({ ...form, penyebab_kematian: e.target.value })} className="app-input" />
                </div>
              )}

              {form.jenis_aktivitas === 'Pindah' && (
                <div className="grid grid-cols-1 gap-4 rounded-[24px] border border-amber-100 bg-amber-50/80 p-4 md:grid-cols-2">
                  <div>
                    <label className="app-label">Alamat Tujuan</label>
                    <textarea value={form.alamat_tujuan} onChange={(e) => setForm({ ...form, alamat_tujuan: e.target.value })} className="app-textarea" rows="3" />
                  </div>
                  <div>
                    <label className="app-label">Alasan Pindah</label>
                    <input type="text" value={form.alasan_pindah} onChange={(e) => setForm({ ...form, alasan_pindah: e.target.value })} className="app-input" />
                  </div>
                </div>
              )}

              {form.jenis_aktivitas === 'Datang' && (
                <div className="rounded-[24px] border border-sky-100 bg-sky-50/80 p-4">
                  <label className="app-label">Alamat Asal</label>
                  <textarea value={form.alamat_asal} onChange={(e) => setForm({ ...form, alamat_asal: e.target.value })} className="app-textarea" rows="3" />
                </div>
              )}

              <div>
                <label className="app-label">Keterangan</label>
                <textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} className="app-textarea" rows="3" />
              </div>

              <div className="app-inline-actions">
                <button type="submit" className="app-button-primary">Simpan Aktivitas</button>
                <button type="button" onClick={closeForm} className="app-button-secondary">Batal</button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="app-panel-title">Filter Aktivitas</h3>
            <p className="app-panel-description">Pilih jenis aktivitas untuk menyaring daftar catatan yang ingin ditinjau.</p>
          </div>
          <span className="app-chip">{filterJenis || 'Semua jenis'}</span>
        </div>

        <div className="app-panel-body">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setFilterJenis('')} className={`app-filter-button ${!filterJenis ? 'app-filter-button-active' : 'app-filter-button-idle'}`}>
              Semua
            </button>
            {jenisAktivitas.map((jenis) => (
              <button
                key={jenis}
                type="button"
                onClick={() => setFilterJenis(jenis)}
                className={`app-filter-button ${filterJenis === jenis ? 'app-filter-button-active' : 'app-filter-button-idle'}`}
              >
                {jenis}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="app-panel-title">Daftar Aktivitas</h3>
            <p className="app-panel-description">Catatan aktivitas warga yang tersimpan sesuai filter aktif.</p>
          </div>
          <span className="app-chip">{data.length} catatan</span>
        </div>

        <div className="app-table-scroll">
          <table className="app-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Penduduk</th>
                <th>No. KK</th>
                <th>Keterangan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="app-empty-row">Memuat data aktivitas...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="7" className="app-empty-row">Belum ada data aktivitas.</td>
                </tr>
              ) : data.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.tanggal_aktivitas}</td>
                  <td>
                    <span className={`app-badge ${jenisColors[item.jenis_aktivitas] || 'app-badge-neutral'}`}>
                      {item.jenis_aktivitas}
                    </span>
                  </td>
                  <td className="font-medium text-slate-900">{item.nama_penduduk || item.nama_bayi || '-'}</td>
                  <td className="font-mono text-xs text-slate-500">{item.no_kk || '-'}</td>
                  <td className="max-w-[260px] leading-6 text-slate-600">{item.keterangan || '-'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="app-icon-button text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      title="Hapus aktivitas"
                    >
                      <FiTrash2 size={16} />
                    </button>
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
