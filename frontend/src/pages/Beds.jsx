import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Loader2, AlertCircle, CheckCircle2, BedDouble,
  ArrowRight, Wrench, X, RefreshCw, Plus
} from 'lucide-react';

const Beds = () => {
  const { user } = useAuth();

  const [wards, setWards] = useState([]);
  const [activeWardIdx, setActiveWardIdx] = useState(0);
  const [activeAdmissions, setActiveAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [isAddWardModalOpen, setIsAddWardModalOpen] = useState(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isAddBedModalOpen, setIsAddBedModalOpen] = useState(false);

  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  const [admitData, setAdmitData] = useState({
    patient_id: '',
    reason_for_admission: '',
    primary_doctor_id: '',
  });
  const [dischargeStatus, setDischargeStatus] = useState('maintenance');

  const [wardForm, setWardForm] = useState({ name: '', type: '', capacity: '' });
  const [roomForm, setRoomForm] = useState({ ward_id: '', room_number: '', room_type: '' });
  const [bedForm, setBedForm] = useState({ room_id: '', bed_number: '' });

  const fetchData = async () => {
    try {
      setError('');
      const [wardsRes, activeAdmsRes, patientsRes, docsRes] = await Promise.all([
        api.get('/api/v1/beds/wards'),
        api.get('/api/v1/admissions/active'),
        api.get('/api/v1/patients/'),
        api.get('/api/v1/auth/doctors'),
      ]);

      setWards(wardsRes.data);
      setActiveAdmissions(activeAdmsRes.data);
      setPatients(patientsRes.data);
      setDoctors(docsRes.data);
    } catch (err) {
      console.error('Error fetching bed/admission records:', err);
      setError('Could not retrieve ward or allocation data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdmitModal = (bed) => {
    setSelectedBed(bed);
    const admittedPatientIds = new Set(activeAdmissions.map(adm => adm.patient_id));
    const eligiblePatients = patients.filter(p => !admittedPatientIds.has(p.id));
    setAdmitData({
      patient_id: eligiblePatients[0]?.id || '',
      reason_for_admission: '',
      primary_doctor_id: doctors[0]?.id || '',
    });
    setIsAdmitModalOpen(true);
  };

  const handleOpenDischargeModal = (bed) => {
    setSelectedBed(bed);
    const admission = activeAdmissions.find(adm => adm.bed_id === bed.id);
    setSelectedAdmission(admission);
    setDischargeStatus('maintenance');
    setIsDischargeModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsAdmitModalOpen(false);
    setIsDischargeModalOpen(false);
    setIsAddWardModalOpen(false);
    setIsAddRoomModalOpen(false);
    setIsAddBedModalOpen(false);
    setSelectedBed(null);
    setSelectedAdmission(null);
    setWardForm({ name: '', type: '', capacity: '' });
    setRoomForm({ ward_id: '', room_number: '', room_type: '' });
    setBedForm({ room_id: '', bed_number: '' });
  };

  const handleAdmitSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!admitData.patient_id || !admitData.primary_doctor_id || !admitData.reason_for_admission) {
      setError('All fields are required for patient intake.');
      return;
    }
    try {
      await api.post('/api/v1/admissions/', {
        patient_id: admitData.patient_id,
        bed_id: selectedBed.id,
        reason_for_admission: admitData.reason_for_admission,
        primary_doctor_id: admitData.primary_doctor_id,
      });
      setSuccess('Patient admitted successfully!');
      fetchData();
      handleCloseModals();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Intake registration failed.');
    }
  };

  const handleDischargeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post(`/api/v1/admissions/${selectedAdmission.id}/discharge`, {
        bed_status: dischargeStatus
      });
      setSuccess('Patient discharged and bed status updated successfully.');
      fetchData();
      handleCloseModals();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Discharge registration failed.');
    }
  };

  const handleSetAvailable = async (bed) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/api/v1/beds/${bed.id}/status`, { status: 'available' });
      setSuccess(`Bed ${bed.bed_number} is now marked Available.`);
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError('Failed to update bed status.');
    }
  };

  const handleAddWardSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/api/v1/beds/wards', {
        name: wardForm.name,
        type: wardForm.type,
        capacity: parseInt(wardForm.capacity)
      });
      setSuccess(`Ward "${wardForm.name}" created successfully!`);
      fetchData();
      handleCloseModals();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to create ward.');
    }
  };

  const handleAddRoomSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/api/v1/beds/rooms', {
        ward_id: roomForm.ward_id,
        room_number: roomForm.room_number,
        room_type: roomForm.room_type
      });
      setSuccess(`Room "${roomForm.room_number}" created successfully!`);
      fetchData();
      handleCloseModals();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to create room.');
    }
  };

  const handleAddBedSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/api/v1/beds/beds', {
        room_id: bedForm.room_id,
        bed_number: bedForm.bed_number
      });
      setSuccess(`Bed "${bedForm.bed_number}" created successfully!`);
      fetchData();
      handleCloseModals();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to create bed.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50/50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const currentWard = wards[activeWardIdx];

  const getBedPatientName = (bedId) => {
    const admission = activeAdmissions.find(adm => adm.bed_id === bedId);
    if (!admission) return 'Loading...';
    return admission.patient
      ? `${admission.patient.first_name} ${admission.patient.last_name}`
      : 'Active Patient';
  };

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

      {/* Admin Configuration Buttons */}
      {user?.role === 'admin' && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setIsAddWardModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
          >
            <Plus size={16} />
            Add Ward
          </button>
          <button
            onClick={() => setIsAddRoomModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
          >
            <Plus size={16} />
            Add Room
          </button>
          <button
            onClick={() => setIsAddBedModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
          >
            <Plus size={16} />
            Add Bed
          </button>
        </div>
      )}

      {/* Ward Tabs */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-2">
        <div className="flex gap-2 flex-wrap">
          {wards.map((ward, idx) => (
            <button
              key={ward.id}
              onClick={() => setActiveWardIdx(idx)}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${activeWardIdx === idx
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                }`}
            >
              {ward.name}
            </button>
          ))}
        </div>
        <button
          onClick={fetchData}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all duration-200"
          title="Refresh statistics"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Ward Details Header */}
      {currentWard && (
        <div className="mb-6">
          <div className="flex items-baseline gap-3">
            <h3 className="text-lg font-bold text-slate-800">{currentWard.name}</h3>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {currentWard.type} Ward • Capacity {currentWard.capacity}
            </span>
          </div>
        </div>
      )}

      {/* Grid of Rooms and Beds */}
      {!currentWard || currentWard.rooms.length === 0 ? (
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <BedDouble size={48} className="text-slate-300 mb-2" />
          <p className="text-slate-500 font-semibold">No Rooms configured inside this Ward.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {currentWard.rooms.map((room) => (
            <div key={room.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-baseline gap-2 mb-4">
                <h4 className="font-bold text-slate-800 text-base">Room {room.room_number}</h4>
                <span className="text-xs text-slate-400 font-medium font-mono">{room.room_type} Room</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {room.beds.map((bed) => {
                  let statusColor = 'border-slate-200 hover:bg-slate-50';
                  let statusLabel = 'Available';
                  let badge = 'bg-slate-100 text-slate-600 border-slate-200';

                  if (bed.status === 'occupied') {
                    statusColor = 'border-red-200 hover:bg-red-50/20';
                    statusLabel = 'Occupied';
                    badge = 'bg-red-50 text-red-700 border-red-200/50';
                  } else if (bed.status === 'maintenance') {
                    statusColor = 'border-amber-200 hover:bg-amber-50/20';
                    statusLabel = 'Maintenance';
                    badge = 'bg-amber-50 text-amber-700 border-amber-200/50';
                  }

                  return (
                    <div
                      key={bed.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between h-36 transition-all duration-200 ${statusColor}`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-slate-800">Bed {bed.bed_number}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${badge}`}>
                          {statusLabel}
                        </span>
                      </div>

                      <div className="my-2">
                        {bed.status === 'occupied' ? (
                          <div className="text-xs">
                            <span className="text-slate-400 font-medium block">Admitted Patient</span>
                            <span className="text-slate-800 font-bold truncate block">{getBedPatientName(bed.id)}</span>
                          </div>
                        ) : bed.status === 'maintenance' ? (
                          <span className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                            <Wrench size={12} />
                            Sanitization
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Ready for Patient</span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        {bed.status === 'available' ? (
                          (user?.role === 'admin' || user?.role === 'cmo' || user?.role === 'doctor' || user?.role === 'nurse') ? (
                            <button
                              onClick={() => handleOpenAdmitModal(bed)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all duration-200"
                            >
                              <span>Admit</span>
                              <ArrowRight size={12} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-medium">No permissions</span>
                          )
                        ) : bed.status === 'occupied' ? (
                          (user?.role === 'admin' || user?.role === 'cmo' || user?.role === 'doctor' || user?.role === 'nurse') ? (
                            <button
                              onClick={() => handleOpenDischargeModal(bed)}
                              className="text-xs text-red-600 hover:text-red-800 font-bold cursor-pointer active:scale-95 transition-all duration-200"
                            >
                              Discharge
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-medium">Patient Check-in</span>
                          )
                        ) :
                          (user?.role === 'admin' || user?.role === 'cmo' || user?.role === 'nurse') && (
                            <button
                              onClick={() => handleSetAvailable(bed)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer active:scale-95 transition-all duration-200"
                            >
                              Set Available
                            </button>
                          )
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Admit Patient */}
      {isAdmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-800">Register Admission</h3>
              <button onClick={handleCloseModals} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-all duration-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdmitSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
                <BedDouble className="text-indigo-600 shrink-0 mt-0.5" size={20} />
                <div className="text-xs text-indigo-900 font-medium">
                  Allocating Bed {selectedBed?.bed_number} in Room {currentWard?.rooms.find(r => r.beds.some(b => b.id === selectedBed?.id))?.room_number} ({currentWard?.name}).
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Patient *</label>
                <select
                  value={admitData.patient_id}
                  onChange={(e) => setAdmitData(prev => ({ ...prev, patient_id: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="" disabled>Select patient...</option>
                  {patients.map((p) => {
                    const isAdmitted = activeAdmissions.some(adm => adm.patient_id === p.id);
                    return (
                      <option key={p.id} value={p.id} disabled={isAdmitted}>
                        {p.first_name} {p.last_name} {isAdmitted ? '(Already Admitted)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Assigned Physician *</label>
                <select
                  value={admitData.primary_doctor_id}
                  onChange={(e) => setAdmitData(prev => ({ ...prev, primary_doctor_id: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="" disabled>Select physician...</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.first_name} {d.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Reason for Admission *</label>
                <textarea
                  value={admitData.reason_for_admission}
                  onChange={(e) => setAdmitData(prev => ({ ...prev, reason_for_admission: e.target.value }))}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="Describe patient condition or diagnosis..."
                  required
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={handleCloseModals} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all duration-200">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200">
                  Confirm Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Discharge Patient */}
      {isDischargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-800">Process Patient Discharge</h3>
              <button onClick={handleCloseModals} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-all duration-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleDischargeSubmit} className="p-6 space-y-5">
              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs text-slate-400 font-semibold">Patient Name:</span>
                  <span className="text-sm font-bold text-slate-800">
                    {selectedAdmission?.patient ? `${selectedAdmission.patient.first_name} ${selectedAdmission.patient.last_name}` : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs text-slate-400 font-semibold">Admission Reason:</span>
                  <span className="text-xs font-medium text-slate-600 max-w-xs text-right">{selectedAdmission?.reason_for_admission}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs text-slate-400 font-semibold">Check-in Date:</span>
                  <span className="text-sm font-medium text-slate-700">
                    {selectedAdmission && new Date(selectedAdmission.admission_date).toLocaleString('en-US')}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 block">Post-Discharge Bed Status *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700 select-none cursor-pointer">
                    <input type="radio" name="discharge_status" value="maintenance" checked={dischargeStatus === 'maintenance'} onChange={() => setDischargeStatus('maintenance')} className="accent-indigo-600" />
                    <span>Set to Maintenance (Recommended for cleaning)</span>
                  </label>
                </div>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700 select-none cursor-pointer">
                    <input type="radio" name="discharge_status" value="available" checked={dischargeStatus === 'available'} onChange={() => setDischargeStatus('available')} className="accent-indigo-600" />
                    <span>Set to Available immediately</span>
                  </label>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={handleCloseModals} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all duration-200">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200">
                  Confirm Discharge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Ward */}
      {isAddWardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-800">Add New Ward</h3>
              <button onClick={handleCloseModals} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-all duration-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddWardSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Ward Name *</label>
                <input
                  type="text"
                  value={wardForm.name}
                  onChange={(e) => setWardForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Cardiology Ward"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Ward Type *</label>
                <select
                  value={wardForm.type}
                  onChange={(e) => setWardForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="" disabled>Select type...</option>
                  <option value="ICU">ICU</option>
                  <option value="General">General</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Maternity">Maternity</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Oncology">Oncology</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Capacity *</label>
                <input
                  type="number"
                  value={wardForm.capacity}
                  onChange={(e) => setWardForm(prev => ({ ...prev, capacity: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. 10"
                  min="1"
                  required
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={handleCloseModals} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all duration-200">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200">
                  Create Ward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Add Room */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-800">Add New Room</h3>
              <button onClick={handleCloseModals} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-all duration-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddRoomSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Select Ward *</label>
                <select
                  value={roomForm.ward_id}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, ward_id: e.target.value }))}
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
                <label className="text-xs font-semibold text-slate-500">Room Number *</label>
                <input
                  type="text"
                  value={roomForm.room_number}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, room_number: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. 201"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Room Type *</label>
                <select
                  value={roomForm.room_type}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, room_type: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="" disabled>Select type...</option>
                  <option value="Private">Private</option>
                  <option value="Semi-Private">Semi-Private</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={handleCloseModals} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all duration-200">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200">
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Add Bed */}
      {isAddBedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-800">Add New Bed</h3>
              <button onClick={handleCloseModals} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-all duration-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddBedSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Select Ward first *</label>
                <select
                  onChange={(e) => {
                    const selectedWard = wards.find(w => w.id === e.target.value);
                    setBedForm(prev => ({ ...prev, room_id: selectedWard?.rooms[0]?.id || '' }));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select ward...</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Select Room *</label>
                <select
                  value={bedForm.room_id}
                  onChange={(e) => setBedForm(prev => ({ ...prev, room_id: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="" disabled>Select room...</option>
                  {wards.flatMap(w => w.rooms).map((r) => (
                    <option key={r.id} value={r.id}>Room {r.room_number}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Bed Number *</label>
                <input
                  type="text"
                  value={bedForm.bed_number}
                  onChange={(e) => setBedForm(prev => ({ ...prev, bed_number: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. B1"
                  required
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={handleCloseModals} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all duration-200">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200">
                  Create Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Beds;