import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Shield, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Profile = () => {
    const { user } = useAuth();
    const [firstName, setFirstName] = useState(user?.first_name || '');
    const [lastName, setLastName] = useState(user?.last_name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileSuccess('');
        setProfileError('');
        setProfileLoading(true);
        try {
            await api.put(`/api/v1/auth/profile`, {
                first_name: firstName,
                last_name: lastName,
            });
            setProfileSuccess('Profile updated successfully!');
            setTimeout(() => setProfileSuccess(''), 4000);
        } catch (err) {
            console.error(err);
            setProfileError(err.response?.data?.detail || 'Failed to update profile.');
        } finally {
            setProfileLoading(false);
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
            setPasswordError('New password must be at least 8 characters!');
            return;
        }

        setPasswordLoading(true);
        try {
            await api.put(`/api/v1/auth/change-password`, {
                current_password: currentPassword,
                new_password: newPassword,
            });
            setPasswordSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordSuccess(''), 4000);
        } catch (err) {
            console.error(err);
            setPasswordError(err.response?.data?.detail || 'Failed to change password. Check your current password.');
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Profile Settings</h2>
                    <p className="text-sm text-slate-400 mt-1">Manage your account information and password</p>
                </div>

                {/* User Info Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                        <div className="w-16 h-16 rounded-full bg-indigo-600/10 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xl uppercase">
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">{user?.first_name} {user?.last_name}</h3>
                            <p className="text-sm text-slate-400">{user?.email}</p>
                            <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-semibold capitalize mt-1 inline-block">
                                {user?.role}
                            </span>
                        </div>
                    </div>

                    {/* Read-only info */}
                    <div className="grid grid-cols-1 gap-4 mb-2">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <Mail size={16} className="text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-400 font-semibold">Email Address (Read-only)</p>
                                <p className="text-sm text-slate-700 font-medium">{user?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <Shield size={16} className="text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-400 font-semibold">Role (Read-only)</p>
                                <p className="text-sm text-slate-700 font-medium capitalize">{user?.role}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Update Name */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <User size={18} className="text-indigo-600" />
                        Update Name
                    </h3>

                    {profileSuccess && (
                        <div className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            {profileSuccess}
                        </div>
                    )}
                    {profileError && (
                        <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm font-semibold flex items-center gap-2">
                            <AlertCircle size={16} />
                            {profileError}
                        </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">First Name *</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Last Name *</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={profileLoading}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
                            >
                                {profileLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Lock size={18} className="text-indigo-600" />
                        Change Password
                    </h3>

                    {passwordSuccess && (
                        <div className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            {passwordSuccess}
                        </div>
                    )}
                    {passwordError && (
                        <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm font-semibold flex items-center gap-2">
                            <AlertCircle size={16} />
                            {passwordError}
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Current Password *</label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 pr-10 text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="Enter current password"
                                    required
                                />
                                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                                    {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">New Password *</label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 pr-10 text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="Enter new password (min 8 characters)"
                                    required
                                />
                                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                                    {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Confirm New Password *</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 pr-10 text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="Confirm new password"
                                    required
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={passwordLoading}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
                            >
                                {passwordLoading ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;