import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        textAlign: 'center',
        marginTop: '10%',
        padding: '2rem',
      }}
    >
      {/* 🚫 Icon & Message */}
      <h1 style={{ fontSize: '2rem', color: '#d9534f' }}>🚫 Access Denied</h1>
      <p style={{ fontSize: '1.1rem', color: '#555' }}>
        You don’t have permission to view this page.
      </p>

      {/* 💡 Helpful next steps */}
      <div style={{ marginTop: '1.5rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginRight: '0.5rem',
            padding: '0.6rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          ← Go Back
        </button>

        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '0.6rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Login as Staff
        </button>
      </div>
    </div>
  );
}
