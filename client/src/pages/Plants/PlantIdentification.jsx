import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  CameraAlt as CameraIcon,
  CloudUpload as UploadIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  Lightbulb as TipIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import usePageTitle from "../../hooks/usePageTitle";

const PlantIdentification = () => {
  usePageTitle("Plant Identification");

  const { token } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    headers: {
      "Content-Type": "multipart/form-data",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleIdentify = async () => {
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("image", selectedImage);

      const response = await api.post("/care/identify", formData);

      if (response.data.success) {
        setResult(response.data.data);
      } else {
        setError(response.data.message || "Identification failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to identify plant");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
  };

  const identificationTips = [
    "Take a clear, well-lit photo of the plant",
    "Include distinctive features like leaves, flowers, or fruits",
    "Avoid blurry or shadowy images",
    "Try to capture the entire plant or a representative part",
    "Multiple angles can help improve accuracy",
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight="bold" mb={3}>
        Plant Identification
      </Typography>

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Plant Image
            </Typography>

            {!imagePreview ? (
              <Box
                sx={{
                  border: "2px dashed #ccc",
                  borderRadius: 2,
                  p: 4,
                  textAlign: "center",
                  minHeight: 300,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "primary.main",
                    backgroundColor: "action.hover",
                  },
                }}
                onClick={() => document.getElementById("image-upload").click()}
              >
                <CameraIcon
                  sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  Click to Upload Image
                </Typography>
                <Typography color="text.secondary">
                  or drag and drop your plant photo here
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  sx={{ mt: 2 }}
                >
                  Choose File
                </Button>
              </Box>
            ) : (
              <Box>
                <Card sx={{ mb: 2 }}>
                  <CardMedia
                    component="img"
                    height="300"
                    image={imagePreview}
                    alt="Plant to identify"
                    sx={{ objectFit: "cover" }}
                  />
                </Card>
                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    onClick={handleIdentify}
                    disabled={loading}
                    startIcon={
                      loading ? <CircularProgress size={20} /> : <SearchIcon />
                    }
                    fullWidth
                  >
                    {loading ? "Identifying..." : "Identify Plant"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    Reset
                  </Button>
                </Box>
              </Box>
            )}

            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: "none" }}
            />
          </Paper>
        </Grid>

        {/* Tips Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              <TipIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Tips for Better Results
            </Typography>
            <List>
              {identificationTips.map((tip, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon>
                    <InfoIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={tip} />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* AI Service Status */}
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>AI Plant Identification Coming Soon!</strong>
              <br />
              We're working on integrating advanced AI models for accurate plant
              identification. Current features include basic plant database
              matching.
            </Typography>
          </Alert>
        </Grid>

        {/* Results Section */}
        {(result || error) && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Identification Results
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {result && (
                <Box>
                  {result.identification ? (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={8}>
                        <Card>
                          <CardContent>
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="flex-start"
                              mb={2}
                            >
                              <Typography variant="h5">
                                {result.identification.commonName}
                              </Typography>
                              <Chip
                                label={`${(result.confidence * 100).toFixed(
                                  1
                                )}% confidence`}
                                color={
                                  result.confidence > 0.8
                                    ? "success"
                                    : result.confidence > 0.5
                                    ? "warning"
                                    : "error"
                                }
                              />
                            </Box>

                            {result.identification.scientificName && (
                              <Typography
                                variant="subtitle1"
                                color="text.secondary"
                                sx={{ fontStyle: "italic", mb: 2 }}
                              >
                                {result.identification.scientificName}
                              </Typography>
                            )}

                            {result.identification.description && (
                              <Typography variant="body1" paragraph>
                                {result.identification.description}
                              </Typography>
                            )}

                            {result.identification.careInstructions && (
                              <Box>
                                <Typography variant="h6" gutterBottom>
                                  Care Instructions
                                </Typography>
                                <Typography variant="body2">
                                  {result.identification.careInstructions}
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        {result.identification.characteristics && (
                          <Card>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                Plant Characteristics
                              </Typography>
                              {/* Add characteristics display here */}
                            </CardContent>
                          </Card>
                        )}
                      </Grid>
                    </Grid>
                  ) : (
                    <Alert severity="info">
                      <Typography variant="body1" gutterBottom>
                        {result.message}
                      </Typography>
                      {result.suggestions && result.suggestions.length > 0 && (
                        <Box>
                          <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                            Suggestions:
                          </Typography>
                          <List dense>
                            {result.suggestions.map((suggestion, index) => (
                              <ListItem key={index} sx={{ py: 0 }}>
                                <ListItemText primary={`• ${suggestion}`} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </Alert>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PlantIdentification;
