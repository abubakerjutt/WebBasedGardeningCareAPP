import React from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  LocalFlorist as PlantIcon,
  Yard as GardenIcon,
  Cloud as WeatherIcon,
  People as CommunityIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import usePageTitle from "../hooks/usePageTitle";

const Home = () => {
  usePageTitle("Plant Management & Care Solutions");

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <PlantIcon sx={{ fontSize: 32, color: "success.main" }} />,
      title: "Plant Database",
      description:
        "Comprehensive database of plants with care instructions, growing tips, and personalized recommendations.",
    },
    {
      icon: <GardenIcon sx={{ fontSize: 32, color: "primary.main" }} />,
      title: "Garden Management",
      description:
        "Track your gardens, monitor plant health, set reminders, and log care activities.",
    },
    {
      icon: <WeatherIcon sx={{ fontSize: 32, color: "info.main" }} />,
      title: "Weather Integration",
      description:
        "Get real-time weather updates, forecasts, and gardening advice based on local conditions.",
    },
    {
      icon: <CommunityIcon sx={{ fontSize: 32, color: "warning.main" }} />,
      title: "Community",
      description:
        "Connect with other gardeners, share experiences, and get expert advice from the community.",
    },
  ];

  return (
    <Box>
      {/* Navigation Bar */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            🌱 GardenCare
          </Typography>
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
            {isAuthenticated ? (
              <Button
                color="primary"
                variant="contained"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button color="primary" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  onClick={() => navigate("/register")}
                >
                  Get Started
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: "#43a047",
          color: "white",
          py: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant={isMobile ? "h3" : "h2"}
                component="h1"
                fontWeight="bold"
                gutterBottom
                sx={{ color: "white" }}
              >
                Your Smart Gardening Companion
              </Typography>
              <Typography
                variant="h6"
                sx={{ mb: 4, opacity: 1, color: "rgba(255,255,255,0.95)" }}
              >
                Discover, plant, and nurture your garden with AI-powered
                insights, weather integration, and a supportive community of
                fellow gardeners.
              </Typography>
              <Typography variant="h2" sx={{ opacity: 0.7 }}>
                🌺🌿🌱
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {isAuthenticated ? (
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: "white",
                      color: "primary.main",
                      "&:hover": { bgcolor: "grey.100" },
                    }}
                    onClick={() => navigate("/dashboard")}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      sx={{
                        bgcolor: "white",
                        color: "primary.main",
                        "&:hover": { bgcolor: "grey.100" },
                      }}
                      onClick={() => navigate("/register")}
                    >
                      Start Gardening
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      sx={{
                        borderColor: "white",
                        color: "white",
                        "&:hover": {
                          borderColor: "grey.300",
                          bgcolor: "rgba(255,255,255,0.1)",
                        },
                      }}
                      onClick={() => navigate("/login")}
                    >
                      Login
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: { xs: 200, md: 400 },
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 2,
                  backdropFilter: "blur(10px)",
                }}
              ></Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Typography
            variant="h4"
            component="h2"
            fontWeight="700"
            gutterBottom
            sx={{ color: "text.primary", mb: 2 }}
          >
            Everything You Need for Successful Gardening
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: "auto" }}
          >
            Comprehensive tools and features designed to help you grow
            beautiful, healthy gardens
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: "100%",
                  textAlign: "center",
                  border: "1px solid rgba(0,0,0,0.08)",
                  width: "560px",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      mb: 1.5,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: 56,
                      height: 56,
                      bgcolor: "grey.50",
                      mx: "auto",
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    component="h3"
                    fontWeight="600"
                    gutterBottom
                    sx={{ fontSize: "1.1rem", color: "text.primary" }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      {!isAuthenticated && (
        <Box sx={{ bgcolor: "#43a047", py: 8 }}>
          <Container maxWidth="md" sx={{ textAlign: "center" }}>
            <Typography
              variant="h4"
              component="h2"
              fontWeight="bold"
              gutterBottom
            >
              Ready to Transform Your Garden?
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Join thousands of gardeners who are already growing better with
              GardenCare.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/register")}
              sx={{ px: 4, py: 1.5 }}
            >
              Get Started Free
            </Button>
          </Container>
        </Box>
      )}

      {/* Footer */}
      <Box sx={{ bgcolor: "grey.900", color: "white", py: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" textAlign="center">
            © 2025 GardenCare. Made with 💚 for gardeners everywhere.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
