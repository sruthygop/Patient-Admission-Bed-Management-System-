import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, CheckCircle2, Plus, Edit2, X, Building2, Shield } from 'lucide-react';

const HospitalManagement = () => {
    const { user } = useAuth();
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHospital, setEditingHospital] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        logo_url: '',
    });

    const fetchHospitals = async () => {
        try {
            const response = await api.get('/api/v1/hospitals/');
            setHospitals(response.data);
        } catch (err) {
            console.error('Failed to load hospitals:', err);
            setError('Could not retrieve hospitals.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHospitals();
    }, []);

    const handleOpenModal = (hospitalToEdit = null) => {
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
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
            setError(err.response?.data?.detail || 'Failed to save hospital.');
        }
    };

    const handleToggleActive = async (hospitalId, currentStatus) => {
        try {
            await api.put(`/api/v1/hospitals/${hospitalId}`, {
                is_active: !currentStatus
            });
            setSuccess(`Hospital ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
            fetchHospitals();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError('Failed to update hospital status.');
        }
    };

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
                    <h1 className="text-2xl font-bold text-slate-800">Hospital Management</h1>
                    <p className="text-sm text-slate-400 mt-1">Onboard and manage hospital tenants</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
                >
                    <Plus size={16} />
                    Add New Hospital
                </button>
            </div>

            {/* Hospitals Table */}
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
                                            <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                                <Building2 size={16} />
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
                                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 ${h.is_active
                                                    ? 'text-red-600 hover:bg-red-50'
                                                    : 'text-emerald-600 hover:bg-emerald-50'
                                                    }`}
                                            >
                                                {h.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

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
                            <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200">
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
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
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
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
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
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
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
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
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
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
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
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="https://..."
                                />
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