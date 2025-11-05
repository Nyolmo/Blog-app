import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, useParams } from 'react-router-dom';

export default function PostForm({ edit=false }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [err, setErr] = useState('');
  const navigate = useNavigate();
  const { slug } = useParams();

  useEffect(() => {
    api.get('/categories/').then(res => setCategories(res.data));
    if (edit && slug) {
      (async () => {
        const res = await api.get('/posts/', { params: { search: slug }});
        const found = (res.data.results || res.data).find(p => p.slug === slug);
        setTitle(found.title);
        setContent(found.content);
        setCategoryId(found.category ? found.category.id : null);
      })();
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      if (edit) {
        // need post id; find via slug
        const list = await api.get('/posts/', { params: { search: slug }});
        const found = (list.data.results || list.data).find(p => p.slug === slug);
        await api.put(`/posts/${found.id}/`, { title, content, category_id: categoryId, published: true });
        navigate(`/posts/${found.slug}`);
      } else {
        const res = await api.post('/posts/', { title, content, category_id: categoryId, published: true });
        navigate(`/posts/${res.data.slug}`);
      }
    } catch (error) {
      if (error.response) setErr(JSON.stringify(error.response.data));
      else setErr('Network error');
    }
  };

  return (
    <form onSubmit={submit}>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" />
      <select value={categoryId || ''} onChange={e => setCategoryId(e.target.value || null)}>
        <option value="">--No category--</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Content" />
      <button type="submit">{edit ? 'Update' : 'Create'}</button>
      {err && <pre>{err}</pre>}
    </form>
  );
}
