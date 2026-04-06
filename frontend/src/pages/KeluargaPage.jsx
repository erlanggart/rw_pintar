import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiEdit2, FiEye, FiPlus, FiTrash2 } from 'react-icons/fi';
import AppPageHeader from '../components/AppPageHeader';
import WilayahFilterToolbar from '../components/WilayahFilterToolbar';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function KeluargaPage() {
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

    const requestUrl = params.toString() ? `/keluarga.php?${params.toString()}` : '/keluarga.php';
    api.get(requestUrl).then((res) => setData(res.data)).catch(() => toast.error('Gagal memuat data')).finally(() => setLoading(false));
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
    if (!confirm('Yakin ingin menghapus data keluarga ini? Semua data anggota juga akan terhapus.')) return;

    try {
      await api.delete(`/keluarga.php?id=${id}`);
      toast.success('Data keluarga berhasil dihapus');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus');
    }
  };

  const totalAnggota = data.reduce((sum, item) => sum + Number(item.jumlah_anggota || 0), 0);
  const hasWilayahFilter = Boolean(selectedDesaId || selectedRwId || selectedRtId);
  const emptyMessage = hasWilayahFilter ? 'Tidak ada data keluarga pada filter wilayah ini.' : 'Belum ada data keluarga.';
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
  const stats = [
    {
      kicker: 'Total KK',
      value: data.length,
      label: 'Jumlah kartu keluarga yang sudah tercatat di wilayah aktif Anda.',
    },
    {
      kicker: 'Total Anggota',
      value: totalAnggota,
      label: 'Akumulasi anggota keluarga dari seluruh data KK yang tersedia.',
    },
    {
      kicker: 'Cakupan RT',
      value: new Set(data.map((item) => item.nomor_rt).filter(Boolean)).size,
      label: 'Jumlah RT yang sudah memiliki data keluarga di sistem.',
    },
  ];

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Administrasi Keluarga"
        title="Data Kartu Keluarga"
        description="Kelola data keluarga dengan format yang lebih bersih dan mudah dibaca. Form tambah dan edit kini dipisah ke halaman khusus agar daftar KK tetap fokus sebagai area penelusuran data."
        stats={stats}
        actions={(
          <Link to="/keluarga/tambah" className="app-button-primary">
            <FiPlus size={18} />
            Tambah KK
          </Link>
        )}
      />

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="app-panel-title">Daftar Kartu Keluarga</h3>
            <p className="app-panel-description">Klik detail untuk melihat anggota keluarga dan mengelola data penduduk yang terhubung dengan KK tersebut.</p>
          </div>
          <span className="app-chip">{data.length} keluarga</span>
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
              Memuat data keluarga...
            </div>
          ) : data.length === 0 ? (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500">
              {emptyMessage}
            </div>
          ) : data.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm">
              <Link to={`/keluarga/${item.id}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-slate-950">{item.kepala_keluarga}</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">{item.no_kk}</p>
                  </div>
                  <span className="app-icon-button text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
                    <FiEye size={16} />
                  </span>
                </div>
              </Link>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`app-badge ${item.status_kk === 'Menetap' ? 'app-badge-emerald' : 'app-badge-amber'}`}>
                  {item.status_kk || 'Menetap'}
                </span>
                <span className="app-badge app-badge-neutral">RT {item.nomor_rt} / RW {item.nomor_rw}</span>
                <span className="app-badge app-badge-sky">{item.jumlah_anggota} orang</span>
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  to={`/keluarga/${item.id}/edit`}
                  className="app-icon-button text-sky-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                  title="Edit keluarga"
                >
                  <FiEdit2 size={16} />
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="app-icon-button text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  title="Hapus keluarga"
                >
                  <FiTrash2 size={16} />
                </button>
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
                  <th>No. KK</th>
                  <th>Kepala Keluarga</th>
                  <th>NIK Kepala</th>
                  <th>Alamat</th>
                  <th>RT/RW</th>
                  <th>Status</th>
                  <th>Anggota</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="app-empty-row">Memuat data keluarga...</td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="app-empty-row">{emptyMessage}</td>
                  </tr>
                ) : data.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td className="font-mono text-xs text-slate-500">{item.no_kk}</td>
                    <td className="font-semibold text-slate-900">{item.kepala_keluarga}</td>
                    <td className="font-mono text-xs text-slate-500">{item.nik_kepala || '-'}</td>
                    <td className="max-w-[260px] leading-6 text-slate-600">{item.alamat}</td>
                    <td>
                      <span className="app-badge app-badge-neutral">RT {item.nomor_rt} / RW {item.nomor_rw}</span>
                    </td>
                    <td>
                      <span className={`app-badge ${item.status_kk === 'Menetap' ? 'app-badge-emerald' : 'app-badge-amber'}`}>
                        {item.status_kk || 'Menetap'}
                      </span>
                    </td>
                    <td>
                      <span className="app-badge app-badge-sky">{item.jumlah_anggota} orang</span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link
                          to={`/keluarga/${item.id}/edit`}
                          className="app-icon-button text-sky-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                          title="Edit keluarga"
                        >
                          <FiEdit2 size={16} />
                        </Link>
                        <Link
                          to={`/keluarga/${item.id}`}
                          className="app-icon-button text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                          title="Lihat detail keluarga"
                        >
                          <FiEye size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="app-icon-button text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                          title="Hapus keluarga"
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
        </div>
      </section>
    </div>
  );
}
