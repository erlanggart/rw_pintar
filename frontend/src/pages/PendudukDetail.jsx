import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';
import AppPageHeader from '../components/AppPageHeader';
import api from '../utils/api';

export default function PendudukDetail() {
  const { id } = useParams();
  const [penduduk, setPenduduk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/penduduk.php?id=${id}`)
      .then((res) => setPenduduk(res.data))
      .catch(() => toast.error('Gagal memuat detail penduduk'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="app-panel">
        <div className="app-panel-body py-16 text-center text-sm text-slate-500">Memuat detail penduduk...</div>
      </div>
    );
  }

  if (!penduduk) {
    return (
      <div className="app-panel">
        <div className="app-panel-body py-16 text-center text-sm text-rose-600">Data penduduk tidak ditemukan.</div>
      </div>
    );
  }

  const heroStats = [
    { kicker: 'NIK', value: penduduk.nik },
    { kicker: 'Status', value: penduduk.status_penduduk || 'Tetap' },
    { kicker: 'No. KK', value: penduduk.no_kk || '-' },
  ];

  const detailItems = [
    { label: 'Nama Lengkap', value: penduduk.nama_lengkap },
    { label: 'Jenis Kelamin', value: penduduk.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan' },
    { label: 'Tempat, Tanggal Lahir', value: [penduduk.tempat_lahir, penduduk.tanggal_lahir].filter(Boolean).join(', ') || '-' },
    { label: 'Agama', value: penduduk.agama || '-' },
    { label: 'Status Perkawinan', value: penduduk.status_perkawinan || '-' },
    { label: 'Pekerjaan', value: penduduk.pekerjaan || '-' },
    { label: 'Pendidikan', value: penduduk.pendidikan || '-' },
    { label: 'Hubungan Keluarga', value: penduduk.hubungan_keluarga || '-' },
    { label: 'Golongan Darah', value: penduduk.golongan_darah || '-' },
    { label: 'Kewarganegaraan', value: penduduk.kewarganegaraan || '-' },
    { label: 'No. Telepon', value: penduduk.no_telepon || '-' },
    { label: 'Kartu Keluarga', value: `${penduduk.no_kk || '-'}${penduduk.kepala_keluarga ? ` — ${penduduk.kepala_keluarga}` : ''}` },
  ];

  return (
    <div className="app-page">
      <AppPageHeader
        eyebrow="Detail Penduduk"
        title={penduduk.nama_lengkap}
        description="Profil penduduk ditampilkan lebih ringkas agar mudah dibaca dari mobile maupun desktop."
        stats={heroStats}
        actions={(
          <Link to="/penduduk" className="app-button-secondary">
            <FiArrowLeft size={18} />
            Kembali
          </Link>
        )}
      />

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="app-panel-title">Informasi Penduduk</h3>
            <p className="app-panel-description">Rincian identitas warga dan keterhubungannya dengan kartu keluarga.</p>
          </div>
          <span className="app-chip">{penduduk.hubungan_keluarga || 'Warga'}</span>
        </div>

        <div className="app-panel-body">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {detailItems.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}