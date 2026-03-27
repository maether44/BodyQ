import React, { useState, useEffect } from 'react';
import { Users, Activity, LogOut, Flame, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const { supabase, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [userWorkouts, setUserWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const fetchUserData = async (userId) => {
    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: workouts } = await supabase
      .from('user_workouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    setUserStats(stats);
    setUserWorkouts(workouts || []);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchUserData(user.id);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d0a1e', color: 'white', fontFamily: 'inherit' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(36,28,64,0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-accent-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="#0d0a1e" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>BodyQ Admin</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Dashboard</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.6rem 1rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.9rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 73px)' }}>

        {/* Left — Users list */}
        <div style={{ width: 320, borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto', padding: '1.5rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', padding: '0 0.5rem' }}>
            <Users size={18} color="var(--color-accent-lime)" />
            <span style={{ fontWeight: 600 }}>All Users</span>
            <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', borderRadius: 99, padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}>{users.length}</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem' }}>Loading...</div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                onClick={() => handleSelectUser(u)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 12,
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  background: selectedUser?.id === u.id ? 'rgba(111,75,242,0.2)' : 'rgba(255,255,255,0.03)',
                  border: selectedUser?.id === u.id ? '1px solid rgba(111,75,242,0.4)' : '1px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                    {(u.full_name || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.full_name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                      {u.role === 'admin' ? '👑 Admin' : 'User'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right — User details */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {!selectedUser ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)' }}>
              <Users size={48} style={{ marginBottom: '1rem' }} />
              <div style={{ fontSize: '1.1rem' }}>Select a user to view their data</div>
            </div>
          ) : (
            <>
              {/* User header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.3rem' }}>
                  {(selectedUser.full_name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.3rem' }}>{selectedUser.full_name || 'Unknown'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                    {selectedUser.gender || 'Gender not set'} · {selectedUser.date_of_birth || 'DOB not set'}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard icon={<Flame size={20} color="white" />} bg="var(--color-primary)" label="Calories Burned" value={userStats?.calories_burned || 0} unit="kcal" />
                <StatCard icon={<TrendingUp size={20} color="#0d0a1e" />} bg="var(--color-accent-lime)" label="Workouts Done" value={userStats?.weekly_done || 0} unit={`/ ${userStats?.weekly_target || 5} goal`} dark />
                <StatCard icon={<Activity size={20} color="white" />} bg="var(--color-accent-light)" label="Total Workouts" value={userStats?.workouts_completed || 0} unit="all time" />
              </div>

              {/* Workout history */}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '1rem' }}>Recent Workouts</div>
                {userWorkouts.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '1.5rem' }}>No workouts logged yet</div>
                ) : (
                  userWorkouts.map((w) => (
                    <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{w.title}</div>
                        {w.duration_min > 0 && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{w.duration_min} min</div>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{w.date}</div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, bg, label, value, unit, dark }) {
  return (
    <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
        {icon}
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem' }}>{unit}</div>
      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>{label}</div>
    </div>
  );
}