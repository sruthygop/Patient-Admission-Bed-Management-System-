import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, CheckCircle2, Plus, Edit2, X, Building2, Shield, Search, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';

const getErrorMessage = (err, fallback) => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
        return detail.map(d => d.msg || JSON.stringify(d)).join('; ');
    }
    return fallback;
};

const HospitalManagement = () => {
    const { user } = useAuth();
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHospital, setEditingHospital] = useState(null);
    const [exporting, setExporting] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // '', 'active', 'inactive'

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);

    const [submitting, setSubmitting] = useState(false);
    const [togglingId, setTogglingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        logo_url: '',
    });

    const fetchHospitals = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/v1/hospitals/', {
                params: {
                    page,
                    page_size: pageSize,
                    search: searchTerm.trim() || undefined,
                    is_active: statusFilter === '' ? undefined : statusFilter === 'active',
                }
            });
            setHospitals(response.data.items || []);
            setTotalCount(response.data.total_count || 0);
        } catch (err) {
            console.error('Failed to load hospitals:', err);
            setError(getErrorMessage(err, 'Could not retrieve hospitals.'));
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    }, [page, pageSize, searchTerm, statusFilter]);

    // Debounced fetch on search/filter change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchHospitals();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchHospitals]);

    // Reset to page 1 whenever search or status filter changes
    useEffect(() => {
        setPage(1);
    }, [searchTerm, statusFilter]);

    const handleOpenModal = (hospitalToEdit = null) => {
        setError('');
        if (hospitalToEdit) {
            setEditingHospital(hospitalToEdit);
            setFormData({
                name: hospitalToEdit.name,
                code: hospitalToEdit.code,
                address: hospitalToEdit.address || '',
                phone: hospitalToEdit.phone || '',
                email: hospitalToEdit.email || '',
                logo_url: hospitalToEdit.logo_url || '',
            });
        } else {
            setEditingHospital(null);
            setFormData({
                name: '',
                code: '',
                address: '',
                phone: '',
                email: '',
                logo_url: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (submitting) return; // don't allow closing mid-submit
        setIsModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            if (editingHospital) {
                // code is immutable after creation — excluded from update payload
                await api.put(`/api/v1/hospitals/${editingHospital.id}`, {
                    name: formData.name,
                    address: formData.address,
                    phone: formData.phone,
                    email: formData.email,
                    logo_url: formData.logo_url,
                });
                setSuccess('Hospital updated successfully!');
            } else {
                await api.post('/api/v1/hospitals/', formData);
                setSuccess('Hospital created successfully!');
            }
            fetchHospitals();
            setIsModalOpen(false);
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to save hospital.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (hospitalId, currentStatus) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} this hospital?`)) return;
        setError('');
        setTogglingId(hospitalId);
        try {
            await api.put(`/api/v1/hospitals/${hospitalId}`, {
                is_active: !currentStatus
            });
            setSuccess(`Hospital ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
            fetchHospitals();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to update hospital status.'));
        } finally {
            setTogglingId(null);
        }
    };

    const handleExportExcel = async () => {
        setError('');
        setExporting(true);
        try {
            const response = await api.get('/api/v1/hospitals/export/excel', {
                params: {
                    search: searchTerm.trim() || undefined,
                    is_active: statusFilter === '' ? undefined : statusFilter === 'active',
                },
                responseType: 'blob',
            });
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `hospitals_export_${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            setError(getErrorMessage(err, 'Failed to export hospital data.'));
        } finally {
            setExporting(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    if (user?.role !== 'super_admin') {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Shield size={48} className="text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">Access Restricted</h3>
                    <p className="text-sm text-slate-400 mt-1">Only Super Admins can manage hospitals.</p>
                </div>
            </div>
        );
    }

    if (initialLoading) {
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
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Hospital Management</h1>
                    <p className="text-sm text-slate-400 mt-1">Onboard and manage hospital tenants</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportExcel}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                        {exporting ? 'Exporting...' : 'Export Excel'}
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
                    >
                        <Plus size={16} />
                        Add New Hospital
                    </button>
                </div>
            </div>

            {/* Search + Filter Bar */}
            <div className="mb-4 flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by hospital name or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 shadow-sm"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="py-2 px-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 shadow-sm"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                </select>
            </div>

            {/* Hospitals Table */}
            {hospitals.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <Building2 size={48} className="text-slate-300 mb-3" />
                    <h3 className="text-base font-bold text-slate-800">
                        {searchTerm || statusFilter ? 'No Matching Hospitals' : 'No Hospitals Found'}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        {searchTerm || statusFilter ? 'Try adjusting your search or filter.' : 'Click Add New Hospital to onboard one.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                    <th className="py-3 px-6">Hospital</th>
                                    <th className="py-3 px-6">Code</th>
                                    <th className="py-3 px-6">Contact</th>
                                    <th className="py-3 px-6">Status</th>
                                    <th className="py-3 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {hospitals.map((h) => (
                                    <tr key={h.id} className="hover:bg-slate-50/40 transition-all duration-200">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 overflow-hidden shrink-0">
                                                    {h.logo_url ? (
                                                        <img
                                                            src={h.logo_url}
                                                            alt={`${h.name} logo`}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                        />
                                                    ) : null}
                                                    <Building2 size={16} style={{ display: h.logo_url ? 'none' : 'flex' }} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{h.name}</p>
                                                    {h.address && <p className="text-xs text-slate-400">{h.address}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded border bg-slate-50 text-slate-600 border-slate-200">
                                                {h.code}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-sm text-slate-600">{h.email || '—'}</p>
                                            <p className="text-xs text-slate-400">{h.phone || ''}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            {h.is_active ? (
                                                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase">
                                                    ● Active
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full text-[10px] font-bold uppercase">
                                                    ● Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(h)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                                    title="Edit hospital"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(h.id, h.is_active)}
                                                    disabled={togglingId === h.id}
                                                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${h.is_active
                                                        ? 'text-red-600 hover:bg-red-50'
                                                        : 'text-emerald-600 hover:bg-emerald-50'
                                                        }`}
                                                >
                                                    {togglingId === h.id ? '...' : (h.is_active ? 'Deactivate' : 'Activate')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
                        <span className="text-xs text-slate-500 font-medium">
                            Showing {totalCount > 0 ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, totalCount)} of {totalCount} hospitals
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs font-semibold text-slate-600 px-2">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add/Edit Hospital */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <Building2 size={16} className="text-indigo-600" />
                                </div>
                                <h3 className="text-base font-bold text-slate-800">
                                    {editingHospital ? 'Edit Hospital' : 'Add New Hospital'}
                                </h3>
                            </div>
                            <button onClick={handleCloseModal} disabled={submitting} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-50">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                    Hospital Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    disabled={submitting}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                    placeholder="e.g. City General Hospital"
                                    required
                                />
                            </div>

                            {!editingHospital && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                        Hospital Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                        disabled={submitting}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                        placeholder="e.g. CG-003"
                                        required
                                    />
                                    <p className="text-[11px] text-slate-400">Code cannot be changed after creation.</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    disabled={submitting}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                    placeholder="e.g. 123 Healthcare Blvd"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                        Phone
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        disabled={submitting}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                        placeholder="e.g. +91-484-555-0101"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        disabled={submitting}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                        placeholder="e.g. info@hospital.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                    Logo URL
                                </label>
                                <input
                                    type="text"
                                    value={formData.logo_url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                                    disabled={submitting}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={submitting}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md flex items-center gap-2 disabled:opacity-50"
                                >
                                    {submitting && <Loader2 size={16} className="animate-spin" />}
                                    {editingHospital ? 'Save Changes' : 'Create Hospital'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HospitalManagement;