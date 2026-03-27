import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createClient } from "@supabase/supabase-js";
import "./Auth.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await login(form.email, form.password);

      // Check role and redirect accordingly
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-logo">BodyQ</div>
        <div className="auth-visual-content">
          <h1>Welcome<br />back, <span>Champ.</span></h1>
          <p>Your workouts, nutrition, and progress are waiting for you.</p>
          <div className="auth-stats">
            <div className="stat"><span className="stat-num">12K+</span><span className="stat-label">Active Users</span></div>
            <div className="stat"><span className="stat-num">98%</span><span className="stat-label">Satisfaction</span></div>
            <div className="stat"><span className="stat-num">50+</span><span className="stat-label">Metrics</span></div>
          </div>
        </div>
        <div className="auth-visual-bg">
          <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-wrapper">
          <button onClick={() => navigate(-1)} className="auth-back-btn">← Back</button>
          <div className="auth-form-header">
            <h2>Sign in</h2>
            <p>Enter your credentials to access your dashboard</p>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required autoComplete="current-password" />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : "Sign In →"}
            </button>
          </form>
          <p className="auth-switch">
            Don't have an account?{" "}<Link to="/register">Sign up for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}