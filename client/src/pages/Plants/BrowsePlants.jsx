import { useState, useEffect, useCallback } from "react";
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
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocalFlorist as PlantIcon,
  WbSunny as SunIcon,
  WaterDrop as WaterIcon,
  Thermostat as TempIcon,
  Height as HeightIcon,
  Schedule as CareIcon,
  Info as InfoIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import usePageTitle from "../../hooks/usePageTitle";
import axios from "axios";

// Helper function to construct full image URLs
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // If it's already a full URL, return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // In development, use the proxied path (Vite will proxy /uploads to the backend)
  // In production, construct full URL from relative path
  if (import.meta.env.DEV) {
    // Development: use proxied path
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return cleanPath;
  } else {
    // Production: construct full URL
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const serverUrl = baseUrl.replace("/api", "");
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${serverUrl}${cleanPath}`;
  }
};

// Fallback mock data when API is unavailable
const mockPlants = [
  {
    _id: "mock-1",
    name: "Snake Plant",
    category: "indoor",
    difficulty: "easy",
    sunRequirement: "indirect",
    waterNeeds: "low",
    description: "A hardy indoor plant perfect for beginners.",
    images: [
      {
        url: "https://placehold.co/300x200/4caf50/ffffff/png?text=Snake+Plant",
        isPrimary: true,
      },
    ],
    characteristics: {
      sunRequirement: "partial-shade",
      waterNeeds: "low",
    },
    careInstructions: {
      watering: "Water every 2-3 weeks",
      lighting: "Low to bright indirect light",
      temperature: "65-75°F (18-24°C)",
    },
    tags: ["indoor", "low-maintenance"],
  },
  {
    _id: "mock-2",
    name: "Basil",
    category: "herb",
    difficulty: "easy",
    sunRequirement: "full",
    waterNeeds: "medium",
    description: "Aromatic herb perfect for cooking.",
    images: [
      {
        url: "https://placehold.co/300x200/4caf50/ffffff/png?text=Basil",
        isPrimary: true,
      },
    ],
    characteristics: {
      sunRequirement: "full-sun",
      waterNeeds: "moderate",
    },
    careInstructions: {
      watering: "Water when soil feels dry",
      lighting: "6+ hours of direct sunlight",
      temperature: "65-75°F (18-24°C)",
    },
    tags: ["herb", "culinary"],
  },
  {
    _id: "mock-3",
    name: "Tomato",
    category: "vegetable",
    difficulty: "medium",
    sunRequirement: "full",
    waterNeeds: "high",
    description: "Popular garden vegetable with fresh fruit.",
    images: [
      {
        url: "https://placehold.co/300x200/4caf50/ffffff/png?text=Tomato",
        isPrimary: true,
      },
    ],
    characteristics: {
      sunRequirement: "full-sun",
      waterNeeds: "high",
    },
    careInstructions: {
      watering: "Water regularly, keep soil moist",
      lighting: "6-8 hours of direct sunlight",
      temperature: "65-75°F (18-24°C)",
    },
    tags: ["vegetable", "fruit"],
  },
];

const BrowsePlants = () => {
  usePageTitle("Browse Plants");

  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { token } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState(new Set());
  const [gardens, setGardens] = useState([]);
  const [userPlantIds, setUserPlantIds] = useState(new Set());
  const [showGardenDialog, setShowGardenDialog] = useState(false);
  const [selectedGarden, setSelectedGarden] = useState("");
  const [plantToAdd, setPlantToAdd] = useState(null);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const plantsPerPage = 9;
  const maxRetries = 3;

  // Fetch plants from API
  const fetchPlants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: plantsPerPage,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCategory !== "all" && {
          category: selectedCategory.toLowerCase(),
        }),
        ...(selectedDifficulty !== "all" && {
          difficulty: selectedDifficulty.toLowerCase(),
        }),
      };

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/plants`,
        {
          params,
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (response.data.success) {
        setPlants(response.data.data.plants || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setRetryCount(0); // Reset retry count on success
      } else {
        throw new Error(response.data.message || "Failed to fetch plants");
      }
    } catch (error) {
      console.error("Error fetching plants:", error);
      setError(error.message);

      // Only show error notification if we've exhausted retries
      if (retryCount >= maxRetries) {
        showError(
          "Failed to load plants from server. Showing offline content."
        );
        setPlants(mockPlants); // Show mock data as fallback
        setTotalPages(1);
      } else {
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    token,
    showError,
    retryCount,
    maxRetries,
  ]);

  useEffect(() => {
    if (retryCount < maxRetries) {
      fetchPlants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, selectedCategory, selectedDifficulty, token]);

  // Fetch user's gardens
  const fetchGardens = useCallback(async () => {
    // Note: We're in a protected route, so token should always exist
    // This check is just defensive programming
    if (!token) {
      console.warn("No token available for fetching gardens");
      return;
    }

    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/gardens`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const userGardens = response.data.data.gardens || [];
        setGardens(userGardens);

        // Extract plant IDs from all gardens
        const plantIds = new Set();
        userGardens.forEach((garden) => {
          if (garden.plants && garden.plants.length > 0) {
            garden.plants.forEach((gardenPlant) => {
              if (gardenPlant.plant && gardenPlant.plant._id) {
                plantIds.add(gardenPlant.plant._id);
              }
            });
          }
        });
        setUserPlantIds(plantIds);
      }
    } catch (error) {
      console.error("Error fetching gardens:", error);
      // Don't show error for gardens as it's not critical for browsing plants
    }
  }, [token]);

  const categories = [
    "All",
    "Herb",
    "Vegetable",
    "Flowering",
    "Flower",
    "Fruit",
    "Tree",
    "Shrub",
    "Succulent",
  ];
  const difficulties = ["All", "Easy", "Moderate", "Difficult"];

  const handleManualRetry = () => {
    setRetryCount(0);
    setError(null);
    setLoading(true);
    fetchPlants();
  };

  const handleFavoriteToggle = (plantId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(plantId)) {
      newFavorites.delete(plantId);
    } else {
      newFavorites.add(plantId);
    }
    setFavorites(newFavorites);
    showSuccess(
      newFavorites.has(plantId)
        ? "Added to favorites!"
        : "Removed from favorites!"
    );
  };

  // Add plant to garden
  const handleAddToGarden = (plant) => {
    setPlantToAdd(plant);

    // If user has no gardens, auto-create one and add the plant directly
    if (gardens.length === 0) {
      createGardenAndAddPlant(plant);
      return;
    }

    setShowGardenDialog(true);
  };

  // Automatically create a garden and add plant
  const createGardenAndAddPlant = async (plant) => {
    try {
      // Check if user is authenticated
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      showSuccess("Creating your first garden...");

      // Create a default garden
      const gardenResponse = await axios.post(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/gardens`,
        {
          name: "My Garden",
          description: "My first garden created automatically",
          type: "outdoor",
          sunExposure: "full-sun", // Required field
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (gardenResponse.data.success) {
        const newGarden = gardenResponse.data.data.garden;

        // Update the gardens list
        setGardens([newGarden]);

        // Now add the plant to the new garden
        const addPlantResponse = await axios.post(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000/api"
          }/gardens/${newGarden._id}/plants`,
          {
            plantId: plant._id,
            notes: `Added from plant browser`,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (addPlantResponse.data.success) {
          showSuccess(
            `Created "My Garden" and added ${plant.name} successfully! 🌱`
          );
          // Update userPlantIds to reflect the newly added plant
          setUserPlantIds((prev) => new Set([...prev, plant._id]));
          // Refresh gardens list to ensure UI is up-to-date
          fetchGardens();
        } else {
          // Garden was created but plant addition failed
          showError(
            `Garden created successfully, but failed to add ${plant.name}. You can try adding it again.`
          );
        }
      } else {
        throw new Error(
          gardenResponse.data.message || "Failed to create garden"
        );
      }
    } catch (error) {
      console.error("Error creating garden and adding plant:", error);

      let errorMessage = "Failed to create garden and add plant. ";
      if (error.response?.status === 401) {
        errorMessage += "Please log in again.";
      } else if (error.response?.status === 400) {
        errorMessage += error.response.data?.message || "Invalid request.";
      } else if (error.isConnectionError) {
        errorMessage += "Please check your connection and try again.";
      } else {
        errorMessage += "Please try again.";
      }

      showError(errorMessage);
    }
  };

  // Confirm adding plant to selected garden
  const confirmAddToGarden = async () => {
    if (!selectedGarden || !plantToAdd) return;

    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/gardens/${selectedGarden}/plants`,
        {
          plantId: plantToAdd._id,
          notes: `Added from plant browser`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showSuccess(`${plantToAdd.name} added to your garden successfully!`);
        // Update userPlantIds to reflect the newly added plant
        setUserPlantIds((prev) => new Set([...prev, plantToAdd._id]));
        setShowGardenDialog(false);
        setSelectedGarden("");
        setPlantToAdd(null);
      }
    } catch (error) {
      console.error("Error adding plant to garden:", error);
      showError(
        error.response?.data?.message || "Failed to add plant to garden"
      );
    }
  };

  useEffect(() => {
    fetchGardens();
  }, [fetchGardens]);

  const PlantCard = ({ plant }) => {
    const plantId = plant._id || plant.id;
    const isPlantInGarden = userPlantIds.has(plantId);

    // Get the primary image URL and convert relative paths to full URLs
    const primaryImagePath =
      plant.images?.find((img) => img.isPrimary)?.url || plant.images?.[0]?.url;
    const primaryImage =
      getImageUrl(primaryImagePath) ||
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
        onClick={() => setSelectedPlant(plant)}
      >
        <CardMedia
          component="img"
          height="200"
          image={primaryImage}
          alt={plant.name}
          crossOrigin="anonymous"
          sx={{ bgcolor: "grey.200" }}
        />
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            mb={1}
          >
            <Typography variant="h6" component="h3" gutterBottom>
              {plant.name}
            </Typography>
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleFavoriteToggle(plantId);
              }}
              sx={{ minWidth: "auto", p: 0.5 }}
            >
              {favorites.has(plantId) ? (
                <FavoriteIcon color="error" />
              ) : (
                <FavoriteBorderIcon color="action" />
              )}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" mb={1}>
            <em>{plant.scientificName}</em>
          </Typography>

          <Typography variant="body2" paragraph>
            {plant.description}
          </Typography>

          <Box display="flex" gap={1} mb={2}>
            <Chip size="small" label={plant.category} color="primary" />
            <Chip
              size="small"
              label={plant.difficulty || "Medium"}
              color={
                (plant.difficulty || "Medium") === "Easy"
                  ? "success"
                  : (plant.difficulty || "Medium") === "Medium"
                  ? "warning"
                  : "error"
              }
            />
          </Box>

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={2}
          >
            <Typography variant="caption" color="text.secondary">
              {plant.characteristics?.sunRequirement || "Moderate light"}
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                size="small"
                variant={isPlantInGarden ? "outlined" : "contained"}
                color={isPlantInGarden ? "primary" : "success"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToGarden(plant);
                }}
              >
                {isPlantInGarden ? "Add More" : "Add to Garden"}
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setSelectedPlant(plant)}
              >
                View Details
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

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
            Plant Database
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate("/my-plants")}
            sx={{ ml: 2 }}
          >
            View My Plants
          </Button>
        </Box>

        <Typography variant="body1" color="text.secondary" mb={4}>
          Explore our comprehensive collection of plants with detailed care
          instructions
        </Typography>

        {/* Error State */}
        {error && retryCount >= maxRetries && (
          <Alert
            severity="warning"
            sx={{ mb: 4 }}
            action={
              <Button color="inherit" size="small" onClick={handleManualRetry}>
                Retry
              </Button>
            }
          >
            Unable to connect to plant database. Showing limited offline
            content. Click "Retry" to try connecting again.
          </Alert>
        )}

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search plants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category.toLowerCase()}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={selectedDifficulty}
                  label="Difficulty"
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                >
                  {difficulties.map((difficulty) => (
                    <MenuItem key={difficulty} value={difficulty.toLowerCase()}>
                      {difficulty}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Results Summary */}
        <Box mb={3}>
          <Typography variant="body1">
            Showing {plants.length} plants
            {searchQuery && ` for "${searchQuery}"`}
          </Typography>
        </Box>

        {/* Loading State */}
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
          >
            <CircularProgress size={60} />
          </Box>
        ) : (
          <>
            {/* Plant Grid */}
            {plants.length > 0 ? (
              <Grid container spacing={3} mb={4}>
                {plants.map((plant) => (
                  <Grid item xs={12} sm={6} md={4} key={plant._id || plant.id}>
                    <PlantCard plant={plant} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={6}>
                {error && retryCount >= maxRetries ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Currently in offline mode with limited plant data available.
                  </Alert>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No plants found matching your search criteria. Try adjusting
                    your filters.
                  </Alert>
                )}
                <Typography variant="body2" color="text.secondary">
                  {error && retryCount >= maxRetries
                    ? "Connect to the internet to see the full plant database."
                    : "You can browse all plants by clearing your search filters."}
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center">
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(e, page) => setCurrentPage(page)}
              color="primary"
            />
          </Box>
        )}

        {/* Plant Detail Dialog */}
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
                  <Box>
                    <Typography variant="h5" component="div">
                      {selectedPlant.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <em>{selectedPlant.scientificName}</em>
                    </Typography>
                  </Box>
                  <Button
                    onClick={() =>
                      handleFavoriteToggle(
                        selectedPlant._id || selectedPlant.id
                      )
                    }
                    startIcon={
                      favorites.has(selectedPlant._id || selectedPlant.id) ? (
                        <FavoriteIcon color="error" />
                      ) : (
                        <FavoriteBorderIcon />
                      )
                    }
                  >
                    {favorites.has(selectedPlant._id || selectedPlant.id)
                      ? "Favorited"
                      : "Add to Favorites"}
                  </Button>
                </Box>
              </DialogTitle>

              <DialogContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    {selectedPlant.images && selectedPlant.images.length > 0 ? (
                      <Box
                        component="img"
                        src={getImageUrl(
                          selectedPlant.images.find((img) => img.isPrimary)
                            ?.url || selectedPlant.images[0]?.url
                        )}
                        alt={selectedPlant.name}
                        crossOrigin="anonymous"
                        sx={{
                          width: "100%",
                          height: 250,
                          objectFit: "cover",
                          borderRadius: 1,
                        }}
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <Box
                      sx={{
                        width: "100%",
                        height: 250,
                        bgcolor: "grey.200",
                        borderRadius: 1,
                        display:
                          selectedPlant.images &&
                          selectedPlant.images.length > 0
                            ? "none"
                            : "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PlantIcon sx={{ fontSize: 60, color: "grey.400" }} />
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <Typography variant="body1" paragraph>
                      {selectedPlant.description}
                    </Typography>

                    <Box display="flex" gap={1} mb={2}>
                      <Chip label={selectedPlant.category} color="primary" />
                      <Chip
                        label={selectedPlant.difficulty}
                        color={
                          selectedPlant.difficulty === "Easy"
                            ? "success"
                            : selectedPlant.difficulty === "Medium"
                            ? "warning"
                            : "error"
                        }
                      />
                    </Box>

                    <Typography variant="h6" gutterBottom>
                      Care Requirements
                    </Typography>

                    <List dense>
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
                      <ListItem>
                        <ListItemIcon>
                          <HeightIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Size"
                          secondary={
                            selectedPlant.characteristics?.height
                              ? `${
                                  selectedPlant.characteristics.height.min ||
                                  "N/A"
                                }cm - ${
                                  selectedPlant.characteristics.height.max ||
                                  "N/A"
                                }cm`
                              : "Not specified"
                          }
                        />
                      </ListItem>
                    </List>

                    {selectedPlant.tags && selectedPlant.tags.length > 0 && (
                      <>
                        <Typography variant="h6" gutterBottom mt={2}>
                          Tags
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                          {selectedPlant.tags.map((tag, index) => (
                            <Chip
                              key={index}
                              size="small"
                              label={tag}
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </>
                    )}

                    {selectedPlant.careInstructions && (
                      <>
                        <Typography variant="h6" gutterBottom>
                          Care Instructions
                        </Typography>
                        <List dense>
                          {selectedPlant.careInstructions.watering
                            ?.instructions && (
                            <ListItem>
                              <ListItemIcon>
                                <WaterIcon color="primary" />
                              </ListItemIcon>
                              <ListItemText
                                primary="Watering"
                                secondary={
                                  selectedPlant.careInstructions.watering
                                    .instructions
                                }
                              />
                            </ListItem>
                          )}
                          {selectedPlant.careInstructions.fertilizing
                            ?.instructions && (
                            <ListItem>
                              <ListItemIcon>
                                <InfoIcon color="action" />
                              </ListItemIcon>
                              <ListItemText
                                primary="Fertilizing"
                                secondary={
                                  selectedPlant.careInstructions.fertilizing
                                    .instructions
                                }
                              />
                            </ListItem>
                          )}
                          {selectedPlant.careInstructions.pruning
                            ?.instructions && (
                            <ListItem>
                              <ListItemIcon>
                                <InfoIcon color="action" />
                              </ListItemIcon>
                              <ListItemText
                                primary="Pruning"
                                secondary={
                                  selectedPlant.careInstructions.pruning
                                    .instructions
                                }
                              />
                            </ListItem>
                          )}
                        </List>
                      </>
                    )}
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions>
                <Button onClick={() => setSelectedPlant(null)}>Close</Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    navigate(
                      `/plants/${selectedPlant._id || selectedPlant.id}`
                    );
                    setSelectedPlant(null);
                  }}
                >
                  View Full Details
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Add to Garden Dialog */}
        <Dialog
          open={showGardenDialog}
          onClose={() => setShowGardenDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add to Garden</DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              Select a garden to add{" "}
              <strong>{plantToAdd?.name || "this plant"}</strong> to:
            </Typography>

            {gardens.length > 0 ? (
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <InputLabel>Garden</InputLabel>
                <Select
                  value={selectedGarden}
                  onChange={(e) => setSelectedGarden(e.target.value)}
                  label="Garden"
                >
                  {gardens.map((garden) => (
                    <MenuItem key={garden._id} value={garden._id}>
                      {garden.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Typography
                variant="body1"
                color="text.secondary"
                paragraph
                sx={{ mb: 2 }}
              >
                You don't have any gardens yet. We can create one for you
                automatically!
              </Typography>
            )}

            <Typography variant="body2" color="text.secondary" paragraph>
              {gardens.length > 0
                ? "Need a different garden? "
                : "Want to customize your garden? "}
              <Button
                color="primary"
                onClick={() => {
                  setShowGardenDialog(false);
                  navigate("/gardens/new");
                }}
              >
                {gardens.length > 0
                  ? "Create another garden"
                  : "Create custom garden"}
              </Button>
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setShowGardenDialog(false)}>Cancel</Button>
            {gardens.length > 0 ? (
              <Button
                variant="contained"
                onClick={confirmAddToGarden}
                disabled={!selectedGarden}
              >
                Add to Garden
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setShowGardenDialog(false);
                  createGardenAndAddPlant(plantToAdd);
                }}
              >
                Create Garden & Add Plant
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default BrowsePlants;
