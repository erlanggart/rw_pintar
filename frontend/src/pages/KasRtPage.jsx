import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiArrowUpCircle, FiArrowDownCircle, FiSearch,
} from 'react-icons/fi';
import AppPageHeader from '../components/AppPageHeader';

const BULAN_NAMA = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const KATEGORI_PEMASUKAN = ['Iuran Warga', 'Donasi', 'Subsidi RW', 'Subsidi Desa', 'Lainnya'];
const KATEGORI_PENGELUARAN = ['Kebersihan', 'Keamanan', 'Sosial', 'Administrasi', 'Perbaikan Fasilitas', 'Konsumsi', 'Lainnya'];

function formatRupiah(val) {
  if (val === undefined || val === null) return '-';
  return 'Rp ' + Number(val).toLocaleString('id-ID');
}

function formatTanggal(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getDate()} ${BULAN_NAMA[d.getMonth() + 1]} ${d.getFullYear()}`;
}

function bulanOptions() {
  return BULAN_NAMA.slice(1).map((nama, i) => ({ value: i + 1, label: nama }));
}

function tahunOptions() {
  const y = new Date().getFullYear();
  return [y + 1, y, y - 1, y - 2].map((t) => ({ value: t, label: String(t) }));
}

// ── Transaction Form Modal ─────────────────────────────────────────────────

function KasFormModal({ existing, onSave, onClose }) {
  const isEdit = !!existing?.id;
  const [jenis, setJenis] = useState(existing?.jenis ?? 'pemasukan');
  const [kategori, setKategori] = useState(existing?.kategori ?? '');
  const [jumlah, setJumlah] = useState(existing?.jumlah ? String(existing.jumlah) : '');
  const [keterangan, setKeterangan] = useState(existing?.keterangan ?? '');
  const [tanggal, setTanggal] = useState(existing?.tanggal ?? new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const kategoriOptions = jenis === 'pemasukan' ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!jumlah || Number(jumlah) <= 0) return toast.error('Jumlah harus lebih dari 0');
    if (!tanggal) return toast.error('Tanggal wajib diisi');

    setLoading(true);
    try {
      const payload = {
        jenis,
        kategori: kategori || 'Lainnya',
        jumlah: Number(jumlah),
        keterangan,
        tanggal,
      };

      if (isEdit) {
        await api.put(`/kas_rt.php?id=${existing.id}`, payload);
        toast.success('Transaksi diperbarui');
      } else {
        await api.post('/kas_rt.php', payload);
        toast.success('Transaksi berhasil dicatat');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </h3>
          <button onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* jenis */}
          <div>
            <label className="app-label">Jenis Transaksi *</label>
            <div className="flex gap-3">
              {[
                { value: 'pemasukan', label: 'Pemasukan', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
                { value: 'pengeluaran', label: 'Pengeluaran', color: 'bg-red-50 text-red-600 border-red-200' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isEdit}
                  onClick={() => { setJenis(opt.value); setKategori(''); }}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${jenis === opt.value ? opt.color : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'} ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* kategori */}
          <div>
            <label className="app-label">Kategori</label>
            <select className="app-select" value={kategori} onChange={(e) => setKategori(e.target.value)}>
              <option value="">-- Pilih Kategori --</option>
              {kategoriOptions.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          {/* jumlah */}
          <div>
            <label className="app-label">Jumlah (Rp) *</label>
            <input
              type="number"
              min="1"
              className="app-input"
              placeholder="Contoh: 100000"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
              required
            />
          </div>

          {/* tanggal */}
          <div>
            <label className="app-label">Tanggal *</label>
            <input
              type="date"
              className="app-input"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required
            />
          </div>

          {/* keterangan */}
          <div>
            <label className="app-label">Keterangan</label>
            <input
              type="text"
              className="app-input"
              placeholder="Uraian transaksi..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
            />
          </div>

          <div className="app-inline-actions">
            <button type="button" onClick={onClose} className="app-button-secondary flex-1">Batal</button>
            <button type="submit" disabled={loading} className="app-button-primary flex-1">
              {loading ? 'Menyimpan...' : isEdit ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────

function DeleteModal({ item, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await api.delete(`/kas_rt.php?id=${item.id}`);
      toast.success('Transaksi dihapus');
      onConfirm();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus transaksi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-900">Hapus Transaksi?</h3>
        <p className="mt-2 text-sm text-slate-500">
          {item.kategori} — {formatRupiah(item.jumlah)} pada {formatTanggal(item.tanggal)} akan dihapus permanen.
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="app-button-secondary flex-1">Batal</button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 transition"
          >
            {loading ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function KasRtPage() {
  const { user } = useAuth();
  const isRT = user?.role === 'rt';

  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [filterJenis, setFilterJenis] = useState('semua');
  const [search, setSearch] = useState('');

  // wilayah filter for rw/desa/superadmin
  const [rtList, setRtList] = useState([]);
  const [selectedRtId, setSelectedRtId] = useState('');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formModal, setFormModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  // ── Computed stats ────────────────────────────────────────────────────
  const totalPemasukan = data.reduce((s, d) => d.jenis === 'pemasukan' ? s + Number(d.jumlah) : s, 0);
  const totalPengeluaran = data.reduce((s, d) => d.jenis === 'pengeluaran' ? s + Number(d.jumlah) : s, 0);
  const saldo = totalPemasukan - totalPengeluaran;

  // ── RT list for rw/desa/superadmin ───────────────────────────────────
  useEffect(() => {
    if (!isRT) {
      api.get('/rt.php').then((res) => setRtList(res.data || [])).catch(() => {});
    }
  }, [isRT]);

  // ── Fetch kas data ────────────────────────────────────────────────────
  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('bulan', bulan);
    params.set('tahun', tahun);
    if (!isRT && selectedRtId) params.set('rt_id', selectedRtId);

    api.get(`/kas_rt.php?${params.toString()}`)
      .then((res) => setData(res.data || []))
      .catch(() => toast.error('Gagal memuat data kas'))
      .finally(() => setLoading(false));
  }, [bulan, tahun, isRT, selectedRtId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Apply jenis + search filters ─────────────────────────────────────
  const filtered = data.filter((d) => {
    if (filterJenis !== 'semua' && d.jenis !== filterJenis) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.kategori?.toLowerCase().includes(q) ||
        d.keterangan?.toLowerCase().includes(q) ||
        d.iuran_kepala_keluarga?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Keuangan RT"
        title="Kas RT"
        description={`Laporan kas operasional RT — ${BULAN_NAMA[bulan]} ${tahun}`}
        stats={[
          { kicker: 'Total Pemasukan', value: formatRupiah(totalPemasukan) },
          { kicker: 'Total Pengeluaran', value: formatRupiah(totalPengeluaran) },
          { kicker: 'Saldo Kas', value: formatRupiah(saldo) },
        ]}
        actions={
          isRT ? (
            <button
              onClick={() => setFormModal({ mode: 'add' })}
              className="app-button-primary"
            >
              <FiPlus size={16} />
              Tambah Transaksi
            </button>
          ) : null
        }
      />

      {/* Saldo indicator */}
      <div className={`rounded-2xl border px-5 py-4 ${saldo >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Saldo Kas Berjalan</p>
        <p className={`font-display mt-1 text-2xl font-bold ${saldo >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
          {formatRupiah(saldo)}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">Periode {BULAN_NAMA[bulan]} {tahun}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        {/* bulan */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Bulan</label>
          <select className="app-select !w-auto !py-2.5 !px-3" value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
            {bulanOptions().map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
        {/* tahun */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Tahun</label>
          <select className="app-select !w-auto !py-2.5 !px-3" value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
            {tahunOptions().map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {/* rt filter */}
        {!isRT && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">RT</label>
            <select className="app-select !w-auto !py-2.5 !px-3" value={selectedRtId} onChange={(e) => setSelectedRtId(e.target.value)}>
              <option value="">Semua RT</option>
              {rtList.map((r) => (
                <option key={r.id} value={r.id}>RT {r.nomor_rt} / RW {r.nomor_rw}</option>
              ))}
            </select>
          </div>
        )}
        {/* jenis toggle */}
        <div className="flex gap-2">
          {[
            { value: 'semua', label: 'Semua' },
            { value: 'pemasukan', label: 'Pemasukan' },
            { value: 'pengeluaran', label: 'Pengeluaran' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterJenis(opt.value)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${filterJenis === opt.value ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {/* search */}
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="app-search pl-10"
            placeholder="Cari kategori / keterangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="app-table-shell">
        <div className="app-table-scroll">
          <table className="app-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Kategori</th>
                <th>Keterangan</th>
                {!isRT && <th>RT / RW</th>}
                <th className="text-right">Jumlah</th>
                {isRT && <th className="text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isRT ? 7 : 6} className="app-empty-row">Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={isRT ? 7 : 6} className="app-empty-row">Belum ada transaksi untuk periode ini</td></tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap text-slate-500 text-xs">{formatTanggal(row.tanggal)}</td>
                    <td>
                      {row.jenis === 'pemasukan' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <FiArrowUpCircle size={12} /> Masuk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                          <FiArrowDownCircle size={12} /> Keluar
                        </span>
                      )}
                    </td>
                    <td className="font-medium text-slate-800">{row.kategori}</td>
                    <td className="text-slate-500 text-xs max-w-[200px] truncate">
                      {row.keterangan || '-'}
                      {row.iuran_kepala_keluarga && (
                        <span className="ml-1 text-slate-400">({row.iuran_kepala_keluarga})</span>
                      )}
                    </td>
                    {!isRT && (
                      <td className="text-xs text-slate-500">RT {row.nomor_rt} / RW {row.nomor_rw}</td>
                    )}
                    <td className={`text-right font-semibold ${row.jenis === 'pemasukan' ? 'text-emerald-700' : 'text-red-600'}`}>
                      {row.jenis === 'pengeluaran' ? '−' : ''}{formatRupiah(row.jumlah)}
                    </td>
                    {isRT && (
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!row.iuran_id && (
                            <>
                              <button
                                onClick={() => setFormModal({ mode: 'edit', ...row })}
                                className="app-icon-button"
                                title="Edit"
                              >
                                <FiEdit2 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteModal(row)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-white text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                                title="Hapus"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </>
                          )}
                          {row.iuran_id && (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Iuran</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            {/* Summary footer */}
            {!loading && filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50/80">
                  <td colSpan={isRT ? 5 : 4} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Periode
                  </td>
                  {!isRT && <td />}
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                    {formatRupiah(
                      filtered.reduce((s, d) => d.jenis === 'pemasukan' ? s + Number(d.jumlah) : s - Number(d.jumlah), 0)
                    )}
                  </td>
                  {isRT && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modals */}
      {formModal && (
        <KasFormModal
          existing={formModal.mode === 'edit' ? formModal : null}
          onSave={fetchData}
          onClose={() => setFormModal(null)}
        />
      )}
      {deleteModal && (
        <DeleteModal
          item={deleteModal}
          onConfirm={fetchData}
          onClose={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
