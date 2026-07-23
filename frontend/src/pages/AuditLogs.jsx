import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, Shield } from 'lucide-react';

const AuditLogs = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState({});
    const [patients, setPatients] = useState({});
    const [wards, setWards] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [logsRes, usersRes, patientsRes, wardsRes] = await Promise.all([
                    api.get('/api/v1/audit-logs/'),
                    api.get('/api/v1/auth/users'),
                    api.get('/api/v1/patients/'),
                    api.get('/api/v1/beds/wards'),
                ]);

                setLogs(logsRes.data);

                // Build lookup maps: id -> name
                const usersMap = {};
                usersRes.data.forEach(u => {
                    usersMap[u.id] = `${u.first_name} ${u.last_name} (${u.username})`;
                });
                setUsers(usersMap);

                const patientsMap = {};
                patientsRes.data.forEach(p => {
                    patientsMap[p.id] = `${p.first_name} ${p.last_name}`;
                });
                setPatients(patientsMap);

                const wardsMap = {};
                wardsRes.data.forEach(w => {
                    wardsMap[w.id] = w.name;
                    w.rooms?.forEach(r => {
                        wardsMap[r.id] = `Room ${r.room_number}`;
                        r.beds?.forEach(b => {
                            wardsMap[b.id] = `Bed ${b.bed_number}`;
                        });
                    });
                });
                setWards(wardsMap);

            } catch (err) {
                console.error('Failed to load audit logs:', err);
                setError('Could not retrieve audit logs.');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const getActionColor = (action) => {
        if (action.includes('REGISTERED') || action.includes('ASSIGNED')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (action.includes('DELETED') || action.includes('REMOVED') || action.includes('UNASSIGNED')) return 'bg-red-50 text-red-700 border-red-200';
        if (action.includes('UPDATED') || action.includes('DISCHARGED')) return 'bg-amber-50 text-amber-700 border-amber-200';
        if (action.includes('ADMITTED')) return 'bg-blue-50 text-blue-700 border-blue-200';
        return 'bg-slate-50 text-slate-700 border-slate-200';
    };

    // Replace UUID with readable name if found in lookup maps
    const resolveValue = (key, value) => {
        if (typeof value !== 'string') return String(value);

        // Check if value looks like a UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) return value;

        // Try to resolve based on key name
        if (key.includes('patient_id') || key.includes('patient')) {
            return patients[value] || value;
        }
        if (key.includes('doctor_id') || key.includes('doctor')) {
            return users[value] || value;
        }
        if (key.includes('staff_id') || key.includes('staff')) {
            return users[value] || value;
        }
        if (key.includes('ward_id') || key.includes('ward')) {
            return wards[value] || value;
        }
        if (key.includes('bed_id') || key.includes('bed')) {
            return wards[value] || value;
        }
        if (key.includes('admission_id') || key.includes('admission')) {
            return `Admission ${value.slice(0, 8)}...`;
        }

        // Try all maps
        return users[value] || patients[value] || wards[value] || value;
    };

    const renderValues = (values) => {
        if (!values) return <span className="text-xs text-slate-300 italic">—</span>;
        return (
            <div className="space-y-1">
                {Object.entries(values).map(([key, value]) => (
                    <div key={key} className="flex gap-1 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{key}:</span>
                        <span className="text-[10px] text-slate-600 break-all">
                            {resolveValue(key, value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    // Resolve who performed the action
    const resolveUser = (userId) => {
        if (!userId) return 'System';
        return users[userId] || userId;
    };

    if (user?.role !== 'admin') {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Shield size={48} className="text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">Access Restricted</h3>
                    <p className="text-sm text-slate-400 mt-1">Only administrators can view audit logs.</p>
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
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30 flex flex-col">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">Audit Logs</h2>
                <p className="text-sm text-slate-400 mt-1">Complete history of all system actions — {logs.length} records</p>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm font-semibold flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                                <th className="py-3 px-6">Action</th>
                                <th className="py-3 px-6">Entity</th>
                                <th className="py-3 px-6">Performed By</th>
                                <th className="py-3 px-6">Old Values</th>
                                <th className="py-3 px-6">New Values</th>
                                <th className="py-3 px-6">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/40 transition-all duration-200">
                                    <td className="py-4 px-6">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-slate-800 font-semibold capitalize">{log.entity_name}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-xs text-slate-600 font-medium">
                                            {resolveUser(log.user_id)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 max-w-[200px]">
                                        {renderValues(log.old_values)}
                                    </td>
                                    <td className="py-4 px-6 max-w-[200px]">
                                        {renderValues(log.new_values)}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-xs text-slate-500">
                                            {new Date(log.timestamp).toLocaleString('en-US')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;