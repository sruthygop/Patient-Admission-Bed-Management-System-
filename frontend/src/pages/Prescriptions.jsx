import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, CheckCircle2, Plus, X, Pill, Clock, UserCheck } from 'lucide-react';

const INITIAL_FORM_DATA = {
    medicine_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
};

const getErrorMessage = (err, fallback) => {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) return detail[0].msg || fallback;
    return fallback;
};

const Prescriptions = () => {
    const { user } = useAuth();
    const userId = user?.id;
    const userRole = user?.role;

    const [admissions, setAdmissions] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [selectedAdmission, setSelectedAdmission] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [presLoading, setPresLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);

    const fetchPrescriptions = useCallback(async (admissionId) => {
        if (!admissionId) return;
        setPresLoading(true);
        try {
            const response = await api.get(`/api/v1/prescriptions/admission/${admissionId}`);
            setPrescriptions(response.data || []);
        } catch (err) {
            console.error('Failed to load prescriptions:', err);
            setError(getErrorMessage(err, 'Could not load prescriptions for the selected patient.'));
        } finally {
            setPresLoading(false);
        }
    }, []);

    const fetchAdmissions = useCallback(async () => {
        try {
            const [admissionsRes, doctorsRes] = await Promise.all([
                api.get('/api/v1/admissions/active'),
                api.get('/api/v1/auth/doctors').catch(() => ({ data: [] })), // fail-safe if doctor endpoint fails
            ]);

            setDoctors(doctorsRes.data || []);

            let activeAdmissions = admissionsRes.data || [];

            if (userRole === 'doctor') {
                activeAdmissions = activeAdmissions.filter((admission) =>
                    admission.doctor_assignments?.some(
                        (da) => da.doctor_id === userId && !da.unassigned_at
                    )
                );
            }

            setAdmissions(activeAdmissions);

            setSelectedAdmission((prevSelected) => {
                const stillExists = activeAdmissions.find((a) => a.id === prevSelected?.id);
                const nextSelection = stillExists || activeAdmissions[0] || null;

                if (nextSelection) {
                    fetchPrescriptions(nextSelection.id);
                } else {
                    setPrescriptions([]);
                }
                return nextSelection;
            });
        } catch (err) {
            console.error('Failed to load admissions:', err);
            setError('Could not load admissions.');
        } finally {
            setLoading(false);
        }
    }, [fetchPrescriptions, userId, userRole]);

    useEffect(() => {
        fetchAdmissions();
    }, [fetchAdmissions]);

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData(INITIAL_FORM_DATA);
    };

    const openModal = () => {
        setError('');
        setIsModalOpen(true);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isModalOpen) closeModal();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen]);

    const handleSelectAdmission = (admission) => {
        if (selectedAdmission?.id === admission.id) return;
        setSelectedAdmission(admission);
        fetchPrescriptions(admission.id);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAdmission) return;

        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            await api.post('/api/v1/prescriptions/', {
                ...formData,
                admission_id: selectedAdmission.id,
                patient_id: selectedAdmission.patient_id,
            });
            setSuccess('Prescription added successfully!');
            fetchPrescriptions(selectedAdmission.id);
            closeModal();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to add prescription.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeactivate = async (prescriptionId) => {
        if (!window.confirm('Are you sure you want to deactivate this prescription?')) return;

        setError('');
        setSuccess('');
        try {
            await api.delete(`/api/v1/prescriptions/${prescriptionId}`);
            setSuccess('Prescription deactivated successfully!');
            fetchPrescriptions(selectedAdmission.id);
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to deactivate prescription.'));
        }
    };

    const formatDate = (dateString, options) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('en-US', options);
    };

    // Helper to extract doctor name robustly from multiple schema formats
    const getAssignedDoctorName = (admission) => {
        const activeAssignment = admission?.doctor_assignments?.find((da) => !da.unassigned_at);
        if (!activeAssignment) return null;

        // 1. Direct name inside doctor_assignment
        if (activeAssignment.doctor_name) {
            return activeAssignment.doctor_name.startsWith('Dr.')
                ? activeAssignment.doctor_name
                : `Dr. ${activeAssignment.doctor_name}`;
        }

        // 2. Nested doctor object inside assignment
        if (activeAssignment.doctor) {
            return `Dr. ${activeAssignment.doctor.first_name || ''} ${activeAssignment.doctor.last_name || ''}`.trim();
        }

        // 3. Fallback to lookup inside doctors array state
        const doctor = doctors.find((d) => d.id === activeAssignment.doctor_id);
        if (doctor) {
            return `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
        }

        return null;
    };

    const canManagePrescriptions = userRole === 'doctor' || userRole === 'cmo';

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30">
            {/* Feedback Alerts */}
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
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                    <Pill size={48} className="text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No Active Admissions</h3>
                    <p className="text-sm text-slate-400 mt-1">
                        {userRole === 'doctor'
                            ? 'You have no patients currently assigned to you.'
                            : 'No patients are currently admitted.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left — Patient List */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-fit">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Patients</h2>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                            {admissions.map((admission) => {
                                const isSelected = selectedAdmission?.id === admission.id;
                                const firstName = admission.patient?.first_name || '';
                                const lastName = admission.patient?.last_name || '';
                                const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'P';
                                const doctorName = getAssignedDoctorName(admission);

                                return (
                                    <button
                                        key={admission.id}
                                        onClick={() => handleSelectAdmission(admission)}
                                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-all duration-200 ${isSelected ? 'bg-indigo-50/70 border-l-4 border-l-indigo-500' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                                                {initials}
                                            </div>
                                            <div className="truncate flex-1">
                                                <p className="text-sm font-bold text-slate-800 truncate">
                                                    {firstName} {lastName}
                                                </p>
                                                <p className="text-xs text-slate-400 truncate">
                                                    {admission.reason_for_admission || 'No reason specified'}
                                                </p>
                                                <p className="text-[11px] font-medium text-indigo-600 mt-0.5 truncate flex items-center gap-1">
                                                    <UserCheck size={12} className="shrink-0" />
                                                    {doctorName ? doctorName : 'Unassigned'}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right — Prescriptions */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Selected Patient Header */}
                        {selectedAdmission && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold uppercase text-sm shrink-0">
                                        {`${selectedAdmission.patient?.first_name?.[0] || ''}${selectedAdmission.patient?.last_name?.[0] || ''}` || 'P'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">
                                            {selectedAdmission.patient?.first_name} {selectedAdmission.patient?.last_name}
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            {selectedAdmission.reason_for_admission} • Admitted {formatDate(selectedAdmission.admission_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                        <p className="text-xs font-semibold text-indigo-600 mt-0.5 flex items-center gap-1">
                                            <UserCheck size={12} className="shrink-0" />
                                            Assigned Doctor: {getAssignedDoctorName(selectedAdmission) || 'Unassigned'}
                                        </p>
                                    </div>
                                </div>
                                {canManagePrescriptions && (
                                    <button
                                        onClick={openModal}
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
                            <div className="flex items-center justify-center py-12 bg-white border border-slate-200 rounded-2xl">
                                <Loader2 className="animate-spin text-indigo-600" size={24} />
                            </div>
                        ) : prescriptions.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                                <Pill size={48} className="text-slate-300 mx-auto mb-3" />
                                <h3 className="text-base font-bold text-slate-800">No Prescriptions</h3>
                                <p className="text-sm text-slate-400 mt-1">No prescriptions added for this patient yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {prescriptions.map((prescription) => (
                                    <div
                                        key={prescription.id}
                                        className={`bg-white border rounded-2xl p-5 shadow-sm transition-opacity ${prescription.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                                                    <Pill size={16} className="text-indigo-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{prescription.medicine_name}</h4>
                                                    <p className="text-xs text-slate-400">{prescription.dosage}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase ${prescription.is_active
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-slate-100 text-slate-500 border-slate-200'
                                                        }`}
                                                >
                                                    {prescription.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                {canManagePrescriptions && prescription.is_active && (
                                                    <button
                                                        onClick={() => handleDeactivate(prescription.id)}
                                                        className="text-xs text-red-500 hover:text-red-700 font-semibold transition-all duration-200 ml-1"
                                                    >
                                                        Deactivate
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
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
                                                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                                                    {prescription.prescribed_by_name ? `Dr. ${prescription.prescribed_by_name}` : 'N/A'}
                                                </p>
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
                                                {formatDate(prescription.prescribed_at, {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short',
                                                })}
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
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <Pill size={16} className="text-indigo-600" />
                                </div>
                                <div>
                                    <h3 id="modal-title" className="text-base font-bold text-slate-800">
                                        Add Prescription
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        For: {selectedAdmission?.patient?.first_name} {selectedAdmission?.patient?.last_name}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors"
                            >
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
                                    onChange={(e) => setFormData((prev) => ({ ...prev, medicine_name: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="e.g. Paracetamol"
                                    required
                                    disabled={submitting}
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
                                        onChange={(e) => setFormData((prev) => ({ ...prev, dosage: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g. 500mg"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                        Frequency <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.frequency}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, frequency: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                        required
                                        disabled={submitting}
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
                                    onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                    required
                                    disabled={submitting}
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
                                    onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="e.g. Take after food, avoid alcohol..."
                                    disabled={submitting}
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {submitting && <Loader2 size={16} className="animate-spin" />}
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