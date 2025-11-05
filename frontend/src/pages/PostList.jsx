import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link, useSearchParams } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [prev, setPrev] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const ordering = searchParams.get('ordering') || '-created_at';

  useEffect(() => {
    api.get('/categories/')
      .then((res) => setCategories(res.data.results || []))
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/posts/', {
        params: {
          page,
          search,
          category__slug: category,
          ordering,
          published: true,
        },
      });
      setPosts(res.data.results);
      setCount(res.data.count);
      setNext(res.data.next);
      setPrev(res.data.previous);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, search, category, ordering]);

  const setPage = (p) =>
    setSearchParams((prev) => {
      const q = Object.fromEntries(prev);
      q.page = p;
      return q;
    });

  const updateSearch = (e) =>
    setSearchParams((prev) => ({
      ...Object.fromEntries(prev),
      search: e.target.value,
      page: 1,
    }));

  const updateCategory = (e) =>
    setSearchParams((prev) => ({
      ...Object.fromEntries(prev),
      category: e.target.value,
      page: 1,
    }));

  const updateOrdering = (e) =>
    setSearchParams((prev) => ({
      ...Object.fromEntries(prev),
      ordering: e.target.value,
      page: 1,
    }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-center mb-6">Dev 📚 Blog Posts</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          value={search}
          onChange={updateSearch}
          placeholder="Search posts..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={updateCategory}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={ordering}
          onChange={updateOrdering}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="-created_at">Newest</option>
          <option value="created_at">Oldest</option>
          <option value="-likes_count">Most Liked</option>
          <option value="likes_count">Least Liked</option>
        </select>
      </div>

      {/* Post list */}
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-6">
            <Skeleton height={200} className="mb-3" />
            <Skeleton height={30} width="60%" className="mb-2" />
            <Skeleton height={20} width="40%" className="mb-2" />
            <Skeleton count={2} />
          </div>
        ))
      ) : posts.length > 0 ? (
        posts.map((p) => (
          <div
            key={p.id}
            className="bg-white shadow-sm rounded-lg p-4 mb-6 hover:shadow-md transition"
          >
            {p.image && (
              <Link to={`/posts/${p.slug}`}>
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full max-h-60 object-cover rounded-md mb-3"
                />
              </Link>
            )}
            <Link to={`/posts/${p.slug}`} className="text-blue-600 hover:underline">
              <h3 className="text-xl font-semibold mb-1">{p.title}</h3>
            </Link>
            <p className="text-sm text-gray-500 mb-2">
              {p.author} • {new Date(p.created_at).toLocaleDateString()}
            </p>
            <p className="text-gray-700 mb-3">
              {p.content?.slice(0, 120)}{p.content?.length > 120 && '...'}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <Link to={`/posts/${p.slug}`} className="hover:underline">
                💖 {p.likes_count || 0} Likes
              </Link>
              <Link to={`/posts/${p.slug}`} className="hover:underline">
                💬 {p.comments?.length || 0} Comments
              </Link>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500">No posts found.</p>
      )}

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-8">
        <button
          onClick={() => setPage(page - 1)}
          disabled={!prev}
          className={`px-4 py-2 rounded-md ${
            prev ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          ◀ Prev
        </button>
        <span className="font-medium">Page {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={!next}
          className={`px-4 py-2 rounded-md ${
            next ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}