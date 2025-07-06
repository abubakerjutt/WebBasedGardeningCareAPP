import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  CameraAlt as CameraIcon,
  MenuBook as BookIcon,
  WbSunny as SunIcon,
  Add as AddIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import usePageTitle from "../../hooks/usePageTitle";

const Plants = () => {
  usePageTitle("Plants & Garden Database");

  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const features = [
    {
      title: "Browse Plant Database",
      description:
        "Explore our comprehensive collection of plants with detailed care instructions and characteristics.",
      icon: <SearchIcon sx={{ fontSize: 24 }} />,
      action: () => navigate("/plants/browse"),
      color: "primary",
    },
    {
      title: "Plant Identification",
      description:
        "Use AI-powered image recognition to identify plants from photos.",
      icon: <CameraIcon sx={{ fontSize: 24 }} />,
      action: () => navigate("/plants/identify"),
      color: "secondary",
    },
  ];

  // Add admin-specific features if user is admin
  const adminFeatures = [
    {
      title: "Add Plant to Database",
      description:
        "Add new plant species to the database with detailed information and care instructions.",
      icon: <AddIcon sx={{ fontSize: 24 }} />,
      action: () => navigate("/plants/add"),
      color: "success",
    },
  ];

  const allFeatures = isAdmin ? [...features, ...adminFeatures] : features;

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 2 } }}>
      {/* Header Section */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h4"
          component="h1"
          fontWeight="bold"
          color="primary.main"
          gutterBottom
        >
          Plants
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover, identify, and care for your plants
        </Typography>
      </Box>

      {/* Main Features */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        {allFeatures.map((feature, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
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
              onClick={feature.action}
            >
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    mb: 2,
                    color: `${feature.color}.main`,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                <Button size="small" color={feature.color}>
                  Get Started
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      {/* Today's Plant Care Tips */}
      <Card
        sx={{
          borderRadius: 2,
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)"
              : "linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: { xs: 2, sm: 3 },
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                borderRadius: "50%",
                bgcolor: "success.main",
                color: "white",
              }}
            >
              <SunIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </Box>
            <Typography
              variant="h6"
              component="h2"
              sx={{
                fontSize: { xs: "1.125rem", sm: "1.25rem" },
                fontWeight: 600,
                color: "success.main",
              }}
            >
              Today's Plant Care Tips
            </Typography>
          </Box>

          <Alert
            severity="info"
            sx={{
              mb: { xs: 2, sm: 3 },
              borderRadius: 1.5,
            }}
          >
            Weather conditions can greatly affect your plant care routine. Here
            are today's recommendations:
          </Alert>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: { xs: 2, sm: 2.5 },
            }}
          >
            <Box>
              <Typography
                variant="subtitle2"
                color="success.main"
                sx={{ fontWeight: 600, mb: 1 }}
              >
                🌡️ Temperature Care
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Based on current weather, consider adjusting watering schedules
                and protecting sensitive plants.
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="subtitle2"
                color="info.main"
                sx={{ fontWeight: 600, mb: 1 }}
              >
                💧 Watering Guidance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check soil moisture levels and adjust watering based on humidity
                and temperature conditions.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Plants;
