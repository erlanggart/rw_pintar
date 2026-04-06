import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiChevronRight } from 'react-icons/fi';
import AppPageHeader from '../components/AppPageHeader';
import WilayahFilterToolbar from '../components/WilayahFilterToolbar';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function PendudukPage() {
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
  const [search, setSearch] = useState('');

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

    const requestUrl = params.toString() ? `/penduduk.php?${params.toString()}` : '/penduduk.php';
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

  if (loading) {
    return (
      <div className="app-panel">
        <div className="app-panel-body py-16 text-center text-sm text-slate-500">Memuat data penduduk...</div>
      </div>
    );
  }

  const filtered = data.filter((penduduk) =>
    penduduk.nama_lengkap?.toLowerCase().includes(search.toLowerCase()) ||
    penduduk.nik?.includes(search) ||
    penduduk.no_kk?.includes(search)
  );

  const hasWilayahFilter = Boolean(selectedDesaId || selectedRwId || selectedRtId);
  const emptyMessage = search
    ? 'Tidak ada hasil pencarian yang cocok.'
    : hasWilayahFilter
      ? 'Tidak ada data penduduk pada filter wilayah ini.'
      : 'Belum ada data penduduk.';
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

  const totalLakiLaki = data.filter((penduduk) => penduduk.jenis_kelamin === 'L').length;
  const totalPerempuan = data.filter((penduduk) => penduduk.jenis_kelamin === 'P').length;
  const heroStats = [
    {
      kicker: 'Total Penduduk',
      value: data.length,
      label: 'Jumlah warga yang tersimpan pada seluruh kartu keluarga yang tersedia.',
    },
    {
      kicker: 'Laki-laki',
      value: totalLakiLaki,
      label: 'Penduduk berjenis kelamin laki-laki pada data yang telah tercatat.',
    },
    {
      kicker: 'Perempuan',
      value: totalPerempuan,
      label: 'Penduduk berjenis kelamin perempuan pada data yang telah tercatat.',
    },
  ];

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Data Penduduk"
        title="Daftar Penduduk"
        description="Tampilan pencarian penduduk dibuat lebih bersih agar operator dapat menelusuri nama, NIK, dan nomor KK dengan cepat dari desktop maupun mobile."
        stats={heroStats}
      />

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="app-panel-title">Pencarian Penduduk</h3>
            <p className="app-panel-description">Cari berdasarkan nama lengkap, NIK, atau nomor kartu keluarga.</p>
          </div>
          <span className="app-chip">{filtered.length} penduduk</span>
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
          trailingContent={(
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NIK, atau No. KK..."
              className="app-search"
            />
          )}
        />

        <div className="space-y-3 p-4 sm:p-6 md:hidden">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500">
              {emptyMessage}
            </div>
          ) : filtered.map((penduduk) => (
            <Link
              key={penduduk.id}
              to={`/penduduk/${penduduk.id}`}
              className="block rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm transition hover:border-slate-300 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-950">{penduduk.nama_lengkap}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">{penduduk.nik}</p>
                </div>
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                  <FiChevronRight size={16} />
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`app-badge ${penduduk.jenis_kelamin === 'L' ? 'app-badge-sky' : 'app-badge-rose'}`}>
                  {penduduk.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
                <span className="app-badge app-badge-neutral">KK {penduduk.no_kk}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="hidden md:block">
          <div className="app-table-scroll">
            <table className="app-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIK</th>
                  <th>Nama</th>
                  <th>Gender</th>
                  <th>Agama</th>
                  <th>Status</th>
                  <th>Pekerjaan</th>
                  <th>No. KK</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="app-empty-row">{emptyMessage}</td>
                  </tr>
                ) : filtered.map((penduduk, index) => (
                  <tr key={penduduk.id}>
                    <td>{index + 1}</td>
                    <td className="font-mono text-xs text-slate-500">{penduduk.nik}</td>
                    <td>
                      <Link to={`/penduduk/${penduduk.id}`} className="font-semibold text-slate-900 transition hover:text-slate-600">
                        {penduduk.nama_lengkap}
                      </Link>
                    </td>
                    <td>
                      <span className={`app-badge ${penduduk.jenis_kelamin === 'L' ? 'app-badge-sky' : 'app-badge-rose'}`}>
                        {penduduk.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </td>
                    <td>{penduduk.agama}</td>
                    <td>{penduduk.status_perkawinan}</td>
                    <td>{penduduk.pekerjaan || '-'}</td>
                    <td className="font-mono text-xs text-slate-500">{penduduk.no_kk}</td>
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
