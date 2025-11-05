import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="text-center mt-32 px-6">
      {/* 🚫 Icon & Message */}
      <h1 className="text-3xl font-bold text-red-600 mb-2">🚫 Access Denied</h1>
      <p className="text-lg text-gray-600">
        You don’t have permission to view this page.
      </p>

      {/* 💡 Helpful next steps */}
      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
        >
          ← Go Back
        </button>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Login as Staff
        </button>
      </div>
    </div>
  );
}