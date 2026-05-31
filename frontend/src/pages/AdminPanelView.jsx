import React, { useState, useEffect } from 'react';
import { adminService } from '../services/apiClient';
import { Users, Shield, History, Cpu, Server, Activity, AlertCircle, Settings, Download, Trash2, UserPlus } from 'lucide-react';
import GlobalHeader from '../components/GlobalHeader';

const AdminPanelView = ({ headerTitle = "Admin Control", headerSubtitle = "System management and audit" }) => {
  const [users, setUsers] = useState([]);
  const [systemStats, setSystemStats] = useState({
      total_scans: 0,
      active_targets: 0,
      critical_findings: 0,
      system_status: 'Operational',
      health: {
        cpu: '0%',
        memory: '0 GB / 0 GB',
        load: 'Stable'
      }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const usersRes = await adminService.getUsers();
        const statsRes = await adminService.getStats();
        
        if (isMounted) {
          if (usersRes && usersRes.data) setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
          if (statsRes && statsRes.data) {
            setSystemStats(prev => ({
              ...prev,
              ...statsRes.data,
              health: statsRes.data.health || prev.health
            }));
          }
        }
      } catch (err) {
        console.error("Admin dashboard fetch error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-black">
      <div className="flex flex-col items-center gap-6">
        <div className="w-10 h-10 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500 font-medium">Loading…</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-32 bg-cyber-black text-white">
      <GlobalHeader title={headerTitle} subtitle={headerSubtitle} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-cyber-surface border border-white/5 rounded-2xl">
           <Cpu className="text-cyber-blue mb-4" />
           <p className="text-sm text-gray-400 font-medium">CPU Load</p>
           <p className="text-3xl font-bold tabular-nums">{systemStats.health?.cpu || '0%'}</p>
        </div>
        <div className="p-6 bg-cyber-surface border border-white/5 rounded-2xl">
           <Server className="text-cyber-neon mb-4" />
           <p className="text-sm text-gray-400 font-medium">Memory</p>
           <p className="text-3xl font-bold tabular-nums">{typeof systemStats.health?.memory === 'string' ? systemStats.health.memory.split(' / ')[0] : '0 GB'}</p>
        </div>
        <div className="p-6 bg-cyber-surface border border-white/5 rounded-2xl">
           <Activity className="text-cyber-alert mb-4" />
           <p className="text-sm text-gray-400 font-medium">Status</p>
           <p className="text-3xl font-bold">{systemStats.health?.load || 'Stable'}</p>
        </div>
      </div>

      <div className="cyber-panel bg-cyber-surface p-8">
         <h2 className="text-lg font-semibold mb-6 border-b border-white/5 pb-4">Users</h2>
         <div className="space-y-4">
            {Array.isArray(users) && users.length > 0 ? users.map((u, i) => (
               <div key={u.id || i} className="p-5 bg-black/20 border border-white/5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center font-bold">{u.username ? u.username.substring(0, 1).toUpperCase() : 'U'}</div>
                     <div>
                        <p className="font-semibold">{u.username || 'System'}</p>
                        <p className="text-xs text-gray-500">{u.role || 'User'}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-xs text-cyber-neon font-semibold">{u.status || 'Active'}</p>
                  </div>
               </div>
            )) : (
               <p className="text-center py-10 text-gray-600">No users found</p>
            )}
         </div>
      </div>
    </div>
  );
};

export default AdminPanelView;
