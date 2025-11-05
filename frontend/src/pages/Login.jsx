import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { saveTokens } from '../auth';
import { toast } from 'react-toastify';

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

      if (remember) {
        saveTokens({ access: res.data.access, refresh: res.data.refresh });
      } else {
        sessionStorage.setItem('access_token', res.data.access);
        sessionStorage.setItem('refresh_token', res.data.refresh);
      }

      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') || '/';
      toast.success('Welcome back!');
      navigate(next, { replace: true });
    } catch (error) {
      setErr(error.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 animate-fade-in"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
          Login to Your Account
        </h2>

        {/* Username */}
        <label htmlFor="username" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
          Username
        </label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          required
          autoComplete="username"
          className="w-full px-4 py-2 mb-4 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Password */}
        <label htmlFor="password" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
          autoComplete="current-password"
          className="w-full px-4 py-2 mb-4 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Remember me */}
        <label className="flex items-center mb-4 text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="mr-2"
          />
          Remember me
        </label>

        {/* Forgot password */}
        <div className="mb-4 text-right">
          <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        {/* Error message */}
        {err && <p className="mt-4 text-red-500 text-sm text-center">{err}</p>}

        {/* Divider */}
        <div className="my-6 border-t border-gray-300 dark:border-gray-700 text-center text-sm text-gray-500">
          or login with
        </div>

        {/* Social login buttons */}
        <div className="flex justify-center gap-4">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            onClick={() => toast.info('Google login coming soon')}
          >
            <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />
            Google
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            onClick={() => toast.info('GitHub login coming soon')}
          >
            <img src="/icons/github.svg" alt="GitHub" className="w-5 h-5" />
            GitHub
          </button>
        </div>
      </form>
    </div>
  );
}