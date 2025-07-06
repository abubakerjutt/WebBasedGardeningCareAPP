import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Pagination,
} from "@mui/material";
import {
  People as UsersIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import axios from "axios";

const UserManagement = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const usersPerPage = 10;

  // API configuration
  const api = axios.create({
    baseURL: "/api",
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

  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/admin/users?page=${currentPage}&limit=${usersPerPage}`
      );

      if (response.data?.success) {
        const usersData = response.data.data?.users || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
        setTotalPages(response.data.data?.pagination?.pages || 1);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      showError("Failed to load users");
      // Set mock data as fallback
      setUsers([
        {
          _id: "1",
          name: "John Doe",
          email: "john@example.com",
          role: "homeowner",
          isActive: true,
          plantsCount: 5,
          gardensCount: 2,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          _id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          role: "gardener",
          isActive: true,
          plantsCount: 8,
          gardensCount: 3,
          lastLogin: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date(Date.now() - 604800000).toISOString(),
        },
        {
          _id: "3",
          name: "Bob Wilson",
          email: "bob@example.com",
          role: "supervisor",
          isActive: false,
          plantsCount: 12,
          gardensCount: 5,
          lastLogin: new Date(Date.now() - 172800000).toISOString(),
          createdAt: new Date(Date.now() - 1209600000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter((user) => user.isActive === isActive);
    }

    setFilteredUsers(filtered);
  };

  const handleEditUser = (userData) => {
    setSelectedUser(userData);
    setEditDialog(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData = {
        role: selectedUser.role,
        isActive: selectedUser.isActive,
      };

      await api.put(`/admin/users/${selectedUser._id}`, updateData);
      showSuccess("User updated successfully");
      setEditDialog(false);
      setSelectedUser(null);
      loadUsers(); // Reload users
    } catch (error) {
      console.error("Error updating user:", error);
      showError("Failed to update user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to deactivate this user?")) {
      return;
    }

    try {
      await api.put(`/admin/users/${userId}`, { isActive: false });
      showSuccess("User deactivated successfully");
      loadUsers(); // Reload users
    } catch (error) {
      console.error("Error deactivating user:", error);
      showError("Failed to deactivate user");
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "error";
      case "supervisor":
        return "warning";
      case "gardener":
        return "info";
      case "homeowner":
        return "success";
      default:
        return "default";
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <Container maxWidth="lg">
        <Box py={4}>
          <Alert severity="error">
            <Typography variant="h6">Access Denied</Typography>
            <Typography>
              You don't have permission to access user management.
            </Typography>
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              <UsersIcon sx={{ mr: 2, verticalAlign: "middle" }} />
              User Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage system users and their permissions
            </Typography>
          </Box>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Role"
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="supervisor">Supervisor</MenuItem>
                  <MenuItem value="gardener">Gardener</MenuItem>
                  <MenuItem value="homeowner">Homeowner</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                {filteredUsers.length} users found
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Users Table */}
        <Paper>
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell>Joined</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            py={4}
                          >
                            No users found matching your criteria
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((userData) => (
                        <TableRow key={userData._id || userData.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar sx={{ bgcolor: "primary.main" }}>
                                {(userData.name || "U").charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {userData.name || "Unknown User"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {userData.email || "No email"}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={userData.role || "user"}
                              color={getRoleColor(userData.role)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                userData.isActive !== false
                                  ? "Active"
                                  : "Inactive"
                              }
                              color={
                                userData.isActive !== false
                                  ? "success"
                                  : "default"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {userData.lastLogin
                              ? new Date(
                                  userData.lastLogin
                                ).toLocaleDateString()
                              : "Never"}
                          </TableCell>
                          <TableCell>
                            {userData.createdAt
                              ? new Date(
                                  userData.createdAt
                                ).toLocaleDateString()
                              : "Unknown"}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleEditUser(userData)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleDeleteUser(userData._id || userData.id)
                              }
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" p={3}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(event, page) => setCurrentPage(page)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </Paper>

        {/* Edit User Dialog */}
        <Dialog
          open={editDialog}
          onClose={() => setEditDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Box sx={{ pt: 2 }}>
                <TextField
                  fullWidth
                  label="Name"
                  value={selectedUser.name || ""}
                  margin="normal"
                  disabled
                />
                <TextField
                  fullWidth
                  label="Email"
                  value={selectedUser.email || ""}
                  margin="normal"
                  disabled
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={selectedUser.role || "homeowner"}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, role: e.target.value })
                    }
                    label="Role"
                  >
                    <MenuItem value="homeowner">Homeowner</MenuItem>
                    <MenuItem value="gardener">Gardener</MenuItem>
                    <MenuItem value="supervisor">Supervisor</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={
                      selectedUser.isActive !== false ? "active" : "inactive"
                    }
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        isActive: e.target.value === "active",
                      })
                    }
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveUser} variant="contained">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default UserManagement;
