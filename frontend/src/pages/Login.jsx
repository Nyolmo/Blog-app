import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { saveTokens } from '../auth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      const res = await api.post('/auth/token/', { username, password });

      // ✅ Enhancement #1: Use helper for token saving
      if (remember) {
        saveTokens({ access: res.data.access, refresh: res.data.refresh });
      } else {
        // Temporary session (tab closes → logged out)
        sessionStorage.setItem('access_token', res.data.access);
        sessionStorage.setItem('refresh_token', res.data.refresh);
      }

      // ✅ Enhancement #2: Redirect to intended page if available
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') || '/';
      navigate(next, { replace: true });

    } catch (error) {
      if (error.response?.data?.detail) {
        setErr(error.response.data.detail);
      } else {
        setErr('Login failed. Please check your connection or credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 400, margin: 'auto' }}>
      <h2>Login</h2>

      {/* ✅ Username field */}
      <label htmlFor="username">Username</label>
      <input
        id="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
        required
        autoComplete="username"
      />

      {/* ✅ Password field */}
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
        required
        autoComplete="current-password"
      />

      {/* ✅ Remember me checkbox */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        Remember me
      </label>

      {/* ✅ Forgot password link */}
      <div style={{ marginBottom: '1rem' }}>
        <a href="/forgot-password" style={{ fontSize: '0.9rem' }}>
          Forgot password?
        </a>
      </div>

      {/* ✅ Submit button with loading feedback */}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>

      {/* ✅ Error feedback */}
      {err && <p style={{ color: 'red' }}>{err}</p>}
    </form>
  );
}
