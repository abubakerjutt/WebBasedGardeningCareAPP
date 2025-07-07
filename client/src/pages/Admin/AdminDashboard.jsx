import { useState, useEffect } from "react";
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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from "@mui/material";
import {
  People as UsersIcon,
  SupervisorAccount as SupervisorIcon,
  Recommend as RecommendIcon,
  LocalFlorist as PlantsIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import { useNotification } from "../../contexts/NotificationContext";
import usePageTitle from "../../hooks/usePageTitle";

const AdminDashboard = () => {
  usePageTitle("Admin Dashboard");

  const { showError } = useNotification();

  // API configuration
  const API_URL = "/api"; // Use relative URL with Vite proxy
  const api = axios.create({
    baseURL: API_URL,
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
  const [supervisors, setSupervisors] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState({});
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/users");

      // Handle the API response structure: { success: true, data: { users } }
      const users =
        response.data.data?.users || response.data.users || response.data;

      // Ensure data is an array before filtering
      if (Array.isArray(users)) {
        setUsers(users.filter((u) => u.role === "user"));
        setSupervisors(users.filter((u) => u.role === "supervisor"));
      } else {
        console.warn("API returned non-array users data:", users);
        setUsers([]);
        setSupervisors([]);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      showError("Failed to load users");
      setUsers([]);
      setSupervisors([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await api.get("/admin/recommendations");

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

  const loadStats = async () => {
    try {
      const response = await api.get("/admin/stats");

      // Handle the API response structure: { success: true, data: { stats } }
      const stats =
        response.data.data?.stats || response.data.stats || response.data;
      setStats(stats || {});
    } catch (error) {
      console.error("Error loading stats:", error);
      showError("Failed to load statistics");
      setStats({});
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadUsers();
      await new Promise((resolve) => setTimeout(resolve, 150));

      await loadRecommendations();
      await new Promise((resolve) => setTimeout(resolve, 150));

      await loadStats();
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Manage users, supervisors, and monitor system activity
        </Typography>

        {/* Stats Cards */}
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
                  <SupervisorIcon
                    color="secondary"
                    sx={{ mr: 1.5, fontSize: 28 }}
                  />
                  <Box>
                    <Typography variant="h6">
                      {stats.usersByRole?.supervisor || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Supervisors
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
                      {stats.totalPlants || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Plants in DB
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
                  <RecommendIcon
                    color="warning"
                    sx={{ mr: 1.5, fontSize: 28 }}
                  />
                  <Box>
                    <Typography variant="h6">
                      {stats.totalRecommendations || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Recommendations
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ mt: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab icon={<DashboardIcon />} label="Overview" />
            <Tab icon={<SupervisorIcon />} label="Supervisors" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Typography variant="h6" gutterBottom>
              System Overview
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Activity
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <UsersIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="New user registrations"
                          secondary={`${stats.newUsersThisWeek || 0} this week`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <RecommendIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Active recommendations"
                          secondary={`${
                            Array.isArray(recommendations)
                              ? recommendations.filter(
                                  (r) => r.status === "active"
                                ).length
                              : 0
                          } pending`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <PlantsIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Plants added"
                          secondary={`${
                            stats.plantsAddedThisWeek || 0
                          } this week`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      System Health
                    </Typography>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      All systems operational
                    </Alert>
                    <Typography variant="body2" color="text.secondary">
                      Last updated: {new Date().toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" gutterBottom>
              Supervisor Overview
            </Typography>
            <Grid container spacing={2}>
              {Array.isArray(supervisors) &&
                supervisors.map((supervisor) => (
                  <Grid item xs={12} md={6} key={supervisor._id}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                          <Avatar sx={{ mr: 2 }}>
                            {supervisor.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6">
                              {supervisor.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {supervisor.email}
                            </Typography>
                          </Box>
                        </Box>
                        <Box display="flex" gap={1} mb={2}>
                          <Chip
                            label={`${
                              supervisor.recommendationsCount || 0
                            } recommendations`}
                            size="small"
                            color="primary"
                          />
                          <Chip
                            label={supervisor.isActive ? "Active" : "Inactive"}
                            size="small"
                            color={supervisor.isActive ? "success" : "default"}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Joined:{" "}
                          {new Date(supervisor.createdAt).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminDashboard;
