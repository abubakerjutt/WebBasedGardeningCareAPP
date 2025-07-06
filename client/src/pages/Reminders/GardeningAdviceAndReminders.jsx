import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Alert,
  Button,
  Container,
  Tab,
  Tabs,
} from "@mui/material";
import {
  WaterDrop as WaterIcon,
  Nature as PlantIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import usePageTitle from "../../hooks/usePageTitle";

const GardeningAdviceAndReminders = () => {
  usePageTitle("Gardening Advice & Reminders");

  const { token } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [weatherAdvice, setWeatherAdvice] = useState([]);
  const [reminders, setReminders] = useState([]);

  // Simple function to generate basic gardening advice
  const generateBasicAdvice = () => {
    const month = new Date().getMonth();
    const advice = [];

    if (month >= 2 && month <= 4) {
      // Spring
      advice.push({
        id: 1,
        icon: <PlantIcon color="success" />,
        title: "Spring Planting",
        description: "Great time for planting new seeds and seedlings.",
        priority: "medium",
      });
    } else if (month >= 5 && month <= 7) {
      // Summer
      advice.push({
        id: 2,
        icon: <WaterIcon color="primary" />,
        title: "Summer Watering",
        description: "Keep plants well watered during hot weather.",
        priority: "high",
      });
    } else {
      // Fall/Winter
      advice.push({
        id: 3,
        icon: <WarningIcon color="warning" />,
        title: "Winter Protection",
        description: "Protect plants from frost and cold weather.",
        priority: "high",
      });
    }

    setWeatherAdvice(advice);
  };

  // Simple function to fetch reminders
  const fetchReminders = async () => {
    try {
      const response = await axios.get("/api/auto-reminders/care-reminders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setReminders(response.data.data?.reminders || []);
      }
    } catch {
      console.log("No reminders available");
      setReminders([]);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    generateBasicAdvice();
    if (token) {
      fetchReminders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Get priority color for chips
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      default:
        return "primary";
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Gardening Advice & Reminders
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
          <Tab label="Gardening Advice" />
          <Tab label="My Reminders" />
        </Tabs>
      </Box>

      {/* Gardening Advice Tab */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Seasonal Gardening Tips
          </Typography>

          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))"
            gap={3}
          >
            {weatherAdvice.map((item) => (
              <Paper key={item.id} elevation={2} sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {item.icon}
                  <Typography variant="h6">{item.title}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {item.description}
                </Typography>
                <Chip
                  label={item.priority?.toUpperCase()}
                  color={getPriorityColor(item.priority)}
                  size="small"
                />
              </Paper>
            ))}
          </Box>

          <Button
            onClick={generateBasicAdvice}
            variant="outlined"
            sx={{ mt: 3 }}
          >
            Refresh Advice
          </Button>
        </Box>
      )}

      {/* Reminders Tab */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            My Garden Reminders
          </Typography>

          {reminders.length === 0 ? (
            <Alert severity="info">
              No reminders set. Create reminders in your garden management
              section.
            </Alert>
          ) : (
            <Box
              display="grid"
              gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))"
              gap={3}
            >
              {reminders.map((item) => (
                <Paper key={item.id} elevation={2} sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <CheckIcon color="success" />
                    <Typography variant="h6">{item.title}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {item.description}
                  </Typography>
                  {item.dueDate && (
                    <Typography variant="caption" color="text.secondary">
                      Due: {new Date(item.dueDate).toLocaleDateString()}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          )}

          <Button onClick={fetchReminders} variant="outlined" sx={{ mt: 3 }}>
            Refresh Reminders
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default GardeningAdviceAndReminders;
