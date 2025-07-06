import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PhotoCamera as CameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";
import usePageTitle from "../../hooks/usePageTitle";
import axios from "axios";

const AddPlant = () => {
  usePageTitle("Add New Plant");

  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // API configuration - use axios directly since auth context manages headers
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const [plantData, setPlantData] = useState({
    // Basic Information
    name: "",
    scientificName: "",
    category: "",
    type: "perennial", // Default type
    description: "",

    // Characteristics
    characteristics: {
      height: {
        min: "",
        max: "",
      },
      width: {
        min: "",
        max: "",
      },
      sunRequirement: "full-sun",
      waterNeeds: "moderate",
      soilType: [],
    },

    // Care Instructions
    careInstructions: {
      watering: {
        frequency: "",
        instructions: "",
      },
      fertilizing: {
        frequency: "",
        instructions: "",
      },
      pruning: {
        frequency: "",
        instructions: "",
      },
    },

    // Additional fields
    difficulty: "moderate",
    tags: [],
  });

  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState([]);

  const steps = [
    "Basic Information",
    "Characteristics",
    "Care Instructions",
    "Additional Information",
  ];

  const categories = [
    "fruit",
    "vegetable",
    "flower",
    "herb",
    "tree",
    "shrub",
    "succulent",
  ];

  const plantTypes = ["annual", "perennial", "biennial"];

  const sunRequirements = [
    "full-sun",
    "partial-sun",
    "partial-shade",
    "full-shade",
  ];

  const waterNeeds = ["low", "moderate", "high"];

  const soilTypes = ["clay", "sandy", "loamy", "silty", "peaty", "chalky"];

  const difficulties = ["easy", "moderate", "difficult"];

  const handleInputChange = (field, value) => {
    const keys = field.split(".");

    if (keys.length === 1) {
      setPlantData((prev) => ({
        ...prev,
        [field]: value,
      }));
    } else if (keys.length === 2) {
      setPlantData((prev) => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: value,
        },
      }));
    } else if (keys.length === 3) {
      setPlantData((prev) => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: {
            ...prev[keys[0]][keys[1]],
            [keys[2]]: value,
          },
        },
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const addTag = () => {
    if (newTag.trim()) {
      setPlantData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (index) => {
    setPlantData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleSoilTypeChange = (soilType) => {
    const currentSoilTypes = [...plantData.characteristics.soilType];
    const index = currentSoilTypes.indexOf(soilType);

    if (index === -1) {
      // Add soil type
      currentSoilTypes.push(soilType);
    } else {
      // Remove soil type
      currentSoilTypes.splice(index, 1);
    }

    handleInputChange("characteristics.soilType", currentSoilTypes);
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Basic Information
        if (!plantData.name.trim()) newErrors.name = "Plant name is required";
        if (!plantData.category) newErrors.category = "Category is required";
        if (!plantData.type) newErrors.type = "Plant type is required";
        if (!plantData.description.trim())
          newErrors.description = "Description is required";
        break;
      case 1: // Characteristics
        if (!plantData.characteristics.sunRequirement)
          newErrors["characteristics.sunRequirement"] =
            "Sunlight requirement is required";
        if (!plantData.characteristics.waterNeeds)
          newErrors["characteristics.waterNeeds"] = "Water needs is required";
        break;
      case 2: // Care Instructions
        if (!plantData.careInstructions.watering.instructions)
          newErrors["careInstructions.watering.instructions"] =
            "Watering instructions are required";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setLoading(true);
    try {
      // Ensure required characteristics are set
      const characteristics = {
        ...plantData.characteristics,
        sunRequirement: plantData.characteristics.sunRequirement || "full-sun", // Default value
        waterNeeds: plantData.characteristics.waterNeeds || "moderate", // Default value
        soilType: plantData.characteristics.soilType || []
      };
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add plant data
      formData.append('name', plantData.name);
      formData.append('scientificName', plantData.scientificName || '');
      formData.append('category', plantData.category);
      formData.append('type', plantData.type);
      formData.append('description', plantData.description);
      
      // Add characteristics as a JSON string (do not stringify twice)
      formData.append('characteristics', JSON.stringify(characteristics));
      
      // Add care instructions
      formData.append('careInstructions', JSON.stringify(plantData.careInstructions));
      
      // Add difficulty and tags
      formData.append('difficulty', plantData.difficulty);
      formData.append('tags', JSON.stringify(plantData.tags));
      
      // Add files
      files.forEach((file) => {
        formData.append('images', file);
      });

      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Submit plant to server with authorization header
      const response = await axios.post(`${API_URL}/plants`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (response.data.success) {
        showSuccess("Plant added successfully to the database!");
        setTimeout(() => {
          navigate("/plants");
        }, 2000);
      } else {
        showError("Failed to add plant");
      }
    } catch (error) {
      console.error("Error adding plant:", error);
      showError(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Plant Name"
                value={plantData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Scientific Name"
                value={plantData.scientificName}
                onChange={(e) =>
                  handleInputChange("scientificName", e.target.value)
                }
                placeholder="e.g., Monstera deliciosa"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={plantData.category}
                  label="Category"
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.type}>
                <InputLabel>Plant Type</InputLabel>
                <Select
                  value={plantData.type}
                  label="Plant Type"
                  onChange={(e) => handleInputChange("type", e.target.value)}
                >
                  {plantTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={plantData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                multiline
                rows={3}
                placeholder="Describe the plant's appearance, characteristics, or any special notes"
                error={!!errors.description}
                helperText={errors.description}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Upload Plant Images
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
              >
                Upload Images
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
              </Button>
              {files.length > 0 && (
                <Typography variant="body2" mt={1}>
                  {files.length} file(s) selected
                </Typography>
              )}
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                required
                error={!!errors["characteristics.sunRequirement"]}
              >
                <InputLabel>Sunlight Requirements</InputLabel>
                <Select
                  value={plantData.characteristics.sunRequirement}
                  label="Sunlight Requirements"
                  onChange={(e) =>
                    handleInputChange(
                      "characteristics.sunRequirement",
                      e.target.value
                    )
                  }
                >
                  {sunRequirements.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option.replace(/-/g, " ")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                required
                error={!!errors["characteristics.waterNeeds"]}
              >
                <InputLabel>Water Needs</InputLabel>
                <Select
                  value={plantData.characteristics.waterNeeds}
                  label="Water Needs"
                  onChange={(e) =>
                    handleInputChange(
                      "characteristics.waterNeeds",
                      e.target.value
                    )
                  }
                >
                  {waterNeeds.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Soil Types (select all that apply)
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {soilTypes.map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    clickable
                    onClick={() => handleSoilTypeChange(type)}
                    color={
                      plantData.characteristics.soilType.includes(type)
                        ? "primary"
                        : "default"
                    }
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Min Height (cm)"
                type="number"
                value={plantData.characteristics.height.min}
                onChange={(e) =>
                  handleInputChange(
                    "characteristics.height.min",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Height (cm)"
                type="number"
                value={plantData.characteristics.height.max}
                onChange={(e) =>
                  handleInputChange(
                    "characteristics.height.max",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Min Width (cm)"
                type="number"
                value={plantData.characteristics.width.min}
                onChange={(e) =>
                  handleInputChange("characteristics.width.min", e.target.value)
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Width (cm)"
                type="number"
                value={plantData.characteristics.width.max}
                onChange={(e) =>
                  handleInputChange("characteristics.width.max", e.target.value)
                }
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Watering Frequency"
                value={plantData.careInstructions.watering.frequency}
                onChange={(e) =>
                  handleInputChange(
                    "careInstructions.watering.frequency",
                    e.target.value
                  )
                }
                placeholder="e.g., Once a week, Every 3-5 days"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Watering Instructions"
                value={plantData.careInstructions.watering.instructions}
                onChange={(e) =>
                  handleInputChange(
                    "careInstructions.watering.instructions",
                    e.target.value
                  )
                }
                multiline
                rows={2}
                placeholder="Detailed watering instructions"
                error={!!errors["careInstructions.watering.instructions"]}
                helperText={errors["careInstructions.watering.instructions"]}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fertilizing Frequency"
                value={plantData.careInstructions.fertilizing.frequency}
                onChange={(e) =>
                  handleInputChange(
                    "careInstructions.fertilizing.frequency",
                    e.target.value
                  )
                }
                placeholder="e.g., Once a month during growing season"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fertilizing Instructions"
                value={plantData.careInstructions.fertilizing.instructions}
                onChange={(e) =>
                  handleInputChange(
                    "careInstructions.fertilizing.instructions",
                    e.target.value
                  )
                }
                multiline
                rows={2}
                placeholder="Detailed fertilizing instructions"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pruning Frequency"
                value={plantData.careInstructions.pruning.frequency}
                onChange={(e) =>
                  handleInputChange(
                    "careInstructions.pruning.frequency",
                    e.target.value
                  )
                }
                placeholder="e.g., Annually in early spring"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pruning Instructions"
                value={plantData.careInstructions.pruning.instructions}
                onChange={(e) =>
                  handleInputChange(
                    "careInstructions.pruning.instructions",
                    e.target.value
                  )
                }
                multiline
                rows={2}
                placeholder="Detailed pruning instructions"
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Difficulty Level</InputLabel>
                <Select
                  value={plantData.difficulty}
                  label="Difficulty Level"
                  onChange={(e) =>
                    handleInputChange("difficulty", e.target.value)
                  }
                >
                  {difficulties.map((difficulty) => (
                    <MenuItem key={difficulty} value={difficulty}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Tags
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  label="Add tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="e.g., air-purifying, pet-friendly"
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                />
                <Button
                  variant="outlined"
                  onClick={addTag}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Box>

              <Box display="flex" gap={1} flexWrap="wrap">
                {plantData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => removeTag(index)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h4" component="h1" fontWeight="bold" mb={2}>
          Add New Plant to Database
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={4}>
          Create a new plant entry in the system database
        </Typography>

        <Paper sx={{ p: 3 }}>
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          <Box mb={4}>{renderStepContent()}</Box>

          {/* Navigation Buttons */}
          <Box display="flex" justifyContent="space-between">
            <Button
              onClick={() => navigate("/plants")}
              startIcon={<CancelIcon />}
            >
              Cancel
            </Button>

            <Box display="flex" gap={2}>
              {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}

              {activeStep < steps.length - 1 ? (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  startIcon={
                    loading ? <CircularProgress size={20} /> : <SaveIcon />
                  }
                  disabled={loading}
                >
                  {loading ? "Adding Plant..." : "Add to Database"}
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AddPlant;
