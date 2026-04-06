import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import AppPageHeader from '../components/AppPageHeader';
import WilayahFilterToolbar from '../components/WilayahFilterToolbar';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

function formatUppercaseValue(value, fallback = '-') {
  if (!value) {
    return fallback;
  }

  return String(value).toUpperCase();
}

export default function AktivitasPindahPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [desaList, setDesaList] = useState([]);
  const [rwList, setRwList] = useState([]);
  const [rtList, setRtList] = useState([]);
  const [selectedDesaId, setSelectedDesaId] = useState('');
  const [selectedRwId, setSelectedRwId] = useState('');
  const [selectedRtId, setSelectedRtId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingRtList, setLoadingRtList] = useState(false);

  const filteredRwOptions = user?.role === 'superadmin' && selectedDesaId
    ? rwList.filter((rw) => String(rw.desa_id) === String(selectedDesaId))
    : rwList;
  const selectedDesa = desaList.find((desa) => String(desa.id) === String(selectedDesaId));
  const selectedRw = rwList.find((rw) => String(rw.id) === String(selectedRwId));
  const selectedRt = rtList.find((rt) => String(rt.id) === String(selectedRtId));

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedRtId) {
      params.set('rt_id', selectedRtId);
    } else if ((user?.role === 'superadmin' || user?.role === 'desa') && selectedRwId) {
      params.set('rw_id', selectedRwId);
    } else if (user?.role === 'superadmin' && selectedDesaId) {
      params.set('desa_id', selectedDesaId);
    }
    params.set('jenis', 'Pindah');

    api.get(`/aktivitas.php?${params.toString()}`)
      .then((res) => setData(res.data))
      .catch(() => toast.error('Gagal memuat data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.role === 'superadmin') {
      api.get('/desa.php').then((res) => setDesaList(res.data)).catch(() => {});
      api.get('/rw.php').then((res) => setRwList(res.data)).catch(() => {});
    } else if (user?.role === 'desa') {
      api.get('/rw.php').then((res) => setRwList(res.data)).catch(() => {});
    }
  }, [user?.role]);

  useEffect(() => {
    if (!user?.role) {
      return;
    }

    if (user.role === 'rt') {
      setSelectedRtId(String(user.rt_id || ''));
      return;
    }

    if (!['superadmin', 'desa', 'rw'].includes(user.role)) {
      return;
    }

    setLoadingRtList(true);
    const params = new URLSearchParams();
    if (user.role === 'superadmin' && selectedDesaId) {
      params.set('desa_id', selectedDesaId);
    }
    if ((user.role === 'superadmin' || user.role === 'desa') && selectedRwId) {
      params.set('rw_id', selectedRwId);
    }

    const requestUrl = params.toString() ? `/rt.php?${params.toString()}` : '/rt.php';
    api.get(requestUrl)
      .then((res) => setRtList(res.data || []))
      .catch(() => setRtList([]))
      .finally(() => setLoadingRtList(false));
  }, [user?.role, user?.rt_id, selectedDesaId, selectedRwId]);

  useEffect(() => {
    fetchData();
  }, [user?.role, selectedDesaId, selectedRwId, selectedRtId]);

  const handleSelectedDesaChange = (value) => {
    setSelectedDesaId(value);
    setSelectedRwId('');
    setSelectedRtId('');
  };

  const handleSelectedRwChange = (value) => {
    setSelectedRwId(value);
    setSelectedRtId('');
  };

  const handleResetFilters = () => {
    setSelectedDesaId('');
    setSelectedRwId('');
    setSelectedRtId(user?.role === 'rt' ? String(user.rt_id || '') : '');
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus data pindah ini?')) return;

    try {
      await api.delete(`/aktivitas.php?id=${id}`);
      toast.success('Data pindah berhasil dihapus');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus');
    }
  };

  const stats = [
    { kicker: 'Total Pindah', value: data.length },
    { kicker: 'Bulan Ini', value: data.filter((d) => { const now = new Date(); const t = new Date(d.tanggal_aktivitas); return t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear(); }).length },
    { kicker: 'Keluarga Terdampak', value: new Set(data.map((d) => d.keluarga_id).filter(Boolean)).size },
  ];
  const hasWilayahFilter = Boolean(selectedDesaId || selectedRwId || selectedRtId);
  const emptyMessage = hasWilayahFilter ? 'Tidak ada data perpindahan pada filter wilayah ini.' : 'Belum ada data perpindahan.';
  const summaryItems = [
    (user?.role === 'superadmin' && selectedDesa) ? { label: 'Desa', value: selectedDesa.nama_desa } : null,
    ((user?.role === 'superadmin' || user?.role === 'desa') && selectedRw) ? { label: 'RW', value: `RW ${selectedRw.nomor_rw}` } : null,
    ((user?.role === 'superadmin' || user?.role === 'desa' || user?.role === 'rw') && selectedRt) ? { label: 'RT', value: `RT ${selectedRt.nomor_rt}` } : null,
    user?.role === 'rt' ? { label: 'Scope', value: 'RT akun aktif', resettable: false } : null,
  ].filter(Boolean);
  const emptySummaryLabel = user?.role === 'rt'
    ? 'Hanya RT akun ini'
    : user?.role === 'rw'
      ? 'Semua RT di RW ini'
      : user?.role === 'desa'
        ? 'Semua RW dan RT di desa ini'
        : 'Semua wilayah';

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Aktivitas — Pindah"
        title="Catatan Perpindahan"
        description="Daftar pencatatan penduduk yang pindah dari wilayah Anda. Input data baru dilakukan pada halaman form terpisah agar operator tidak bingung."
        stats={stats}
        actions={(
          <Link to="/aktivitas/pindah/tambah" className="app-button-primary">
            <FiPlus size={18} />
            Catat Pindah
          </Link>
        )}
      />

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="app-panel-title">Daftar Perpindahan</h3>
            <p className="app-panel-description">Catatan perpindahan penduduk yang sudah tersimpan.</p>
          </div>
          <span className="app-chip">{data.length} catatan</span>
        </div>
        <WilayahFilterToolbar
          role={user?.role}
          desaList={desaList}
          rwList={filteredRwOptions}
          rtList={rtList}
          selectedDesaId={selectedDesaId}
          selectedRwId={selectedRwId}
          selectedRtId={selectedRtId}
          onDesaChange={handleSelectedDesaChange}
          onRwChange={handleSelectedRwChange}
          onRtChange={setSelectedRtId}
          onReset={handleResetFilters}
          loadingRtList={loadingRtList}
          summaryItems={summaryItems}
          emptySummaryLabel={emptySummaryLabel}
        />
        <div className="space-y-3 p-4 sm:p-6 md:hidden">
          {loading ? (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500">
              Memuat data perpindahan...
            </div>
          ) : data.length === 0 ? (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500">
              {emptyMessage}
            </div>
          ) : data.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-950 uppercase">{formatUppercaseValue(item.nama_penduduk, 'PENDUDUK TIDAK DIKETAHUI')}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">KK {item.no_kk || '-'}</p>
                </div>
                <button type="button" onClick={() => handleDelete(item.id)} className="app-icon-button text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700" title="Hapus">
                  <FiTrash2 size={16} />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="app-badge app-badge-amber">{item.tanggal_aktivitas}</span>
              </div>

              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <p><span className="font-semibold text-slate-800">Alamat tujuan:</span> <span className="uppercase">{formatUppercaseValue(item.alamat_tujuan)}</span></p>
                <p><span className="font-semibold text-slate-800">Alasan:</span> <span className="uppercase">{formatUppercaseValue(item.alasan_pindah)}</span></p>
                <p className="uppercase">{formatUppercaseValue(item.keterangan, 'TANPA KETERANGAN.')}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block">
          <div className="app-table-scroll">
            <table className="app-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>Nama Penduduk</th>
                  <th>No. KK</th>
                  <th>Alamat Tujuan</th>
                  <th>Alasan</th>
                  <th>Keterangan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="app-empty-row">Memuat data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan="8" className="app-empty-row">{emptyMessage}</td></tr>
                ) : data.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td>{item.tanggal_aktivitas}</td>
                    <td className="font-medium text-slate-900 uppercase">{formatUppercaseValue(item.nama_penduduk)}</td>
                    <td className="font-mono text-xs text-slate-500">{item.no_kk || '-'}</td>
                    <td className="max-w-[200px] leading-6 text-slate-600 uppercase">{formatUppercaseValue(item.alamat_tujuan)}</td>
                    <td className="text-slate-700 uppercase">{formatUppercaseValue(item.alasan_pindah)}</td>
                    <td className="max-w-[200px] leading-6 text-slate-600 uppercase">{formatUppercaseValue(item.keterangan)}</td>
                    <td>
                      <button type="button" onClick={() => handleDelete(item.id)} className="app-icon-button text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700" title="Hapus">
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
