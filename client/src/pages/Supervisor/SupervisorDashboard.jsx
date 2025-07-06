import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  IconButton,
  Badge,
} from "@mui/material";
import {
  People as UsersIcon,
  LocalFlorist as PlantsIcon,
  Recommend as RecommendIcon,
  History as HistoryIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Feedback as FeedbackIcon,
  Comment as CommentIcon,
  Notifications as NotificationIcon,
  Assessment as StatsIcon,
} from "@mui/icons-material";
import { useNotification } from "../../contexts/NotificationContext";
import usePageTitle from "../../hooks/usePageTitle";

const SupervisorDashboard = () => {
  usePageTitle("Supervisor Dashboard");

  const { showSuccess, showError } = useNotification();

  // API configuration
  const api = axios.create({
    baseURL: "/api", // Use relative URL with Vite proxy
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Add token to requests
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState({});
  const [recentObservations, setRecentObservations] = useState([]);
  const [recommendationDialog, setRecommendationDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPlants, setUserPlants] = useState([]);
  const [observations, setObservations] = useState([]);
  const [observationsDialog, setObservationsDialog] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState(null);
  const [feedback, setFeedback] = useState({
    message: "",
    status: "approved",
  });
  const [newRecommendation, setNewRecommendation] = useState({
    title: "",
    description: "",
    category: "care",
    priority: "medium",
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/supervisor/users");

      // Handle the API response structure: { success: true, data: { users } }
      const users =
        response.data.data?.users || response.data.users || response.data;

      // Ensure data is an array
      if (Array.isArray(users)) {
        setUsers(users);
      } else {
        console.warn("API returned non-array users data:", users);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      showError("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await api.get("/recommendations");

      // Handle the API response structure: { success: true, data: { recommendations } }
      const recommendations =
        response.data.data?.recommendations ||
        response.data.recommendations ||
        response.data;

      // Ensure data is an array before setting
      if (Array.isArray(recommendations)) {
        setRecommendations(recommendations);
      } else {
        console.warn(
          "Recommendations API returned non-array data:",
          recommendations
        );
        setRecommendations([]);
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
      showError("Failed to load recommendations");
      setRecommendations([]);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await api.get("/supervisor/dashboard-stats");
      const statsData = response.data.data?.stats || {};
      setStats(statsData);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
      showError("Failed to load dashboard statistics");
      setStats({});
    }
  };

  const loadRecentObservations = async () => {
    try {
      const response = await api.get(
        "/supervisor/recent-observations?limit=10"
      );
      const data = response.data.data || {};
      setRecentObservations(data.observations || []);
    } catch (error) {
      console.error("Error loading recent observations:", error);
      showError("Failed to load recent observations");
      setRecentObservations([]);
    }
  };

  useEffect(() => {
    loadUsers();
    loadRecommendations();
    loadDashboardStats();
    loadRecentObservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserPlants = async (userId) => {
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/user-plants?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserPlants(data);
      }
    } catch {
      showError("Failed to load user plants");
    }
  };

  const loadUserObservations = async (userId) => {
    try {
      const response = await api.get(
        `/supervisor/users/${userId}/observations`
      );
      const data = response.data.data || {};
      setObservations(data.observations || []);
    } catch (error) {
      console.error("Error loading user observations:", error);
      showError("Failed to load user observations");
      setObservations([]);
    }
  };

  const handleViewUserObservations = (user) => {
    setSelectedUser(user);
    loadUserObservations(user._id);
    setObservationsDialog(true);
  };

  const handleProvideFeedback = (observation) => {
    setSelectedObservation(observation);
    setFeedback({
      message: "",
      status: "approved",
    });
    setFeedbackDialog(true);
  };

  const handleSubmitFeedback = async () => {
    try {
      if (!feedback.message.trim()) {
        showError("Please provide feedback message");
        return;
      }

      const response = await api.put(
        `/supervisor/observations/${selectedObservation._id}/feedback`,
        feedback
      );
      if (response.data.success) {
        showSuccess("Feedback provided successfully");
        setFeedbackDialog(false);
        setSelectedObservation(null);
        setFeedback({ message: "", status: "approved" });

        // Reload observations to show updated status
        if (selectedUser) {
          loadUserObservations(selectedUser._id);
        }

        // Refresh dashboard data to update statistics and recent observations
        loadDashboardStats();
        loadRecentObservations();
      }
    } catch (error) {
      console.error("Error providing feedback:", error);
      showError("Failed to provide feedback");
    }
  };

  const handleDeleteObservation = async (observationId) => {
    try {
      if (
        !window.confirm(
          "Are you sure you want to delete this observation? This action cannot be undone."
        )
      ) {
        return;
      }

      const response = await api.delete(
        `/supervisor/observations/${observationId}`
      );

      if (response.data.success) {
        showSuccess("Observation deleted successfully");

        // Reload observations to show updated list
        if (selectedUser) {
          loadUserObservations(selectedUser._id);
        }

        // Refresh dashboard data to update statistics and recent observations
        loadDashboardStats();
        loadRecentObservations();
      }
    } catch (error) {
      console.error("Error deleting observation:", error);
      showError("Failed to delete observation");
    }
  };

  const handleViewUserPlants = (user) => {
    setSelectedUser(user);
    loadUserPlants(user._id);
    setRecommendationDialog(true);
  };

  const handleCreateRecommendation = async () => {
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...newRecommendation,
          userId: selectedUser._id,
        }),
      });

      if (response.ok) {
        showSuccess("Recommendation created successfully");
        setRecommendationDialog(false);
        setNewRecommendation({
          title: "",
          description: "",
          category: "care",
          priority: "medium",
        });
        loadRecommendations();
      } else {
        throw new Error("Failed to create recommendation");
      }
    } catch {
      showError("Failed to create recommendation");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "default";
    }
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`supervisor-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Supervisor Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Manage user recommendations and monitor plant care progress
        </Typography>

        {/* Dashboard Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <UsersIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
                  <Box>
                    <Typography variant="h6">
                      {stats.totalUsers || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PlantsIcon color="success" sx={{ mr: 1.5, fontSize: 28 }} />
                  <Box>
                    <Typography variant="h6">
                      {stats.totalUserPlants || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      User Plants
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <NotificationIcon
                    color="warning"
                    sx={{ mr: 1.5, fontSize: 28 }}
                  />
                  <Box>
                    <Typography variant="h6">
                      {stats.pendingObservations || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Reviews
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <StatsIcon color="info" sx={{ mr: 1.5, fontSize: 28 }} />
                  <Box>
                    <Typography variant="h6">
                      {stats.totalObservations || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Observations
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Observations Section */}
        {recentObservations.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              <NotificationIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Recent Observations (
              {recentObservations.filter((obs) => !obs.hasResponse).length}{" "}
              pending feedback)
            </Typography>
            <Grid container spacing={2}>
              {recentObservations.slice(0, 6).map((observation) => (
                <Grid item xs={12} md={6} key={observation._id}>
                  <Card
                    variant="outlined"
                    sx={{
                      bgcolor: observation.hasResponse
                        ? "green"
                        : "warning.light",
                      borderColor: observation.hasResponse
                        ? "grey.300"
                        : "warning.main",
                    }}
                  >
                    <CardContent>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={1}
                      >
                        <Typography variant="h6" fontSize="1rem">
                          {observation.plantName}
                          {observation.gardenName && (
                            <Typography
                              variant="caption"
                              display="block"
                              color="text.secondary"
                            >
                              in {observation.gardenName}
                            </Typography>
                          )}
                        </Typography>
                        <Chip
                          label={
                            observation.hasResponse ? "Reviewed" : "Pending"
                          }
                          size="small"
                          color={
                            observation.hasResponse ? "success" : "warning"
                          }
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        By: {observation.user.name}
                      </Typography>
                      <Typography variant="body2" noWrap>
                        {observation.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                        mt={1}
                      >
                        {new Date(observation.createdAt).toLocaleDateString()}
                      </Typography>
                      {!observation.hasResponse && (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            mt: 1,
                            alignItems: "center",
                          }}
                        >
                          <Button
                            size="small"
                            startIcon={<CommentIcon />}
                            onClick={() => handleProvideFeedback(observation)}
                            sx={{ flex: 1 }}
                          >
                            Provide Feedback
                          </Button>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              handleDeleteObservation(observation._id)
                            }
                            title="Delete Observation"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        <Paper sx={{ mt: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab icon={<UsersIcon />} label="Users" />
            <Tab
              icon={
                <Badge
                  badgeContent={
                    recentObservations.filter((obs) => !obs.hasResponse).length
                  }
                  color="error"
                  max={99}
                >
                  <NotificationIcon />
                </Badge>
              }
              label="Recent Observations"
            />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Typography variant="h6" gutterBottom>
              User Management
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center">
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(users) &&
                      users.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar>{user.name.charAt(0)}</Avatar>
                              <Box ml={2}>
                                <Typography variant="body2" fontWeight="bold">
                                  {user.name}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => handleViewUserPlants(user)}
                              size="small"
                              color="primary"
                              title="View Plants & Create Recommendation"
                            >
                              <ViewIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleViewUserObservations(user)}
                              size="small"
                              color="secondary"
                              title="View Observations & Provide Feedback"
                            >
                              <FeedbackIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" gutterBottom>
              Recent User Observations
            </Typography>
            {recentObservations.length === 0 ? (
              <Alert severity="info">No recent observations from users.</Alert>
            ) : (
              <Grid container spacing={3}>
                {recentObservations.map((observation) => (
                  <Grid item xs={12} md={6} key={observation._id}>
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor: observation.hasResponse
                          ? "green"
                          : "warning.light",
                        borderColor: observation.hasResponse
                          ? "grey.300"
                          : "warning.main",
                      }}
                    >
                      <CardContent>
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          mb={2}
                        >
                          <Typography variant="h6">
                            {observation.plantName}
                          </Typography>
                          <Chip
                            label={
                              observation.hasResponse
                                ? "Reviewed"
                                : "Pending Feedback"
                            }
                            size="small"
                            color={
                              observation.hasResponse ? "success" : "warning"
                            }
                          />
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          <strong>User:</strong> {observation.user.name} (
                          {observation.user.email})
                        </Typography>

                        <Typography variant="body1" gutterBottom>
                          <strong>Title:</strong> {observation.title}
                        </Typography>

                        <Typography variant="body2" paragraph>
                          <strong>Description:</strong>{" "}
                          {observation.description}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          mb={2}
                        >
                          Submitted:{" "}
                          {new Date(observation.createdAt).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(observation.createdAt).toLocaleTimeString()}
                        </Typography>

                        {!observation.hasResponse && (
                          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<CommentIcon />}
                              onClick={() => handleProvideFeedback(observation)}
                              sx={{ flex: 1 }}
                            >
                              Provide Feedback
                            </Button>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteObservation(observation._id)
                              }
                              title="Delete Observation"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        )}

                        {observation.hasResponse && (
                          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<ViewIcon />}
                              onClick={() => {
                                const user = users.find(
                                  (u) => u._id === observation.user._id
                                );
                                if (user) {
                                  handleViewUserObservations(user);
                                }
                              }}
                              sx={{ flex: 1 }}
                            >
                              View Details
                            </Button>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteObservation(observation._id)
                              }
                              title="Delete Observation"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </Paper>

        {/* Create Recommendation Dialog */}
        <Dialog
          open={recommendationDialog}
          onClose={() => setRecommendationDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Create Recommendation for {selectedUser?.name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                User's Plants
              </Typography>
              <List>
                {userPlants.map((userPlant) => (
                  <ListItem key={userPlant._id}>
                    <ListItemIcon>
                      <PlantsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={userPlant.plant?.name}
                      secondary={`Added: ${new Date(
                        userPlant.dateAdded
                      ).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                New Recommendation
              </Typography>
              <TextField
                fullWidth
                label="Title"
                value={newRecommendation.title}
                onChange={(e) =>
                  setNewRecommendation({
                    ...newRecommendation,
                    title: e.target.value,
                  })
                }
                margin="normal"
              />
              <TextField
                fullWidth
                label="Description"
                value={newRecommendation.description}
                onChange={(e) =>
                  setNewRecommendation({
                    ...newRecommendation,
                    description: e.target.value,
                  })
                }
                multiline
                rows={4}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Category</InputLabel>
                <Select
                  value={newRecommendation.category}
                  onChange={(e) =>
                    setNewRecommendation({
                      ...newRecommendation,
                      category: e.target.value,
                    })
                  }
                >
                  <MenuItem value="care">Care</MenuItem>
                  <MenuItem value="watering">Watering</MenuItem>
                  <MenuItem value="fertilizing">Fertilizing</MenuItem>
                  <MenuItem value="pruning">Pruning</MenuItem>
                  <MenuItem value="pest_control">Pest Control</MenuItem>
                  <MenuItem value="general">General</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newRecommendation.priority}
                  onChange={(e) =>
                    setNewRecommendation({
                      ...newRecommendation,
                      priority: e.target.value,
                    })
                  }
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRecommendationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRecommendation} variant="contained">
              Create Recommendation
            </Button>
          </DialogActions>
        </Dialog>

        {/* User Observations Dialog */}
        <Dialog
          open={observationsDialog}
          onClose={() => setObservationsDialog(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>{selectedUser?.name}'s Plant Observations</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              {observations.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  py={4}
                >
                  No observations found for this user.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {observations.map((observation) => (
                    <Grid item xs={12} md={6} key={observation._id}>
                      <Card>
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={2}>
                            <PlantsIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6">
                              {observation.plantName}
                            </Typography>
                            <Chip
                              label={observation.status || "pending"}
                              size="small"
                              color={
                                observation.status === "reviewed"
                                  ? "success"
                                  : "default"
                              }
                              sx={{ ml: "auto" }}
                            />
                          </Box>

                          <Typography variant="body2" paragraph>
                            <strong>Observation:</strong>{" "}
                            {observation.description}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            mb={2}
                          >
                            Submitted:{" "}
                            {new Date(
                              observation.createdAt
                            ).toLocaleDateString()}
                          </Typography>

                          {observation.supervisorFeedback ? (
                            <Box
                              sx={{
                                bgcolor: "green",
                                color: "text.primary",
                                p: 2,
                                borderRadius: 1,
                                mb: 2,
                              }}
                            >
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                gutterBottom
                              >
                                Supervisor Feedback:
                              </Typography>
                              <Typography variant="body2" paragraph>
                                {observation.supervisorFeedback.message}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Status: {observation.supervisorFeedback.status}{" "}
                                | Reviewed:{" "}
                                {new Date(
                                  observation.supervisorFeedback.reviewedAt
                                ).toLocaleDateString()}
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CommentIcon />}
                                onClick={() =>
                                  handleProvideFeedback(observation)
                                }
                                sx={{ flex: 1 }}
                              >
                                Provide Feedback
                              </Button>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  handleDeleteObservation(observation._id)
                                }
                                title="Delete Observation"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setObservationsDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Feedback Dialog */}
        <Dialog
          open={feedbackDialog}
          onClose={() => setFeedbackDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Provide Feedback on Observation</DialogTitle>
          <DialogContent>
            {selectedObservation && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedObservation.plantName}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>User Observation:</strong>{" "}
                  {selectedObservation.description}
                </Typography>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={feedback.status}
                    onChange={(e) =>
                      setFeedback({ ...feedback, status: e.target.value })
                    }
                  >
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="needs_improvement">
                      Needs Improvement
                    </MenuItem>
                    <MenuItem value="concern">Concern</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Feedback Message"
                  multiline
                  rows={4}
                  value={feedback.message}
                  onChange={(e) =>
                    setFeedback({ ...feedback, message: e.target.value })
                  }
                  margin="normal"
                  placeholder="Provide detailed feedback to help the user improve their plant observations..."
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFeedbackDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitFeedback} variant="contained">
              Submit Feedback
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default SupervisorDashboard;
