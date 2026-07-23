import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  // Get readable page name from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'System Dashboard';
    if (path.startsWith('/patients')) return 'Patient Registry';
    if (path.startsWith('/beds')) return 'Bed & Admission Control';
    if (path.startsWith('/doctor-assignments')) return 'Doctor Assignments';
    if (path.startsWith('/staff-assignments')) return 'Staff Assignments';
    if (path.startsWith('/audit-logs')) return 'Audit Logs';
    if (path.startsWith('/profile')) return 'Profile Settings';
    return 'Hospital Portal';
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });


  // Fetch recent audit logs for notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (user?.role === 'admin') {
          const response = await api.get('/api/v1/audit-logs/?limit=5');
          setNotifications(response.data);
          setUnreadCount(response.data.length);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchNotifications();
  }, [user]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getActionColor = (action) => {
    if (action.includes('REGISTERED') || action.includes('ASSIGNED')) return 'text-emerald-500';
    if (action.includes('DELETED') || action.includes('REMOVED')) return 'text-red-500';
    if (action.includes('UPDATED') || action.includes('DISCHARGED')) return 'text-amber-500';
    if (action.includes('ADMITTED')) return 'text-blue-500';
    return 'text-slate-500';
  };

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/70 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between shadow-sm">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 leading-tight">{getPageTitle()}</h2>
        <p className="text-xs text-slate-400 font-medium">PABMS Healthcare Platform</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Date Display */}
        <span className="text-xs text-slate-500 font-semibold px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/50">
          {currentDate}
        </span>


        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setUnreadCount(0); }}
            className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Recent Activity</h3>
                <span className="text-xs text-slate-400">{notifications.length} records</span>
              </div>

              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-400">No recent activity</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map((log) => (
                    <div key={log.id} className="px-4 py-3 hover:bg-slate-50 transition-all duration-200">
                      <div className="flex items-start gap-2">
                        <div className={`text-xs font-bold mt-0.5 ${getActionColor(log.action)}`}>●</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700">{formatAction(log.action)}</p>
                          <p className="text-xs text-slate-400 capitalize">{log.entity_name}</p>
                          <p className="text-[10px] text-slate-300 mt-0.5">
                            {new Date(log.timestamp).toLocaleString('en-US')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="px-4 py-2 border-t border-slate-100 text-center">
                <a href="/audit-logs" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                  View all activity →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-6 bg-slate-200" />

        {/* Active Session Status */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-slate-500 font-medium capitalize">
            {user?.role} Session
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;