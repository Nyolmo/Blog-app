import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PostForm({ edit = false }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const textareaRef = useRef(null);
  const navigate = useNavigate();
  const { slug } = useParams();

  // ✅ Fetch categories + post (if editing)
  useEffect(() => {
    api.get("/categories/")
      .then((res) => setCategories(res.data.results || []))
      .catch((err) => {
        console.error("Failed to fetch categories:", err);
        setCategories([]);
      });

    if (edit && slug) {
      (async () => {
        try {
          const res = await api.get("/posts/", { params: { search: slug } });
          const found = (res.data.results || res.data).find((p) => p.slug === slug);
          if (found) {
            setTitle(found.title);
            setContent(found.content);
            setCategoryId(found.category?.id || "");
          } else {
            toast.error("Post not found.");
            navigate("/");
          }
        } catch {
          toast.error("Failed to load post.");
        }
      })();
    }
  }, [edit, slug, navigate]);

  // ✅ Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const removeImage = () => setImage(null);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    if (!title.trim() || !content.trim()) {
      setErr("Title and content are required.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (categoryId) formData.append("category_id", categoryId);
      formData.append("published", true);
      if (image) formData.append("image", image);

      if (edit) {
        const list = await api.get("/posts/", { params: { search: slug } });
        const found = (list.data.results || list.data).find((p) => p.slug === slug);
        if (!found) throw new Error("Post not found");

        await api.put(`/posts/${found.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        toast.success("Post updated!");
        navigate(`/posts/${found.slug}`);
      } else {
        const res = await api.post("/posts/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Post created!");
        navigate(`/posts/${res.data.slug}`);
      }
    } catch (error) {
      if (error.response?.data) {
        setErr(JSON.stringify(error.response.data, null, 2));
      } else {
        setErr("Network error");
      }
      toast.error("Failed to submit post.");
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <div
      className={`min-h-screen flex justify-center items-start p-4 transition-all duration-300 ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
      }`}
    >
      <form
        onSubmit={submit}
        className={`w-full max-w-xl rounded-xl shadow-lg p-6 transition-all duration-300 ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* 🌗 Dark mode toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="float-right border px-3 py-1 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>

        <h2 className="text-center text-2xl font-semibold mb-4">
          {edit ? "Edit Post" : "Create New Post"}
        </h2>

        {/* 📝 Title */}
        <label htmlFor="title" className="block mb-1 font-medium">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter post title"
          required
          className="w-full mb-3 px-3 py-2 border rounded-md focus:ring focus:ring-blue-400 outline-none dark:bg-gray-700 dark:border-gray-600"
        />

        {/* 📂 Category */}
        <label htmlFor="category" className="block mb-1 font-medium">
          Category
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded-md focus:ring focus:ring-blue-400 outline-none dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="">-- No category --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* ✍️ Content */}
        <label htmlFor="content" className="block mb-1 font-medium">
          Content
        </label>
        <textarea
          id="content"
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post content here..."
          rows={5}
          required
          className="w-full mb-3 px-3 py-2 border rounded-md focus:ring focus:ring-blue-400 outline-none resize-none overflow-hidden dark:bg-gray-700 dark:border-gray-600"
        />

        {/* 🖼️ Image Upload */}
        <label htmlFor="image" className="block mb-1 font-medium">
          Upload Image
        </label>
        <input
          type="file"
          id="image"
          accept="image/*"
          onChange={handleImageChange}
          className="mb-3 w-full text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
        />

        {image && (
          <div className="relative mb-4">
            <img
              src={URL.createObjectURL(image)}
              alt="preview"
              className="w-full rounded-lg shadow-md"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded hover:bg-red-700"
            >
              ✕ Remove
            </button>
          </div>
        )}

        {/* 🚀 Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-md text-white font-medium transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading
            ? edit
              ? "Updating..."
              : "Creating..."
            : edit
            ? "Update Post"
            : "Create Post"}
        </button>

        {/* ⚠️ Error */}
        {err && (
          <pre className="text-red-500 mt-3 text-sm whitespace-pre-wrap">
            {err}
          </pre>
        )}
      </form>
    </div>
  );
}