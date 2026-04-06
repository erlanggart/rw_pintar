# RW Pintar - Aplikasi Pendataan Penduduk

Aplikasi pendataan penduduk berbasis web dengan sistem multi-level akses (Super Admin, Desa, RW, RT).

## Teknologi
- **Frontend**: React JS + Tailwind CSS + Vite
- **Backend**: PHP Native (REST API)
- **Database**: MySQL

## Struktur Akun
| Role | Username | Password | Hak Akses |
|------|----------|----------|-----------|
| Super Admin | `superadmin` | `password123` | Kelola Desa |
| Admin Desa | `admin_desa` | `password123` | Kelola RW |
| Admin RW | `admin_rw` | `password123` | Kelola RT |
| Admin RT | `admin_rt` | `password123` | Kelola Penduduk & Aktivitas |

## Setup

### 1. Database
Pastikan Laragon sudah berjalan (Apache + MySQL), lalu import database:
```bash
mysql -u root < database/rw_pintar.sql
```
Atau import melalui phpMyAdmin: buka `http://localhost/phpmyadmin`, buat database `rw_pintar`, lalu import file `database/rw_pintar.sql`.

### 2. Backend
Backend menggunakan PHP native yang berjalan langsung melalui Apache Laragon.
API tersedia di: `http://localhost/rw-pintar/backend/api/`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend berjalan di: `http://localhost:5173`

## API Endpoints
| Endpoint | Method | Keterangan |
|----------|--------|------------|
| `/api/auth/login.php` | POST | Login |
| `/api/auth/me.php` | GET | Info user |
| `/api/dashboard.php` | GET | Statistik dashboard |
| `/api/desa.php` | GET/POST/PUT/DELETE | CRUD Desa |
| `/api/rw.php` | GET/POST/PUT/DELETE | CRUD RW |
| `/api/rt.php` | GET/POST/PUT/DELETE | CRUD RT |
| `/api/keluarga.php` | GET/POST/PUT/DELETE | CRUD Keluarga (KK) |
| `/api/penduduk.php` | GET/POST/PUT/DELETE | CRUD Penduduk |
| `/api/aktivitas.php` | GET/POST/DELETE | Aktivitas (Lahir/Mati/Pindah/Datang) |

## Fitur
- **Super Admin**: Dashboard statistik, kelola data desa
- **Admin Desa**: Kelola RW dalam desa, lihat data penduduk
- **Admin RW**: Kelola RT dalam RW, lihat data penduduk
- **Admin RT**: Input data keluarga (KK), input data penduduk (KTP), catat aktivitas penduduk (Lahir, Mati, Pindah, Datang)
- Setiap penambahan Desa/RW/RT otomatis membuat akun admin terkait
