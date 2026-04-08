import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiFileText, FiPrinter, FiSearch, FiX } from 'react-icons/fi';
import AppPageHeader from '../components/AppPageHeader';

const bulanNama = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function formatTanggal(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getDate()} ${bulanNama[d.getMonth() + 1]} ${d.getFullYear()}`;
}

function formatTanggalSurat(dateStr) {
  if (!dateStr) {
    const now = new Date();
    return `${now.getDate()} ${bulanNama[now.getMonth() + 1]} ${now.getFullYear()}`;
  }
  return formatTanggal(dateStr);
}

function CetakSuratModal({ surat, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Surat Pengantar - ${surat.nomor_surat}</title>
        <style>
          @page { size: A4; margin: 1.5cm 2cm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; line-height: 1.6; }
          .surat-container { max-width: 21cm; margin: 0 auto; padding: 0; }
          .kop-surat { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; position: relative; }
          .kop-surat .logo { position: absolute; left: 10px; top: 0; width: 72px; height: 72px; }
          .kop-surat h2 { font-size: 14pt; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
          .kop-surat h1 { font-size: 16pt; font-weight: bold; margin: 2px 0; text-transform: uppercase; }
          .kop-surat p { font-size: 10pt; margin: 0; }
          .judul-surat { text-align: center; margin: 24px 0 4px 0; }
          .judul-surat h3 { font-size: 14pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 2px; }
          .nomor-surat { text-align: center; margin-bottom: 20px; font-size: 11pt; }
          .isi-surat { margin: 0 20px; text-align: justify; }
          .isi-surat p { margin-bottom: 8px; text-indent: 40px; }
          .isi-surat .no-indent { text-indent: 0; }
          .data-table { width: 100%; margin: 12px 0; border-collapse: collapse; }
          .data-table td { padding: 3px 8px; vertical-align: top; font-size: 12pt; }
          .data-table td:first-child { width: 180px; }
          .data-table td:nth-child(2) { width: 16px; text-align: center; }
          .penutup { margin-top: 16px; }
          .ttd-container { display: flex; justify-content: space-between; margin-top: 30px; }
          .ttd-box { text-align: center; width: 200px; }
          .ttd-box .nama { margin-top: 70px; font-weight: bold; text-decoration: underline; }
          .ttd-box .jabatan { font-size: 11pt; }
          .ttd-right { margin-left: auto; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const alamatPenduduk = [surat.alamat, `RT ${surat.nomor_rt}`, `RW ${surat.nomor_rw}`, surat.kelurahan || surat.nama_desa, surat.kecamatan, surat.kabupaten].filter(Boolean).join(', ');
  const sekretariat = surat.alamat_sekretariat || `RT ${surat.nomor_rt}/${surat.nomor_rw} Desa ${surat.nama_desa} Kecamatan ${surat.kecamatan} ${surat.kabupaten}`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Preview Surat Pengantar</h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="app-btn app-btn-primary inline-flex items-center gap-2">
              <FiPrinter size={16} /> Cetak / Simpan PDF
            </button>
            <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
              <FiX size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-auto p-6" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <div ref={printRef} style={{ fontFamily: "'Times New Roman', Times, serif", color: '#000', lineHeight: '1.6', fontSize: '12pt' }}>
            <div className="surat-container">
              {/* KOP SURAT */}
              <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: '10px', marginBottom: '20px', position: 'relative', minHeight: '80px' }}>
                <img src="/logo-96.png" alt="Logo" style={{ position: 'absolute', left: '10px', top: '0', width: '72px', height: '72px' }} />
                <div style={{ paddingLeft: '90px', paddingRight: '20px' }}>
                  <h1 style={{ fontSize: '16pt', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>PENGURUS RT {surat.nomor_rt} RW {surat.nomor_rw}</h1>
                  <p style={{ fontSize: '12pt', margin: '0', textTransform: 'uppercase' }}>DESA {surat.nama_desa?.toUpperCase()}</p>
                  <p style={{ fontSize: '11pt', margin: '0', fontWeight: 'bold', textTransform: 'uppercase' }}>KECAMATAN {surat.kecamatan?.toUpperCase()} {surat.kabupaten?.toUpperCase()}</p>
                  <p style={{ fontSize: '9pt', margin: '0' }}>Sekretariat ; {sekretariat}</p>
                </div>
              </div>

              {/* JUDUL */}
              <div style={{ textAlign: 'center', margin: '24px 0 4px 0' }}>
                <h3 style={{ fontSize: '14pt', fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase', letterSpacing: '2px' }}>Surat Pengantar</h3>
              </div>
              <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '11pt' }}>
                No: {surat.nomor_surat}
              </div>

              {/* ISI */}
              <div style={{ margin: '0 20px', textAlign: 'justify' }}>
                <p style={{ marginBottom: '8px', textIndent: '40px' }}>
                  Yang bertanda tangan di bawah ini Ketua RT {surat.nomor_rt} RW {surat.nomor_rw} Desa {surat.nama_desa}, Kecamatan {surat.kecamatan}, {surat.kabupaten}, dengan ini menerangkan bahwa:
                </p>

                <table style={{ width: '100%', margin: '12px 0', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '3px 8px', width: '180px', verticalAlign: 'top' }}>Nama Lengkap</td>
                      <td style={{ padding: '3px 0', width: '16px', textAlign: 'center' }}>:</td>
                      <td style={{ padding: '3px 8px', fontWeight: 'bold' }}>{surat.nama_lengkap}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 8px', verticalAlign: 'top' }}>NIK</td>
                      <td style={{ padding: '3px 0', textAlign: 'center' }}>:</td>
                      <td style={{ padding: '3px 8px' }}>{surat.nik}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 8px', verticalAlign: 'top' }}>No. KK</td>
                      <td style={{ padding: '3px 0', textAlign: 'center' }}>:</td>
                      <td style={{ padding: '3px 8px' }}>{surat.no_kk}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 8px', verticalAlign: 'top' }}>Tempat / Tgl Lahir</td>
                      <td style={{ padding: '3px 0', textAlign: 'center' }}>:</td>
                      <td style={{ padding: '3px 8px' }}>{surat.tempat_lahir}, {formatTanggal(surat.tanggal_lahir)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 8px', verticalAlign: 'top' }}>Jenis Kelamin</td>
                      <td style={{ padding: '3px 0', textAlign: 'center' }}>:</td>
                      <td style={{ padding: '3px 8px' }}>{surat.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 8px', verticalAlign: 'top' }}>Agama</td>
                      <td style={{ padding: '3px 0', textAlign: 'center' }}>:</td>
                      <td style={{ padding: '3px 8px' }}>{surat.agama}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 8px', verticalAlign: 'top' }}>Status Perkawinan</td>
                      <td style={{ padding: '3px 0', textAlign: 'center' }}>:</td>
                      <td style={{ padding: '3px 8px' }}>{surat.status_perkawinan}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 8px', verticalAlign: 'top' }}>Pekerjaan</td>
                      <td style={{ padding: '3px 0', textAlign: 'center' }}>:</td>
                      <td style={{ padding: '3px 8px' }}>{surat.pekerjaan || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 8px', verticalAlign: 'top' }}>Kewarganegaraan</td>
                      <td style={{ padding: '3px 0', textAlign: 'center' }}>:</td>
                      <td style={{ padding: '3px 8px' }}>{surat.kewarganegaraan}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 8px', verticalAlign: 'top' }}>Alamat</td>
                      <td style={{ padding: '3px 0', textAlign: 'center' }}>:</td>
                      <td style={{ padding: '3px 8px' }}>{alamatPenduduk}</td>
                    </tr>
                  </tbody>
                </table>

                <p style={{ marginBottom: '8px' }}>
                  Orang tersebut di atas adalah benar warga kami yang berdomisili di RT {surat.nomor_rt} RW {surat.nomor_rw} Desa {surat.nama_desa}.
                </p>

                <table style={{ width: '100%', margin: '12px 0', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '3px 8px', width: '180px', verticalAlign: 'top', fontWeight: 'bold' }}>Keperluan</td>
                      <td style={{ padding: '3px 0', width: '16px', textAlign: 'center' }}>:</td>
                      <td style={{ padding: '3px 8px', fontWeight: 'bold' }}>{surat.keperluan}</td>
                    </tr>
                    {surat.keterangan && (
                      <tr>
                        <td style={{ padding: '3px 8px', verticalAlign: 'top' }}>Keterangan</td>
                        <td style={{ padding: '3px 0', textAlign: 'center' }}>:</td>
                        <td style={{ padding: '3px 8px' }}>{surat.keterangan}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <p style={{ marginBottom: '8px', textIndent: '40px' }}>
                  Demikian surat pengantar ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
                </p>
              </div>

              {/* TTD */}
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '30px 20px 0 20px' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <p>Mengetahui,</p>
                  <p>Ketua RW {surat.nomor_rw}</p>
                  <p style={{ marginTop: '70px', fontWeight: 'bold', textDecoration: 'underline' }}>{surat.ketua_rw || '........................'}</p>
                </div>
                <div style={{ textAlign: 'center', width: '240px' }}>
                  <p>{surat.nama_desa}, {formatTanggalSurat(surat.created_at)}</p>
                  <p>Ketua RT {surat.nomor_rt}</p>
                  <p style={{ marginTop: '70px', fontWeight: 'bold', textDecoration: 'underline' }}>{surat.ketua_rt || '........................'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PilihPendudukModal({ onSelect, onClose, user }) {
  const [pendudukList, setPendudukList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/penduduk.php')
      .then((res) => setPendudukList(res.data || []))
      .catch(() => toast.error('Gagal memuat data penduduk'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = pendudukList.filter((p) =>
    p.nama_lengkap?.toLowerCase().includes(search.toLowerCase()) ||
    p.nik?.includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Pilih Penduduk</h3>
          <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
            <FiX size={18} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau NIK..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-300 focus:bg-white"
              autoFocus
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-500">Memuat data penduduk...</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">Tidak ada penduduk ditemukan.</div>
            ) : (
              <div className="space-y-2">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelect(p)}
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-left transition hover:border-slate-300 hover:bg-white"
                  >
                    <p className="text-sm font-semibold text-slate-900">{p.nama_lengkap}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">NIK: {p.nik}</p>
                    <div className="mt-1.5 flex gap-2">
                      <span className={`app-badge ${p.jenis_kelamin === 'L' ? 'app-badge-sky' : 'app-badge-rose'}`}>
                        {p.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                      <span className="app-badge app-badge-neutral">RT {p.nomor_rt} / RW {p.nomor_rw}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuratPengantarPage() {
  const { user } = useAuth();
  const [suratList, setSuratList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPilihPenduduk, setShowPilihPenduduk] = useState(false);
  const [showCetak, setShowCetak] = useState(null);
  const [selectedPenduduk, setSelectedPenduduk] = useState(null);
  const [keperluan, setKeperluan] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [nomorSuratPreview, setNomorSuratPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const fetchList = () => {
    setLoading(true);
    api.get('/surat_pengantar.php')
      .then((res) => setSuratList(res.data || []))
      .catch(() => toast.error('Gagal memuat data surat'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleBuatSurat = () => {
    setShowForm(true);
    setSelectedPenduduk(null);
    setKeperluan('');
    setKeterangan('');
    api.get('/surat_pengantar.php?action=next_nomor')
      .then((res) => setNomorSuratPreview(res.data.nomor_surat))
      .catch(() => toast.error('Gagal memuat nomor surat'));
  };

  const handleSelectPenduduk = (penduduk) => {
    setSelectedPenduduk(penduduk);
    setShowPilihPenduduk(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPenduduk) {
      toast.error('Pilih penduduk terlebih dahulu');
      return;
    }
    if (!keperluan.trim()) {
      toast.error('Keperluan harus diisi');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/surat_pengantar.php', {
        penduduk_id: selectedPenduduk.id,
        keperluan: keperluan.trim(),
        keterangan: keterangan.trim(),
      });
      toast.success(`Surat berhasil dibuat: ${res.data.nomor_surat}`);
      setShowForm(false);
      fetchList();

      // Auto-open cetak preview
      const detail = await api.get(`/surat_pengantar.php?id=${res.data.id}`);
      setShowCetak(detail.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal membuat surat');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCetak = async (suratId) => {
    try {
      const res = await api.get(`/surat_pengantar.php?id=${suratId}`);
      setShowCetak(res.data);
    } catch {
      toast.error('Gagal memuat detail surat');
    }
  };

  const filtered = suratList.filter((s) =>
    s.nama_lengkap?.toLowerCase().includes(search.toLowerCase()) ||
    s.nik?.includes(search) ||
    s.nomor_surat?.includes(search) ||
    s.keperluan?.toLowerCase().includes(search.toLowerCase())
  );

  const heroStats = [
    { kicker: 'Total Surat', value: suratList.length, label: 'Jumlah surat pengantar yang telah diterbitkan.' },
    { kicker: 'Bulan Ini', value: suratList.filter((s) => { const d = new Date(s.created_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length, label: 'Surat yang diterbitkan pada bulan ini.' },
  ];

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Layanan Surat"
        title="Surat Pengantar"
        description="Buat dan cetak surat pengantar RT/RW untuk keperluan warga. Nomor surat digenerate otomatis secara berurut per desa setiap bulannya."
        stats={heroStats}
      />

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="app-panel-title">Daftar Surat Pengantar</h3>
            <p className="app-panel-description">Riwayat surat pengantar yang telah diterbitkan.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="app-chip">{filtered.length} surat</span>
            {user?.role === 'rt' && (
              <button onClick={handleBuatSurat} className="app-btn app-btn-primary inline-flex items-center gap-2">
                <FiFileText size={16} /> Buat Surat Pengantar
              </button>
            )}
          </div>
        </div>

        <div className="border-b border-slate-200/80 px-4 py-3 sm:px-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, NIK, nomor surat, atau keperluan..."
            className="app-search"
          />
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 p-4 sm:p-6 md:hidden">
          {loading ? (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500">Belum ada surat pengantar.</div>
          ) : filtered.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{s.nama_lengkap}</p>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">{s.nomor_surat}</p>
                </div>
                <button onClick={() => handleCetak(s.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
                  <FiPrinter size={13} /> Cetak
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-600">{s.keperluan}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                <span>RT {s.nomor_rt} / RW {s.nomor_rw}</span>
                <span>•</span>
                <span>{formatTanggal(s.created_at)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="app-table-scroll">
            <table className="app-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nomor Surat</th>
                  <th>Nama Penduduk</th>
                  <th>NIK</th>
                  <th>Keperluan</th>
                  <th>RT/RW</th>
                  <th>Tanggal</th>
                  <th>Dibuat Oleh</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" className="app-empty-row">Memuat data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="9" className="app-empty-row">Belum ada surat pengantar.</td></tr>
                ) : filtered.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td className="font-mono text-xs text-slate-600">{s.nomor_surat}</td>
                    <td className="font-semibold text-slate-900">{s.nama_lengkap}</td>
                    <td className="font-mono text-xs text-slate-500">{s.nik}</td>
                    <td>{s.keperluan}</td>
                    <td>RT {s.nomor_rt} / RW {s.nomor_rw}</td>
                    <td className="text-sm text-slate-500">{formatTanggal(s.created_at)}</td>
                    <td className="text-sm text-slate-500">{s.created_by_name}</td>
                    <td>
                      <button onClick={() => handleCetak(s.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
                        <FiPrinter size={13} /> Cetak
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Buat Surat Pengantar</h3>
              <button onClick={() => setShowForm(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Nomor Surat Preview */}
              <div>
                <label className="app-label">Nomor Surat (otomatis)</label>
                <input type="text" value={nomorSuratPreview ? `No: ${nomorSuratPreview}` : 'Memuat...'} readOnly className="app-input bg-slate-100 cursor-not-allowed" />
              </div>

              {/* Pilih Penduduk */}
              <div>
                <label className="app-label">Penduduk <span className="text-red-500">*</span></label>
                {selectedPenduduk ? (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{selectedPenduduk.nama_lengkap}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-500">NIK: {selectedPenduduk.nik}</p>
                    </div>
                    <button type="button" onClick={() => setShowPilihPenduduk(true)} className="text-sm font-medium text-blue-600 hover:text-blue-700">Ganti</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowPilihPenduduk(true)} className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-4 text-sm text-slate-600 transition hover:border-slate-400 hover:bg-white">
                    Klik untuk memilih penduduk
                  </button>
                )}
              </div>

              {/* Keperluan */}
              <div>
                <label className="app-label">Keperluan / Alasan <span className="text-red-500">*</span></label>
                <textarea
                  value={keperluan}
                  onChange={(e) => setKeperluan(e.target.value)}
                  placeholder="Contoh: Pengurusan KTP, Surat Keterangan Domisili, dll."
                  className="app-input min-h-[80px] resize-y"
                  required
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="app-label">Keterangan Tambahan</label>
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Keterangan tambahan jika diperlukan (opsional)"
                  className="app-input min-h-[60px] resize-y"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="app-btn app-btn-secondary">Batal</button>
                <button type="submit" disabled={submitting} className="app-btn app-btn-primary inline-flex items-center gap-2">
                  {submitting ? 'Menyimpan...' : <><FiFileText size={16} /> Buat Surat</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pilih Penduduk Modal */}
      {showPilihPenduduk && (
        <PilihPendudukModal
          user={user}
          onSelect={handleSelectPenduduk}
          onClose={() => setShowPilihPenduduk(false)}
        />
      )}

      {/* Cetak Preview Modal */}
      {showCetak && (
        <CetakSuratModal
          surat={showCetak}
          onClose={() => setShowCetak(null)}
        />
      )}
    </div>
  );
}
