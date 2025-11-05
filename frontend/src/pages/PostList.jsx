import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link, useSearchParams } from 'react-router-dom';

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [prev, setPrev] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const page = searchParams.get('page') || 1;
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/posts/', { params: { page, search, 'category__slug': category, published: true } });
      setPosts(res.data.results);
      setCount(res.data.count);
      setNext(res.data.next);
      setPrev(res.data.previous);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, [page, search, category]);

  const setPage = (p) => setSearchParams(prev => { const q = Object.fromEntries(prev); q.page = p; return q; });

  return (
    <div>
      <h1>Blog</h1>
      <input value={search} onChange={(e) => setSearchParams(s => ({...Object.fromEntries(s), search: e.target.value}))} placeholder="Search..." />
      {loading ? <p>Loading...</p> : posts.map(p => (
        <div key={p.id}>
          <Link to={`/posts/${p.slug}`}><h3>{p.title}</h3></Link>
          <p>{p.author} • {new Date(p.created_at).toLocaleDateString()}</p>
        </div>
      ))}
      <div>
        <button onClick={() => setPage(Number(page) - 1)} disabled={!prev}>Prev</button>
        <span> Page {page} </span>
        <button onClick={() => setPage(Number(page) + 1)} disabled={!next}>Next</button>
      </div>
    </div>
  );
}
