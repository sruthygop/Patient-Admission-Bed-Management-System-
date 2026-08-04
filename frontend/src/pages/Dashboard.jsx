import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Activity, BedDouble, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/v1/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        setError('Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
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
      label: 'OCCUPANCY RATE',
      value: `${stats?.global_occupancy_rate?.toFixed(1) || 0}%`,
      sub: `${stats?.occupied_beds || 0} of ${stats?.total_beds || 0} beds occupied`,
      icon: TrendingUp,
      color: 'border-l-blue-500',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: '+2.1%',
      trendUp: true,
    },
    {
      label: 'ACTIVE ADMISSIONS',
      value: stats?.active_admissions || 0,
      sub: 'Currently admitted patients',
      icon: Activity,
      color: 'border-l-emerald-500',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trend: '+1',
      trendUp: true,
    },
    {
      label: 'AVAILABLE BEDS',
      value: stats?.available_beds || 0,
      sub: `${stats?.maintenance_beds || 0} beds in maintenance`,
      icon: BedDouble,
      color: 'border-l-amber-500',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      trend: '-2',
      trendUp: false,
    },
    {
      label: 'TOTAL PATIENTS',
      value: stats?.total_patients || 0,
      sub: 'Registered in system directory',
      icon: Users,
      color: 'border-l-purple-500',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      trend: '+3',
      trendUp: true,
    },
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30">

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">System Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Real-time hospital bed and admission overview</p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Live Data
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
              <div className="mb-2">
                <p className="text-4xl font-bold text-slate-800 leading-none">{card.value}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">{card.sub}</p>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${card.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                  {card.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {card.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">

        {/* Admission Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">Admission Trends</h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily admissions vs discharges (Last 7 days)</p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-semibold rounded-lg">Weekly</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats?.admission_trends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
              <Line type="monotone" dataKey="admissions" name="Admissions" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="discharges" name="Discharges" stroke="#10b981" strokeWidth={2} strokeDasharray="5 4" dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ward Occupancy */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-800">Ward Occupancy</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time bed utilization breakdown</p>
          </div>
          <div className="space-y-4">
            {(stats?.ward_occupancy || []).map((ward, idx) => {
              const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-red-500'];
              const labelColors = ['text-blue-600 bg-blue-50 border-blue-200', 'text-emerald-600 bg-emerald-50 border-emerald-200', 'text-amber-600 bg-amber-50 border-amber-200', 'text-purple-600 bg-purple-50 border-purple-200', 'text-red-600 bg-red-50 border-red-200'];
              const color = colors[idx % colors.length];
              const labelColor = labelColors[idx % labelColors.length];
              const occupancyRate = ward.occupancy_rate || 0;

              return (
                <div key={ward.ward_id || idx}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{ward.ward_name}</span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${labelColor}`}>
                        {ward.ward_type}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-800">{occupancyRate.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`${color} h-1.5 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(occupancyRate, 100)}%` }}
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

      {/* Recent Admissions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Recent Patient Admissions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest patient check-ins registered today</p>
          </div>
          <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 flex items-center gap-1.5 transition-all duration-200">
            <Activity size={12} />
            Live Logs
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-6">Patient</th>
                <th className="py-3 px-6">Location (Bed)</th>
                <th className="py-3 px-6">Check-In Date</th>
                <th className="py-3 px-6">Reason</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(stats?.recent_admissions || []).map((admission, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-all duration-200">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                        {admission.patient_name?.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800">{admission.patient_name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-slate-700 block">{admission.ward_name}</span>
                    <span className="text-xs text-slate-400">Room {admission.room_number} • Bed {admission.bed_number}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-slate-600 text-xs">
                      {new Date(admission.admission_date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-slate-500 text-xs">{admission.reason_for_admission}</span>
                  </td>
                  <td className="py-4 px-6">
                    {admission.status === 'admitted' ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase">
                        ● Active
                      </span>
                    ) : (
                      <div className="min-w-[120px]">
                        <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full text-[10px] font-bold uppercase whitespace-nowrap">
                          ● Discharged
                        </span>
                        {admission.discharge_date && (
                          <p className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">
                            {new Date(admission.discharge_date).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    )}
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

export default Dashboard;