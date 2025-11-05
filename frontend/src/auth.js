import { jwtDecode } from "jwt-decode";


/* ======================================================
   🔐 TOKEN MANAGEMENT HELPERS
   ====================================================== */

// ✅ Save access and refresh tokens (from login or refresh)
export const saveTokens = ({ access, refresh }) => {
  if (access) localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
};

// ✅ Clear all tokens (on logout or error)
export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

/* ======================================================
   🚪 LOGOUT + REDIRECT
   ====================================================== */

// ✅ Logout user and redirect to login (React Router–friendly)
export const logout = (navigate = null) => {
  clearTokens();
  if (navigate) {
    navigate('/login'); // use React Router navigate if provided
  } else if (window.location.pathname !== '/login') {
    window.location.href = '/login'; // fallback hard redirect
  }
};

/* ======================================================
   👤 USER INFO + AUTH CHECKS
   ====================================================== */

// ✅ Decode access token and return full user info
export const getUserInfo = () => {
  const access = localStorage.getItem('access_token');
  if (!access) return null;
  try {
    const decoded = jwtDecode(access);
    return {
      user_id: decoded.user_id,   // 🔹 include user_id for convenience
      username: decoded.username,
      is_staff: decoded.is_staff,
      exp: decoded.exp,           // expiration timestamp (seconds)
    };
  } catch {
    return null; // invalid or corrupted token
  }
};

// ✅ Check if user is authenticated and token is still valid
export const isAuthenticated = () => {
  const access = localStorage.getItem('access_token');
  if (!access) return false;
  try {
    const { exp } = jwtDecode(access);
    return Date.now() < exp * 1000; // compare ms vs seconds
  } catch {
    return false;
  }
};

/* ======================================================
   ⏰ OPTIONAL AUTO-LOGOUT (recommended in main App)
   ====================================================== */

// ✅ Automatically logout if token expires
export const autoLogoutIfExpired = (navigate = null) => {
  const access = localStorage.getItem('access_token');
  if (!access) return;
  try {
    const { exp } = jwtDecode(access);
    const expiryTime = exp * 1000;
    const timeLeft = expiryTime - Date.now();

    if (timeLeft <= 0) {
      logout(navigate);
    } else {
      // Set a timeout to auto-logout when token expires
      setTimeout(() => logout(navigate), timeLeft);
    }
  } catch {
    logout(navigate);
  }
};
