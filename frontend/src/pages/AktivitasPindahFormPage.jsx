import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import AppPageHeader from '../components/AppPageHeader';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const createEmptyForm = () => ({
  rt_id: '',
  penduduk_id: '',
  keluarga_id: '',
  tanggal_aktivitas: '',
  keterangan: '',
  alamat_tujuan: '',
  alasan_pindah: '',
});

function toUppercase(value) {
  return value.toUpperCase();
}

export default function AktivitasPindahFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rtList, setRtList] = useState([]);
  const [loadingRtList, setLoadingRtList] = useState(false);
  const [pendudukList, setPendudukList] = useState([]);
  const [keluargaList, setKeluargaList] = useState([]);
  const [loadingReferences, setLoadingReferences] = useState(false);
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
      setPendudukList([]);
      setKeluargaList([]);
      setForm((current) => {
        if (!current.penduduk_id && !current.keluarga_id) {
          return current;
        }

        return { ...current, penduduk_id: '', keluarga_id: '' };
      });
      return;
    }

    setLoadingReferences(true);
    Promise.all([
      api.get(`/penduduk.php?rt_id=${activeRtId}`),
      api.get(`/keluarga.php?rt_id=${activeRtId}`),
    ])
      .then(([pendudukRes, keluargaRes]) => {
        setPendudukList(pendudukRes.data || []);
        setKeluargaList(keluargaRes.data || []);
      })
      .catch(() => toast.error('Gagal memuat data referensi aktivitas'))
      .finally(() => setLoadingReferences(false));
  }, [activeRtId]);

  const handleRtChange = (value) => {
    setForm((current) => ({ ...current, rt_id: value, penduduk_id: '', keluarga_id: '' }));
  };

  const handlePendudukChange = (value) => {
    const selectedPenduduk = pendudukList.find((item) => String(item.id) === String(value));
    setForm((current) => ({
      ...current,
      penduduk_id: value,
      keluarga_id: selectedPenduduk?.keluarga_id ? String(selectedPenduduk.keluarga_id) : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post('/aktivitas.php', { ...form, jenis_aktivitas: 'Pindah' });
      toast.success('Data pindah berhasil dicatat');
      navigate('/aktivitas/pindah');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mencatat pindah');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Form Aktivitas"
        title="Catat Perpindahan"
        description="Halaman ini khusus untuk pencatatan penduduk pindah supaya operator fokus pada pengisian tujuan dan alasan perpindahan."
        actions={(
          <Link to="/aktivitas/pindah" className="app-button-secondary">
            <FiArrowLeft size={18} />
            Kembali ke Daftar
          </Link>
        )}
      />

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="app-panel-title">Form Pencatatan Pindah</h3>
            <p className="app-panel-description">Pilih penduduk yang pindah dan lengkapi tujuan serta alasan kepindahan.</p>
          </div>
          <span className="app-chip">Pindah</span>
        </div>
        <div className="app-panel-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                <label className="app-label">Tanggal Pindah *</label>
                <input type="date" value={form.tanggal_aktivitas} onChange={(e) => setForm({ ...form, tanggal_aktivitas: e.target.value })} className="app-input" required />
              </div>
              <div>
                <label className="app-label">Penduduk *</label>
                <select value={form.penduduk_id} onChange={(e) => handlePendudukChange(e.target.value)} className="app-select uppercase" disabled={!activeRtId || loadingReferences} required>
                  <option value="">{!activeRtId && user?.role !== 'rt' ? 'Pilih RT lebih dulu' : loadingReferences ? 'Memuat penduduk...' : 'Pilih penduduk'}</option>
                  {pendudukList.map((p) => (
                    <option key={p.id} value={p.id}>{p.nik} — {p.nama_lengkap}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="app-label">Keluarga (KK)</label>
                <select value={form.keluarga_id} onChange={(e) => setField('keluarga_id', e.target.value)} className="app-select uppercase" disabled={!activeRtId || loadingReferences}>
                  <option value="">{!activeRtId && user?.role !== 'rt' ? 'Pilih RT lebih dulu' : loadingReferences ? 'Memuat keluarga...' : 'Pilih keluarga'}</option>
                  {keluargaList.map((k) => (
                    <option key={k.id} value={k.id}>{k.no_kk} — {k.kepala_keluarga}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-xl border border-amber-100 bg-amber-50/80 p-4 md:grid-cols-2">
              <div>
                <label className="app-label">Alamat Tujuan *</label>
                <textarea value={form.alamat_tujuan} onChange={(e) => setField('alamat_tujuan', toUppercase(e.target.value))} className="app-textarea uppercase" rows="3" required />
              </div>
              <div>
                <label className="app-label">Alasan Pindah</label>
                <input type="text" value={form.alasan_pindah} onChange={(e) => setField('alasan_pindah', toUppercase(e.target.value))} className="app-input uppercase" />
              </div>
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
              <Link to="/aktivitas/pindah" className="app-button-secondary">Batal</Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}