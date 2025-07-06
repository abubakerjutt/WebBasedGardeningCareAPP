import React, { createContext, useContext, useState, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user) {
      // Use relative URL to leverage Vite proxy
      const socketURL = import.meta.env.VITE_SOCKET_URL || "/";
      const newSocket = io(socketURL, {
        auth: {
          token: localStorage.getItem("token"),
        },
        timeout: 5000, // 5 second timeout
        autoConnect: false, // Don't auto-connect to prevent errors
        path: "/socket.io" // Ensure path is correct
      });

      // Try to connect and handle errors gracefully
      newSocket.connect();

      newSocket.on("connect", () => {
        console.log("Connected to notifications server");
      });

      newSocket.on("connect_error", (error) => {
        console.warn(
          "WebSocket connection failed (server not running):",
          error.message
        );
        // Don't spam console with errors, fail silently
      });

      newSocket.on("notification", (notification) => {
        addNotification(notification);
        showSnackbar(notification.message, "info");
      });

      newSocket.on("reminder", (reminder) => {
        showSnackbar(`Reminder: ${reminder.message}`, "warning");
      });

      newSocket.on("alert", (alert) => {
        showSnackbar(`Alert: ${alert.message}`, "error");
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from notifications server");
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
      };
    }
  }, [isAuthenticated, user]);

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification,
    };

    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (notificationId) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== notificationId)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const showSnackbar = (message, severity = "info", duration = 6000) => {
    setSnackbar({
      open: true,
      message,
      severity,
      duration,
    });
  };

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const showSuccess = (message) => showSnackbar(message, "success");
  const showError = (message) => showSnackbar(message, "error");
  const showWarning = (message) => showSnackbar(message, "warning");
  const showInfo = (message) => showSnackbar(message, "info");

  const getUnreadCount = () => {
    return notifications.filter((n) => !n.read).length;
  };

  const value = {
    notifications,
    socket,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    showSnackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    getUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Global Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.duration}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={hideSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
