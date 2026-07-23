import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, CheckCircle2, Plus, Trash2, X, Users } from 'lucide-react';

const StaffAssignments = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [wards, setWards] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        ward_id: '',
        staff_id: '',
        shift_start: '',
        shift_end: '',
    });

    const fetchData = async () => {
        try {
            setError('');
            const [assignmentsRes, wardsRes] = await Promise.all([
                api.get('/api/v1/staff-assignments/'),
                api.get('/api/v1/beds/wards'),
            ]);
            setAssignments(assignmentsRes.data);
            setWards(wardsRes.data);

            // Only admin can fetch users list
            if (user?.role === 'admin') {
                const usersRes = await api.get('/api/v1/auth/users');
                setStaff(usersRes.data.filter(u => u.role === 'staff'));
            }
        } catch (err) {
            console.error('Failed to load staff assignments:', err);
            setError('Could not retrieve staff assignments.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await api.post('/api/v1/staff-assignments/', formData);
            setSuccess('Staff assigned successfully!');
            fetchData();
            setIsModalOpen(false);
            setFormData({ ward_id: '', staff_id: '', shift_start: '', shift_end: '' });
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to assign staff.');
        }
    };

    const handleDelete = async (assignmentId) => {
        if (!window.confirm('Are you sure you want to remove this staff assignment?')) return;
        setError('');
        setSuccess('');
        try {
            await api.delete(`/api/v1/staff-assignments/${assignmentId}`);
            setSuccess('Staff assignment removed successfully.');
            fetchData();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to remove assignment.');
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30 flex flex-col">
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
                    <h2 className="text-xl font-bold text-slate-800">Staff Assignments</h2>
                    <p className="text-sm text-slate-400 mt-1">
                        {user?.role === 'admin'
                            ? 'Assign nurses and staff to wards for shifts'
                            : 'View nurse and staff ward assignments'}
                    </p>
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
                    >
                        <Plus size={16} />
                        Assign Staff
                    </button>
                )}
            </div>

            {/* Assignments Table */}
            {assignments.length === 0 ? (
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <Users size={48} className="text-slate-300 mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No Staff Assignments</h3>
                    <p className="text-sm text-slate-400 mt-1">No staff have been assigned to any ward yet.</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                                    <th className="py-3 px-6">Staff Member</th>
                                    <th className="py-3 px-6">Ward</th>
                                    <th className="py-3 px-6">Shift Start</th>
                                    <th className="py-3 px-6">Shift End</th>
                                    {user?.role === 'admin' && <th className="py-3 px-6 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {assignments.map((assignment) => (
                                    <tr key={assignment.id} className="hover:bg-slate-50/40 transition-all duration-200">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                                                    {assignment.staff_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-800 block">{assignment.staff_name}</span>
                                                    <span className="text-xs text-slate-400">{assignment.staff_username}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-slate-800 font-semibold">{assignment.ward_name}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-xs text-slate-600">
                                                {new Date(assignment.shift_start).toLocaleString('en-US')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-xs text-slate-600">
                                                {new Date(assignment.shift_end).toLocaleString('en-US')}
                                            </span>
                                        </td>
                                        {user?.role === 'admin' && (
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => handleDelete(assignment.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                    title="Remove assignment"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal: Assign Staff - Admin only */}
            {isModalOpen && user?.role === 'admin' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                            <h3 className="text-lg font-bold text-slate-800">Assign Staff to Ward</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-all duration-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Select Ward *</label>
                                <select
                                    value={formData.ward_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, ward_id: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                    required
                                >
                                    <option value="" disabled>Select ward...</option>
                                    {wards.map((w) => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Select Staff Member *</label>
                                <select
                                    value={formData.staff_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, staff_id: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                    required
                                >
                                    <option value="" disabled>Select staff member...</option>
                                    {staff.map((s) => (
                                        <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.username})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Shift Start *</label>
                                <input
                                    type="datetime-local"
                                    value={formData.shift_start}
                                    onChange={(e) => setFormData(prev => ({ ...prev, shift_start: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Shift End *</label>
                                <input
                                    type="datetime-local"
                                    value={formData.shift_end}
                                    onChange={(e) => setFormData(prev => ({ ...prev, shift_end: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
                                >
                                    Assign Staff
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffAssignments;