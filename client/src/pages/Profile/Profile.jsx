import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  Avatar,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
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
} from "@mui/material";
import {
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  LocalFlorist as EcoIcon,
  WbSunny as SunIcon,
  Landscape as TerrainIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Cloud as CloudIcon,
  Grain as RainIcon,
  AcUnit as SnowIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import usePageTitle from "../../hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Profile = () => {
  usePageTitle("My Profile");

  const {
    user,
    updateProfile,
    changePassword,
    loading: authLoading,
  } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    profile: {
      location: {
        address: "",
        city: "",
        state: "",
        zipCode: "",
      },
      climate: "",
      soilType: "",
      gardeningExperience: "",
      interests: [],
      bio: "",
    },
    preferences: {
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      units: "metric",
      language: "en",
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const loadWeatherData = useCallback(async () => {
    if (!user?.profile?.location?.city) return;

    try {
      setWeatherLoading(true);
      const response = await axios.get(
        `/api/weather/forecast?city=${encodeURIComponent(
          user.profile.location.city
        )}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data?.success) {
        setWeatherData(response.data.data);
      }
    } catch (error) {
      console.error("Error loading weather data:", error);
      // Set mock data as fallback
      setWeatherData({
        forecast: [
          {
            date: new Date().toDateString(),
            temperature: { max: 25, min: 18 },
            condition: "clear",
            description: "Clear sky",
          },
          {
            date: new Date(Date.now() + 86400000).toDateString(),
            temperature: { max: 27, min: 20 },
            condition: "clouds",
            description: "Partly cloudy",
          },
          {
            date: new Date(Date.now() + 2 * 86400000).toDateString(),
            temperature: { max: 21, min: 15 },
            condition: "rain",
            description: "Light rain",
          },
          {
            date: new Date(Date.now() + 3 * 86400000).toDateString(),
            temperature: { max: 23, min: 17 },
            condition: "clouds",
            description: "Cloudy",
          },
          {
            date: new Date(Date.now() + 4 * 86400000).toDateString(),
            temperature: { max: 26, min: 19 },
            condition: "clear",
            description: "Sunny",
          },
        ],
      });
    } finally {
      setWeatherLoading(false);
    }
  }, [user?.profile?.location?.city]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        profile: {
          location: {
            address: user.profile?.location?.address || "",
            city: user.profile?.location?.city || "",
            state: user.profile?.location?.state || "",
            zipCode: user.profile?.location?.zipCode || "",
          },
          climate: user.profile?.climate || "",
          soilType: user.profile?.soilType || "",
          gardeningExperience: user.profile?.gardeningExperience || "",
          interests: user.profile?.interests || [],
          bio: user.profile?.bio || "",
        },
        preferences: {
          notifications: {
            email: user.preferences?.notifications?.email ?? true,
            push: user.preferences?.notifications?.push ?? true,
            sms: user.preferences?.notifications?.sms ?? false,
          },
          units: user.preferences?.units || "metric",
          language: user.preferences?.language || "en",
        },
      });
    }
  }, [user]); // Removed loadWeatherData dependency to prevent form resets

  // Separate useEffect for loading weather data
  useEffect(() => {
    if (user?.profile?.location?.city) {
      loadWeatherData();
    }
  }, [user?.profile?.location?.city, loadWeatherData]);

  const getWeatherIcon = (condition, size = 24) => {
    const iconProps = { fontSize: size === 24 ? "medium" : "large" };
    switch (condition?.toLowerCase()) {
      case "clear":
      case "sunny":
        return <SunIcon {...iconProps} />;
      case "clouds":
      case "cloudy":
        return <CloudIcon {...iconProps} />;
      case "rain":
      case "rainy":
        return <RainIcon {...iconProps} />;
      case "snow":
      case "snowy":
        return <SnowIcon {...iconProps} />;
      default:
        return <SunIcon {...iconProps} />;
    }
  };

  const getDayName = (date, index) => {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";
    return new Date(date).toLocaleDateString("en-US", { weekday: "short" });
  };

  const handleProfileUpdate = async () => {
    // Basic validation
    if (profileData.name && profileData.name.length < 2) {
      showError("Name must be at least 2 characters long");
      return;
    }

    setLoading(true);
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        showSuccess("Profile updated successfully!");
        setActiveTab(0); // Go back to overview tab after successful update
      } else {
        showError(result.error);
      }
    } catch {
      showError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError("New passwords don't match");
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
        setPasswordDialog(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        showError(result.error);
      }
    } catch {
      showError("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = useCallback((field, value) => {
    // Store current scroll position
    const currentScrollY = window.scrollY;

    setProfileData((prev) => {
      const newData = { ...prev };

      // Handle specific fields to avoid deep object manipulation
      switch (field) {
        case "name":
          newData.name = value;
          break;
        case "email":
          newData.email = value;
          break;
        case "phone":
          newData.phone = value;
          break;
        case "profile.bio":
          newData.profile = { ...prev.profile, bio: value };
          break;
        case "profile.location.address":
          newData.profile = {
            ...prev.profile,
            location: { ...prev.profile.location, address: value },
          };
          break;
        case "profile.location.city":
          newData.profile = {
            ...prev.profile,
            location: { ...prev.profile.location, city: value },
          };
          break;
        case "profile.location.state":
          newData.profile = {
            ...prev.profile,
            location: { ...prev.profile.location, state: value },
          };
          break;
        case "profile.location.zipCode":
          newData.profile = {
            ...prev.profile,
            location: { ...prev.profile.location, zipCode: value },
          };
          break;
        case "profile.gardeningExperience":
          newData.profile = { ...prev.profile, gardeningExperience: value };
          break;
        case "profile.climate":
          newData.profile = { ...prev.profile, climate: value };
          break;
        case "profile.soilType":
          newData.profile = { ...prev.profile, soilType: value };
          break;
        case "preferences.units":
          newData.preferences = { ...prev.preferences, units: value };
          break;
        case "preferences.language":
          newData.preferences = { ...prev.preferences, language: value };
          break;
        default:
          return prev; // Don't update for unknown fields
      }

      return newData;
    });

    // Prevent scroll jumping by restoring position
    requestAnimationFrame(() => {
      if (window.scrollY !== currentScrollY) {
        window.scrollTo(0, currentScrollY);
      }
    });
  }, []);

  const TabPanel = ({ children, value, index }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      style={{ display: value === index ? "block" : "none" }}
    >
      <Box sx={{ py: 3 }}>{children}</Box>
    </div>
  );

  const ProfileOverview = () => (
    <Grid container spacing={3}>
      {/* Profile Header */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={3}>
              <Avatar src={user?.avatar} sx={{ width: 100, height: 100 }}>
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h4" gutterBottom>
                  {user?.name || "No Name"}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  {user?.email || "No Email"}
                </Typography>
                <Chip
                  label={
                    user?.role
                      ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                      : "User"
                  }
                  color="primary"
                  size="small"
                />
              </Box>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setActiveTab(1)}
                sx={{ mr: 1 }}
              >
                Edit Profile
              </Button>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => navigate("/settings")}
              >
                Settings
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Contact Information */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={user?.email || "Not provided"}
                />
              </ListItem>
              {user?.phone && (
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText primary="Phone" secondary={user?.phone} />
                </ListItem>
              )}
              {user?.profile?.location?.address && (
                <ListItem>
                  <ListItemIcon>
                    <LocationIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Location"
                    secondary={`${user.profile.location.address}, ${user.profile.location.city}`}
                  />
                </ListItem>
              )}
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Member Since"
                  secondary={
                    user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "Unknown"
                  }
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Gardening Profile */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Gardening Profile
            </Typography>
            <List dense>
              {user?.profile?.gardeningExperience && (
                <ListItem>
                  <ListItemIcon>
                    <EcoIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Experience Level"
                    secondary={user.profile.gardeningExperience}
                  />
                </ListItem>
              )}
              {user?.profile?.climate && (
                <ListItem>
                  <ListItemIcon>
                    <SunIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Climate"
                    secondary={user.profile.climate}
                  />
                </ListItem>
              )}
              {user?.profile?.soilType && (
                <ListItem>
                  <ListItemIcon>
                    <TerrainIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Soil Type"
                    secondary={user.profile.soilType}
                  />
                </ListItem>
              )}
            </List>
            {user?.profile?.interests?.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Interests:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {user.profile.interests.map((interest, index) => (
                    <Chip key={index} label={interest} size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* User Statistics */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Garden Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {user?.stats?.gardensCount ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gardens
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {user?.stats?.plantsCount ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Plants
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {user?.stats?.followersCount ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Followers
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {user?.stats?.careTasksCompleted ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Care Tasks
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Bio */}
      {user?.profile?.bio && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                About Me
              </Typography>
              <Typography variant="body1">{user.profile.bio}</Typography>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Weather Widget */}
      {user?.profile?.location?.city && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">5-Day Weather Forecast</Typography>
                <IconButton onClick={loadWeatherData} disabled={weatherLoading}>
                  <RefreshIcon />
                </IconButton>
              </Box>

              {weatherLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : weatherData?.forecast ? (
                <Grid container spacing={2}>
                  {weatherData.forecast.slice(0, 5).map((day, index) => (
                    <Grid item xs={12} sm={6} md={2.4} key={index}>
                      <Card elevation={1} sx={{ textAlign: "center", p: 1 }}>
                        <CardContent sx={{ p: "8px !important" }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            {day.day || getDayName(day.date, index)}
                          </Typography>
                          <Box my={1}>{getWeatherIcon(day.condition, 32)}</Box>
                          <Typography variant="h6" fontWeight="bold">
                            {day.temperature?.max
                              ? Math.round(day.temperature.max)
                              : day.tempMax
                              ? Math.round(day.tempMax)
                              : "N/A"}
                            °
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {day.temperature?.min
                              ? Math.round(day.temperature.min)
                              : day.tempMin
                              ? Math.round(day.tempMin)
                              : "N/A"}
                            °
                          </Typography>
                          <Typography
                            variant="caption"
                            display="block"
                            mt={0.5}
                          >
                            {day.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  No weather data available. Update your location in settings to
                  see weather forecast.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  const ProfileSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Box component="form" noValidate autoComplete="off">
              <TextField
                fullWidth
                id="profile-name"
                label="Full Name"
                value={profileData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                margin="normal"
                helperText="Leave empty to keep current name"
                autoComplete="name"
                autoFocus={false}
                InputProps={{
                  style: { scrollMarginTop: "20px" },
                }}
              />
              <TextField
                fullWidth
                id="profile-email"
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                margin="normal"
                disabled
                helperText="Email cannot be changed"
                autoComplete="email"
              />
              <TextField
                fullWidth
                id="profile-phone"
                label="Phone"
                value={profileData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                margin="normal"
                helperText="Leave empty if you don't want to provide phone number"
                autoComplete="tel"
              />
              <TextField
                fullWidth
                id="profile-bio"
                label="Bio"
                multiline
                rows={4}
                value={profileData.profile.bio}
                onChange={(e) =>
                  handleInputChange("profile.bio", e.target.value)
                }
                margin="normal"
                helperText="Tell us about yourself (optional)"
                autoComplete="off"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Location
            </Typography>
            <TextField
              fullWidth
              id="profile-address"
              label="Address"
              value={profileData.profile.location.address}
              onChange={(e) =>
                handleInputChange("profile.location.address", e.target.value)
              }
              margin="normal"
              helperText="Your street address (optional)"
              autoComplete="street-address"
            />
            <TextField
              fullWidth
              id="profile-city"
              label="City"
              value={profileData.profile.location.city}
              onChange={(e) =>
                handleInputChange("profile.location.city", e.target.value)
              }
              margin="normal"
              helperText="Your city (optional)"
              autoComplete="address-level2"
            />
            <TextField
              fullWidth
              id="profile-state"
              label="State"
              value={profileData.profile.location.state}
              onChange={(e) =>
                handleInputChange("profile.location.state", e.target.value)
              }
              margin="normal"
              helperText="Your state or province (optional)"
              autoComplete="address-level1"
            />
            <TextField
              fullWidth
              id="profile-zipcode"
              label="ZIP Code"
              value={profileData.profile.location.zipCode}
              onChange={(e) =>
                handleInputChange("profile.location.zipCode", e.target.value)
              }
              margin="normal"
              helperText="Your postal code (optional)"
              autoComplete="postal-code"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Gardening Profile
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel id="experience-label">Experience Level</InputLabel>
              <Select
                labelId="experience-label"
                id="profile-experience"
                value={profileData.profile.gardeningExperience}
                onChange={(e) =>
                  handleInputChange(
                    "profile.gardeningExperience",
                    e.target.value
                  )
                }
                label="Experience Level"
              >
                <MenuItem value="">None selected</MenuItem>
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
                <MenuItem value="expert">Expert</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="climate-label">Climate</InputLabel>
              <Select
                labelId="climate-label"
                id="profile-climate"
                value={profileData.profile.climate}
                onChange={(e) =>
                  handleInputChange("profile.climate", e.target.value)
                }
                label="Climate"
              >
                <MenuItem value="">None selected</MenuItem>
                <MenuItem value="tropical">Tropical</MenuItem>
                <MenuItem value="subtropical">Subtropical</MenuItem>
                <MenuItem value="temperate">Temperate</MenuItem>
                <MenuItem value="continental">Continental</MenuItem>
                <MenuItem value="polar">Polar</MenuItem>
                <MenuItem value="arid">Arid</MenuItem>
                <MenuItem value="semiarid">Semi-arid</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="soil-label">Soil Type</InputLabel>
              <Select
                labelId="soil-label"
                id="profile-soil"
                value={profileData.profile.soilType}
                onChange={(e) =>
                  handleInputChange("profile.soilType", e.target.value)
                }
                label="Soil Type"
              >
                <MenuItem value="">None selected</MenuItem>
                <MenuItem value="clay">Clay</MenuItem>
                <MenuItem value="sandy">Sandy</MenuItem>
                <MenuItem value="loamy">Loamy</MenuItem>
                <MenuItem value="silty">Silty</MenuItem>
                <MenuItem value="peaty">Peaty</MenuItem>
                <MenuItem value="chalky">Chalky</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Preferences
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel id="units-label">Units</InputLabel>
              <Select
                labelId="units-label"
                id="profile-units"
                value={profileData.preferences.units}
                onChange={(e) =>
                  handleInputChange("preferences.units", e.target.value)
                }
                label="Units"
              >
                <MenuItem value="metric">Metric</MenuItem>
                <MenuItem value="imperial">Imperial</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="language-label">Language</InputLabel>
              <Select
                labelId="language-label"
                id="profile-language"
                value={profileData.preferences.language}
                onChange={(e) =>
                  handleInputChange("preferences.language", e.target.value)
                }
                label="Language"
              >
                <MenuItem value="">None selected</MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={() => {
              setActiveTab(0); // Go back to overview tab
              // Reset form data
              if (user) {
                setProfileData({
                  name: user.name || "",
                  email: user.email || "",
                  phone: user.phone || "",
                  profile: user.profile || {},
                  preferences: user.preferences || {},
                });
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleProfileUpdate}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Save Changes
          </Button>
        </Box>
      </Grid>
    </Grid>
  );

  const SecuritySettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Password & Security
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Keep your account secure with a strong password
            </Typography>
            <Button
              variant="outlined"
              startIcon={<SecurityIcon />}
              onClick={() => setPasswordDialog(true)}
            >
              Change Password
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (authLoading || !user) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          {authLoading ? "Loading user data..." : "No user data found"}
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" component="h1" fontWeight="bold" mb={3}>
          Profile & Settings
        </Typography>

        <Paper sx={{ width: "100%", position: "relative" }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
            variant="fullWidth"
          >
            <Tab label="Overview" />
            <Tab label="Edit Profile" />
          </Tabs>

          <Box
            sx={{
              position: "relative",
              "& .MuiTextField-root": {
                "& input, & textarea": {
                  scrollMarginTop: "100px", // Prevent scroll jumping
                },
              },
            }}
          >
            <TabPanel value={activeTab} index={0} key="overview">
              <ProfileOverview />
            </TabPanel>

            <TabPanel value={activeTab} index={1} key="edit-profile">
              <ProfileSettings />
            </TabPanel>
          </Box>
        </Paper>

        {/* Password Change Dialog */}
        <Dialog
          open={passwordDialog}
          onClose={() => setPasswordDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
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
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
            <Button
              onClick={handlePasswordChange}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : "Change Password"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Profile;
