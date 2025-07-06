import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Switch,
  FormGroup,
  FormControlLabel,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Storage as StorageIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  DeleteForever as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Message as SmsIcon,
  Phone as PhoneIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import { useAppTheme } from "../../contexts/ThemeContext";
import usePageTitle from "../../hooks/usePageTitle";

const Settings = () => {
  usePageTitle("Settings");

  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { setThemeMode } = useAppTheme();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: "",
    title: "",
    message: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      sound: true,
      desktop: true,
      reminders: true,
      community: true,
      weather: true,
      care: true,
    },
    privacy: {
      profileVisible: true,
      gardenVisible: true,
      contactVisible: false,
      locationVisible: true,
      activityVisible: true,
    },
    preferences: {
      theme: "system",
      language: "en",
      units: "metric",
      timezone: "auto",
      dateFormat: "MM/DD/YYYY",
      startOfWeek: "monday",
    },
    advanced: {
      autoSync: true,
      dataBackup: true,
      analytics: true,
      betaFeatures: false,
      lowPowerMode: false,
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [exportData, setExportData] = useState({
    includeProfile: true,
    includeGardens: true,
    includePlants: true,
    includeActivity: false,
  });

  useEffect(() => {
    // Only sync settings from user data on initial load
    if (user && !initialLoadDone) {
      setSettings((prevSettings) => ({
        ...prevSettings,
        notifications: {
          email:
            user.preferences?.emailNotifications ??
            prevSettings.notifications.email,
          push:
            user.preferences?.pushNotifications ??
            prevSettings.notifications.push,
          sms: false, // Not stored in backend
          sound: prevSettings.notifications.sound, // Local only
          desktop: prevSettings.notifications.desktop, // Local only
          reminders: prevSettings.notifications.reminders, // Local only
          weather:
            user.preferences?.weatherAlerts ??
            prevSettings.notifications.weather,
          community:
            user.preferences?.communityUpdates ??
            prevSettings.notifications.community,
          plants:
            user.preferences?.plantRecommendations ??
            prevSettings.notifications.plants,
          care:
            user.preferences?.careReminders ?? prevSettings.notifications.care,
        },
        privacy: {
          ...prevSettings.privacy,
          ...user.privacy,
        },
        preferences: {
          ...prevSettings.preferences,
          theme: user.preferences?.theme ?? prevSettings.preferences.theme,
          language:
            user.preferences?.language ?? prevSettings.preferences.language,
          units: user.preferences?.units ?? prevSettings.preferences.units,
          timezone:
            user.preferences?.timezone ?? prevSettings.preferences.timezone,
          dateFormat:
            user.preferences?.dateFormat ?? prevSettings.preferences.dateFormat,
          startOfWeek:
            user.preferences?.startOfWeek ??
            prevSettings.preferences.startOfWeek,
        },
        advanced: {
          ...prevSettings.advanced,
          ...user.advanced,
        },
      }));

      // Set theme mode in theme context
      if (user.preferences?.theme) {
        setThemeMode(user.preferences.theme);
      }

      setInitialLoadDone(true);
    }
  }, [user, setThemeMode, initialLoadDone]);

  const handleSettingsChange = (category, field, value) => {
    // Handle theme change immediately
    if (category === "preferences" && field === "theme") {
      setThemeMode(value);
    }

    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);

    try {
      const payload = {
        preferences: {
          ...user.preferences,
          ...settings.preferences,
          // Map notifications to individual preference fields
          emailNotifications: settings.notifications.email,
          pushNotifications: settings.notifications.push,
          careReminders: settings.notifications.care,
          weatherAlerts: settings.notifications.weather,
          communityUpdates: settings.notifications.community,
          plantRecommendations: settings.notifications.plants,
        },
        privacy: settings.privacy,
        advanced: settings.advanced,
      };

      const result = await updateProfile(payload);

      if (result.success) {
        showSuccess("Settings saved successfully!");
      } else {
        showError(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Settings save error:", error);
      showError("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (result.success) {
        showSuccess("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setConfirmDialog({ open: false, type: "", title: "", message: "" });
      } else {
        showError(result.error || "Failed to change password");
      }
    } catch {
      showError("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      // Simulate API call to export data
      const exportPayload = {
        userId: user.id,
        options: exportData,
        timestamp: new Date().toISOString(),
      };

      // Create downloadable JSON file
      const dataStr = JSON.stringify(exportPayload, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `gardening_app_data_${
        new Date().toISOString().split("T")[0]
      }.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      showSuccess("Data exported successfully!");
      setConfirmDialog({ open: false, type: "", title: "", message: "" });
    } catch {
      showError("Failed to export data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const result = await deleteAccount();
      if (result.success) {
        showSuccess("Account deleted successfully!");
        // User will be redirected by the auth context
      } else {
        showError(result.error || "Failed to delete account");
      }
    } catch {
      showError("Failed to delete account");
    } finally {
      setLoading(false);
      setConfirmDialog({ open: false, type: "", title: "", message: "" });
    }
  };

  const confirmAction = (type, title, message, action) => {
    setConfirmDialog({
      open: true,
      type,
      title,
      message,
      action: action || (() => {}),
    });
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  const NotificationSettings = () => (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Choose how you want to be notified about important events
            </Typography>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Email Notifications</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.email}
                        onChange={(e) =>
                          handleSettingsChange(
                            "notifications",
                            "email",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Email notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.reminders}
                        onChange={(e) =>
                          handleSettingsChange(
                            "notifications",
                            "reminders",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Care reminders"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.weather}
                        onChange={(e) =>
                          handleSettingsChange(
                            "notifications",
                            "weather",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Weather alerts"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.community}
                        onChange={(e) =>
                          handleSettingsChange(
                            "notifications",
                            "community",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Community updates"
                  />
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Push Notifications</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.push}
                        onChange={(e) =>
                          handleSettingsChange(
                            "notifications",
                            "push",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Push notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.desktop}
                        onChange={(e) =>
                          handleSettingsChange(
                            "notifications",
                            "desktop",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Desktop notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.sound}
                        onChange={(e) =>
                          handleSettingsChange(
                            "notifications",
                            "sound",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Notification sounds"
                  />
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">SMS Notifications</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.sms}
                        onChange={(e) =>
                          handleSettingsChange(
                            "notifications",
                            "sms",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="SMS notifications"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Standard messaging rates may apply
                  </Typography>
                </FormGroup>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const PrivacySettings = () => (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Privacy & Visibility
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Control what information is visible to other users
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <VisibilityIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Profile Visibility"
                  secondary="Make your profile visible to other users"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.privacy.profileVisible}
                    onChange={(e) =>
                      handleSettingsChange(
                        "privacy",
                        "profileVisible",
                        e.target.checked
                      )
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Location Visibility"
                  secondary="Show your location to other users"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.privacy.locationVisible}
                    onChange={(e) =>
                      handleSettingsChange(
                        "privacy",
                        "locationVisible",
                        e.target.checked
                      )
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Contact Information"
                  secondary="Allow other users to see your contact details"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.privacy.contactVisible}
                    onChange={(e) =>
                      handleSettingsChange(
                        "privacy",
                        "contactVisible",
                        e.target.checked
                      )
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <StorageIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Garden Visibility"
                  secondary="Make your gardens visible to the community"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.privacy.gardenVisible}
                    onChange={(e) =>
                      handleSettingsChange(
                        "privacy",
                        "gardenVisible",
                        e.target.checked
                      )
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <ScheduleIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Activity Visibility"
                  secondary="Show your recent activity to other users"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.privacy.activityVisible}
                    onChange={(e) =>
                      handleSettingsChange(
                        "privacy",
                        "activityVisible",
                        e.target.checked
                      )
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const AppearanceSettings = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Appearance
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Theme</InputLabel>
              <Select
                value={settings.preferences.theme}
                onChange={(e) =>
                  handleSettingsChange("preferences", "theme", e.target.value)
                }
              >
                <MenuItem value="light">
                  <Box display="flex" alignItems="center" gap={1}>
                    <LightModeIcon />
                    Light
                  </Box>
                </MenuItem>
                <MenuItem value="dark">
                  <Box display="flex" alignItems="center" gap={1}>
                    <DarkModeIcon />
                    Dark
                  </Box>
                </MenuItem>
                <MenuItem value="system">
                  <Box display="flex" alignItems="center" gap={1}>
                    <SettingsIcon />
                    System
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Language</InputLabel>
              <Select
                value={settings.preferences.language}
                onChange={(e) =>
                  handleSettingsChange(
                    "preferences",
                    "language",
                    e.target.value
                  )
                }
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
                <MenuItem value="it">Italian</MenuItem>
                <MenuItem value="pt">Portuguese</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Units</InputLabel>
              <Select
                value={settings.preferences.units}
                onChange={(e) =>
                  handleSettingsChange("preferences", "units", e.target.value)
                }
              >
                <MenuItem value="metric">Metric (°C, cm, kg)</MenuItem>
                <MenuItem value="imperial">Imperial (°F, in, lbs)</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Date & Time
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Date Format</InputLabel>
              <Select
                value={settings.preferences.dateFormat}
                onChange={(e) =>
                  handleSettingsChange(
                    "preferences",
                    "dateFormat",
                    e.target.value
                  )
                }
              >
                <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Start of Week</InputLabel>
              <Select
                value={settings.preferences.startOfWeek}
                onChange={(e) =>
                  handleSettingsChange(
                    "preferences",
                    "startOfWeek",
                    e.target.value
                  )
                }
              >
                <MenuItem value="sunday">Sunday</MenuItem>
                <MenuItem value="monday">Monday</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Timezone</InputLabel>
              <Select
                value={settings.preferences.timezone}
                onChange={(e) =>
                  handleSettingsChange(
                    "preferences",
                    "timezone",
                    e.target.value
                  )
                }
              >
                <MenuItem value="auto">Auto-detect</MenuItem>
                <MenuItem value="UTC">UTC</MenuItem>
                <MenuItem value="America/New_York">Eastern Time</MenuItem>
                <MenuItem value="America/Chicago">Central Time</MenuItem>
                <MenuItem value="America/Denver">Mountain Time</MenuItem>
                <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const SecuritySettings = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Password & Security
            </Typography>

            <Button
              variant="outlined"
              startIcon={<SecurityIcon />}
              onClick={() =>
                confirmAction(
                  "password",
                  "Change Password",
                  "Enter your current password and choose a new one",
                  () => {}
                )
              }
              fullWidth
              sx={{ mb: 2 }}
            >
              Change Password
            </Button>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Last password change:{" "}
                {user?.passwordChangedAt
                  ? new Date(user.passwordChangedAt).toLocaleDateString()
                  : "Never"}
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Advanced Security
            </Typography>

            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.advanced.autoSync}
                    onChange={(e) =>
                      handleSettingsChange(
                        "advanced",
                        "autoSync",
                        e.target.checked
                      )
                    }
                  />
                }
                label="Auto-sync data"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.advanced.dataBackup}
                    onChange={(e) =>
                      handleSettingsChange(
                        "advanced",
                        "dataBackup",
                        e.target.checked
                      )
                    }
                  />
                }
                label="Automatic data backup"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.advanced.analytics}
                    onChange={(e) =>
                      handleSettingsChange(
                        "advanced",
                        "analytics",
                        e.target.checked
                      )
                    }
                  />
                }
                label="Usage analytics"
              />
            </FormGroup>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const DataSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Export Data
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Download your data in JSON format
            </Typography>

            <FormGroup sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={exportData.includeProfile}
                    onChange={(e) =>
                      setExportData((prev) => ({
                        ...prev,
                        includeProfile: e.target.checked,
                      }))
                    }
                  />
                }
                label="Profile information"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={exportData.includeGardens}
                    onChange={(e) =>
                      setExportData((prev) => ({
                        ...prev,
                        includeGardens: e.target.checked,
                      }))
                    }
                  />
                }
                label="Gardens data"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={exportData.includePlants}
                    onChange={(e) =>
                      setExportData((prev) => ({
                        ...prev,
                        includePlants: e.target.checked,
                      }))
                    }
                  />
                }
                label="Plants data"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={exportData.includeActivity}
                    onChange={(e) =>
                      setExportData((prev) => ({
                        ...prev,
                        includeActivity: e.target.checked,
                      }))
                    }
                  />
                }
                label="Activity history"
              />
            </FormGroup>

            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() =>
                confirmAction(
                  "export",
                  "Export Data",
                  "This will download your selected data as a JSON file",
                  handleExportData
                )
              }
              fullWidth
            >
              Export Data
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Danger Zone
            </Typography>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                These actions cannot be undone. Please be careful.
              </Typography>
            </Alert>

            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() =>
                confirmAction(
                  "delete",
                  "Delete Account",
                  "This will permanently delete your account and all associated data. This action cannot be undone.",
                  handleDeleteAccount
                )
              }
              fullWidth
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (!user) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" component="h1" fontWeight="bold" mb={3}>
          Settings
        </Typography>

        <Paper sx={{ width: "100%" }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<NotificationsIcon />} label="Notifications" />
            <Tab icon={<VisibilityIcon />} label="Privacy" />
            <Tab icon={<PaletteIcon />} label="Appearance" />
            <Tab icon={<SecurityIcon />} label="Security" />
            <Tab icon={<StorageIcon />} label="Data" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <NotificationSettings />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <PrivacySettings />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <AppearanceSettings />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <SecuritySettings />
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            <DataSettings />
          </TabPanel>

          {/* Save Settings Button */}
          <Box p={3} display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveSettings}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Save Settings
            </Button>
          </Box>
        </Paper>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialog.open}
          onClose={() =>
            setConfirmDialog({ open: false, type: "", title: "", message: "" })
          }
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{confirmDialog.title}</DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              {confirmDialog.message}
            </Typography>

            {confirmDialog.type === "password" && (
              <Box>
                <TextField
                  fullWidth
                  label="Current Password"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  margin="normal"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                setConfirmDialog({
                  open: false,
                  type: "",
                  title: "",
                  message: "",
                })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={
                confirmDialog.type === "password"
                  ? handlePasswordChange
                  : confirmDialog.type === "export"
                  ? handleExportData
                  : confirmDialog.type === "delete"
                  ? handleDeleteAccount
                  : () => {}
              }
              variant="contained"
              color={confirmDialog.type === "delete" ? "error" : "primary"}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={20} />
              ) : confirmDialog.type === "password" ? (
                "Change Password"
              ) : confirmDialog.type === "export" ? (
                "Export Data"
              ) : confirmDialog.type === "delete" ? (
                "Delete Account"
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Settings;
