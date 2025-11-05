import React, { useEffect, useState, useRef, useMemo } from 'react';
import api from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-toastify';
import { isAuthenticated, getUserInfo } from '../auth';
import 'react-toastify/dist/ReactToastify.css';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Error fallback component
function ErrorMessage({ message, retry }) {
  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <p style={{ color: 'red', fontWeight: 'bold' }}>{message}</p>
      <button
        onClick={retry}
        style={{
          background: '#333',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
        }}
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
  const [replyBodies, setReplyBodies] = useState({}); // { commentId: replyText }
  const [replyingMap, setReplyingMap] = useState({}); // { commentId: boolean }
  const commentsEndRef = useRef(null);

  const COMMENTS_PER_PAGE = 5;
  const currentUser = getUserInfo();

  // Fetch post details (expects /posts/:slug/ endpoint)
  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/posts/${slug}/`);
      // Ensure comments array and replies structure exist
      const normalized = {
        ...res.data,
        comments: (res.data.comments || []).map(c => ({
          ...c,
          replies: c.replies || [],
        })),
      };
      setPost(normalized);
      setErr('');
    } catch (e) {
      console.error(e);
      setErr('Failed to load post. Please check your connection.');
      toast.error('Could not load post. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
    // clean up title on unmount
    return () => { document.title = 'Blog'; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // SEO: update document title when post loads
  useEffect(() => {
    if (post) document.title = `${post.title} | Blog`;
  }, [post]);

  const addComment = async () => {
    if (!commentBody.trim()) return;
    if (!isAuthenticated()) {
      toast.warn('You must be logged in to comment.');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${post.id}/add_comment/`, { body: commentBody });
      const updatedComments = [...(post.comments || []), res.data];
      setPost({ ...post, comments: updatedComments });
      setCommentBody('');
      toast.success('Comment added!');
      setPage(Math.ceil(updatedComments.length / COMMENTS_PER_PAGE));
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch (error) {
      toast.error('Could not add comment.');
      setErr(error.response?.data?.detail || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async () => {
    if (!isAuthenticated()) {
      toast.warn('You must be logged in to like posts.');
      navigate('/login');
      return;
    }
    if (liking) return;
    setLiking(true);

    try {
      const newLiked = !post.liked;
      setPost({
        ...post,
        liked: newLiked,
        likes_count: post.likes_count + (newLiked ? 1 : -1),
      });

      const res = await api.post(`/posts/${post.id}/toggle_like/`);
      setPost({
        ...post,
        liked: res.data.liked,
        likes_count: res.data.likes_count,
      });
    } catch (error) {
      toast.error('Could not toggle like.');
    } finally {
      setLiking(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}/`);
      const updatedComments = post.comments.filter((c) => c.id !== commentId);
      setPost({ ...post, comments: updatedComments });
      toast.success('Comment deleted.');
    } catch {
      toast.error('Failed to delete comment.');
    }
  };

  // Edit comment
  const saveEdit = async (commentId) => {
    if (!editBody.trim()) return;
    try {
      const res = await api.put(`/comments/${commentId}/`, { body: editBody });
      const updatedComments = post.comments.map((c) => (c.id === commentId ? res.data : c));
      setPost({ ...post, comments: updatedComments });
      setEditingId(null);
      setEditBody('');
      toast.success('Comment updated!');
    } catch {
      toast.error('Failed to edit comment.');
    }
  };

  // Reply to a comment (single-level replies)
  const addReply = async (commentId) => {
    const body = (replyBodies[commentId] || '').trim();
    if (!body) return;
    if (!isAuthenticated()) {
      toast.warn('You must be logged in to reply.');
      navigate('/login');
      return;
    }

    // optimistic update: add temporary reply with a negative id
    const tempId = `temp-${Date.now()}`;
    const tempReply = {
      id: tempId,
      body,
      author: currentUser?.username || 'You',
      created_at: new Date().toISOString(),
      is_temp: true,
    };

    const updatedComments = post.comments.map((c) =>
      c.id === commentId ? { ...c, replies: [...(c.replies || []), tempReply] } : c
    );
    setPost({ ...post, comments: updatedComments });
    setReplyBodies({ ...replyBodies, [commentId]: '' });
    setReplyingMap({ ...replyingMap, [commentId]: false });
    // scroll to bottom of replies
    setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);

    try {
      const res = await api.post(`/comments/${commentId}/reply/`, { body });
      // replace temp reply with server reply
      const replaced = post.comments.map((c) => {
        if (c.id !== commentId) return c;
        const replies = (c.replies || []).map((r) => (r.id === tempId ? res.data : r));
        return { ...c, replies };
      });
      setPost({ ...post, comments: replaced });
      toast.success('Reply added!');
    } catch (error) {
      // rollback optimistic update
      const rolledBack = post.comments.map((c) =>
        c.id === commentId ? { ...c, replies: (c.replies || []).filter((r) => r.id !== tempId) } : c
      );
      setPost({ ...post, comments: rolledBack });
      toast.error('Failed to add reply.');
    }
  };

  // Delete a reply
  const deleteReply = async (commentId, replyId) => {
    try {
      await api.delete(`/replies/${replyId}/`);
      const updatedComments = post.comments.map((c) =>
        c.id === commentId ? { ...c, replies: (c.replies || []).filter((r) => r.id !== replyId) } : c
      );
      setPost({ ...post, comments: updatedComments });
      toast.success('Reply deleted.');
    } catch {
      toast.error('Failed to delete reply.');
    }
  };

  const paginatedComments = useMemo(() => {
    return (post?.comments || []).slice((page - 1) * COMMENTS_PER_PAGE, page * COMMENTS_PER_PAGE);
  }, [post, page]);

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: 'auto' }}>
        <Skeleton height={40} width="60%" />
        <Skeleton count={8} style={{ marginTop: '1rem' }} />
      </div>
    );
  }

  if (err) return <ErrorMessage message={err} retry={fetchPost} />;
  if (!post) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>❌ Post not found.</p>;

  return (
    <div style={{ maxWidth: 700, margin: 'auto', padding: '1rem' }}>
      <h2>{post.title}</h2>

      <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>

      <button
        onClick={toggleLike}
        disabled={liking}
        style={{
          background: post.liked ? '#ffccd5' : '#f1f1f1',
          border: 'none',
          borderRadius: '8px',
          padding: '0.5rem 1rem',
          cursor: liking ? 'wait' : 'pointer',
          marginTop: '1rem',
          transition: 'background 0.3s ease',
        }}
      >
        {post.liked ? '💖 Unlike' : '🤍 Like'} ({post.likes_count})
      </button>

      <h3 style={{ marginTop: '2rem' }}>Comments ({post.comments?.length || 0})</h3>

      {paginatedComments.length > 0 ? (
        paginatedComments.map((c) => (
          <div
            key={c.id}
            style={{
              background: '#fafafa',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1rem',
              border: '1px solid #eee',
              position: 'relative',
            }}
          >
            {/* Comment body or edit form */}
            {editingId === c.id ? (
              <>
                <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={3} style={{ width: '100%', padding: '0.5rem' }} />
                <button onClick={() => saveEdit(c.id)} style={{ marginTop: '0.5rem', background: '#333', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px' }}>Save</button>
                <button onClick={() => { setEditingId(null); setEditBody(''); }} style={{ marginLeft: '0.5rem', background: '#ccc', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px' }}>Cancel</button>
              </>
            ) : (
              <>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.body}</ReactMarkdown>
                <small style={{ color: '#777' }}>{c.author} • {new Date(c.created_at).toLocaleString()}</small>

                {/* comment owner actions */}
                {currentUser?.username === c.author && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                    <button onClick={() => { setEditingId(c.id); setEditBody(c.body); }} style={{ background: 'transparent', border: 'none', color: '#333', cursor: 'pointer', marginRight: '8px' }}>✏️</button>
                    <button onClick={() => deleteComment(c.id)} style={{ background: 'transparent', border: 'none', color: '#c00', cursor: 'pointer' }}>🗑️</button>
                  </div>
                )}
              </>
            )}

            {/* Replies list */}
            <div style={{ marginTop: '0.8rem', paddingLeft: '1rem' }}>
              {(c.replies || []).map((r) => (
                <div key={r.id} style={{ background: '#fff', borderRadius: '6px', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #f0f0f0', position: 'relative' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.body}</ReactMarkdown>
                  <small style={{ color: '#666' }}>{r.author} • {new Date(r.created_at).toLocaleString()}</small>

                  {/* reply owner actions */}
                  {currentUser?.username === r.author && (
                    <button onClick={() => deleteReply(c.id, r.id)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', color: '#c00', cursor: 'pointer' }}>
                      🗑️
                    </button>
                  )}
                </div>
              ))}

              {/* Reply input toggle + box */}
              {replyingMap[c.id] ? (
                <div style={{ marginTop: '0.5rem' }}>
                  <textarea value={replyBodies[c.id] || ''} onChange={(e) => setReplyBodies({ ...replyBodies, [c.id]: e.target.value })} rows={2} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px' }} />
                  <div style={{ marginTop: '0.4rem' }}>
                    <button onClick={() => addReply(c.id)} style={{ background: '#333', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>Reply</button>
                    <button onClick={() => setReplyingMap({ ...replyingMap, [c.id]: false })} style={{ marginLeft: '0.5rem', background: '#ccc', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setReplyingMap({ ...replyingMap, [c.id]: true })} style={{ marginTop: '0.5rem', background: 'transparent', border: 'none', color: '#007bff', cursor: 'pointer' }}>
                  Reply
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <p style={{ textAlign: 'center', fontSize: '1.1rem' }}>🗨️ No comments yet. Be the first to share your thoughts!</p>
      )}

      {/* Pagination */}
      {post.comments?.length > COMMENTS_PER_PAGE && (
        <div style={{ marginBottom: '1rem' }}>
          {Array.from({ length: Math.ceil(post.comments.length / COMMENTS_PER_PAGE) }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} style={{ marginRight: '0.5rem', fontWeight: page === i + 1 ? 'bold' : 'normal', background: page === i + 1 ? '#ddd' : '#f9f9f9', border: 'none', borderRadius: '5px', padding: '0.3rem 0.6rem' }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Add comment form */}
      <div style={{ marginTop: '2rem' }}>
        <textarea value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Write a comment..." rows={4} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px' }} />
        <button onClick={addComment} disabled={submitting || !commentBody.trim()} style={{ marginTop: '0.5rem', background: '#333', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: submitting ? 'wait' : 'pointer' }}>
          {submitting ? 'Submitting...' : 'Add Comment'}
        </button>
        {err && <p style={{ color: 'red' }}>{err}</p>}
        <div ref={commentsEndRef} />
      </div>
    </div>
  );
}
