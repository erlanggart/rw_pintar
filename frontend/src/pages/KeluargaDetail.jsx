import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import AppPageHeader from '../components/AppPageHeader';
import api from '../utils/api';

const createDefaultPenduduk = () => ({
  nik: '',
  nama_lengkap: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  jenis_kelamin: '',
  golongan_darah: '-',
  agama: '',
  status_perkawinan: 'Belum Kawin',
  pekerjaan: '',
  pendidikan: 'Tidak Sekolah',
  kewarganegaraan: 'WNI',
  hubungan_keluarga: '',
  no_telepon: '',
  status_penduduk: 'Tetap',
});

const hubunganOptions = [
  { value: 'Kepala Keluarga', label: 'KEPALA KELUARGA' },
  { value: 'Istri', label: 'ISTRI' },
  { value: 'Anak', label: 'ANAK' },
  { value: 'Menantu', label: 'MENANTU' },
  { value: 'Cucu', label: 'CUCU' },
  { value: 'Orang Tua', label: 'ORANG TUA' },
  { value: 'Mertua', label: 'MERTUA' },
  { value: 'Famili Lain', label: 'FAMILY LAIN' },
  { value: 'Lainnya', label: 'LAINNYA' },
];

const agamaOptions = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'];

function toUppercase(value) {
  return value.toUpperCase();
}

