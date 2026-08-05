import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BedDouble, LogOut, ShieldAlert, ClipboardList, UserCog, Stethoscope, ChevronDown, Settings, X, Eye, EyeOff, BarChart2, Pill } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Admin reset password states
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'cmo', 'nurse', 'receptionist'] },
    { to: '/patients', label: 'Patients', icon: Users, roles: ['admin', 'doctor', 'cmo', 'nurse', 'receptionist'] },
    { to: '/beds', label: 'Bed & Admissions', icon: BedDouble, roles: ['admin', 'doctor', 'cmo', 'nurse', 'receptionist'] },
    { to: '/doctor-assignments', label: 'Doctor Assignments', icon: Stethoscope, roles: ['admin', 'doctor', 'cmo', 'nurse', 'receptionist'] },
    { to: '/staff-assignments', label: 'Staff Assignments', icon: UserCog, roles: ['admin', 'cmo', 'doctor', 'nurse', 'receptionist'] },
    { to: '/prescriptions', label: 'Prescriptions', icon: Pill, roles: ['admin', 'doctor', 'cmo', 'nurse', 'receptionist'] },
    { to: '/analytics', label: 'Analytics', icon: BarChart2, roles: ['admin', 'doctor', 'cmo', 'nurse', 'receptionist'] },
    { to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList, roles: ['admin'] },
    { to: '/user-management', label: 'User Management', icon: UserCog, roles: ['admin'] },
  ];

  const visibleLinks = links.filter((link) => link.roles.includes(user?.role));

  const handleOpenProfile = async () => {
    setShowUserMenu(false);
    setShowProfileModal(true);
    if (user?.role === 'admin') {
      try {
        const res = await api.get('/api/v1/auth/users');
        setAllUsers(res.data.filter(u => u.id !== user.id));
      } catch (err) {
        console.error('Failed to load users');
      }
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    try {
      await api.put('/api/v1/auth/profile', { first_name: firstName, last_name: lastName });
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match!');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters!');
      return;
    }
    try {
      await api.put('/api/v1/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Incorrect current password.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetSuccess('');
    setResetError('');
    if (resetPassword.length < 8) {
      setResetError('Password must be at least 8 characters!');
      return;
    }
    try {
      await api.put('/api/v1/auth/admin/reset-password', {
        user_id: selectedUserId,
        new_password: resetPassword,
      });
      setResetSuccess('Password reset successfully!');
      setSelectedUserId('');
      setResetPassword('');
      setTimeout(() => setResetSuccess(''), 3000);
    } catch (err) {
      setResetError(err.response?.data?.detail || 'Failed to reset password.');
    }
  };

  return (
    <>
      <aside className="w-64 bg-[#0d1528] text-slate-100 flex flex-col h-screen sticky top-0 border-r border-slate-700/50">

        {/* Brand Header */}
        <div className="p-5 border-b border-slate-700/50 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1a1a1a] rounded-xl flex items-center justify-center border border-slate-600/30 shrink-0">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
              <rect x="15" y="5" width="10" height="30" rx="3" fill="#f59e0b" />
              <rect x="5" y="15" width="30" height="10" rx="3" fill="#f59e0b" />
              <path d="M5 20 L10 20 L13 13 L17 27 L20 10 L23 23 L26 20 L35 20"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-sm leading-none tracking-wide">
              <span className="text-white">Settlement</span>
              <span className="text-yellow-400">Sense</span>
            </h1>
            <span className="text-[9px] text-slate-500 font-medium tracking-wider uppercase">Bed Management Platform</span>
          </div>
        </div>

        {/* User Profile */}
        <div className="px-4 py-4 border-b border-slate-700/50">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-all duration-200"
          >
            <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold uppercase text-sm select-none shrink-0">
              {user?.first_name[0]}{user?.last_name[0]}
            </div>
            <div className="overflow-hidden flex-1 text-left">
              <h2 className="font-semibold text-sm text-slate-200 truncate leading-snug">{user?.first_name} {user?.last_name}</h2>
              <span className="text-xs text-indigo-400 font-medium capitalize flex items-center gap-1">
                <ShieldAlert size={9} />
                {user?.role}
              </span>
            </div>
            <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 shrink-0 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="mt-2 mx-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <button
                onClick={handleOpenProfile}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-700 transition-all duration-200"
              >
                <Settings size={13} />
                Profile Settings
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold px-3 mb-2">Navigation</p> */}
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                  }`
                }
              >
                <Icon size={17} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-700/50">
          <p className="text-center text-[9px] text-slate-600 mb-2">© 2026 Settlement Sense</p>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-950/30 hover:text-red-400 transition-all duration-200"
          >
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Profile Settings Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">User Profile Settings</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

              {/* User Info */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg uppercase">
                  {user?.first_name[0]}{user?.last_name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{user?.first_name} {user?.last_name}</h4>
                  <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
                </div>
              </div>

              {/* Update Name */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Basic Info</h4>
                {profileSuccess && <div className="mb-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">{profileSuccess}</div>}
                {profileError && <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{profileError}</div>}
                <form onSubmit={handleUpdateProfile} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">First Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Last Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Email Address (Read-only)</label>
                    <input
                      type="text"
                      value={user?.email}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowProfileModal(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50">
                      Cancel
                    </button>
                    <button type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>

              {/* Change Password */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Change Password</h4>
                {passwordSuccess && <div className="mb-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">{passwordSuccess}</div>}
                {passwordError && <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{passwordError}</div>}
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Current Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type={showCurrentPw ? 'text' : 'password'} value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 pr-9 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="Enter current password" required />
                      <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-2.5 text-slate-400">
                        {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">New Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type={showNewPw ? 'text' : 'password'} value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 pr-9 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="Min 8 characters" required />
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-2.5 text-slate-400">
                        {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Confirm New Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type={showConfirmPw ? 'text' : 'password'} value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 pr-9 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="Confirm new password" required />
                      <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3 top-2.5 text-slate-400">
                        {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">
                      Change Password
                    </button>
                  </div>
                </form>
              </div>

              {/* Admin Reset Password Section */}
              {user?.role === 'admin' && (
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Admin — Reset User Password
                  </h4>
                  {resetSuccess && <div className="mb-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">{resetSuccess}</div>}
                  {resetError && <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{resetError}</div>}
                  <form onSubmit={handleResetPassword} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Select User <span className="text-red-500">*</span></label>
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                        required
                      >
                        <option value="" disabled>Select a user...</option>
                        {allUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.first_name} {u.last_name} ({u.username})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">New Password <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="Min 8 characters"
                        required
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button type="submit"
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold">
                        Reset Password
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;