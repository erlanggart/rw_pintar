import { useState, useEffect, useRef } from 'react';
import { FiPrinter, FiCalendar } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

const bulanNama = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function daysInMonth(bulan, tahun) {
  return new Date(tahun, bulan, 0).getDate();
}

function sumRow(row) {
  return {
    wni_l: row.wni_l || 0,
    wni_p: row.wni_p || 0,
    wna_l: row.wna_l || 0,
    wna_p: row.wna_p || 0,
    jml_l: (row.wni_l || 0) + (row.wna_l || 0),
    jml_p: (row.wni_p || 0) + (row.wna_p || 0),
    jml_total: (row.wni_l || 0) + (row.wni_p || 0) + (row.wna_l || 0) + (row.wna_p || 0),
    kk_l: row.kk_l || 0,
    kk_p: row.kk_p || 0,
    kk_total: (row.kk_l || 0) + (row.kk_p || 0),
  };
}

function addRows(a, b) {
  return {
    wni_l: a.wni_l + b.wni_l,
    wni_p: a.wni_p + b.wni_p,
    wna_l: a.wna_l + b.wna_l,
    wna_p: a.wna_p + b.wna_p,
    kk_l: a.kk_l + b.kk_l,
    kk_p: a.kk_p + b.kk_p,
  };
}

function subRows(a, b) {
  return {
    wni_l: a.wni_l - b.wni_l,
    wni_p: a.wni_p - b.wni_p,
    wna_l: a.wna_l - b.wna_l,
    wna_p: a.wna_p - b.wna_p,
    kk_l: a.kk_l - b.kk_l,
    kk_p: a.kk_p - b.kk_p,
  };
}

function zeroRow() {
  return { wni_l: 0, wni_p: 0, wna_l: 0, wna_p: 0, kk_l: 0, kk_p: 0 };
}

function CellRow({ data }) {
  const s = sumRow(data);
  return (
    <>
      <td>{s.wni_l || ''}</td>
      <td>{s.wni_p || ''}</td>
      <td>{s.wna_l || ''}</td>
      <td>{s.wna_p || ''}</td>
      <td>{s.jml_l || ''}</td>
      <td>{s.jml_p || ''}</td>
      <td>{s.jml_total || ''}</td>
      <td>{s.kk_l || ''}</td>
      <td>{s.kk_p || ''}</td>
      <td>{s.kk_total || ''}</td>
    </>
  );
}

function PindahCellRow({ data }) {
  const l = data.l || 0;
  const p = data.p || 0;
  const total = l + p;
  const kk_l = data.kk_l || 0;
  const kk_p = data.kk_p || 0;
  const kk_total = kk_l + kk_p;
  return (
    <>
      <td>{l || ''}</td>
      <td>{p || ''}</td>
      <td>{total || ''}</td>
      <td>{kk_l || ''}</td>
      <td>{kk_p || ''}</td>
      <td>{kk_total || ''}</td>
    </>
  );
}

