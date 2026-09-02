import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Beds from './pages/Beds';
import AuditLogs from './pages/AuditLogs';
import StaffAssignments from './pages/StaffAssignments';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DoctorAssignments from './pages/DoctorAssignments';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import Prescriptions from './pages/Prescriptions';
import UserManagement from './pages/UserManagement';
import HospitalManagement from './pages/HospitalManagement';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedLayout>
            <Patients />
          </ProtectedLayout>
        }
      />
      <Route
        path="/beds"
        element={
          <ProtectedLayout>
            <Beds />
          </ProtectedLayout>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedLayout>
            <AuditLogs />
          </ProtectedLayout>
        }
      />
      <Route
        path="/staff-assignments"
        element={
          <ProtectedLayout>
            <StaffAssignments />
          </ProtectedLayout>
        }
      />
      <Route
        path="/doctor-assignments"
        element={
          <ProtectedLayout>
            <DoctorAssignments />
          </ProtectedLayout>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedLayout>
            <Profile />
          </ProtectedLayout>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedLayout>
            <Analytics />
          </ProtectedLayout>
        }
      />
      <Route
        path="/prescriptions"
        element={
          <ProtectedLayout>
            <Prescriptions />
          </ProtectedLayout>
        }
      />
      <Route
        path="/user-management"
        element={
          <ProtectedLayout>
            <UserManagement />
          </ProtectedLayout>
        }
      />
      <Route
        path="/hospital-management"
        element={
          <ProtectedLayout>
            <HospitalManagement />
          </ProtectedLayout>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;