import React, { useState, useEffect } from 'react';
import { Flame, TrendingUp, Target, Plus, X } from 'lucide-react';
import { PageContainer, Card } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, supabase } = useAuth();
  const [stats, setStats] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showCalModal, setShowCalModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [calInput, setCalInput] = useState('');
  const [workoutInput, setWorkoutInput] = useState({ title: '', duration: '' });
  const [goalInput, setGoalInput] = useState('');

  // Load stats and workouts from Supabase
  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch or create stats row
    let { data: statsData } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!statsData) {
      const { data: newStats } = await supabase
        .from('user_stats')
        .insert([{ user_id: user.id }])
        .select()
        .single();
      statsData = newStats;
    }
    setStats(statsData);

    // Fetch today's workouts
    const today = new Date().toISOString().split('T')[0];
    const { data: workoutsData } = await supabase
      .from('user_workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: false });

    setWorkouts(workoutsData || []);
    setLoading(false);
  };

  const updateStats = async (updates) => {
    const { data } = await supabase
      .from('user_stats')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .single();
    setStats(data);
  };

  const handleAddCalories = async () => {
    if (!calInput || isNaN(calInput)) return;
    await updateStats({
      calories_burned: (stats.calories_burned || 0) + parseInt(calInput),
    });
    setCalInput('');
    setShowCalModal(false);
  };

  const handleAddWorkout = async () => {
    if (!workoutInput.title) return;
    await supabase.from('user_workouts').insert([{
      user_id: user.id,
      title: workoutInput.title,
      duration_min: parseInt(workoutInput.duration) || 0,
      date: new Date().toISOString().split('T')[0],
    }]);
    await updateStats({
      workouts_completed: (stats.workouts_completed || 0) + 1,
      weekly_done: (stats.weekly_done || 0) + 1,
    });
    setWorkoutInput({ title: '', duration: '' });
    setShowWorkoutModal(false);
    fetchData();
  };

  const handleSetGoal = async () => {
    if (!goalInput || isNaN(goalInput)) return;
    await updateStats({ weekly_target: parseInt(goalInput) });
    setGoalInput('');
    setShowGoalModal(false);
  };

  const goalPercent = stats
    ? Math.min(Math.round(((stats.weekly_done || 0) / (stats.weekly_target || 5)) * 100), 100)
    : 0;

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Athlete';

  if (loading) {
    return (
      <PageContainer title="Dashboard" subtitle="Loading your data...">
        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' }}>
          Loading...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Hey, ${firstName} 👋`}
      subtitle="Here's your fitness overview for today."
    >
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>

        {/* Calories Card */}
        <Card title="Today's calories burned">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={24} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                  {stats?.calories_burned || 0}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>kcal burned</div>
              </div>
            </div>
            <button
              onClick={() => setShowCalModal(true)}
              style={{ background: 'var(--color-primary)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Plus size={18} color="white" />
            </button>
          </div>
        </Card>

        {/* Workouts Card */}
        <Card title="This week's workouts">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-accent-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={24} color="var(--color-background)" />
              </div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                  {stats?.weekly_done || 0}
                  <span style={{ fontSize: '1rem', fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>
                    /{stats?.weekly_target || 5}
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>workouts completed</div>
              </div>
            </div>
            <button
              onClick={() => setShowWorkoutModal(true)}
              style={{ background: 'var(--color-accent-lime)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Plus size={18} color="var(--color-background)" />
            </button>
          </div>
        </Card>

        {/* Goal Progress Card */}
        <Card title="Weekly goal progress">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={24} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{goalPercent}%</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>weekly target</div>
              </div>
            </div>
            <button
              onClick={() => setShowGoalModal(true)}
              style={{ background: 'var(--color-accent-light)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Plus size={18} color="white" />
            </button>
          </div>
          {/* Progress bar */}
          <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 99 }}>
            <div style={{
              height: '100%',
              width: `${goalPercent}%`,
              background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent-lime))',
              borderRadius: 99,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </Card>
      </div>

      {/* Today's Workouts List */}
      <Card title="Today's workouts">
        {workouts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏋️</div>
            <div>No workouts logged yet today.</div>
            <button
              onClick={() => setShowWorkoutModal(true)}
              style={{ marginTop: '1rem', background: 'var(--color-primary)', border: 'none', borderRadius: '50px', padding: '0.6rem 1.5rem', color: 'white', fontWeight: 600, cursor: 'pointer' }}
            >
              Log your first workout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {workouts.map((w) => (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{w.title}</div>
                  {w.duration_min > 0 && (
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{w.duration_min} min</div>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Today</div>
              </div>
            ))}
            <button
              onClick={() => setShowWorkoutModal(true)}
              style={{ marginTop: '0.5rem', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 12, padding: '0.6rem', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} /> Add another workout
            </button>
          </div>
        )}
      </Card>

      {/* ── MODALS ── */}

      {/* Calories Modal */}
      {showCalModal && (
        <Modal title="Log Calories Burned" onClose={() => setShowCalModal(false)}>
          <input
            type="number" placeholder="e.g. 300"
            value={calInput} onChange={(e) => setCalInput(e.target.value)}
            style={inputStyle}
            autoFocus
          />
          <button onClick={handleAddCalories} style={btnStyle}>Add Calories</button>
        </Modal>
      )}

      {/* Workout Modal */}
      {showWorkoutModal && (
        <Modal title="Log Workout" onClose={() => setShowWorkoutModal(false)}>
          <input
            type="text" placeholder="Workout name (e.g. Upper Body)"
            value={workoutInput.title}
            onChange={(e) => setWorkoutInput({ ...workoutInput, title: e.target.value })}
            style={{ ...inputStyle, marginBottom: '0.75rem' }}
            autoFocus
          />
          <input
            type="number" placeholder="Duration in minutes (optional)"
            value={workoutInput.duration}
            onChange={(e) => setWorkoutInput({ ...workoutInput, duration: e.target.value })}
            style={inputStyle}
          />
          <button onClick={handleAddWorkout} style={btnStyle}>Log Workout</button>
        </Modal>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <Modal title="Set Weekly Goal" onClose={() => setShowGoalModal(false)}>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Current goal: {stats?.weekly_target || 5} workouts/week
          </p>
          <input
            type="number" placeholder="e.g. 5"
            value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
            style={inputStyle}
            autoFocus
          />
          <button onClick={handleSetGoal} style={btnStyle}>Set Goal</button>
        </Modal>
      )}
    </PageContainer>
  );
}

// Reusable Modal component
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}
      onClick={onClose}>
      <div style={{ background: '#1a1035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 400 }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.2rem' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.85rem 1rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, color: 'white',
  fontSize: '0.95rem', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
};

const btnStyle = {
  width: '100%', padding: '0.9rem',
  background: 'var(--color-primary)',
  border: 'none', borderRadius: 12,
  color: 'white', fontWeight: 700,
  fontSize: '1rem', cursor: 'pointer',
};