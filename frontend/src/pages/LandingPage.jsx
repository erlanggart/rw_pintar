import { Link } from 'react-router-dom';
import {
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiClock,
  FiGrid,
  FiLayers,
  FiMapPin,
  FiShield,
  FiUsers,
} from 'react-icons/fi';

const metrics = [
  {
    value: '3 level',
    label: 'Akses admin desa, RW, dan RT dalam satu sistem.',
  },
  {
    value: '6 modul',
    label: 'Kelola wilayah, keluarga, penduduk, dan aktivitas harian.',
  },
  {
    value: 'Realtime',
    label: 'Perubahan data lebih mudah dipantau tanpa alur yang rumit.',
  },
];

const modules = [
  {
    title: 'Struktur Wilayah',
    description: 'Pantau desa, RW, dan RT dengan susunan yang jelas.',
    icon: FiMapPin,
    tone: 'from-amber-100 via-white to-white',
  },
  {
    title: 'Data Keluarga',
    description: 'Pencatatan keluarga lebih rapi dan mudah ditelusuri.',
    icon: FiUsers,
    tone: 'from-teal-100 via-white to-white',
  },
  {
    title: 'Data Penduduk',
    description: 'Informasi warga tersimpan dalam satu tempat yang konsisten.',
    icon: FiGrid,
    tone: 'from-orange-100 via-white to-white',
  },
  {
    title: 'Aktivitas Warga',
    description: 'Catat lahir, mati, datang, dan pindah dengan lebih cepat.',
    icon: FiActivity,
    tone: 'from-sky-100 via-white to-white',
  },
];

const features = [
  {
    title: 'Pendataan lebih tertata',
    description: 'Setiap modul dirancang supaya operator bisa fokus pada data inti tanpa antarmuka yang berisik.',
    icon: FiLayers,
  },
  {
    title: 'Hak akses sesuai peran',
    description: 'Admin desa, RW, dan RT hanya melihat menu yang relevan, sehingga proses kerja lebih aman dan ringkas.',
    icon: FiShield,
  },
  {
    title: 'Ringkasan cepat dibaca',
    description: 'Dashboard menampilkan statistik utama agar progres wilayah bisa dipahami dalam sekali lihat.',
    icon: FiBarChart2,
  },
];

const roles = [
  {
    title: 'Admin Desa',
    description: 'Memantau struktur wilayah yang lebih luas dan mengelola akun operasional di bawahnya.',
  },
  {
    title: 'Admin RW',
    description: 'Mengontrol data RT, keluarga, penduduk, serta aktivitas pada area RW yang ditangani.',
  },
  {
    title: 'Admin RT',
    description: 'Fokus pada pendataan rumah tangga dan perubahan aktivitas warga secara harian.',
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-cream)] text-slate-900">
      <div className="landing-grid absolute inset-0 opacity-40" />
      <div className="landing-orb landing-orb-sand -left-20 top-20 h-72 w-72" />
      <div className="landing-orb landing-orb-teal -right-16 top-56 h-80 w-80" />

      <header className="relative z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pb-6 pt-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-lg font-bold text-white shadow-lg shadow-slate-900/15">
              RW
            </div>
            <div>
              <p className="font-display text-xl text-slate-950">RW Pintar</p>
              <p className="text-sm text-slate-500">Sistem administrasi warga yang lebih rapi</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-600 backdrop-blur sm:inline-flex">
              Digitalisasi layanan desa, RW, dan RT
            </span>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Masuk
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8 lg:pb-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
            <div className="animate-fade-rise">
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Platform Administrasi Warga
              </span>
              <h1 className="font-display mt-6 max-w-3xl text-4xl leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Pendataan warga yang modern, sederhana, dan nyaman dipakai.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                RW Pintar membantu pengurus mengelola struktur wilayah, data keluarga, data penduduk, dan aktivitas warga dari satu dashboard yang ringan dipahami di desktop maupun mobile.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Masuk ke Sistem
                  <FiArrowRight size={18} />
                </Link>
                <a
                  href="#fitur"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
                >
                  Lihat Fitur
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {metrics.map((item) => (
                  <div key={item.value} className="rounded-3xl border border-white/60 bg-white/75 p-5 shadow-lg shadow-slate-900/5 backdrop-blur">
                    <p className="font-display text-2xl text-slate-950">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-fade-rise-delayed">
              <div className="glass-panel relative overflow-hidden rounded-[30px] border border-white/60 bg-white/80 p-5 shadow-[0_32px_90px_-50px_rgba(15,23,42,0.45)] sm:p-6">
                <div className="absolute -right-6 top-10 hidden h-24 w-24 rounded-full bg-amber-200/70 sm:block float-soft" />
                <div className="absolute -left-6 bottom-14 hidden h-20 w-20 rounded-full bg-teal-200/80 sm:block float-soft" />

                <div className="relative flex items-center justify-between border-b border-slate-200/70 pb-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Ringkasan Operasional</p>
                    <h2 className="font-display text-2xl text-slate-950">Dashboard RW Pintar</h2>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Siap Digunakan
                  </span>
                </div>

                <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
                  {modules.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className={`rounded-3xl border border-slate-200/80 bg-gradient-to-br ${item.tone} p-4`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                          </div>
                          <div className="rounded-2xl bg-white/90 p-3 text-slate-900 shadow-sm">
                            <Icon size={18} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="relative mt-6 rounded-[28px] bg-slate-900 p-5 text-white sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-300">Monitoring Harian</p>
                      <p className="mt-2 font-display text-3xl text-white">24 Jam</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3 text-amber-300">
                      <FiClock size={20} />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {[
                      'Perubahan data keluarga lebih cepat tercatat.',
                      'Aktivitas warga tersusun menurut jenis kejadian.',
                      'Statistik penting langsung terlihat di dashboard.',
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="fitur" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Kenapa RW Pintar
              </span>
              <h2 className="font-display mt-3 text-3xl text-slate-950 sm:text-4xl">
                Fokus pada kebutuhan administrasi yang benar-benar dipakai.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Desain antarmuka dibuat lebih bersih agar operator cepat paham, tidak perlu menebak-nebak alur, dan tetap nyaman digunakan dari ponsel.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
                  <div className="inline-flex rounded-2xl bg-slate-900 p-3 text-white">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="rounded-[32px] bg-slate-900 px-6 py-8 text-white shadow-[0_32px_90px_-50px_rgba(15,23,42,0.8)] sm:px-8 lg:px-10 lg:py-10">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <span className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
                  Alur Peran
                </span>
                <h2 className="font-display mt-3 text-3xl sm:text-4xl">
                  Setiap level kerja mendapatkan tampilan yang sesuai tugasnya.
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                  Dengan pembagian peran yang jelas, pengurus bisa bergerak lebih cepat tanpa dibebani menu yang tidak relevan dengan wilayah tanggung jawabnya.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {roles.map((item, index) => (
                  <div key={item.title} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
                      0{index + 1}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 px-6 py-8 shadow-lg shadow-slate-900/5 backdrop-blur sm:px-8 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Siap Digunakan
                </span>
                <h2 className="font-display mt-3 text-3xl text-slate-950 sm:text-4xl">
                  Mulai masuk dan kelola data warga dari satu pusat kerja.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Landing page ini dibuat untuk memberi titik masuk yang lebih jelas sebelum autentikasi, tanpa mengubah alur dashboard yang sudah berjalan.
                </p>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-400"
              >
                Lanjut ke Login
                <FiArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}