import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, Shield, Building2, Search, Filter } from 'lucide-react';

const AuditLogs = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';

    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState({});
    const [patients, setPatients] = useState({});
    const [wards, setWards] = useState({});
    const [hospitals, setHospitals] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filtering State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedActionFilter, setSelectedActionFilter] = useState('ALL');

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                // Primary log fetch
                const logsRes = await api.get('/api/v1/audit-logs/');
                setLogs(logsRes.data || []);

                // Fetch metadata concurrently with failure isolation
                const [usersRes, patientsRes, wardsRes, hospitalsRes] = await Promise.allSettled([
                    api.get('/api/v1/auth/users'),
                    api.get('/api/v1/patients/'),
                    api.get('/api/v1/beds/wards'),
                    isSuperAdmin ? api.get('/api/v1/hospitals/') : Promise.reject('Not super_admin')
                ]);

                // Map Users
                if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
                    const usersMap = {};
                    usersRes.value.data.forEach(u => {
                        usersMap[u.id] = `${u.first_name} ${u.last_name} (${u.username})`;
                    });
                    setUsers(usersMap);
                }

                // Map Patients
                if (patientsRes.status === 'fulfilled' && patientsRes.value?.data) {
                    const patientsMap = {};
                    patientsRes.value.data.forEach(p => {
                        patientsMap[p.id] = `${p.first_name} ${p.last_name}`;
                    });
                    setPatients(patientsMap);
                }

                // Map Wards, Rooms, Beds
                if (wardsRes.status === 'fulfilled' && wardsRes.value?.data) {
                    const wardsMap = {};
                    wardsRes.value.data.forEach(w => {
                        wardsMap[w.id] = w.name;
                        w.rooms?.forEach(r => {
                            wardsMap[r.id] = `Room ${r.room_number}`;
                            r.beds?.forEach(b => {
                                wardsMap[b.id] = `Bed ${b.bed_number}`;
                            });
                        });
                    });
                    setWards(wardsMap);
                }

                // Map Hospitals
                if (hospitalsRes.status === 'fulfilled' && hospitalsRes.value?.data) {
                    const hospitalsMap = {};
                    hospitalsRes.value.data.forEach(h => {
                        hospitalsMap[h.id] = `${h.name} (${h.code})`;
                    });
                    setHospitals(hospitalsMap);
                }

            } catch (err) {
                console.error('Failed to load audit logs:', err);
                setError('Could not retrieve audit logs from server.');
            } finally {
                setLoading(false);
            }
        };

        if (user?.role === 'admin' || user?.role === 'super_admin') {
            fetchAll();
        }
    }, [user, isSuperAdmin]);

    const getActionColor = (action = '') => {
        const act = action.toUpperCase();
        if (act.includes('REGISTERED') || act.includes('ASSIGNED') || act.includes('CREATED')) {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }
        if (act.includes('DELETED') || act.includes('REMOVED') || act.includes('UNASSIGNED') || act.includes('DEACTIVATED')) {
            return 'bg-red-50 text-red-700 border-red-200';
        }
        if (act.includes('UPDATED') || act.includes('DISCHARGED') || act.includes('RESET')) {
            return 'bg-amber-50 text-amber-700 border-amber-200';
        }
        if (act.includes('ADMITTED') || act.includes('CHANGED') || act.includes('LOGGED')) {
            return 'bg-blue-50 text-blue-700 border-blue-200';
        }
        return 'bg-slate-50 text-slate-700 border-slate-200';
    };

    const resolveValue = (key, value) => {
        if (value === null || value === undefined) return '—';
        if (typeof value !== 'string') return String(value);

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) return value;

        if (key.includes('patient')) return patients[value] || value;
        if (key.includes('doctor') || key.includes('staff') || key.includes('user')) return users[value] || value;
        if (key.includes('hospital')) return hospitals[value] || value;
        if (key.includes('ward') || key.includes('bed') || key.includes('room')) return wards[value] || value;
        if (key.includes('admission')) return `Admission #${value.slice(0, 8)}`;

        return users[value] || patients[value] || wards[value] || hospitals[value] || value;
    };

    const renderValues = (values) => {
        if (!values || Object.keys(values).length === 0) {
            return <span className="text-xs text-slate-300 italic">—</span>;
        }
        return (
            <div className="space-y-1">
                {Object.entries(values).map(([key, value]) => (
                    <div key={key} className="flex gap-1 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{key}:</span>
                        <span className="text-[10px] text-slate-600 break-all font-mono">
                            {resolveValue(key, value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    const resolveUser = (userId) => userId ? (users[userId] || userId) : 'System';
    const resolveHospital = (hospitalId) => hospitalId ? (hospitals[hospitalId] || hospitalId) : 'Global';

    // Client-side filtering
    const filteredLogs = logs.filter(log => {
        const matchesAction = selectedActionFilter === 'ALL' || log.action === selectedActionFilter;
        const searchLower = searchTerm.toLowerCase();

        const matchesSearch = !searchTerm ||
            log.action?.toLowerCase().includes(searchLower) ||
            log.entity_name?.toLowerCase().includes(searchLower) ||
            resolveUser(log.user_id).toLowerCase().includes(searchLower);

        return matchesAction && matchesSearch;
    });

    const uniqueActions = ['ALL', ...new Set(logs.map(l => l.action))];

    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                    <Shield size={48} className="text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">Access Restricted</h3>
                    <p className="text-sm text-slate-400 mt-1">Only administrators and super admins can view audit logs.</p>
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
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">
                        {isSuperAdmin ? 'Global Audit Logs' : 'Audit Logs'}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        {isSuperAdmin
                            ? `Complete system activity history across all hospitals — ${filteredLogs.length} records`
                            : `Complete activity history for your hospital — ${filteredLogs.length} records`}
                    </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="relative flex items-center">
                        <Filter size={14} className="absolute left-3 text-slate-400" />
                        <select
                            value={selectedActionFilter}
                            onChange={(e) => setSelectedActionFilter(e.target.value)}
                            className="pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm font-semibold flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                                <th className="py-3 px-6">Action</th>
                                <th className="py-3 px-6">Entity</th>
                                {isSuperAdmin && <th className="py-3 px-6">Hospital</th>}
                                <th className="py-3 px-6">Performed By</th>
                                <th className="py-3 px-6">Old Values</th>
                                <th className="py-3 px-6">New Values</th>
                                <th className="py-3 px-6">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={isSuperAdmin ? 7 : 6} className="py-8 text-center text-slate-400 text-sm">
                                        No matching audit logs found.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/40 transition-all duration-200">
                                        <td className="py-4 px-6">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-slate-800 font-semibold capitalize">{log.entity_name}</span>
                                        </td>
                                        {isSuperAdmin && (
                                            <td className="py-4 px-6">
                                                <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
                                                    <Building2 size={12} className="text-indigo-400" />
                                                    {resolveHospital(log.hospital_id)}
                                                </span>
                                            </td>
                                        )}
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
                                        <td className="py-4 px-6 whitespace-nowrap">
                                            <span className="text-xs text-slate-500">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;