import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, CheckCircle2, Plus, X, Pill, User, Clock } from 'lucide-react';

const Prescriptions = () => {
    const { user } = useAuth();
    const [admissions, setAdmissions] = useState([]);
    const [selectedAdmission, setSelectedAdmission] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [presLoading, setPresLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        medicine_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
    });

    useEffect(() => {
        fetchAdmissions();
    }, []);

    const fetchAdmissions = async () => {
        try {
            const response = await api.get('/api/v1/admissions/active');
            setAdmissions(response.data);
            if (response.data.length > 0) {
                setSelectedAdmission(response.data[0]);
                fetchPrescriptions(response.data[0].id);
            }
        } catch (err) {
            console.error('Failed to load admissions:', err);
            setError('Could not load admissions.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPrescriptions = async (admissionId) => {
        setPresLoading(true);
        try {
            const response = await api.get(`/api/v1/prescriptions/admission/${admissionId}`);
            setPrescriptions(response.data);
        } catch (err) {
            console.error('Failed to load prescriptions:', err);
        } finally {
            setPresLoading(false);
        }
    };

    const handleSelectAdmission = (admission) => {
        setSelectedAdmission(admission);
        fetchPrescriptions(admission.id);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await api.post('/api/v1/prescriptions/', {
                ...formData,
                admission_id: selectedAdmission.id,
                patient_id: selectedAdmission.patient_id,
            });
            setSuccess('Prescription added successfully!');
            fetchPrescriptions(selectedAdmission.id);
            setIsModalOpen(false);
            setFormData({ medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' });
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to add prescription.');
        }
    };

    const handleDeactivate = async (prescriptionId) => {
        if (!window.confirm('Are you sure you want to deactivate this prescription?')) return;
        try {
            await api.delete(`/api/v1/prescriptions/${prescriptionId}`);
            setSuccess('Prescription deactivated successfully!');
            fetchPrescriptions(selectedAdmission.id);
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to deactivate prescription.');
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
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Digital Prescriptions</h1>
                <p className="text-sm text-slate-400 mt-1">Manage prescriptions for active admissions</p>
            </div>

            {admissions.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                    <Pill size={48} className="text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No Active Admissions</h3>
                    <p className="text-sm text-slate-400 mt-1">No patients are currently admitted.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left — Patient List */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Patients</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {admissions.map((admission) => (
                                <button
                                    key={admission.id}
                                    onClick={() => handleSelectAdmission(admission)}
                                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-all duration-200 ${selectedAdmission?.id === admission.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                                            {admission.patient?.first_name?.[0]}{admission.patient?.last_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">
                                                {admission.patient?.first_name} {admission.patient?.last_name}
                                            </p>
                                            <p className="text-xs text-slate-400">{admission.reason_for_admission}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right — Prescriptions */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Selected Patient Header */}
                        {selectedAdmission && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold uppercase">
                                        {selectedAdmission.patient?.first_name?.[0]}{selectedAdmission.patient?.last_name?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">
                                            {selectedAdmission.patient?.first_name} {selectedAdmission.patient?.last_name}
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            {selectedAdmission.reason_for_admission} • Admitted {new Date(selectedAdmission.admission_date).toLocaleDateString('en-US')}
                                        </p>
                                    </div>
                                </div>
                                {(user?.role === 'doctor' || user?.role === 'cmo') && (
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
                                    >
                                        <Plus size={16} />
                                        Add Prescription
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Prescriptions List */}
                        {presLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="animate-spin text-indigo-600" size={24} />
                            </div>
                        ) : prescriptions.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                                <Pill size={48} className="text-slate-300 mx-auto mb-3" />
                                <h3 className="text-base font-bold text-slate-800">No Prescriptions</h3>
                                <p className="text-sm text-slate-400 mt-1">No prescriptions added for this patient yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {prescriptions.map((prescription) => (
                                    <div key={prescription.id} className={`bg-white border rounded-2xl p-5 shadow-sm ${prescription.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                                    <Pill size={16} className="text-indigo-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{prescription.medicine_name}</h4>
                                                    <p className="text-xs text-slate-400">{prescription.dosage}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {prescription.is_active ? (
                                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase">Active</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-[10px] font-bold uppercase">Inactive</span>
                                                )}
                                                {(user?.role === 'doctor' || user?.role === 'cmo') && prescription.is_active && (
                                                    <button
                                                        onClick={() => handleDeactivate(prescription.id)}
                                                        className="text-xs text-red-500 hover:text-red-700 font-semibold transition-all duration-200"
                                                    >
                                                        Deactivate
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 mb-3">
                                            <div className="bg-slate-50 rounded-lg p-2.5">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Frequency</p>
                                                <p className="text-xs font-semibold text-slate-700 mt-0.5">{prescription.frequency}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-2.5">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                                                <p className="text-xs font-semibold text-slate-700 mt-0.5">{prescription.duration}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-2.5">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Prescribed By</p>
                                                <p className="text-xs font-semibold text-slate-700 mt-0.5">Dr. {prescription.prescribed_by_name}</p>
                                            </div>
                                        </div>
                                        {prescription.instructions && (
                                            <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                                                <p className="text-[10px] font-bold text-amber-600 uppercase mb-0.5">Instructions</p>
                                                <p className="text-xs text-amber-800">{prescription.instructions}</p>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 mt-3">
                                            <Clock size={10} className="text-slate-400" />
                                            <p className="text-[10px] text-slate-400">
                                                {new Date(prescription.prescribed_at).toLocaleString('en-US')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Prescription Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <Pill size={16} className="text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">Add Prescription</h3>
                                    <p className="text-xs text-slate-400">
                                        For: {selectedAdmission?.patient?.first_name} {selectedAdmission?.patient?.last_name}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                    Medicine Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.medicine_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, medicine_name: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="e.g. Paracetamol"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                        Dosage <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.dosage}
                                        onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g. 500mg"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                        Frequency <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.frequency}
                                        onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                        required
                                    >
                                        <option value="" disabled>Select...</option>
                                        <option value="Once daily">Once daily</option>
                                        <option value="Twice daily">Twice daily</option>
                                        <option value="Three times daily">Three times daily</option>
                                        <option value="Four times daily">Four times daily</option>
                                        <option value="Every 6 hours">Every 6 hours</option>
                                        <option value="Every 8 hours">Every 8 hours</option>
                                        <option value="Every 12 hours">Every 12 hours</option>
                                        <option value="As needed">As needed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                    Duration <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.duration}
                                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                    required
                                >
                                    <option value="" disabled>Select...</option>
                                    <option value="1 day">1 day</option>
                                    <option value="2 days">2 days</option>
                                    <option value="3 days">3 days</option>
                                    <option value="5 days">5 days</option>
                                    <option value="7 days">7 days</option>
                                    <option value="10 days">10 days</option>
                                    <option value="14 days">14 days</option>
                                    <option value="1 month">1 month</option>
                                    <option value="Until discharge">Until discharge</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                    Instructions
                                </label>
                                <textarea
                                    value={formData.instructions}
                                    onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="e.g. Take after food, avoid alcohol..."
                                />
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50">
                                    Cancel
                                </button>
                                <button type="submit"
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md">
                                    Add Prescription
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Prescriptions;