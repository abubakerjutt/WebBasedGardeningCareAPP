import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const CommunityContext = createContext();

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error("useCommunity must be used within a CommunityProvider");
  }
  return context;
};

export const CommunityProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  // Fetch posts
  const fetchPosts = useCallback(
    async (params = {}) => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get("/community/posts", { params });

        if (response.data.success) {
          setPosts(response.data.data.posts);
          return response.data.data;
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch posts");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  // Create post
  const createPost = async (postData) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      Object.keys(postData).forEach((key) => {
        if (key === "images" && postData[key]) {
          Array.from(postData[key]).forEach((file) => {
            formData.append("images", file);
          });
        } else if (postData[key] !== null && postData[key] !== undefined) {
          formData.append(key, postData[key]);
        }
      });

      const response = await api.post("/community/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        const newPost = response.data.data.post;
        setPosts((prev) => [newPost, ...prev]);
        return newPost;
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Like/unlike post
  const likePost = async (postId) => {
    try {
      const response = await api.post(`/community/posts/${postId}/like`);

      if (response.data.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  likes: response.data.data.liked
                    ? [...post.likes, { user: user.id }]
                    : post.likes.filter((like) => like.user !== user.id),
                  likeCount: response.data.data.liked
                    ? (post.likeCount || 0) + 1
                    : Math.max(0, (post.likeCount || 0) - 1),
                }
              : post
          )
        );
        return response.data.data;
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle like");
      throw err;
    }
  };

  // Add comment
  const addComment = async (postId, content) => {
    try {
      const response = await api.post(`/community/posts/${postId}/comments`, {
        content,
      });

      if (response.data.success) {
        const newComment = response.data.data.comment;
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  comments: [...(post.comments || []), newComment],
                  commentCount: (post.commentCount || 0) + 1,
                }
              : post
          )
        );
        return newComment;
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment");
      throw err;
    }
  };

  const value = {
    posts,
    loading,
    error,
    fetchPosts,
    createPost,
    likePost,
    addComment,
    setError,
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
};

export default CommunityContext;
