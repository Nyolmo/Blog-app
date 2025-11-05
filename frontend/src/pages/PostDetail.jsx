import React, { useEffect, useState, useRef, useMemo } from 'react';
import api from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-toastify';
import { isAuthenticated, getUserInfo } from '../auth';
import Skeleton from 'react-loading-skeleton';
import 'react-toastify/dist/ReactToastify.css';
import 'react-loading-skeleton/dist/skeleton.css';

function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);
  return [darkMode, setDarkMode];
}

function ErrorMessage({ message, retry }) {
  return (
    <div className="text-center mt-6">
      <p className="text-red-500 font-semibold">{message}</p>
      <button
        onClick={retry}
        className="bg-gray-800 text-white rounded-lg px-4 py-2 mt-3 hover:bg-gray-700"
      >
        Retry
      </button>
    </div>
  );
}

export default function PostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [commentBody, setCommentBody] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [page, setPage] = useState(1);
  const [darkMode, setDarkMode] = useDarkMode();
  const commentsEndRef = useRef(null);
  const currentUser = getUserInfo();

  const COMMENTS_PER_PAGE = 5;

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/posts/${slug}/`);
      setPost({
        ...res.data,
        comments: res.data.comments || [],
      });
    } catch (e) {
      console.error(e);
      setErr('Failed to load post.');
      toast.error('Could not load post.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (post) document.title = `${post.title} | Blog`;
  }, [post]);

  const toggleLike = async () => {
    if (!isAuthenticated()) {
      toast.warn('You must be logged in to like.');
      navigate('/login');
      return;
    }
    if (liking) return;
    setLiking(true);

    try {
      const res = await api.post(`/posts/${post.slug}/toggle_like/`);
      setPost({ ...post, liked: res.data.liked, likes_count: res.data.likes_count });
    } catch (err) {
      console.error('Like error:', err);
      toast.error('Failed to like/unlike post.');
    } finally {
      setLiking(false);
    }
  };

  const addComment = async () => {
    if (!commentBody.trim()) return;
    if (!isAuthenticated()) {
      toast.warn('You must be logged in to comment.');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${post.slug}/add_comment/`, { body: commentBody });
      setPost({ ...post, comments: [...post.comments, res.data] });
      setCommentBody('');
      toast.success('Comment added!');
    } catch (err) {
      console.error('Comment error:', err);
      toast.error('Failed to add comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (id) => {
    try {
      await api.delete(`/comments/${id}/`);
      setPost({ ...post, comments: post.comments.filter(c => c.id !== id) });
      toast.success('Comment deleted.');
    } catch {
      toast.error('Failed to delete comment.');
    }
  };

  const saveEdit = async (id) => {
    try {
      const res = await api.put(`/comments/${id}/`, { body: editBody });
      const updated = post.comments.map(c => (c.id === id ? res.data : c));
      setPost({ ...post, comments: updated });
      setEditingId(null);
      setEditBody('');
      toast.success('Comment updated!');
    } catch {
      toast.error('Edit failed.');
    }
  };

  const paginatedComments = useMemo(() => {
    return post?.comments?.slice((page - 1) * COMMENTS_PER_PAGE, page * COMMENTS_PER_PAGE);
  }, [post, page]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <Skeleton height={40} width="60%" />
        <Skeleton count={8} className="mt-4" />
      </div>
    );
  }

  if (err) return <ErrorMessage message={err} retry={fetchPost} />;
  if (!post) return <p className="text-center mt-6">Post not found.</p>;

  return (
    <div className={`max-w-2xl mx-auto p-4 ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} transition`}>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="mb-3 px-3 py-1 rounded-lg border dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-800"
      >
        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>

      {post.image && (
        <img
          src={post.image}
          alt={post.title}
          className="rounded-xl mb-4 w-full object-cover max-h-96 shadow-md"
        />
      )}

      <h1 className="text-2xl font-bold mb-2">{post.title}</h1>

      <div className="prose dark:prose-invert max-w-none mb-4">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </div>

      <button
        onClick={toggleLike}
        disabled={liking}
        className={`mt-3 px-4 py-2 rounded-lg ${post.liked ? 'bg-pink-500 text-white' : 'bg-gray-200 dark:bg-gray-700'} transition`}
      >
        {post.liked ? '💖 Unlike' : '🤍 Like'} ({post.likes_count})
      </button>

      <h2 className="text-xl mt-6 mb-3 font-semibold">Comments ({post.comments?.length || 0})</h2>
      {paginatedComments?.length ? (
        paginatedComments.map((c) => (
          <div key={c.id} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-3 relative">
            {editingId === c.id ? (
              <>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={3}
                  className="w-full p-2 rounded-md"
                />
                <button
                  onClick={() => saveEdit(c.id)}
                  className="bg-blue-500 text-white rounded-md px-3 py-1 mt-2"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditingId(null); setEditBody(''); }}
                  className="ml-2 bg-gray-400 text-white rounded-md px-3 py-1 mt-2"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="prose dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {c.body}
                  </ReactMarkdown>
                </div>
                <small className="text-gray-500">
                  {c.author} • {new Date(c.created_at).toLocaleString()}
                </small>
                {currentUser?.username === c.author && (
                  <div className="absolute top-2 right-3 flex gap-2">
                    <button
                      onClick={() => { setEditingId(c.id); setEditBody(c.body); }}
                      className="text-blue-500"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="text-red-500"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500">No comments yet.</p>
      )}

      {/* Pagination */}
      {post.comments?.length > COMMENTS_PER_PAGE && (
        <div className="mt-3 flex justify-center gap-2">
          {Array.from({ length: Math.ceil(post.comments.length / COMMENTS_PER_PAGE) }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                page === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Add Comment */}
      <div className="mt-6">
        <textarea
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          rows={3}
          placeholder="Write a comment..."
          className="w-full p-2 border dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <button
          onClick={addComment}
          disabled={submitting || !commentBody.trim()}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Add Comment'}
        </button>
        {err && <p className="text-red-500 mt-2">{err}</p>}
        <div ref={commentsEndRef} />
      </div>
    </div>
  );
}