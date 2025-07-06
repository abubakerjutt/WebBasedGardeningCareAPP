import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Tabs,
  Tab,
  Switch,
  Divider,
} from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import axios from "axios";

const Admin = () => {
  const { user } = useAuth();
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

  // Real data states
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    userRegistration: true,
    emailNotifications: true,
    communityModeration: true,
    autoBackup: true,
    weatherIntegration: true,
  });

  const handleSettingChange = (setting, value) => {
    setSystemSettings((prev) => ({ ...prev, [setting]: value }));
    showSuccess(`${setting} ${value ? "enabled" : "disabled"}`);
    // TODO: Implement actual API call to save settings
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </div>
  );

  if (!user || user.role !== "admin") {
    return (
      <Container maxWidth="lg">
        <Box py={4}>
          <Alert severity="error">
            <Typography variant="h6">Access Denied</Typography>
            <Typography>
              You don't have permission to access the admin dashboard.
            </Typography>
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              System management and user administration
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ width: "100%" }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab icon={<SettingsIcon />} label="Settings" />
          </Tabs>

          <Box p={3}>
            <TabPanel value={activeTab} index={0}>
              {/* Settings Tab */}
              <Typography variant="h6" gutterBottom>
                System Settings
              </Typography>

              <Card>
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Maintenance Mode"
                        secondary="Enable to temporarily disable user access"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.maintenanceMode}
                          onChange={(e) =>
                            handleSettingChange(
                              "maintenanceMode",
                              e.target.checked
                            )
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />

                    <ListItem>
                      <ListItemText
                        primary="User Registration"
                        secondary="Allow new users to register accounts"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.userRegistration}
                          onChange={(e) =>
                            handleSettingChange(
                              "userRegistration",
                              e.target.checked
                            )
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />

                    <ListItem>
                      <ListItemText
                        primary="Email Notifications"
                        secondary="Send system notifications via email"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.emailNotifications}
                          onChange={(e) =>
                            handleSettingChange(
                              "emailNotifications",
                              e.target.checked
                            )
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />

                    <ListItem>
                      <ListItemText
                        primary="Community Moderation"
                        secondary="Enable automatic content moderation"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.communityModeration}
                          onChange={(e) =>
                            handleSettingChange(
                              "communityModeration",
                              e.target.checked
                            )
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />

                    <ListItem>
                      <ListItemText
                        primary="Auto Backup"
                        secondary="Automatically backup system data"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.autoBackup}
                          onChange={(e) =>
                            handleSettingChange("autoBackup", e.target.checked)
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />

                    <ListItem>
                      <ListItemText
                        primary="Weather Integration"
                        secondary="Enable weather data and recommendations"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.weatherIntegration}
                          onChange={(e) =>
                            handleSettingChange(
                              "weatherIntegration",
                              e.target.checked
                            )
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </TabPanel>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Admin;