function digitsOnly(value, maxLength = Infinity) {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

function formatUppercaseValue(value) {
  if (!value) {
    return '-';
  }

  if (typeof value !== 'string') {
    return value;
  }

  return value.toUpperCase();
}

export default function KeluargaDetail() {
  const { id } = useParams();
  const [keluarga, setKeluarga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(createDefaultPenduduk());

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleUppercaseChange = (name) => (e) => {
    setField(name, toUppercase(e.target.value));
  };

  const handleDigitChange = (name, maxLength) => (e) => {
    setField(name, digitsOnly(e.target.value, maxLength));
  };

  const fetchData = () => {
    setLoading(true);
    api.get(`/keluarga.php?id=${id}`).then((res) => setKeluarga(res.data)).catch(() => toast.error('Gagal memuat data')).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const openCreateForm = () => {
    setEditing(null);
    setForm(createDefaultPenduduk());
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(createDefaultPenduduk());
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        await api.put('/penduduk.php', { ...form, id: editing.id, keluarga_id: id });
        toast.success('Data penduduk berhasil diupdate');
      } else {
        await api.post('/penduduk.php', { ...form, keluarga_id: id });
        toast.success('Data penduduk berhasil ditambahkan');
      }

      closeForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (pendudukId) => {
    if (!confirm('Yakin ingin menghapus data penduduk ini?')) return;

    try {
      await api.delete(`/penduduk.php?id=${pendudukId}`);
      toast.success('Data penduduk berhasil dihapus');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus');
    }
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      nik: item.nik,
      nama_lengkap: item.nama_lengkap,
      tempat_lahir: item.tempat_lahir || '',
      tanggal_lahir: item.tanggal_lahir || '',
      jenis_kelamin: item.jenis_kelamin,
      golongan_darah: item.golongan_darah || '-',
      agama: item.agama,
      status_perkawinan: item.status_perkawinan || 'Belum Kawin',
      pekerjaan: item.pekerjaan || '',
      pendidikan: item.pendidikan || 'Tidak Sekolah',
      kewarganegaraan: item.kewarganegaraan || 'WNI',
      hubungan_keluarga: item.hubungan_keluarga,
      no_telepon: item.no_telepon || '',
      status_penduduk: item.status_penduduk || 'Tetap',
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="app-panel">
        <div className="app-panel-body py-16 text-center text-sm text-slate-500">Memuat detail keluarga...</div>
      </div>
    );
  }

  if (!keluarga) {
    return (
      <div className="app-panel">
        <div className="app-panel-body py-16 text-center text-sm text-rose-600">Data keluarga tidak ditemukan.</div>
      </div>
    );
  }

  const anggota = keluarga.anggota || [];
  const kepalaKeluargaMember = anggota.find((item) => item.hubungan_keluarga === 'Kepala Keluarga');
  const availableHubunganOptions = editing
    ? hubunganOptions
    : hubunganOptions.filter((option) => option.value !== 'Kepala Keluarga' || !kepalaKeluargaMember);
  const detailItems = [
    { label: 'Kepala Keluarga', value: keluarga.kepala_keluarga },
    { label: 'Alamat', value: keluarga.alamat },
    { label: 'RT / RW', value: `RT ${keluarga.nomor_rt} / RW ${keluarga.nomor_rw}` },
    { label: 'Desa/Kelurahan', value: keluarga.kelurahan },
    { label: 'Kecamatan', value: keluarga.kecamatan },
    { label: 'Kabupaten/Kota', value: keluarga.kabupaten },
    { label: 'Provinsi', value: keluarga.provinsi },
    { label: 'Kode Pos', value: keluarga.kode_pos },
  ].filter((item) => item.value);

  const kepalaProfileItems = [
    { label: 'NIK Kepala', value: keluarga.nik_kepala },
    { label: 'Jenis Kelamin', value: keluarga.kepala_jenis_kelamin === 'L' ? 'LAKI-LAKI' : keluarga.kepala_jenis_kelamin === 'P' ? 'PEREMPUAN' : '' },
    { label: 'Tempat Lahir', value: keluarga.kepala_tempat_lahir },
    { label: 'Tanggal Lahir', value: keluarga.kepala_tanggal_lahir },
    { label: 'Agama', value: keluarga.kepala_agama },
    { label: 'Pekerjaan', value: keluarga.kepala_pekerjaan },
  ].filter((item) => item.value);

  const heroStats = [
    {
      kicker: 'No. KK',
      value: keluarga.no_kk,
      label: 'Identitas utama keluarga yang menjadi basis seluruh anggota di halaman ini.',
    },
    {
      kicker: 'Anggota',
      value: anggota.length,
      label: 'Jumlah penduduk yang saat ini terhubung ke kartu keluarga ini.',
    },
    {
      kicker: 'Wilayah',
      value: `RT ${keluarga.nomor_rt} / RW ${keluarga.nomor_rw}`,
      label: 'Penempatan keluarga pada struktur RT dan RW di wilayah aktif.',
    },
  ];

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Detail Keluarga"
        title={keluarga.kepala_keluarga}
        description="Lihat profil keluarga secara utuh dan kelola anggota keluarga tanpa berpindah konteks. Semua data penduduk tetap terhubung ke kartu keluarga ini."
        stats={heroStats}
        actions={(
          <>
            <Link to="/keluarga" className="app-button-secondary">
              <FiArrowLeft size={18} />
              Kembali
            </Link>
            <Link to={`/keluarga/${id}/edit`} className="app-button-secondary">
              <FiEdit2 size={18} />
              Edit KK
            </Link>
            <button type="button" onClick={openCreateForm} className="app-button-primary">
              <FiPlus size={18} />
              Tambah Anggota
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

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="app-panel-title">Informasi Kartu Keluarga</h3>
            <p className="app-panel-description">Ringkasan identitas keluarga dan wilayah administratif yang melekat pada kartu keluarga ini.</p>
          </div>
          <span className="app-chip">{anggota.length} anggota</span>
        </div>

        <div className="app-panel-body">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {detailItems.map((item) => (
              <div key={item.label} className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{item.label}</p>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-900 uppercase">{formatUppercaseValue(item.value)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {kepalaProfileItems.length > 0 && (
        <section className="app-panel">
          <div className="app-panel-header">
            <div>
              <h3 className="app-panel-title">Profil Kepala Keluarga</h3>
              <p className="app-panel-description">Data pokok Kepala Keluarga dikelola dari form KK dan ditampilkan otomatis di sini.</p>
            </div>
            <span className="app-chip uppercase">Data Kepala</span>
          </div>

          <div className="app-panel-body">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {kepalaProfileItems.map((item) => (
                <div key={item.label} className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{item.label}</p>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-900 uppercase">{formatUppercaseValue(item.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {showForm && (
        <section className="app-panel">
          <div className="app-panel-header">
            <div>
              <h3 className="app-panel-title">{editing ? 'Edit Data Penduduk' : 'Tambah Anggota Keluarga'}</h3>
              <p className="app-panel-description">Lengkapi identitas anggota keluarga, hubungan keluarga, dan data sosial dasar sebelum disimpan.</p>
            </div>
            <span className="app-chip">{editing ? 'Mode edit' : 'Anggota baru'}</span>
          </div>

          <div className="app-panel-body">
            <div className="mb-5 rounded-[24px] border border-teal-100 bg-teal-50/80 p-4 text-sm leading-6 text-teal-900">
              Data penduduk yang Anda simpan di sini otomatis terhubung ke KK <span className="font-semibold">{keluarga.no_kk}</span> dan akan muncul di halaman data penduduk utama. Opsi <span className="font-semibold">FAMILY LAIN</span> tersedia untuk anggota keluarga di luar hubungan baku.
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="app-label">NIK *</label>
                <input type="text" value={form.nik} onChange={handleDigitChange('nik', 16)} className="app-input" maxLength="16" required />
              </div>
              <div>
                <label className="app-label">Nama Lengkap *</label>
                <input type="text" value={form.nama_lengkap} onChange={handleUppercaseChange('nama_lengkap')} className="app-input uppercase" required />
              </div>
              <div>
                <label className="app-label">Hubungan Keluarga *</label>
                <select value={form.hubungan_keluarga} onChange={(e) => setField('hubungan_keluarga', e.target.value)} className="app-select uppercase" required>
                  <option value="">Pilih</option>
                  {availableHubunganOptions.map((hubungan) => (
                    <option key={hubungan.value} value={hubungan.value}>{hubungan.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="app-label">Tempat Lahir</label>
                <input type="text" value={form.tempat_lahir} onChange={handleUppercaseChange('tempat_lahir')} className="app-input uppercase" />
              </div>
              <div>
                <label className="app-label">Tanggal Lahir</label>
                <input type="date" value={form.tanggal_lahir} onChange={(e) => setField('tanggal_lahir', e.target.value)} className="app-input" />
              </div>
              <div>
                <label className="app-label">Jenis Kelamin *</label>
                <select value={form.jenis_kelamin} onChange={(e) => setField('jenis_kelamin', e.target.value)} className="app-select uppercase" required>
                  <option value="">Pilih</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="app-label">Golongan Darah</label>
                <select value={form.golongan_darah} onChange={(e) => setField('golongan_darah', e.target.value)} className="app-select uppercase">
                  {['A', 'B', 'AB', 'O', '-'].map((golongan) => (
                    <option key={golongan} value={golongan}>{golongan}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="app-label">Agama *</label>
                <select value={form.agama} onChange={(e) => setField('agama', e.target.value)} className="app-select uppercase" required>
                  <option value="">Pilih</option>
                  {agamaOptions.map((agama) => (
                    <option key={agama} value={agama}>{agama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="app-label">Status Perkawinan</label>
                <select value={form.status_perkawinan} onChange={(e) => setField('status_perkawinan', e.target.value)} className="app-select uppercase">
                  {['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="app-label">Pekerjaan</label>
                <input type="text" value={form.pekerjaan} onChange={handleUppercaseChange('pekerjaan')} className="app-input uppercase" />
              </div>
              <div>
                <label className="app-label">Pendidikan</label>
                <select value={form.pendidikan} onChange={(e) => setField('pendidikan', e.target.value)} className="app-select uppercase">
                  {['Tidak Sekolah', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3'].map((pendidikan) => (
                    <option key={pendidikan} value={pendidikan}>{pendidikan}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="app-label">Kewarganegaraan</label>
                <select value={form.kewarganegaraan} onChange={(e) => setField('kewarganegaraan', e.target.value)} className="app-select uppercase">
                  <option value="WNI">WNI</option>
                  <option value="WNA">WNA</option>
                </select>
              </div>
              <div>
                <label className="app-label">No. Telepon</label>
                <input type="text" value={form.no_telepon} onChange={(e) => setField('no_telepon', e.target.value)} className="app-input" />
              </div>
              <div>
                <label className="app-label">Status Penduduk</label>
                <select value={form.status_penduduk} onChange={(e) => setField('status_penduduk', e.target.value)} className="app-select uppercase">
                  <option value="Tetap">Tetap</option>
                  <option value="Sementara">Sementara</option>
                </select>
              </div>
              <div className="app-inline-actions lg:col-span-3">
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
            <h3 className="app-panel-title">Anggota Keluarga</h3>
            <p className="app-panel-description">Daftar penduduk yang saat ini tercatat pada kartu keluarga ini.</p>
          </div>
          <span className="app-chip">{anggota.length} anggota</span>
        </div>

        <div className="app-table-scroll">
          <table className="app-table">
            <thead>
              <tr>
                <th>No</th>
                <th>NIK</th>
                <th>Nama</th>
                <th>Gender</th>
                <th>TTL</th>
                <th>Hubungan</th>
                <th>Pekerjaan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {anggota.length === 0 ? (
                <tr>
                  <td colSpan="8" className="app-empty-row">Belum ada anggota keluarga.</td>
                </tr>
              ) : anggota.map((penduduk, index) => (
                <tr key={penduduk.id}>
                  <td>{index + 1}</td>
                  <td className="font-mono text-xs text-slate-500">{penduduk.nik}</td>
                  <td className="font-semibold text-slate-900 uppercase">{formatUppercaseValue(penduduk.nama_lengkap)}</td>
                  <td className="uppercase">{penduduk.jenis_kelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}</td>
                  <td className="text-xs leading-5 text-slate-600 uppercase">{formatUppercaseValue([penduduk.tempat_lahir, penduduk.tanggal_lahir].filter(Boolean).join(', ') || '-')}</td>
                  <td>
                    <span className="app-badge app-badge-neutral uppercase">{formatUppercaseValue(penduduk.hubungan_keluarga)}</span>
                  </td>
                  <td className="uppercase">{formatUppercaseValue(penduduk.pekerjaan)}</td>
                  <td>
                    {penduduk.hubungan_keluarga === 'Kepala Keluarga' ? (
                      <Link
                        to={`/keluarga/${id}/edit`}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700"
                      >
                        Kelola di Form KK
                      </Link>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(penduduk)}
                          className="app-icon-button text-sky-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                          title="Edit anggota"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(penduduk.id)}
                          className="app-icon-button text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                          title="Hapus anggota"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    )}
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
