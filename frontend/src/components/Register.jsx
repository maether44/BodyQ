import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register(form.email, form.password, form.name);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* LEFT — branding panel */}
      <div className="auth-visual">
        <div className="auth-logo">BodyQ</div>
        <div className="auth-visual-content">
          <h1>Start your<br /><span>journey.</span></h1>
          <p>Join thousands of athletes tracking their progress with BodyQ every day.</p>
          <div className="auth-stats">
            <div className="stat">
              <span className="stat-num">12K+</span>
              <span className="stat-label">Active Users</span>
            </div>
            <div className="stat">
              <span className="stat-num">98%</span>
              <span className="stat-label">Satisfaction</span>
            </div>
            <div className="stat">
              <span className="stat-num">50+</span>
              <span className="stat-label">Metrics</span>
            </div>
          </div>
        </div>
        <div className="auth-visual-bg">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
      </div>

      {/* RIGHT — form panel */}
      <div className="auth-form-side">
        <div className="auth-form-wrapper">
          <button onClick={() => navigate(-1)} className="auth-back-btn">← Back</button>

          <div className="auth-form-header">
            <h2>Create account</h2>
            <p>Free forever. No credit card needed.</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name" type="text" name="name"
                placeholder="Jane Doe"
                value={form.name} onChange={handleChange} required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email" type="email" name="email"
                placeholder="you@example.com"
                value={form.email} onChange={handleChange} required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password" type="password" name="password"
                placeholder="Min. 6 characters"
                value={form.password} onChange={handleChange} required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm">Confirm Password</label>
              <input
                id="confirm" type="password" name="confirm"
                placeholder="••••••••"
                value={form.confirm} onChange={handleChange} required
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : "Create Account →"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}