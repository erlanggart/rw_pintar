import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import AppPageHeader from '../components/AppPageHeader';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const createEmptyForm = () => ({
  rt_id: '',
  keluarga_id: '',
  tanggal_aktivitas: '',
  keterangan: '',
  alamat_asal: '',
});

function toUppercase(value) {
  return value.toUpperCase();
}

export default function AktivitasDatangFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rtList, setRtList] = useState([]);
  const [loadingRtList, setLoadingRtList] = useState(false);
  const [keluargaList, setKeluargaList] = useState([]);
  const [loadingKeluargaList, setLoadingKeluargaList] = useState(false);
  const [form, setForm] = useState(createEmptyForm());
  const [saving, setSaving] = useState(false);
  const activeRtId = user?.role === 'rt' ? String(user?.rt_id || '') : form.rt_id;

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

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
    if (!activeRtId) {
      setKeluargaList([]);
      setForm((current) => (current.keluarga_id ? { ...current, keluarga_id: '' } : current));
      return;
    }

    setLoadingKeluargaList(true);
    api.get(`/keluarga.php?rt_id=${activeRtId}`)
      .then((res) => setKeluargaList(res.data || []))
      .catch(() => toast.error('Gagal memuat data keluarga'))
      .finally(() => setLoadingKeluargaList(false));
  }, [activeRtId]);

  const handleRtChange = (value) => {
    setForm((current) => ({ ...current, rt_id: value, keluarga_id: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post('/aktivitas.php', { ...form, jenis_aktivitas: 'Datang' });
      toast.success('Data kedatangan berhasil dicatat');
      navigate('/aktivitas/datang');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mencatat kedatangan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Form Aktivitas"
        title="Catat Kedatangan"
        description="Halaman ini khusus untuk pencatatan warga datang agar input alamat asal dan keluarga terkait tidak membingungkan operator."
        actions={(
          <Link to="/aktivitas/datang" className="app-button-secondary">
            <FiArrowLeft size={18} />
            Kembali ke Daftar
          </Link>
        )}
      />

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="app-panel-title">Form Pencatatan Kedatangan</h3>
            <p className="app-panel-description">Catat warga baru yang datang ke wilayah beserta alamat asalnya.</p>
          </div>
          <span className="app-chip">Kedatangan</span>
        </div>
        <div className="app-panel-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {user?.role !== 'rt' && (
                <div>
                  <label className="app-label">RT *</label>
                  <select value={form.rt_id} onChange={(e) => handleRtChange(e.target.value)} className="app-select uppercase" required>
                    <option value="">{loadingRtList ? 'Memuat RT...' : 'Pilih RT'}</option>
                    {rtList.map((rt) => (
                      <option key={rt.id} value={rt.id}>RT {rt.nomor_rt} / RW {rt.nomor_rw}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="app-label">Tanggal Datang *</label>
                <input type="date" value={form.tanggal_aktivitas} onChange={(e) => setForm({ ...form, tanggal_aktivitas: e.target.value })} className="app-input" required />
              </div>
              <div>
                <label className="app-label">Keluarga (KK)</label>
                <select value={form.keluarga_id} onChange={(e) => setField('keluarga_id', e.target.value)} className="app-select uppercase" disabled={!activeRtId || loadingKeluargaList}>
                  <option value="">{!activeRtId && user?.role !== 'rt' ? 'Pilih RT lebih dulu' : loadingKeluargaList ? 'Memuat keluarga...' : 'Pilih keluarga'}</option>
                  {keluargaList.map((k) => (
                    <option key={k.id} value={k.id}>{k.no_kk} — {k.kepala_keluarga}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-4">
              <label className="app-label">Alamat Asal *</label>
              <textarea value={form.alamat_asal} onChange={(e) => setField('alamat_asal', toUppercase(e.target.value))} className="app-textarea uppercase" rows="3" required />
            </div>

            <div>
              <label className="app-label">Keterangan</label>
              <textarea value={form.keterangan} onChange={(e) => setField('keterangan', toUppercase(e.target.value))} className="app-textarea uppercase" rows="3" />
            </div>

            <div className="app-inline-actions">
              <button type="submit" className="app-button-primary" disabled={saving}>
                <FiSave size={18} />
                {saving ? 'Menyimpan...' : 'Simpan Data'}
              </button>
              <Link to="/aktivitas/datang" className="app-button-secondary">Batal</Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}