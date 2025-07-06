import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material";
import {
  LocalFlorist as PlantIcon,
  WbSunny as SunnyIcon,
  Cloud as CloudyIcon,
  Air as HumidityIcon,
  Speed as WindIcon,
  Refresh as RefreshIcon,
  Notifications as AlertIcon,
  WbSunny as WeatherIcon,
  Nature as NatureIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import usePageTitle from "../../hooks/usePageTitle";
import axios from "axios";

// Simple mock weather data
const mockWeatherData = {
  location: { name: "Demo City" },
  current: {
    temperature: 22,
    humidity: 65,
    windSpeed: 12,
    condition: "clear",
    description: "Clear sunny day",
  },
};

const Dashboard = () => {
  usePageTitle("Dashboard");

  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    plants: 0,
    totalPlants: 0,
    activeReminders: 0,
  });
  const [weatherData, setWeatherData] = useState(mockWeatherData);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);

  // Generate dynamic garden alerts based on weather and season
  const generateDynamicAlerts = () => {
    const currentHour = new Date().getHours();
    const alerts = [];

    // Stats-based alerts
    if (stats.plants === 0) {
      alerts.push({
        id: 1,
        message: "Start your gardening journey - add your first plant today!",
        type: "info",
      });
      setAlerts(alerts);
      return;
    }

    // Weather-based alerts
    if (weatherData.current.temperature > 25) {
      alerts.push({
        id: 1,
        message: "High temperature today - ensure plants are well watered",
        type: "warning",
      });
    } else if (weatherData.current.temperature < 10) {
      alerts.push({
        id: 1,
        message: "Cold weather alert - protect sensitive plants from frost",
        type: "warning",
      });
    }

    // Time-based alerts
    if (currentHour >= 6 && currentHour <= 10) {
      alerts.push({
        id: 2,
        message: "Perfect morning time for watering and plant inspection",
        type: "success",
      });
    } else if (currentHour >= 17 && currentHour <= 19) {
      alerts.push({
        id: 2,
        message: "Evening garden care time - check soil moisture levels",
        type: "info",
      });
    }

    // Humidity-based alerts
    if (weatherData.current.humidity < 40) {
      alerts.push({
        id: 3,
        message: "Low humidity detected - consider misting plants",
        type: "warning",
      });
    } else if (weatherData.current.humidity > 80) {
      alerts.push({
        id: 3,
        message: "High humidity - ensure good air circulation around plants",
        type: "info",
      });
    }

    // Seasonal/General alerts
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) {
      // Spring
      alerts.push({
        id: 4,
        message: "Spring season - ideal time for planting new seeds",
        type: "success",
      });
    } else if (month >= 5 && month <= 7) {
      // Summer
      alerts.push({
        id: 4,
        message: "Summer care - increase watering frequency during hot days",
        type: "info",
      });
    } else if (month >= 8 && month <= 10) {
      // Fall
      alerts.push({
        id: 4,
        message: "Autumn preparation - consider harvesting mature plants",
        type: "info",
      });
    } else {
      // Winter
      alerts.push({
        id: 4,
        message: "Winter care - reduce watering and provide indoor protection",
        type: "warning",
      });
    }

    // If no specific alerts, show general helpful tip
    if (alerts.length === 0) {
      alerts.push({
        id: 1,
        message: "Regular plant inspection helps maintain healthy gardens",
        type: "info",
      });
    }

    setAlerts(alerts.slice(0, 2)); // Show maximum 2 alerts
  };

  // Simple weather icon function
  const getWeatherIcon = (condition) => {
    switch (condition?.toLowerCase()) {
      case "clear":
      case "sunny":
        return <SunnyIcon sx={{ fontSize: 60, color: "#FFA726" }} />;
      case "clouds":
      case "cloudy":
        return <CloudyIcon sx={{ fontSize: 60, color: "#78909C" }} />;
      default:
        return <SunnyIcon sx={{ fontSize: 60, color: "#FFA726" }} />;
    }
  };

  // Fetch weather data
  const fetchWeatherData = async () => {
    setWeatherLoading(true);
    try {
      // Try to get user's location first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const response = await axios.get(
                `/api/weather/current?lat=${latitude}&lon=${longitude}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (response.data.success && response.data.data?.weather) {
                setWeatherData(response.data.data.weather);
              } else {
                throw new Error("Invalid weather response");
              }
            } catch {
              console.log(
                "Failed to fetch location-based weather, using demo data"
              );
              setWeatherData(mockWeatherData);
            }
            setWeatherLoading(false);
          },
          async () => {
            // Fallback: try to get weather by city name
            try {
              const response = await axios.get(
                "/api/weather/current?city=London",
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (response.data.success && response.data.data?.weather) {
                setWeatherData(response.data.data.weather);
              } else {
                throw new Error("Invalid weather response");
              }
            } catch {
              console.log("Using demo weather data");
              setWeatherData(mockWeatherData);
            }
            setWeatherLoading(false);
          }
        );
      } else {
        // No geolocation support, try default city
        try {
          const response = await axios.get("/api/weather/current?city=London", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.data.success && response.data.data?.weather) {
            setWeatherData(response.data.data.weather);
          } else {
            throw new Error("Invalid weather response");
          }
        } catch {
          console.log("Using demo weather data");
          setWeatherData(mockWeatherData);
        }
        setWeatherLoading(false);
      }
    } catch {
      console.log("Using demo weather data");
      setWeatherData(mockWeatherData);
      setWeatherLoading(false);
    }
  };

  // Fetch user statistics
  const fetchStats = async () => {
    try {
      // Get plants count
      const plantsRes = await axios.get("/api/user-plants", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStats({
        plants: plantsRes.data.data?.plants?.length || 0,
        totalPlants: plantsRes.data.data?.plants?.length || 0,
        activeReminders: Math.floor(Math.random() * 5) + 1, // Mock reminders
      });
    } catch (error) {
      console.log("Could not fetch stats:", error.message);
      // Set default values on error
      setStats({
        plants: 0,
        totalPlants: 0,
        activeReminders: 0,
      });
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      if (token) {
        await fetchStats();
        // Add small delay before weather fetch
        setTimeout(() => {
          fetchWeatherData();
        }, 200);
      }
      // Generate alerts after component mounts
      generateDynamicAlerts();
    };

    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Update alerts when weather data changes
  useEffect(() => {
    generateDynamicAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherData, stats]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
        }}
      >
        <Typography variant="h4" sx={{ color: "white", mb: 1 }}>
          Welcome back, {user?.name || "Gardener"}!
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)" }}>
          Manage your gardens and plants all in one place
        </Typography>
      </Paper>

      {/* Stats Row */}
      <Grid container spacing={3} mb={4}>
        {/* Plant Stats */}
        <Grid item xs={12} sm={6} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="success.main"
                  >
                    {stats.plants}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    My Plants
                  </Typography>
                  <Chip
                    label="Healthy"
                    size="small"
                    color="success"
                    sx={{ mt: 1 }}
                  />
                </Box>
                <PlantIcon sx={{ fontSize: 40, color: "success.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reminders */}
        <Grid item xs={12} sm={6} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="warning.main"
                  >
                    {stats.activeReminders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Reminders
                  </Typography>
                  <Chip
                    label="Pending"
                    size="small"
                    color="warning"
                    sx={{ mt: 1 }}
                  />
                </Box>
                <AlertIcon sx={{ fontSize: 40, color: "warning.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Alerts */}
      <Paper sx={{ p: 3, mb: 4, backgroundColor: "rgba(76, 175, 80, 0.1)" }}>
        <Typography variant="h6" gutterBottom>
          <NatureIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Today's Garden Alerts
        </Typography>
        <Grid container spacing={2}>
          {alerts.map((alert) => (
            <Grid item xs={12} md={6} key={alert.id}>
              <Alert severity={alert.type} sx={{ mb: 1 }}>
                {alert.message}
              </Alert>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Expanded Weather Section */}
      <Paper sx={{ p: 0, overflow: "hidden" }}>
        <Box
          sx={{ p: 3, background: "linear-gradient(135deg, #2196F3, #1976D2)" }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography
              variant="h5"
              sx={{ color: "white", fontWeight: "bold" }}
            >
              <WeatherIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Current Weather Conditions
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchWeatherData}
              disabled={weatherLoading}
              sx={{
                color: "white",
                borderColor: "white",
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.8)",
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              Refresh
            </Button>
          </Box>

          {weatherLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress sx={{ color: "white" }} />
            </Box>
          ) : weatherData ? (
            <Grid container spacing={3}>
              {/* Main Weather Display */}
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    height: "100%",
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <CardContent sx={{ textAlign: "center", p: 3 }}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      mb={2}
                    >
                      {getWeatherIcon(weatherData.current.condition)}
                      <Box ml={3}>
                        <Typography
                          variant="h2"
                          sx={{ color: "white", fontWeight: "bold" }}
                        >
                          {Math.round(weatherData.current.temperature)}°C
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ color: "rgba(255,255,255,0.9)" }}
                        >
                          {weatherData.current.description}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ color: "rgba(255,255,255,0.7)" }}
                        >
                          📍 {weatherData.location.name}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Weather Details */}
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    height: "100%",
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ color: "white", mb: 3 }}>
                      Detailed Conditions
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <HumidityIcon
                            sx={{
                              color: "rgba(255,255,255,0.9)",
                              fontSize: 30,
                            }}
                          />
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              Humidity
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{ color: "white", fontWeight: "bold" }}
                            >
                              {weatherData.current.humidity}%
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <WindIcon
                            sx={{
                              color: "rgba(255,255,255,0.9)",
                              fontSize: 30,
                            }}
                          />
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              Wind Speed
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{ color: "white", fontWeight: "bold" }}
                            >
                              {weatherData.current.windSpeed} km/h
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider
                          sx={{
                            backgroundColor: "rgba(255,255,255,0.3)",
                            my: 2,
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: "rgba(255,255,255,0.8)",
                            textAlign: "center",
                          }}
                        >
                          Perfect conditions for outdoor gardening activities
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert
              severity="info"
              sx={{ color: "white", backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              No weather data available. Please try refreshing.
            </Alert>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;
