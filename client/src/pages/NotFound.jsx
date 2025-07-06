import React from "react";
import { Container, Typography, Button, Box, Paper } from "@mui/material";
import { Home as HomeIcon, ArrowBack as BackIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import usePageTitle from "../hooks/usePageTitle";

const NotFound = () => {
  usePageTitle("Page Not Found");

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGoHome = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
          textAlign: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            maxWidth: "500px",
            width: "100%",
          }}
        >
          {/* Large 404 */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "4rem", md: "6rem" },
              fontWeight: "bold",
              color: "primary.main",
              mb: 2,
            }}
          >
            404
          </Typography>

          {/* Plant emoji */}
          <Typography variant="h2" sx={{ mb: 3 }}>
            🌵
          </Typography>

          {/* Error message */}
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            fontWeight="bold"
          >
            Oops! Page Not Found
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Looks like this page got lost in the garden! The page you're looking
            for doesn't exist or may have been moved.
          </Typography>

          {/* Action buttons */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              size="large"
            >
              {isAuthenticated ? "Go to Dashboard" : "Go Home"}
            </Button>

            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={handleGoBack}
              size="large"
            >
              Go Back
            </Button>
          </Box>
        </Paper>

        {/* Additional help text */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          If you think this is an error, please contact support.
        </Typography>
      </Box>
    </Container>
  );
};

export default NotFound;
