import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Badge,
  Tabs,
  Tab,
} from "@mui/material";
import {
  LocalFlorist as PlantIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Feedback as FeedbackIcon,
  Schedule as ScheduleIcon,
  WaterDrop as WaterIcon,
  Thermostat as TempIcon,
  WbSunny as SunIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import usePageTitle from "../../hooks/usePageTitle";
import axios from "axios";

const MyPlants = () => {
  usePageTitle("My Plants");

  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { token } = useAuth();

  const [userPlants, setUserPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [showObservationDialog, setShowObservationDialog] = useState(false);
  const [observationForm, setObservationForm] = useState({
    title: "",
    description: "",
  });
  const [observations, setObservations] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  // Fetch user's plants from their gardens
  const fetchMyPlants = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch gardens with populated plants
      const response = await axios.get("/api/gardens", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const gardens = response.data.data.gardens || [];

        // Extract all plants from all gardens
        const allPlants = [];
        gardens.forEach((garden) => {
          if (garden.plants && garden.plants.length > 0) {
            garden.plants.forEach((gardenPlant, plantIndex) => {
              if (gardenPlant.plant) {
                allPlants.push({
                  ...gardenPlant.plant,
                  gardenInfo: {
                    gardenId: garden._id,
                    gardenName: garden.name,
                    plantedDate: gardenPlant.plantedDate,
                    status: gardenPlant.status,
                    notes: gardenPlant.notes,
                    plantIndex: plantIndex, // Index of plant in garden.plants array
                    observations: gardenPlant.observations || [],
                  },
                });
              }
            });
          }
        });

        setUserPlants(allPlants);
      }
    } catch (error) {
      console.error("Error fetching my plants:", error);
      showError("Failed to load your plants");
    } finally {
      setLoading(false);
    }
  }, [token, showError]);

  // Fetch observations for a specific plant
  const fetchObservations = useCallback(
    async (gardenId, plantIndex) => {
      try {
        const response = await axios.get(
          `/api/gardens/${gardenId}/plants/${plantIndex}/observations`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setObservations(response.data.data.observations || []);
        }
      } catch (error) {
        console.error("Error fetching observations:", error);
        // Don't show error as this might be expected for plants without observations
        setObservations([]);
      }
    },
    [token]
  );

  // Add observation
  const handleAddObservation = async () => {
    if (!observationForm.title.trim() || !observationForm.description.trim()) {
      showError("Please fill in all required fields");
      return;
    }

    try {
      const response = await axios.post(
        `/api/gardens/${selectedPlant.gardenInfo.gardenId}/plants/${selectedPlant.gardenInfo.plantIndex}/observations`,
        observationForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showSuccess(
          "Observation added successfully! Supervisors will review it."
        );
        setShowObservationDialog(false);
        setObservationForm({ title: "", description: "" });
        // Refresh observations
        fetchObservations(
          selectedPlant.gardenInfo.gardenId,
          selectedPlant.gardenInfo.plantIndex
        );
      }
    } catch (error) {
      console.error("Error adding observation:", error);
      showError(error.response?.data?.message || "Failed to add observation");
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyPlants();
    }
  }, [fetchMyPlants, token]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "reviewed":
        return "success";
      case "needs_attention":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <PendingIcon />;
      case "reviewed":
        return <CheckIcon />;
      case "needs_attention":
        return <WarningIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const PlantCard = ({ plant }) => {
    const primaryImage =
      plant.images?.find((img) => img.isPrimary)?.url ||
      plant.images?.[0]?.url ||
      `https://placehold.co/300x200/4caf50/ffffff/png?text=${encodeURIComponent(
        plant.name || "Plant"
      )}`;

    return (
      <Card
        sx={{
          height: "100%",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: 4,
          },
        }}
        onClick={() => {
          setSelectedPlant(plant);
          fetchObservations(
            plant.gardenInfo.gardenId,
            plant.gardenInfo.plantIndex
          );
        }}
      >
        <CardMedia
          component="img"
          height="200"
          image={primaryImage}
          alt={plant.name}
          sx={{ bgcolor: "grey.200" }}
        />
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom>
            {plant.name}
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={1}>
            <em>{plant.scientificName}</em>
          </Typography>

          <Typography variant="body2" paragraph>
            Garden: {plant.gardenInfo.gardenName}
          </Typography>

          <Box display="flex" gap={1} mb={2}>
            <Chip size="small" label={plant.category} color="primary" />
            <Chip
              size="small"
              label={plant.gardenInfo.status || "growing"}
              color="success"
            />
          </Box>

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="text.secondary">
              Planted:{" "}
              {new Date(plant.gardenInfo.plantedDate).toLocaleDateString()}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ViewIcon />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPlant(plant);
                fetchObservations(
                  plant.gardenInfo.gardenId,
                  plant.gardenInfo.plantIndex
                );
              }}
            >
              View Details
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress size={60} />
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
          mb={3}
        >
          <Typography variant="h4" component="h1" fontWeight="bold">
            My Plants
          </Typography>
          <Button variant="outlined" onClick={() => navigate("/plants")}>
            Browse More Plants
          </Button>
        </Box>

        <Typography variant="body1" color="text.secondary" mb={4}>
          Manage your plant collection and track their progress
        </Typography>

        {userPlants.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <PlantIcon sx={{ fontSize: 60, color: "grey.400", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Plants Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Start building your garden by adding plants from our database
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/plants")}
              startIcon={<AddIcon />}
            >
              Browse Plants
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {userPlants.map((plant, index) => (
              <Grid item xs={12} sm={6} md={4} key={`${plant._id}-${index}`}>
                <PlantCard plant={plant} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Plant Details Dialog */}
        <Dialog
          open={!!selectedPlant}
          onClose={() => setSelectedPlant(null)}
          maxWidth="md"
          fullWidth
        >
          {selectedPlant && (
            <>
              <DialogTitle>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h5">{selectedPlant.name}</Typography>
                  <IconButton onClick={() => setSelectedPlant(null)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </DialogTitle>

              <DialogContent>
                <Tabs
                  value={tabValue}
                  onChange={(e, newValue) => setTabValue(newValue)}
                  sx={{ mb: 3 }}
                >
                  <Tab label="Plant Info" />
                  <Tab
                    label={
                      <Badge badgeContent={observations.length} color="primary">
                        Observations
                      </Badge>
                    }
                  />
                </Tabs>

                {tabValue === 0 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Care Information
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <SunIcon color="warning" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Sunlight"
                            secondary={
                              selectedPlant.characteristics?.sunRequirement ||
                              "Not specified"
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <WaterIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Watering"
                            secondary={
                              selectedPlant.characteristics?.waterNeeds ||
                              "Not specified"
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <TempIcon color="info" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Temperature"
                            secondary={
                              selectedPlant.characteristics?.hardiness
                                ?.temperature
                                ? `${
                                    selectedPlant.characteristics.hardiness
                                      .temperature.min || "N/A"
                                  }°C - ${
                                    selectedPlant.characteristics.hardiness
                                      .temperature.max || "N/A"
                                  }°C`
                                : "Not specified"
                            }
                          />
                        </ListItem>
                      </List>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Garden Information
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemText
                            primary="Garden"
                            secondary={selectedPlant.gardenInfo.gardenName}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Planted Date"
                            secondary={new Date(
                              selectedPlant.gardenInfo.plantedDate
                            ).toLocaleDateString()}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Status"
                            secondary={
                              selectedPlant.gardenInfo.status || "growing"
                            }
                          />
                        </ListItem>
                        {selectedPlant.gardenInfo.notes && (
                          <ListItem>
                            <ListItemText
                              primary="Notes"
                              secondary={selectedPlant.gardenInfo.notes}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Grid>
                  </Grid>
                )}

                {tabValue === 1 && (
                  <Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography variant="h6">
                        Observations ({observations.length})
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowObservationDialog(true)}
                      >
                        Add Observation
                      </Button>
                    </Box>

                    {observations.length === 0 ? (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        No observations yet. Add your first observation to track
                        your plant's progress!
                      </Alert>
                    ) : (
                      <List>
                        {observations.map((observation, index) => (
                          <React.Fragment key={observation._id || index}>
                            <ListItem alignItems="flex-start">
                              <ListItemIcon>
                                {getStatusIcon(observation.status)}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                  >
                                    <Typography variant="subtitle1">
                                      {observation.title}
                                    </Typography>
                                    <Chip
                                      size="small"
                                      label={observation.status}
                                      color={getStatusColor(observation.status)}
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2" paragraph>
                                      {observation.description}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Added:{" "}
                                      {new Date(
                                        observation.createdAt
                                      ).toLocaleString()}
                                    </Typography>
                                    {observation.supervisorFeedback && (
                                      <Box
                                        mt={1}
                                        p={2}
                                        bgcolor="grey.50"
                                        color="text.primary"
                                        borderRadius={1}
                                      >
                                        <Typography
                                          variant="subtitle2"
                                          color="primary"
                                          gutterBottom
                                        >
                                          Supervisor Feedback:
                                        </Typography>
                                        <Typography variant="body2">
                                          {
                                            observation.supervisorFeedback
                                              .message
                                          }
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          Reviewed:{" "}
                                          {new Date(
                                            observation.supervisorFeedback.reviewedAt
                                          ).toLocaleString()}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < observations.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </Box>
                )}
              </DialogContent>
            </>
          )}
        </Dialog>

        {/* Add Observation Dialog */}
        <Dialog
          open={showObservationDialog}
          onClose={() => setShowObservationDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Observation</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Observation Title"
              value={observationForm.title}
              onChange={(e) =>
                setObservationForm({
                  ...observationForm,
                  title: e.target.value,
                })
              }
              margin="normal"
              required
              placeholder="e.g., New growth spotted, Leaves turning yellow..."
            />
            <TextField
              fullWidth
              label="Description"
              value={observationForm.description}
              onChange={(e) =>
                setObservationForm({
                  ...observationForm,
                  description: e.target.value,
                })
              }
              margin="normal"
              required
              multiline
              rows={4}
              placeholder="Describe what you observed about your plant..."
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              Your observation will be reviewed by supervisors who can provide
              feedback and guidance.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowObservationDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAddObservation}
              disabled={
                !observationForm.title.trim() ||
                !observationForm.description.trim()
              }
            >
              Add Observation
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default MyPlants;