function ReportTable({ report, bulan, tahun }) {
  const akt = report.aktivitas;
  const pendudukNow = {
    wni_l: report.penduduk_sekarang.wni_l,
    wni_p: report.penduduk_sekarang.wni_p,
    wna_l: report.penduduk_sekarang.wna_l,
    wna_p: report.penduduk_sekarang.wna_p,
    kk_l: report.kk_sekarang.l,
    kk_p: report.kk_sekarang.p,
  };

  const lahir = { ...akt.Lahir };
  const mati = { ...akt.Mati };
  const datang = { ...akt.Datang };
  const pindah = { ...akt.Pindah };

  // Row 7 = current penduduk (Penduduk/Keluarga Sampai bulan ini)
  const row7 = pendudukNow;

  // Compute row 1 (Penduduk awal bulan) = row7 - lahir - datang + mati + pindah
  const pertambahan = addRows(lahir, datang);
  const pengurangan = addRows(mati, pindah);
  const row1 = addRows(subRows(row7, pertambahan), pengurangan);

  const maxDay = daysInMonth(bulan, tahun);
  const periode = `Periode 1 - ${maxDay} ${bulanNama[bulan]} ${tahun}`;

  const lokasi = [report.nama_desa, report.kecamatan, report.kabupaten].filter(Boolean).join(', ');

  return (
    <div className="laporan-page">
      <div className="laporan-header">
        <h2>LAPORAN BULANAN KEPENDUDUKAN</h2>
        <p>RT {report.nomor_rt} RW {report.nomor_rw}</p>
        <p className="laporan-periode">{periode}</p>
      </div>

      <table className="laporan-table">
        <thead>
          <tr>
            <th rowSpan={3}>No</th>
            <th rowSpan={3}>URAIAN</th>
            <th colSpan={7}>PENDUDUK</th>
            <th colSpan={3} rowSpan={2}>KEPALA KELUARGA (KK)</th>
          </tr>
          <tr>
            <th colSpan={2}>WNI</th>
            <th colSpan={2}>WNA</th>
            <th colSpan={3}>JUMLAH</th>
          </tr>
          <tr>
            <th>L</th><th>P</th>
            <th>L</th><th>P</th>
            <th>L</th><th>P</th><th>L+P</th>
            <th>L</th><th>P</th><th>L+P</th>
          </tr>
          <tr className="row-number">
            <td>1</td><td>2</td>
            <td>3</td><td>4</td><td>5</td><td>6</td>
            <td>7</td><td>8</td><td>9</td>
            <td>10</td><td>11</td><td>12</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td className="text-left">Penduduk Keluarga Bulan ini</td>
            <CellRow data={row1} />
          </tr>
          <tr>
            <td>2</td>
            <td className="text-left">Kelahiran Keluarga Baru Bulan ini</td>
            <CellRow data={lahir} />
          </tr>
          <tr>
            <td>3</td>
            <td className="text-left">Kematian Bulan Ini</td>
            <CellRow data={mati} />
          </tr>
          <tr>
            <td>4</td>
            <td className="text-left">Pendatang Bulan ini</td>
            <CellRow data={datang} />
          </tr>
          <tr>
            <td>5</td>
            <td className="text-left">Pindah/Keluarga Pergi Bulan ini</td>
            <CellRow data={pindah} />
          </tr>
          <tr>
            <td>6</td>
            <td className="text-left">Penduduk Hilang Bulan ini</td>
            <CellRow data={zeroRow()} />
          </tr>
          <tr className="row-total">
            <td>7</td>
            <td className="text-left">Penduduk/Keluarga Sampai bulan ini</td>
            <CellRow data={row7} />
          </tr>
        </tbody>
      </table>

      <div className="laporan-section-title">PERINCIAN PINDAH</div>
      <table className="laporan-table laporan-table-pindah">
        <thead>
          <tr>
            <th rowSpan={2}>No</th>
            <th rowSpan={2}>URAIAN</th>
            <th colSpan={3}>PENDUDUK</th>
            <th colSpan={3}>KEPALA KELUARGA (KK)</th>
          </tr>
          <tr>
            <th>L</th><th>P</th><th>L+P</th>
            <th>L</th><th>P</th><th>L+P</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td className="text-left">Pindah Keluar Desa/Kelurahan</td>
            <PindahCellRow data={report.pindah_detail.desa} />
          </tr>
          <tr>
            <td>2</td>
            <td className="text-left">Pindah Keluar Kecamatan</td>
            <PindahCellRow data={report.pindah_detail.kecamatan} />
          </tr>
          <tr>
            <td>3</td>
            <td className="text-left">Pindah Keluar Kabupaten/Kota</td>
            <PindahCellRow data={report.pindah_detail.kabupaten} />
          </tr>
          <tr>
            <td>4</td>
            <td className="text-left">Pindah Keluar Provinsi</td>
            <PindahCellRow data={report.pindah_detail.provinsi} />
          </tr>
          <tr className="row-total">
            <td colSpan={2}><strong>JUMLAH</strong></td>
            <PindahCellRow data={{
              l: (report.pindah_detail.desa.l || 0) + (report.pindah_detail.kecamatan.l || 0) + (report.pindah_detail.kabupaten.l || 0) + (report.pindah_detail.provinsi.l || 0),
              p: (report.pindah_detail.desa.p || 0) + (report.pindah_detail.kecamatan.p || 0) + (report.pindah_detail.kabupaten.p || 0) + (report.pindah_detail.provinsi.p || 0),
              kk_l: (report.pindah_detail.desa.kk_l || 0) + (report.pindah_detail.kecamatan.kk_l || 0) + (report.pindah_detail.kabupaten.kk_l || 0) + (report.pindah_detail.provinsi.kk_l || 0),
              kk_p: (report.pindah_detail.desa.kk_p || 0) + (report.pindah_detail.kecamatan.kk_p || 0) + (report.pindah_detail.kabupaten.kk_p || 0) + (report.pindah_detail.provinsi.kk_p || 0),
            }} />
          </tr>
        </tbody>
      </table>

      <div className="laporan-ttd">
        <div className="ttd-box">
          <p>{lokasi}</p>
          <p>{bulanNama[bulan]} {tahun}</p>
          <p>Ketua RT {report.nomor_rt} Rw {report.nomor_rw}</p>
          <div className="ttd-space"></div>
          <p className="ttd-name">{report.ketua_rt || '...................'}</p>
        </div>
      </div>
    </div>
  );
}

