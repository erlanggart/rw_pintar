import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMapPin, FiSave } from 'react-icons/fi';
import AppPageHeader from '../components/AppPageHeader';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const createEmptyForm = () => ({
  rt_id: '',
  no_kk: '',
  kepala_keluarga: '',
  nik_kepala: '',
  kepala_jenis_kelamin: '',
  kepala_tempat_lahir: '',
  kepala_tanggal_lahir: '',
  kepala_agama: '',
  kepala_pekerjaan: '',
  alamat: '',
  kelurahan: '',
  kecamatan: '',
  kabupaten: '',
  provinsi: '',
  kode_pos: '',
  status_kk: 'Menetap',
});

const agamaOptions = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'];

function toUppercase(value) {
  return value.toUpperCase();
}

function digitsOnly(value, maxLength = Infinity) {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

export default function KeluargaFormPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(createEmptyForm());
  const [rtList, setRtList] = useState([]);
  const [loadingRtList, setLoadingRtList] = useState(false);
  const [currentDesa, setCurrentDesa] = useState(null);
  const [loadingCurrentDesa, setLoadingCurrentDesa] = useState(true);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleUppercaseChange = (name) => (e) => {
    setField(name, toUppercase(e.target.value));
  };

  const handleDigitChange = (name, maxLength) => (e) => {
    setField(name, digitsOnly(e.target.value, maxLength));
  };

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    setLoading(true);
    api.get(`/keluarga.php?id=${id}`)
      .then((res) => {
        const item = res.data;
        setForm({
          rt_id: item.rt_id || '',
          no_kk: item.no_kk || '',
          kepala_keluarga: item.kepala_keluarga || '',
          nik_kepala: item.nik_kepala || '',
          kepala_jenis_kelamin: item.kepala_jenis_kelamin || '',
          kepala_tempat_lahir: item.kepala_tempat_lahir || '',
          kepala_tanggal_lahir: item.kepala_tanggal_lahir || '',
          kepala_agama: item.kepala_agama || '',
          kepala_pekerjaan: item.kepala_pekerjaan || '',
          alamat: item.alamat || '',
          kelurahan: item.kelurahan || '',
          kecamatan: item.kecamatan || '',
          kabupaten: item.kabupaten || '',
          provinsi: item.provinsi || '',
          kode_pos: item.kode_pos || '',
          status_kk: item.status_kk || 'Menetap',
        });
      })
      .catch(() => toast.error('Gagal memuat data keluarga'))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  useEffect(() => {
    if (!user?.role) {
      return;
    }

    if (user.role === 'rt') {
      setForm((current) => (current.rt_id ? current : { ...current, rt_id: String(user.rt_id || '') }));
      return;
    }

    setLoadingRtList(true);
    api.get('/rt.php')
      .then((res) => {
        const options = res.data || [];
        setRtList(options);
        setForm((current) => {
          if (current.rt_id || options.length !== 1) {
            return current;
          }

          return { ...current, rt_id: String(options[0].id) };
        });
      })
      .catch(() => toast.error('Gagal memuat data RT'))
      .finally(() => setLoadingRtList(false));
  }, [user?.role, user?.rt_id]);

  useEffect(() => {
    setLoadingCurrentDesa(true);
    api.get('/current_desa.php')
      .then((res) => setCurrentDesa(res.data))
      .catch(() => setCurrentDesa(null))
      .finally(() => setLoadingCurrentDesa(false));
  }, []);

  const applyCurrentDesaData = () => {
    if (!currentDesa) {
      return;
    }

    setForm((current) => ({
      ...current,
      kelurahan: toUppercase(currentDesa.nama_desa || ''),
      kecamatan: toUppercase(currentDesa.kecamatan || ''),
      kabupaten: toUppercase(currentDesa.kabupaten || ''),
      provinsi: toUppercase(currentDesa.provinsi || ''),
    }));

    toast.success('Data desa sekarang berhasil digunakan');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditing) {
        await api.put('/keluarga.php', { ...form, id });
        toast.success('Data keluarga berhasil diupdate');
      } else {
        await api.post('/keluarga.php', form);
        toast.success('Data keluarga berhasil ditambahkan');
      }

      navigate('/keluarga');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan data keluarga');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-panel">
        <div className="app-panel-body py-16 text-center text-sm text-slate-500">Memuat form keluarga...</div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Form Kartu Keluarga"
        title={isEditing ? 'Edit Kartu Keluarga' : 'Tambah Kartu Keluarga'}
        description="Halaman ini khusus untuk pengisian data KK agar proses input lebih fokus dan daftar keluarga tetap bersih untuk ditelusuri."
        actions={(
          <Link to="/keluarga" className="app-button-secondary">
            <FiArrowLeft size={18} />
            Kembali ke Daftar
          </Link>
        )}
      />

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="app-panel-title">{isEditing ? 'Edit Data Keluarga' : 'Tambah Data Keluarga Baru'}</h3>
            <p className="app-panel-description">Isi identitas kepala keluarga dan alamat utama. Detail anggota keluarga dapat dikelola setelah data KK tersimpan.</p>
          </div>
          <span className="app-chip">{isEditing ? 'Mode edit' : 'Form baru'}</span>
        </div>

        <div className="app-panel-body">
          {user?.role === 'rt' && (
            <div className="mb-6 rounded-[20px] border border-slate-200/80 bg-white/80 px-4 py-4 text-sm leading-6 text-slate-600">
              RT tujuan mengikuti akun RT yang sedang login, jadi Anda tidak perlu memilih RT secara manual.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-5">
              <div className="mb-5">
                <h4 className="text-base font-semibold text-slate-950">Data Kartu Keluarga</h4>
                <p className="mt-1 text-sm leading-6 text-slate-500">Informasi dokumen KK dan alamat domisili utama keluarga.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {user?.role !== 'rt' && (
                  <div>
                    <label className="app-label">RT *</label>
                    <select
                      value={form.rt_id}
                      onChange={(e) => setField('rt_id', e.target.value)}
                      className="app-select uppercase"
                      required
                    >
                      <option value="">{loadingRtList ? 'Memuat RT...' : 'Pilih RT'}</option>
                      {rtList.map((rt) => (
                        <option key={rt.id} value={rt.id}>RT {rt.nomor_rt} / RW {rt.nomor_rw}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="app-label">No. Kartu Keluarga *</label>
                  <input
                    type="text"
                    value={form.no_kk}
                    onChange={handleDigitChange('no_kk', 16)}
                    className="app-input"
                    maxLength="16"
                    placeholder="16 digit"
                    required
                  />
                </div>

                <div>
                  <label className="app-label">Status KK *</label>
                  <select
                    value={form.status_kk}
                    onChange={(e) => setField('status_kk', e.target.value)}
                    className="app-select uppercase"
                    required
                  >
                    <option value="Menetap">Menetap</option>
                    <option value="Tidak Menetap">Tidak Menetap</option>
                  </select>
                </div>

                <div>
                  <label className="app-label">Kode Pos</label>
                  <input
                    type="text"
                    value={form.kode_pos}
                    onChange={handleDigitChange('kode_pos', 5)}
                    className="app-input"
                    maxLength="5"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="app-label">Alamat *</label>
                  <input
                    type="text"
                    value={form.alamat}
                    onChange={handleUppercaseChange('alamat')}
                    className="app-input uppercase"
                    required
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-3 rounded-[20px] border border-dashed border-slate-200 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Gunakan data desa sekarang</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {currentDesa
                        ? `Autofill dari ${currentDesa.nama_desa}${currentDesa.kecamatan ? `, ${currentDesa.kecamatan}` : ''}`
                        : 'Data desa aktif belum tersedia untuk akun ini atau belum dilengkapi.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={applyCurrentDesaData}
                    disabled={!currentDesa || loadingCurrentDesa}
                    className="app-button-secondary whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiMapPin size={17} />
                    {loadingCurrentDesa ? 'Memuat Data Desa...' : 'Pakai Data Desa Sekarang'}
                  </button>
                </div>

                <div>
                  <label className="app-label">Desa/Kelurahan</label>
                  <input
                    type="text"
                    value={form.kelurahan}
                    onChange={handleUppercaseChange('kelurahan')}
                    className="app-input uppercase"
                  />
                </div>

                <div>
                  <label className="app-label">Kecamatan</label>
                  <input
                    type="text"
                    value={form.kecamatan}
                    onChange={handleUppercaseChange('kecamatan')}
                    className="app-input uppercase"
                  />
                </div>

                <div>
                  <label className="app-label">Kabupaten/Kota</label>
                  <input
                    type="text"
                    value={form.kabupaten}
                    onChange={handleUppercaseChange('kabupaten')}
                    className="app-input uppercase"
                  />
                </div>

                <div>
                  <label className="app-label">Provinsi</label>
                  <input
                    type="text"
                    value={form.provinsi}
                    onChange={handleUppercaseChange('provinsi')}
                    className="app-input uppercase"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h4 className="text-base font-semibold text-slate-950">Data Kepala Keluarga</h4>
                <p className="mt-1 text-sm leading-6 text-slate-500">Data ini akan menjadi profil utama kepala keluarga dan otomatis muncul di daftar anggota KK.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="app-label">Nama Kepala Keluarga *</label>
                  <input
                    type="text"
                    value={form.kepala_keluarga}
                    onChange={handleUppercaseChange('kepala_keluarga')}
                    className="app-input uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="app-label">NIK Kepala Keluarga *</label>
                  <input
                    type="text"
                    value={form.nik_kepala}
                    onChange={handleDigitChange('nik_kepala', 16)}
                    className="app-input"
                    maxLength="16"
                    placeholder="16 digit"
                    required
                  />
                </div>

                <div>
                  <label className="app-label">Jenis Kelamin *</label>
                  <select
                    value={form.kepala_jenis_kelamin}
                    onChange={(e) => setField('kepala_jenis_kelamin', e.target.value)}
                    className="app-select uppercase"
                    required
                  >
                    <option value="">Pilih</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="app-label">Tempat Lahir *</label>
                  <input
                    type="text"
                    value={form.kepala_tempat_lahir}
                    onChange={handleUppercaseChange('kepala_tempat_lahir')}
                    className="app-input uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="app-label">Tanggal Lahir *</label>
                  <input
                    type="date"
                    value={form.kepala_tanggal_lahir}
                    onChange={(e) => setField('kepala_tanggal_lahir', e.target.value)}
                    className="app-input"
                    required
                  />
                </div>

                <div>
                  <label className="app-label">Agama *</label>
                  <select
                    value={form.kepala_agama}
                    onChange={(e) => setField('kepala_agama', e.target.value)}
                    className="app-select uppercase"
                    required
                  >
                    <option value="">Pilih</option>
                    {agamaOptions.map((agama) => (
                      <option key={agama} value={agama}>{agama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="app-label">Jenis Pekerjaan *</label>
                  <input
                    type="text"
                    value={form.kepala_pekerjaan}
                    onChange={handleUppercaseChange('kepala_pekerjaan')}
                    className="app-input uppercase"
                    required
                  />
                </div>
              </div>
            </section>

            <div className="app-inline-actions">
              <button type="submit" className="app-button-primary" disabled={saving}>
                <FiSave size={18} />
                {saving ? 'Menyimpan...' : 'Simpan Data'}
              </button>
              <Link to="/keluarga" className="app-button-secondary">Batal</Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}