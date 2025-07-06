import React, { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Chip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  LocalFlorist as PlantIcon,
  Yard as GardenIcon,
  Forum as CommunityIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  AdminPanelSettings as AdminIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Logout,
  MenuBook as MenuBookIcon,
  SupervisorAccount as SupervisorIcon,
  Schedule as RemindersIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import { useRole } from "../../hooks/useRole";

const drawerWidth = 240;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { user, logout } = useAuth();
  const { getUnreadCount } = useNotification();
  const { canAccess } = useRole();

  // Role-based menu items
  const getAllMenuItems = () => {
    const baseItems = [
      {
        text: "Dashboard",
        icon: <DashboardIcon />,
        path: "/dashboard",
        roles: ["admin", "supervisor", "homeowner", "gardener"],
      },
      {
        text: "Plants",
        icon: <PlantIcon />,
        path: "/plants",
        roles: ["admin", "supervisor", "homeowner", "gardener"],
      },
      {
        text: "My Plants",
        icon: <GardenIcon />,
        path: "/my-plants",
        roles: ["homeowner", "gardener"],
      },
      {
        text: "Community",
        icon: <CommunityIcon />,
        path: "/community",
        roles: ["admin", "supervisor", "homeowner", "gardener"],
      },
      {
        text: "Gardening Advice & Reminders",
        icon: <RemindersIcon />,
        path: "/gardening-advice",
        roles: ["homeowner", "gardener"],
      },
    ];

    const supervisorItems = [
      {
        text: "Supervisor Dashboard",
        icon: <SupervisorIcon />,
        path: "/supervisor",
        roles: ["admin", "supervisor", "gardener"],
      },
    ];

    const adminItems = [
      {
        text: "Admin Panel",
        icon: <AdminIcon />,
        path: "/admin",
        roles: ["admin"],
      },
      {
        text: "User Management",
        icon: <PeopleIcon />,
        path: "/admin/users",
        roles: ["admin"],
      },
      {
        text: "System Settings",
        icon: <SettingsIcon />,
        path: "/admin/settings",
        roles: ["admin"],
      },
    ];

    return [...baseItems, ...supervisorItems, ...adminItems];
  };

  // Filter menu items based on user role
  const menuItems = getAllMenuItems().filter((item) => canAccess(item.roles));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    handleMenuClose();
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            fontSize: { xs: "1.125rem", sm: "1.25rem" },
            fontWeight: 600,
          }}
        >
          🌱 GardenCare
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, py: { xs: 1, sm: 2 } }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            disablePadding
            sx={{ px: { xs: 1, sm: 2 } }}
          >
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                  "& .MuiListItemIcon-root": {
                    color: "primary.contrastText",
                  },
                },
                "&:hover": {
                  backgroundColor: "action.hover",
                  borderRadius: 2,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: { xs: 40, sm: 56 },
                  color:
                    location.pathname === item.path
                      ? "inherit"
                      : "action.active",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: "background.paper",
          color: "text.primary",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 1px 3px rgba(0,0,0,0.3)"
              : "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: { xs: "1rem", sm: "1.25rem" },
              fontWeight: 500,
            }}
          >
            {menuItems.find((item) => item.path === location.pathname)?.text ||
              "GardenCare"}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 2 },
            }}
          >
            <IconButton
              color="inherit"
              sx={{
                p: { xs: 1, sm: 1.5 },
              }}
            >
              <Badge badgeContent={getUnreadCount()} color="error">
                <NotificationsIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              </Badge>
            </IconButton>

            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
              sx={{ p: { xs: 0.5, sm: 1 } }}
            >
              <Avatar
                src={user?.avatar}
                alt={user?.name}
                sx={{
                  width: { xs: 28, sm: 32 },
                  height: { xs: 28, sm: 32 },
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {user?.name}
              </Typography>
              <Chip
                label={
                  user?.role
                    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                    : "User"
                }
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                navigate("/profile");
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                navigate("/settings");
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          backgroundColor: "background.default",
        }}
      >
        <Toolbar />
        <Box sx={{ mt: { xs: 1, sm: 2 } }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default Layout;
