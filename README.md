# RW Pintar - Aplikasi Pendataan Penduduk

Aplikasi pendataan penduduk berbasis web dengan sistem multi-level akses (Super Admin, Desa, RW, RT).

## Teknologi
- **Frontend**: React JS + Tailwind CSS + Vite
- **Backend**: PHP Native (REST API)
- **Database**: MySQL

## Informasi Akses

- Aplikasi memakai sistem multi-role: Super Admin, Admin Desa, Admin RW, dan Admin RT.
- Akun wilayah dibuat otomatis saat data Desa, RW, atau RT dibuat di sistem.
- Kredensial login, pola username, dan password default tidak dicantumkan di README publik. Pengelolaan akses dilakukan oleh administrator sistem.

### Hak akses per role
| Role | Cakupan Akses |
|------|---------------|
| Super Admin | Kelola desa, RW, RT, akun pengguna, serta melihat dan mengelola seluruh data keluarga, penduduk, dan aktivitas |
| Admin Desa | Kelola RW dan RT dalam desa, kelola akun RW/RT di desa, serta melihat dan mengelola data keluarga, penduduk, dan aktivitas dalam desa |
| Admin RW | Kelola RT dalam RW, kelola akun RT dalam RW, serta melihat dan mengelola data keluarga, penduduk, dan aktivitas dalam RW |
| Admin RT | Kelola data keluarga (KK), penduduk, dan aktivitas pada RT miliknya sendiri |

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
- **Super Admin**: Dashboard statistik, kelola desa, RW, RT, akun pengguna, serta seluruh data kependudukan
- **Admin Desa**: Kelola RW dan RT dalam desa, kelola akun wilayah terkait, dan akses data desa sendiri
- **Admin RW**: Kelola RT dalam RW, kelola akun RT, dan akses data RW sendiri
- **Admin RT**: Input data keluarga (KK), input data penduduk (KTP), dan catat aktivitas penduduk (Lahir, Mati, Pindah, Datang) di RT sendiri
- Setiap penambahan Desa/RW/RT otomatis membuat akun admin wilayah terkait dengan username unik
