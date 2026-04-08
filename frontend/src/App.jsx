import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import DesaPage from './pages/DesaPage';
import RwPage from './pages/RwPage';
import RtPage from './pages/RtPage';
import UserManagementPage from './pages/UserManagementPage';
import UserDetailPage from './pages/UserDetailPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import KeluargaPage from './pages/KeluargaPage';
import KeluargaFormPage from './pages/KeluargaFormPage';
import KeluargaDetail from './pages/KeluargaDetail';
import PendudukPage from './pages/PendudukPage';
import PendudukDetail from './pages/PendudukDetail';
import AktivitasLahirPage from './pages/AktivitasLahirPage';
import AktivitasLahirFormPage from './pages/AktivitasLahirFormPage';
import AktivitasMatiPage from './pages/AktivitasMatiPage';
import AktivitasMatiFormPage from './pages/AktivitasMatiFormPage';
import AktivitasPindahPage from './pages/AktivitasPindahPage';
import AktivitasPindahFormPage from './pages/AktivitasPindahFormPage';
import AktivitasDatangPage from './pages/AktivitasDatangPage';
import AktivitasDatangFormPage from './pages/AktivitasDatangFormPage';
import SuratPengantarPage from './pages/SuratPengantarPage';
import Layout from './components/Layout';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute roles={['superadmin', 'desa', 'rw', 'rt']}><Layout><ProfileSettingsPage /></Layout></PrivateRoute>} />
      <Route path="/desa" element={<PrivateRoute roles={['superadmin']}><Layout><DesaPage /></Layout></PrivateRoute>} />
      <Route path="/rw" element={<PrivateRoute roles={['superadmin', 'desa']}><Layout><RwPage /></Layout></PrivateRoute>} />
      <Route path="/rt" element={<PrivateRoute roles={['superadmin', 'desa', 'rw']}><Layout><RtPage /></Layout></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute roles={['superadmin', 'desa', 'rw']}><Layout><UserManagementPage /></Layout></PrivateRoute>} />
      <Route path="/users/:id" element={<PrivateRoute roles={['superadmin', 'desa']}><Layout><UserDetailPage /></Layout></PrivateRoute>} />
      <Route path="/keluarga" element={<PrivateRoute roles={['superadmin', 'desa', 'rw', 'rt']}><Layout><KeluargaPage /></Layout></PrivateRoute>} />
      <Route path="/keluarga/tambah" element={<PrivateRoute roles={['superadmin', 'desa', 'rw', 'rt']}><Layout><KeluargaFormPage /></Layout></PrivateRoute>} />
      <Route path="/keluarga/:id/edit" element={<PrivateRoute roles={['superadmin', 'desa', 'rw', 'rt']}><Layout><KeluargaFormPage /></Layout></PrivateRoute>} />
      <Route path="/keluarga/:id" element={<PrivateRoute roles={['superadmin', 'desa', 'rw', 'rt']}><Layout><KeluargaDetail /></Layout></PrivateRoute>} />
      <Route path="/penduduk" element={<PrivateRoute roles={['superadmin', 'desa', 'rw', 'rt']}><Layout><PendudukPage /></Layout></PrivateRoute>} />
      <Route path="/penduduk/:id" element={<PrivateRoute roles={['superadmin', 'desa', 'rw', 'rt']}><Layout><PendudukDetail /></Layout></PrivateRoute>} />
      <Route path="/aktivitas/lahir" element={<PrivateRoute roles={['superadmin', 'desa', 'rw', 'rt']}><Layout><AktivitasLahirPage /></Layout></PrivateRoute>} />
      <Route path="/aktivitas/lahir/tambah" element={<PrivateRoute roles={['superadmin', 'desa', 'rw', 'rt']}><Layout><AktivitasLahirFormPage /></Layout></PrivateRoute>} />
      <Route path="/aktivitas/mati" element={<PrivateRoute roles={['superadmin', 'desa', 'rw', 'rt']}><Layout><AktivitasMatiPage /></Layout></PrivateRoute>} />
      <Route path="/aktivitas/mati/tambah" element={<PrivateRoute roles={['superadmin', 'desa', 'rw', 'rt']}><Layout><AktivitasMatiFormPage /></Layout></PrivateRoute>} />
      <Route path="/aktivitas/pindah" element={<PrivateRoute roles={['superadmin', 'desa', 'rw', 'rt']}><Layout><AktivitasPindahPage /></Layout></PrivateRoute>} />
      <Route path="/aktivitas/pindah/tambah" element={<PrivateRoute roles={['superadmin', 'desa', 'rw', 'rt']}><Layout><AktivitasPindahFormPage /></Layout></PrivateRoute>} />
      <Route path="/aktivitas/datang" element={<PrivateRoute roles={['superadmin', 'desa', 'rw', 'rt']}><Layout><AktivitasDatangPage /></Layout></PrivateRoute>} />
      <Route path="/aktivitas/datang/tambah" element={<PrivateRoute roles={['superadmin', 'desa', 'rw', 'rt']}><Layout><AktivitasDatangFormPage /></Layout></PrivateRoute>} />
      <Route path="/surat-pengantar" element={<PrivateRoute roles={['superadmin', 'desa', 'rw', 'rt']}><Layout><SuratPengantarPage /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
