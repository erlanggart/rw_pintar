import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiDollarSign, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiSearch } from 'react-icons/fi';
import AppPageHeader from '../components/AppPageHeader';

const BULAN_NAMA = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function formatRupiah(val) {
  if (!val && val !== 0) return '-';
  return 'Rp ' + Number(val).toLocaleString('id-ID');
}

function bulanOptions() {
  return BULAN_NAMA.slice(1).map((nama, i) => ({ value: i + 1, label: nama }));
}

function tahunOptions() {
  const y = new Date().getFullYear();
  return [y + 1, y, y - 1, y - 2].map((t) => ({ value: t, label: String(t) }));
}

// ── Modal Form ─────────────────────────────────────────────────────────────

function IuranFormModal({ rtId, existing, keluargaList, bulan, tahun, onSave, onClose }) {
  const [keluargaId, setKeluargaId] = useState(existing?.keluarga_id ? String(existing.keluarga_id) : '');
  const [jumlah, setJumlah] = useState(existing?.jumlah ? String(existing.jumlah) : '');
  const [status, setStatus] = useState(existing?.status ?? 'belum');
  const [keterangan, setKeterangan] = useState(existing?.keterangan ?? '');
  const [loading, setLoading] = useState(false);

  const isEdit = !!existing?.id;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!keluargaId) return toast.error('Pilih keluarga terlebih dahulu');
    if (!jumlah || Number(jumlah) <= 0) return toast.error('Jumlah iuran harus lebih dari 0');

    setLoading(true);
    try {
      const payload = {
        keluarga_id: Number(keluargaId),
        bulan,
        tahun,
        jumlah: Number(jumlah),
        status,
        keterangan,
      };

      if (isEdit) {
        await api.put(`/iuran_warga.php?id=${existing.id}`, payload);
        toast.success('Data iuran diperbarui');
      } else {
        await api.post('/iuran_warga.php', payload);
        toast.success('Iuran berhasil dicatat');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  }

  const availableKeluarga = isEdit
    ? keluargaList
    : keluargaList;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit Iuran Warga' : 'Catat Iuran Warga'}
          </h3>
          <button onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="app-label">Bulan / Tahun</label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              {BULAN_NAMA[bulan]} {tahun}
            </div>
          </div>

          <div>
            <label className="app-label">Kepala Keluarga *</label>
            {isEdit ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {existing.kepala_keluarga} (No. KK: {existing.no_kk})
              </div>
            ) : (
              <select
                className="app-select"
                value={keluargaId}
                onChange={(e) => setKeluargaId(e.target.value)}
                required
              >
                <option value="">-- Pilih Keluarga --</option>
                {availableKeluarga.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.kepala_keluarga} – {k.no_kk}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="app-label">Jumlah Iuran (Rp) *</label>
            <input
              type="number"
              min="1"
              className="app-input"
              placeholder="Contoh: 50000"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="app-label">Status Pembayaran</label>
            <div className="flex gap-3">
              {[{ value: 'lunas', label: 'Lunas', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' }, { value: 'belum', label: 'Belum Bayar', color: 'bg-red-50 text-red-600 border-red-200' }].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${status === opt.value ? opt.color : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="app-label">Keterangan (opsional)</label>
            <input
              type="text"
              className="app-input"
              placeholder="Catatan tambahan..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              maxLength={255}
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
      await api.delete(`/iuran_warga.php?id=${item.id}`);
      toast.success('Data iuran dihapus');
      onConfirm();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus data');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-900">Hapus Data Iuran?</h3>
        <p className="mt-2 text-sm text-slate-500">
          Iuran <strong>{item.kepala_keluarga}</strong> untuk{' '}
          {BULAN_NAMA[item.bulan]} {item.tahun} akan dihapus. Jika sudah lunas, catatan kas terkait juga ikut terhapus.
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

export default function IuranWargaPage() {
  const { user } = useAuth();
  const isRT = user?.role === 'rt';

  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [search, setSearch] = useState('');

  // wilayah filter (for rw/desa/superadmin)
  const [rtList, setRtList] = useState([]);
  const [selectedRtId, setSelectedRtId] = useState('');

  const [data, setData] = useState([]);
  const [keluargaList, setKeluargaList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formModal, setFormModal] = useState(null); // null | 'add' | existing item
  const [deleteModal, setDeleteModal] = useState(null);

  // stats
  const totalLunas = data.filter((d) => d.status === 'lunas').length;
  const totalBelum = data.filter((d) => d.status === 'belum').length;
  const totalPemasukan = data.filter((d) => d.status === 'lunas').reduce((s, d) => s + Number(d.jumlah), 0);

  // ── fetch rt list for rw/desa/superadmin ──────────────────────────────
  useEffect(() => {
    if (!isRT) {
      api.get('/rt.php').then((res) => setRtList(res.data || [])).catch(() => {});
    }
  }, [isRT]);

  // ── fetch keluarga (for RT only — to populate the add-form dropdown) ──
  useEffect(() => {
    if (isRT) {
      api.get('/keluarga.php').then((res) => setKeluargaList(res.data || [])).catch(() => {});
    }
  }, [isRT]);

  // ── fetch iuran data ──────────────────────────────────────────────────
  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('bulan', bulan);
    params.set('tahun', tahun);
    if (!isRT && selectedRtId) params.set('rt_id', selectedRtId);

    api.get(`/iuran_warga.php?${params.toString()}`)
      .then((res) => setData(res.data || []))
      .catch(() => toast.error('Gagal memuat data iuran'))
      .finally(() => setLoading(false));
  }, [bulan, tahun, isRT, selectedRtId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── filter by search ──────────────────────────────────────────────────
  const filtered = data.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.kepala_keluarga?.toLowerCase().includes(q) ||
      d.no_kk?.includes(q)
    );
  });

  // ── keluarga already recorded (to exclude from add-form dropdown) ─────
  const recordedKeluargaIds = new Set(data.map((d) => String(d.keluarga_id)));
  const availableKeluarga = keluargaList.filter((k) => !recordedKeluargaIds.has(String(k.id)));

  const rtLabel = isRT
    ? `RT ${user.rt_id}`
    : selectedRtId
      ? `RT ${rtList.find((r) => String(r.id) === String(selectedRtId))?.nomor_rt ?? selectedRtId}`
      : 'Semua RT';

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Keuangan RT"
        title="Iuran Warga"
        description={`Pencatatan iuran bulanan warga — ${BULAN_NAMA[bulan]} ${tahun}`}
        stats={[
          { kicker: 'Sudah Bayar', value: `${totalLunas} KK` },
          { kicker: 'Belum Bayar', value: `${totalBelum} KK` },
          { kicker: 'Total Terkumpul', value: formatRupiah(totalPemasukan) },
        ]}
        actions={
          isRT ? (
            <button
              onClick={() => setFormModal({ mode: 'add' })}
              className="app-button-primary"
            >
              <FiPlus size={16} />
              Catat Iuran
            </button>
          ) : null
        }
      />

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
        {/* rt filter for non-RT */}
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
        {/* search */}
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="app-search pl-10"
            placeholder="Cari kepala keluarga / No. KK..."
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
                <th>No. KK</th>
                <th>Kepala Keluarga</th>
                {!isRT && <th>RT / RW</th>}
                <th>Jumlah Iuran</th>
                <th>Status</th>
                <th>Keterangan</th>
                {isRT && <th className="text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isRT ? 7 : 6} className="app-empty-row">Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={isRT ? 7 : 6} className="app-empty-row">Belum ada data iuran untuk periode ini</td></tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs">{row.no_kk}</td>
                    <td className="font-medium text-slate-900">{row.kepala_keluarga}</td>
                    {!isRT && (
                      <td className="text-xs text-slate-500">RT {row.nomor_rt} / RW {row.nomor_rw}</td>
                    )}
                    <td className="font-semibold text-slate-900">{formatRupiah(row.jumlah)}</td>
                    <td>
                      {row.status === 'lunas' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <FiCheck size={11} /> Lunas
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                          Belum Bayar
                        </span>
                      )}
                    </td>
                    <td className="text-slate-500">{row.keterangan || '-'}</td>
                    {isRT && (
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {formModal && (
        <IuranFormModal
          rtId={user?.rt_id}
          existing={formModal.mode === 'edit' ? formModal : null}
          keluargaList={formModal.mode === 'add' ? availableKeluarga : keluargaList}
          bulan={bulan}
          tahun={tahun}
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