const printCSS = `
  @page { size: A4 landscape; margin: 1cm 1.5cm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #000; }
  .laporan-page { page-break-after: always; padding: 0; }
  .laporan-page:last-child { page-break-after: auto; }
  .laporan-header { text-align: center; margin-bottom: 12px; }
  .laporan-header h2 { font-size: 13pt; font-weight: bold; margin: 0; }
  .laporan-header p { font-size: 11pt; margin: 2px 0; }
  .laporan-periode { text-align: right; font-style: italic; font-size: 10pt; margin-top: 8px !important; }
  .laporan-section-title { font-weight: bold; font-size: 10pt; margin: 14px 0 4px 0; }
  .laporan-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9pt; }
  .laporan-table th, .laporan-table td { border: 1px solid #000; padding: 3px 5px; text-align: center; vertical-align: middle; }
  .laporan-table th { background: #f0f0f0; font-weight: bold; font-size: 8.5pt; }
  .laporan-table .text-left { text-align: left; }
  .laporan-table .row-number td { font-style: italic; font-size: 8pt; background: #fafafa; }
  .laporan-table .row-total td { font-weight: bold; }
  .laporan-table thead th { white-space: nowrap; }
  .laporan-table td:nth-child(2) { min-width: 200px; }
  .laporan-table-pindah td:nth-child(2) { min-width: 220px; }
  .laporan-ttd { display: flex; justify-content: flex-end; margin-top: 20px; }
  .ttd-box { text-align: center; min-width: 220px; }
  .ttd-box p { margin: 2px 0; font-size: 10pt; }
  .ttd-space { height: 60px; }
  .ttd-name { font-weight: bold; text-decoration: underline; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

export default function LaporanBulanan({ userRole, rwId }) {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [rtId, setRtId] = useState(0);
  const [rtList, setRtList] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  // For RW role, fetch RT list
  useEffect(() => {
    if (userRole === 'rw') {
      api.get('/rt.php').then((res) => {
        setRtList(res.data.data || res.data || []);
      }).catch(() => {});
    }
  }, [userRole]);

  const fetchReport = () => {
    setLoading(true);
    const params = { bulan, tahun };
    if (userRole === 'rw' && rtId > 0) {
      params.rt_id = rtId;
    }
    api.get('/laporan_bulanan.php', { params })
      .then((res) => {
        setReports(res.data.reports || []);
      })
      .catch((err) => {
        toast.error(err.response?.data?.error || 'Gagal memuat laporan');
        setReports([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, [bulan, tahun, rtId]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=1100,height=700');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Bulanan Kependudukan - ${bulanNama[bulan]} ${tahun}</title>
        <style>${printCSS}</style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const yearOptions = [];
  for (let y = now.getFullYear(); y >= 2020; y--) {
    yearOptions.push(y);
  }

  return (
    <section className="app-panel">
      <div className="app-panel-header">
        <div>
          <h3 className="app-panel-title">Laporan Bulanan Kependudukan</h3>
          <p className="app-panel-description">Rekap data kependudukan per bulan sesuai format laporan RT. Pilih periode lalu cetak ke PDF.</p>
        </div>
        <div className="flex items-center gap-2">
          <FiCalendar className="text-slate-400" size={16} />
          <span className="app-chip">{bulanNama[bulan]} {tahun}</span>
        </div>
      </div>

      <div className="app-panel-body space-y-5">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="app-label">Bulan</label>
            <select className="app-select" value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
              {bulanNama.slice(1).map((nama, i) => (
                <option key={i + 1} value={i + 1}>{nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="app-label">Tahun</label>
            <select className="app-select" value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {userRole === 'rw' && rtList.length > 0 && (
            <div>
              <label className="app-label">RT</label>
              <select className="app-select" value={rtId} onChange={(e) => setRtId(Number(e.target.value))}>
                <option value={0}>Semua RT</option>
                {rtList.map((rt) => (
                  <option key={rt.id} value={rt.id}>RT {rt.nomor_rt}</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={handlePrint} disabled={loading || reports.length === 0} className="app-button-primary">
            <FiPrinter size={16} />
            Cetak PDF
          </button>
        </div>

        {loading && (
          <div className="py-10 text-center text-sm text-slate-500">Memuat laporan...</div>
        )}

        {!loading && reports.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-500">Tidak ada data laporan untuk periode ini.</div>
        )}

        {!loading && reports.length > 0 && (
          <div className="overflow-x-auto" ref={printRef}>
            {reports.map((report) => (
              <ReportTable key={report.rt_id} report={report} bulan={bulan} tahun={tahun} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
