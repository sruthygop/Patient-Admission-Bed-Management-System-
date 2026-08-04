import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { Loader2, TrendingUp, Users, BedDouble, Activity } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await api.get('/api/v1/analytics/stats');
                setData(response.data);
            } catch (err) {
                console.error('Failed to load analytics:', err);
                setError('Could not load analytics data.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-red-500 text-sm">{error}</p>
            </div>
        );
    }

    const statCards = [
        {
            label: 'TOTAL PATIENTS',
            value: data?.patient_stats?.total_patients || 0,
            sub: 'Registered in system',
            icon: Users,
            color: 'border-l-blue-500',
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
        },
        {
            label: 'TOTAL ADMISSIONS',
            value: data?.patient_stats?.total_admissions || 0,
            sub: 'All time admissions',
            icon: Activity,
            color: 'border-l-indigo-500',
            iconBg: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
        },
        {
            label: 'TOTAL DISCHARGED',
            value: data?.patient_stats?.total_discharged || 0,
            sub: 'Successfully discharged',
            icon: TrendingUp,
            color: 'border-l-emerald-500',
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
        },
        {
            label: 'AVG LENGTH OF STAY',
            value: `${data?.patient_stats?.avg_length_of_stay || 0} days`,
            sub: 'Average patient stay',
            icon: BedDouble,
            color: 'border-l-amber-500',
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
        },
    ];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-xl">
                    <p className="font-semibold">{payload[0].name}</p>
                    <p>Count: {payload[0].value}</p>
                    <p>Percentage: {((payload[0].value / (data?.gender_distribution?.reduce((a, b) => a + b.count, 0) || 1)) * 100).toFixed(1)}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30">

            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Analytics Hub</h1>
                        <p className="text-sm text-slate-400 mt-1">Clinical and operational insights for hospital management</p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full">
                        Data Analytics
                    </span>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {statCards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div key={idx} className={`bg-white rounded-2xl shadow-sm border border-slate-200 border-l-4 ${card.color} p-5 hover:shadow-md transition-all duration-200`}>
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                                <div className={`w-9 h-9 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                                    <Icon size={18} className={card.iconColor} />
                                </div>
                            </div>
                            <p className="text-4xl font-bold text-slate-800 leading-none mb-2">{card.value}</p>
                            <p className="text-xs text-slate-400">{card.sub}</p>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">

                {/* Monthly Trends */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Monthly Admission Trends</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Admissions vs discharges over last 6 months</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={data?.monthly_trends || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
                            <Line type="monotone" dataKey="admissions" name="Admissions" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#fff' }} />
                            <Line type="monotone" dataKey="discharges" name="Discharges" stroke="#10b981" strokeWidth={2} strokeDasharray="5 4" dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Gender Distribution */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-slate-800">Gender Distribution</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Patient gender breakdown</p>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={data?.gender_distribution || []}
                                dataKey="count"
                                nameKey="gender"
                                cx="50%"
                                cy="50%"
                                outerRadius={75}
                                innerRadius={40}
                                label={false}
                            >
                                {(data?.gender_distribution || []).map((entry, index) => (
                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Custom Legend */}
                    <div className="flex flex-col gap-2 mt-3">
                        {(data?.gender_distribution || []).map((entry, index) => {
                            const total = data?.gender_distribution?.reduce((a, b) => a + b.count, 0) || 1;
                            const percentage = ((entry.count / total) * 100).toFixed(1);
                            return (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-sm font-medium text-slate-700">{entry.gender}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-800">{entry.count}</span>
                                        <span className="text-xs text-slate-400">({percentage}%)</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">

                {/* Blood Group Distribution */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="mb-6">
                        <h3 className="text-base font-bold text-slate-800">Blood Group Distribution</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Patient blood group breakdown</p>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data?.blood_group_distribution || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="blood_group" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }} />
                            <Bar dataKey="count" name="Patients" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Ward Performance */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="mb-6">
                        <h3 className="text-base font-bold text-slate-800">Ward Performance</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Occupancy rate by ward</p>
                    </div>
                    <div className="space-y-4">
                        {(data?.ward_performance || []).map((ward, idx) => {
                            const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-red-500'];
                            const color = colors[idx % colors.length];
                            return (
                                <div key={idx}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-700">{ward.ward_name}</span>
                                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border text-slate-500 bg-slate-50 border-slate-200">
                                                {ward.ward_type}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-800">{ward.occupancy_rate}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                                        <div
                                            className={`${color} h-1.5 rounded-full transition-all duration-500`}
                                            style={{ width: `${Math.min(ward.occupancy_rate, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[10px] text-slate-400">{ward.occupied_beds} occupied</span>
                                        <span className="text-[10px] text-slate-400">{ward.total_beds} beds total</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;