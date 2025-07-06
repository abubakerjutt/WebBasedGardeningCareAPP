import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Avatar,
  LinearProgress,
  Alert,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  WaterDrop as WaterIcon,
  WbSunny as SunIcon,
  Thermostat as TempIcon,
  LocalFlorist as FlowerIcon,
  Schedule as CalendarIcon,
  Info as InfoIcon,
  CameraAlt as CameraIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  CheckCircle as HealthyIcon,
  TrendingUp as GrowthIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle";

const PlantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plant, setPlant] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Set page title dynamically based on plant name
  usePageTitle(plant?.name ? `${plant.name} - Plant Details` : "Plant Details");

  // Mock plant data - in real app this would come from API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPlant({
        id: id,
        name: "Snake Plant",
        scientificName: "Sansevieria trifasciata",
        category: "Houseplant",
        difficulty: "Easy",
        image: "/api/placeholder/400/300",
        description:
          "The Snake Plant is a popular, low-maintenance houseplant known for its architectural appearance and air-purifying qualities. It's perfect for beginners and can tolerate neglect.",
        careInstructions: {
          light: "Low to bright indirect light",
          water: "Water when soil is completely dry (every 2-3 weeks)",
          humidity: "Low humidity (30-50%)",
          temperature: "65-75°F (18-24°C)",
          soil: "Well-draining potting mix",
          fertilizer: "Monthly during growing season",
        },
        characteristics: {
          height: "1-4 feet",
          spread: "6-12 inches",
          growth: "Slow growing",
          toxicity: "Toxic to pets",
          airPurifying: true,
          origin: "West Africa",
        },
        seasons: {
          spring: "Active growth period, increase watering slightly",
          summer: "Continue regular care, watch for pests",
          fall: "Reduce watering as growth slows",
          winter: "Minimal watering, avoid cold drafts",
        },
        commonIssues: [
          {
            issue: "Yellow leaves",
            cause: "Overwatering",
            solution: "Reduce watering frequency and ensure good drainage",
          },
          {
            issue: "Brown tips",
            cause: "Low humidity or fluoride in water",
            solution: "Use filtered water and increase humidity",
          },
          {
            issue: "Soft, mushy leaves",
            cause: "Root rot from overwatering",
            solution: "Repot in fresh soil and reduce watering",
          },
        ],
        healthStatus: {
          overall: "Healthy",
          lastWatered: "5 days ago",
          nextWatering: "In 9 days",
          growthStage: "Mature",
          healthScore: 85,
        },
        tips: [
          "Rotate occasionally for even growth",
          "Wipe leaves monthly to remove dust",
          "Propagate easily by division",
          "Can survive in low light conditions",
          "Produces oxygen at night",
        ],
        companions: ["ZZ Plant", "Pothos", "Peace Lily"],
        rating: 4.5,
        reviews: 127,
        price: "$15-25",
        availability: "In Stock",
      });
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: plant.name,
        text: `Check out this ${plant.name} on our gardening app!`,
        url: window.location.href,
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: "100%", mt: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ textAlign: "center", mt: 2 }}>
          Loading plant details...
        </Typography>
      </Box>
    );
  }

  if (!plant) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Plant not found
        </Typography>
        <Button
          variant="contained"
          startIcon={<BackIcon />}
          onClick={() => navigate("/plants")}
        >
          Back to Plants
        </Button>
      </Box>
    );
  }

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`plant-tabpanel-${index}`}
      aria-labelledby={`plant-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate("/plants")}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography
          variant="h4"
          component="h1"
          fontWeight="bold"
          sx={{ flexGrow: 1 }}
        >
          {plant.name}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            onClick={toggleFavorite}
            color={isFavorite ? "error" : "inherit"}
          >
            {isFavorite ? "Favorited" : "Favorite"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleShare}
          >
            Share
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setIsEditDialogOpen(true)}
          >
            Edit
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Image and Basic Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              height="300"
              image={plant.image}
              alt={plant.name}
              sx={{ objectFit: "cover" }}
            />
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {plant.name}
              </Typography>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                gutterBottom
              >
                <em>{plant.scientificName}</em>
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                <Chip label={plant.category} color="primary" size="small" />
                <Chip label={plant.difficulty} color="success" size="small" />
                <Chip
                  label={
                    plant.characteristics.airPurifying
                      ? "Air Purifying"
                      : "Standard"
                  }
                  color="info"
                  size="small"
                />
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Rating
                  value={plant.rating}
                  precision={0.5}
                  readOnly
                  size="small"
                />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {plant.rating} ({plant.reviews} reviews)
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary">
                {plant.description}
              </Typography>
            </CardContent>
          </Card>

          {/* Health Status Card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🌱 Health Status
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <HealthyIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body1" color="success.main">
                  {plant.healthStatus.overall}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Health Score: {plant.healthStatus.healthScore}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={plant.healthStatus.healthScore}
                  color="success"
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>

              <Typography variant="body2" gutterBottom>
                <strong>Last watered:</strong> {plant.healthStatus.lastWatered}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Next watering:</strong>{" "}
                {plant.healthStatus.nextWatering}
              </Typography>
              <Typography variant="body2">
                <strong>Growth stage:</strong> {plant.healthStatus.growthStage}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Detailed Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ width: "100%" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Care Guide" />
                <Tab label="Characteristics" />
                <Tab label="Seasonal Care" />
                <Tab label="Common Issues" />
                <Tab label="Tips & Companions" />
              </Tabs>
            </Box>

            {/* Care Guide Tab */}
            <TabPanel value={activeTab} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <SunIcon sx={{ mr: 2, color: "warning.main" }} />
                    <Box>
                      <Typography variant="subtitle2">Light</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {plant.careInstructions.light}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <WaterIcon sx={{ mr: 2, color: "info.main" }} />
                    <Box>
                      <Typography variant="subtitle2">Water</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {plant.careInstructions.water}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <TempIcon sx={{ mr: 2, color: "error.main" }} />
                    <Box>
                      <Typography variant="subtitle2">Temperature</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {plant.careInstructions.temperature}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <FlowerIcon sx={{ mr: 2, color: "secondary.main" }} />
                    <Box>
                      <Typography variant="subtitle2">Humidity</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {plant.careInstructions.humidity}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <GrowthIcon sx={{ mr: 2, color: "success.main" }} />
                    <Box>
                      <Typography variant="subtitle2">Soil</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {plant.careInstructions.soil}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <CalendarIcon sx={{ mr: 2, color: "primary.main" }} />
                    <Box>
                      <Typography variant="subtitle2">Fertilizer</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {plant.careInstructions.fertilizer}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Characteristics Tab */}
            <TabPanel value={activeTab} index={1}>
              <Grid container spacing={2}>
                {Object.entries(plant.characteristics).map(([key, value]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "background.default",
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ textTransform: "capitalize" }}
                      >
                        {key.replace(/([A-Z])/g, " $1")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {typeof value === "boolean"
                          ? value
                            ? "Yes"
                            : "No"
                          : value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            {/* Seasonal Care Tab */}
            <TabPanel value={activeTab} index={2}>
              <Grid container spacing={2}>
                {Object.entries(plant.seasons).map(([season, care]) => (
                  <Grid item xs={12} sm={6} key={season}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="h6"
                          sx={{ textTransform: "capitalize", mb: 1 }}
                        >
                          {season}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {care}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            {/* Common Issues Tab */}
            <TabPanel value={activeTab} index={3}>
              <List>
                {plant.commonIssues.map((issue, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={issue.issue}
                        secondary={
                          <>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              gutterBottom
                            >
                              <strong>Cause:</strong> {issue.cause}
                            </Typography>
                            <Typography variant="body2" color="success.main">
                              <strong>Solution:</strong> {issue.solution}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < plant.commonIssues.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </TabPanel>

            {/* Tips & Companions Tab */}
            <TabPanel value={activeTab} index={4}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    💡 Pro Tips
                  </Typography>
                  <List>
                    {plant.tips.map((tip, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <InfoIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={tip} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    🌿 Companion Plants
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {plant.companions.map((companion, index) => (
                      <Chip
                        key={index}
                        label={companion}
                        variant="outlined"
                        color="secondary"
                        onClick={() => {
                          /* Navigate to companion plant */
                        }}
                      />
                    ))}
                  </Box>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    These plants have similar care requirements and look great
                    together!
                  </Alert>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            startIcon={<WaterIcon />}
            onClick={() => {
              /* Add watering log */
            }}
          >
            Log Watering
          </Button>
          <Button
            variant="outlined"
            startIcon={<CameraIcon />}
            onClick={() => {
              /* Take progress photo */
            }}
          >
            Progress Photo
          </Button>
          <Button
            variant="outlined"
            startIcon={<CalendarIcon />}
            onClick={() => {
              /* Set care reminder */
            }}
          >
            Set Reminder
          </Button>
        </Box>
      </Paper>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Plant Information</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Plant editing functionality will be implemented here. Users will be
            able to update care schedules, add notes, and modify plant details.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlantDetail;
