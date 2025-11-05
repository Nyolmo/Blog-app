import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PostList from './pages/PostList';
import PostDetail from './pages/PostDetail';
import Login from './pages/Login';
import PostForm from './pages/PostForm';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <header>
        <Link to="/">Home</Link> | <Link to="/create">Create Post</Link> | <Link to="/login">Login</Link>
      </header>
      <Routes>
        <Route path="/" element={<PostList />} />
        <Route path="/posts/:slug" element={<PostDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create" element={<ProtectedRoute><PostForm /></ProtectedRoute>} />
        <Route path="/edit/:slug" element={<ProtectedRoute><PostForm edit={true} /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}
