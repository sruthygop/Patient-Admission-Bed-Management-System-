import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, CheckCircle2, UserCheck, X, Plus, Search } from 'lucide-react';

const DoctorAssignments = () => {
    const { user } = useAuth();
    const [admissions, setAdmissions] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAdmission, setSelectedAdmission] = useState(null);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [notes, setNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Loading state for the Assign Doctor form submit
    const [submitting, setSubmitting] = useState(false);
    // Tracks which specific assignment's "Unassign" action is in flight
    const [unassigningId, setUnassigningId] = useState(null);

    // Extracts a readable string from a FastAPI/Pydantic error response,
    // whether detail is a plain string or an array of validator error objects.
    const getErrorMessage = (err, fallback) => {
        const detail = err?.response?.data?.detail;
        if (typeof detail === 'string') return detail;
        if (Array.isArray(detail)) {
            return detail.map(d => d.msg || JSON.stringify(d)).join(', ');
        }
        return fallback;
    };

    const fetchData = async () => {
        try {
            const [admissionsRes, doctorsRes] = await Promise.all([
                api.get('/api/v1/admissions/active'),
                api.get('/api/v1/auth/doctors'),
            ]);
            setAdmissions(admissionsRes.data);
            setDoctors(doctorsRes.data);
        } catch (err) {
            console.error('Failed to load data:', err);
            setError(getErrorMessage(err, 'Could not retrieve admissions or doctors.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (admission) => {
        setSelectedAdmission(admission);
        setSelectedDoctorId(doctors[0]?.id || '');
        setNotes('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (submitting) return; // don't allow closing mid-submit
        setIsModalOpen(false);
    };

    const handleAssignDoctor = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            await api.post('/api/v1/doctor-assignments/', {
                admission_id: selectedAdmission.id,
                doctor_id: selectedDoctorId,
                notes: notes || null,
            });
            setSuccess('Doctor assigned successfully!');
            fetchData();
            setIsModalOpen(false);
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err, 'Failed to assign doctor.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleUnassign = async (assignmentId) => {
        if (!window.confirm('Are you sure you want to unassign this doctor?')) return;
        setError('');
        setSuccess('');
        setUnassigningId(assignmentId);
        try {
            await api.delete(`/api/v1/doctor-assignments/${assignmentId}`);
            setSuccess('Doctor unassigned successfully.');
            fetchData();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err, 'Failed to unassign doctor.'));
        } finally {
            setUnassigningId(null);
        }
    };

    // Filter admissions by patient name or any assigned doctor's name
    const filteredAdmissions = admissions.filter((admission) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const patientName = `${admission.patient?.first_name || ''} ${admission.patient?.last_name || ''}`.toLowerCase();
        const doctorNames = (admission.doctor_assignments || [])
            .map((da) => {
                const doctor = doctors.find(d => d.id === da.doctor_id);
                return doctor ? `${doctor.first_name} ${doctor.last_name}`.toLowerCase() : '';
            })
            .join(' ');
        return patientName.includes(term) || doctorNames.includes(term);
    });

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
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Doctor Assignments</h2>
                    <p className="text-sm text-slate-400 mt-1">View and manage doctor assignments for active admissions</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by patient or doctor name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-9 text-sm focus:outline-none focus:border-indigo-500"
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
            </div>

            {/* Admissions List */}
            {filteredAdmissions.length === 0 ? (
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <UserCheck size={48} className="text-slate-300 mb-3" />
                    <h3 className="text-base font-bold text-slate-800">
                        {searchTerm ? 'No Matching Admissions' : 'No Active Admissions'}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        {searchTerm ? `No results for "${searchTerm}".` : 'No patients are currently admitted.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAdmissions.map((admission) => (
                        <div key={admission.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            {/* Patient Info */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm uppercase">
                                        {admission.patient?.first_name?.[0]}{admission.patient?.last_name?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">
                                            {admission.patient?.first_name} {admission.patient?.last_name}
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            {admission.reason_for_admission} • Admitted {new Date(admission.admission_date).toLocaleDateString('en-US')}
                                        </p>
                                    </div>
                                </div>
                                {/* Bed info */}
                                <div className="text-right">
                                    <span className="text-xs font-semibold text-slate-500">
                                        Bed: {admission.bed?.bed_number || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Doctor Assignments */}
                            <div className="border-t border-slate-100 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Doctors</span>
                                    {(user?.role === 'admin' || user?.role === 'cmo' || user?.role === 'nurse') && (
                                        <button
                                            onClick={() => handleOpenModal(admission)}
                                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-all duration-200"
                                        >
                                            <Plus size={12} />
                                            Add Doctor
                                        </button>
                                    )}
                                </div>

                                {admission.doctor_assignments?.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No doctors assigned yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {admission.doctor_assignments?.map((da) => {
                                            const doctor = doctors.find(d => d.id === da.doctor_id);
                                            return (
                                                <div key={da.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <UserCheck size={14} className="text-indigo-600" />
                                                        <span className="text-sm font-semibold text-slate-700">
                                                            Dr. {doctor?.first_name} {doctor?.last_name}
                                                        </span>
                                                        {da.notes && (
                                                            <span className="text-xs text-slate-400">— {da.notes}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {da.unassigned_at ? (
                                                            <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded font-bold">
                                                                Unassigned
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                                                                Active
                                                            </span>
                                                        )}
                                                        {(user?.role === 'admin' || user?.role === 'cmo' || user?.role === 'nurse') && !da.unassigned_at && (
                                                            <button
                                                                onClick={() => handleUnassign(da.id)}
                                                                disabled={unassigningId === da.id}
                                                                className="text-xs text-red-500 hover:text-red-700 font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                                            >
                                                                {unassigningId === da.id ? (
                                                                    <>
                                                                        <Loader2 size={12} className="animate-spin" />
                                                                        Unassigning...
                                                                    </>
                                                                ) : (
                                                                    'Unassign'
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal: Assign Doctor */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                            <h3 className="text-lg font-bold text-slate-800">Assign Doctor</h3>
                            <button onClick={handleCloseModal} disabled={submitting} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-all duration-200 disabled:opacity-50">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAssignDoctor} className="p-6 space-y-4">
                            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                <p className="text-xs text-indigo-900 font-medium">
                                    Assigning doctor to: <strong>{selectedAdmission?.patient?.first_name} {selectedAdmission?.patient?.last_name}</strong>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Select Doctor *</label>
                                <select
                                    value={selectedDoctorId}
                                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                                    disabled={submitting}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                    required
                                >
                                    <option value="" disabled>Select doctor...</option>
                                    {doctors.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            Dr. {d.first_name} {d.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Notes (optional)</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    disabled={submitting}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                    placeholder="e.g. Specialist consultation"
                                />
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={submitting}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all duration-200 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Assigning...
                                        </>
                                    ) : (
                                        'Assign Doctor'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorAssignments;