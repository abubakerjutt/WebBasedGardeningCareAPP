import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Context Providers
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { CommunityProvider } from "./contexts/CommunityContext";
import { AppThemeProvider } from "./contexts/ThemeContext";

// Components
import Layout from "./components/Layout/Layout";
import ProtectedRoute, {
  AdminRoute,
  SupervisorRoute,
} from "./components/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import Plants from "./pages/Plants/Plants";
import BrowsePlants from "./pages/Plants/BrowsePlants";
import MyPlants from "./pages/Plants/MyPlants";
import AddPlant from "./pages/Plants/AddPlant";

import Community from "./pages/Community/Community";
import Profile from "./pages/Profile/Profile";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin/Admin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import UserManagement from "./pages/Admin/UserManagement";
import SupervisorDashboard from "./pages/Supervisor/SupervisorDashboard";
import GardeningAdviceAndReminders from "./pages/Reminders/GardeningAdviceAndReminders";
import NotFound from "./pages/NotFound";
import PlantIdentification from "./pages/Plants/PlantIdentification";

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AuthProvider>
        <AppThemeProvider>
          <CssBaseline />
          <NotificationProvider>
            <CommunityProvider>
              <Router>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Dashboard />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/plants"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Plants />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/plants/browse"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <BrowsePlants />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/my-plants"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <MyPlants />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/plants/add"
                    element={
                      <AdminRoute>
                        <Layout>
                          <AddPlant />
                        </Layout>
                      </AdminRoute>
                    }
                  />

                  <Route
                    path="/community"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Community />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Profile />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Settings />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <Layout>
                          <AdminDashboard />
                        </Layout>
                      </AdminRoute>
                    }
                  />

                  {/* Admin-only routes */}
                  <Route
                    path="/admin/users"
                    element={
                      <AdminRoute>
                        <Layout>
                          <UserManagement />
                        </Layout>
                      </AdminRoute>
                    }
                  />

                  <Route
                    path="/admin/settings"
                    element={
                      <AdminRoute>
                        <Layout>
                          <Admin />
                        </Layout>
                      </AdminRoute>
                    }
                  />

                  {/* Supervisor routes */}
                  <Route
                    path="/supervisor"
                    element={
                      <SupervisorRoute>
                        <Layout>
                          <SupervisorDashboard />
                        </Layout>
                      </SupervisorRoute>
                    }
                  />

                  {/* Gardening Advice & Reminders */}
                  <Route
                    path="/gardening-advice"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <GardeningAdviceAndReminders />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Auto Reminders - Legacy Route (redirects to new page) */}
                  <Route
                    path="/reminders/auto"
                    element={<Navigate to="/gardening-advice" replace />}
                  />

                  <Route
                    path="/plants/identify"
                    element={
                      <ProtectedRoute>
                        <PlantIdentification />
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 Page */}
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </Router>
            </CommunityProvider>
          </NotificationProvider>
        </AppThemeProvider>
      </AuthProvider>
    </LocalizationProvider>
  );
}

export default App;
