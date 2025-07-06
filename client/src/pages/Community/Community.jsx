import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Favorite as FavoriteIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  Forum as ForumIcon,
} from "@mui/icons-material";
import { useNotification } from "../../contexts/NotificationContext";
import usePageTitle from "../../hooks/usePageTitle";
import axios from "axios";

const Community = () => {
  usePageTitle("Community & Forums");

  const { showSuccess, showError } = useNotification();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [postDialog, setPostDialog] = useState(false);
  const [newPostForm, setNewPostForm] = useState({
    title: "",
    content: "",
    category: "general",
  });

  // API base URL
  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Fetch posts from backend
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        showError("Please login to view community posts");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/community/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setPosts(response.data.data.posts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      showError("Failed to load community posts");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, showError]);

  // Load posts on mount
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = async () => {
    if (!newPostForm.title.trim() || !newPostForm.content.trim()) {
      showError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        showError("Please login to create posts");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/community/posts`,
        {
          title: newPostForm.title,
          content: newPostForm.content,
          category: newPostForm.category,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        showSuccess("Post created successfully!");
        setNewPostForm({ title: "", content: "", category: "general" });
        setPostDialog(false);
        // Refresh posts to show the new one
        await fetchPosts();
      }
    } catch (error) {
      console.error("Error creating post:", error);
      showError("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        showError("Please login to like posts");
        return;
      }

      await axios.post(
        `${API_BASE_URL}/community/posts/${postId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh posts to show updated likes
      await fetchPosts();
    } catch (error) {
      console.error("Error liking post:", error);
      showError("Failed to like post");
    }
  };

  const PostCard = ({ post }) => (
    <Card sx={{ mb: 2, "&:hover": { boxShadow: 3 } }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            src={post.author?.avatar}
            sx={{ mr: 2, bgcolor: "primary.main" }}
          >
            {post.author?.name?.charAt(0) || "U"}
          </Avatar>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight="bold">
              {post.author?.name || "Unknown User"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(post.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
          <Chip
            label={post.category}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <Typography variant="h6" gutterBottom>
          {post.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          {post.content}
        </Typography>
      </CardContent>

      <CardActions>
        <IconButton onClick={() => handleLikePost(post._id)} color="primary">
          <FavoriteIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          {Array.isArray(post.likes) ? post.likes.length : 0}
        </Typography>

        <IconButton>
          <CommentIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          {Array.isArray(post.comments) ? post.comments.length : 0}
        </Typography>

        <IconButton>
          <ShareIcon />
        </IconButton>
      </CardActions>
    </Card>
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <ForumIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Community & Forums
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Share tips, ask questions, and connect with fellow gardeners
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Posts Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {posts.length > 0 ? (
            posts.map((post) => <PostCard key={post._id} post={post} />)
          ) : (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary">
                No posts yet. Be the first to share something!
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add post"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={() => setPostDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Create Post Dialog */}
      <Dialog
        open={postDialog}
        onClose={() => setPostDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Post</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Post Title"
            fullWidth
            variant="outlined"
            value={newPostForm.title}
            onChange={(e) =>
              setNewPostForm({ ...newPostForm, title: e.target.value })
            }
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={newPostForm.category}
              label="Category"
              onChange={(e) =>
                setNewPostForm({ ...newPostForm, category: e.target.value })
              }
            >
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="tips">Tips & Advice</MenuItem>
              <MenuItem value="plant-care">Plant Care</MenuItem>
              <MenuItem value="garden-design">Garden Design</MenuItem>
              <MenuItem value="pest-control">Pest Control</MenuItem>
              <MenuItem value="tools">Tools & Equipment</MenuItem>
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            label="Content"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={newPostForm.content}
            onChange={(e) =>
              setNewPostForm({ ...newPostForm, content: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPostDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreatePost}
            variant="contained"
            disabled={!newPostForm.title.trim() || !newPostForm.content.trim()}
          >
            Create Post
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Community;
