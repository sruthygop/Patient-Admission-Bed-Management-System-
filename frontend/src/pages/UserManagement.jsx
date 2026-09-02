import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, CheckCircle2, Plus, Edit2, X, Users, Shield } from 'lucide-react';

const UserManagement = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';

    const [users, setUsers] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'nurse',
        first_name: '',
        last_name: '',
        hospital_id: '',
    });

    const fetchUsers = useCallback(async () => {
        try {
            const response = await api.get('/api/v1/auth/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Failed to load users:', err);
            setError('Could not retrieve users.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchHospitals = useCallback(async () => {
        try {
            const response = await api.get('/api/v1/hospitals/');
            setHospitals(response.data);
        } catch (err) {
            console.error('Failed to load hospitals:', err);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        if (isSuperAdmin) {
            fetchHospitals();
        }
    }, [isSuperAdmin, fetchUsers, fetchHospitals]);

    const handleOpenModal = (userToEdit = null) => {
        if (userToEdit) {
            setEditingUser(userToEdit);
            setFormData({
                username: userToEdit.username,
                email: userToEdit.email,
                password: '',
                role: userToEdit.role,
                first_name: userToEdit.first_name,
                last_name: userToEdit.last_name,
                hospital_id: userToEdit.hospital_id || '',
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                email: '',
                password: '',
                role: 'nurse',
                first_name: '',
                last_name: '',
                hospital_id: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            if (editingUser) {
                await api.put(`/api/v1/auth/users/${editingUser.id}`, {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    role: formData.role,
                });
                setSuccess('User updated successfully!');
            } else {
                if (isSuperAdmin && formData.role !== 'super_admin' && !formData.hospital_id) {
                    setError('Please select a hospital for this user.');
                    return;
                }
                await api.post('/api/v1/auth/users/create', formData);
                setSuccess('User created successfully!');
            }
            fetchUsers();
            setIsModalOpen(false);
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save user.');
        }
    };

    const handleToggleActive = async (userId, currentStatus) => {
        try {
            await api.put(`/api/v1/auth/users/${userId}`, {
                is_active: !currentStatus
            });
            setSuccess(`User ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
            fetchUsers();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError('Failed to update user status.');
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-50 text-red-700 border-red-200';
            case 'super_admin': return 'bg-slate-800 text-white border-slate-900';
            case 'doctor': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'cmo': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'nurse': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'receptionist': return 'bg-amber-50 text-amber-700 border-amber-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Shield size={48} className="text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">Access Restricted</h3>
                    <p className="text-sm text-slate-400 mt-1">Only administrators and super admins can manage users.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30">
            {success && (
                <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    {success}
                </div>
            )}
            {error && (
                <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm font-semibold flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        {isSuperAdmin ? 'Add, edit and manage users across all hospitals' : 'Add, edit and manage system users'}
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
                >
                    <Plus size={16} />
                    Add New User
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                <th className="py-3.5 px-6">User</th>
                                <th className="py-3.5 px-6">Email</th>
                                <th className="py-3.5 px-6">Role</th>
                                {isSuperAdmin && <th className="py-3.5 px-6">Hospital</th>}
                                <th className="py-3.5 px-6">Status</th>
                                <th className="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/40 transition-all duration-200">
                                    <td className="py-4 px-6 align-middle">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm uppercase shrink-0">
                                                {u.first_name?.[0]}{u.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 leading-tight">{u.first_name} {u.last_name}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">@{u.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 align-middle">
                                        <span className="text-sm text-slate-600">{u.email}</span>
                                    </td>
                                    <td className="py-4 px-6 align-middle">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded border text-[10px] font-bold uppercase leading-none whitespace-nowrap ${getRoleBadgeColor(u.role)}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    {isSuperAdmin && (
                                        <td className="py-4 px-6 align-middle">
                                            <span className="text-xs text-slate-500">{u.hospital_name || 'Global'}</span>
                                        </td>
                                    )}
                                    <td className="py-4 px-6 align-middle">
                                        <div className="flex items-center">
                                            {u.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold uppercase leading-none whitespace-nowrap">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full text-[11px] font-bold uppercase leading-none whitespace-nowrap">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 align-middle text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(u)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                                title="Edit user"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(u.id, u.is_active)}
                                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 ${u.is_active
                                                    ? 'text-red-600 hover:bg-red-50'
                                                    : 'text-emerald-600 hover:bg-emerald-50'
                                                    }`}
                                            >
                                                {u.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Add/Edit User */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <Users size={16} className="text-indigo-600" />
                                </div>
                                <h3 className="text-base font-bold text-slate-800">
                                    {editingUser ? 'Edit User' : 'Add New User'}
                                </h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g. John"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g. Doe"
                                        required
                                    />
                                </div>
                            </div>

                            {!editingUser && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                            Username <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                            placeholder="e.g. dr_smith"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                            placeholder="e.g. john@hospital.com"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                            placeholder="Min 8 characters"
                                            required
                                        />
                                    </div>

                                    {isSuperAdmin && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                                Hospital {formData.role !== 'super_admin' && <span className="text-red-500">*</span>}
                                            </label>
                                            <select
                                                value={formData.hospital_id}
                                                onChange={(e) => setFormData(prev => ({ ...prev, hospital_id: e.target.value }))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                                required={formData.role !== 'super_admin'}
                                            >
                                                <option value="" disabled>Select a hospital...</option>
                                                {hospitals.map((h) => (
                                                    <option key={h.id} value={h.id}>
                                                        {h.name} ({h.code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                    required
                                >
                                    <option value="doctor">Doctor</option>
                                    <option value="nurse">Nurse</option>
                                    <option value="receptionist">Receptionist</option>
                                    <option value="cmo">CMO / Department Head</option>
                                    <option value="admin">Admin</option>
                                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                                </select>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md"
                                >
                                    {editingUser ? 'Save Changes' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;