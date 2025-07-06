import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // API base URL
  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Configure axios defaults for API requests
  axios.defaults.baseURL = "";
  axios.defaults.headers.common["Content-Type"] = "application/json";
  axios.defaults.withCredentials = true;

  // Global axios interceptor for connection errors
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle connection errors silently for non-critical requests
        if (
          error.code === "ERR_NETWORK" ||
          error.code === "ECONNREFUSED" ||
          error.message.includes("ECONNREFUSED") ||
          error.message === "Network Error"
        ) {
          console.warn("Backend connection failed:", error.message);
          setIsOnline(false);

          // Return a rejected promise but with a more user-friendly error
          return Promise.reject({
            ...error,
            isConnectionError: true,
            userMessage: "Unable to connect to server. Please try again later.",
          });
        }
        return Promise.reject(error);
      }
    );

    // Cleanup function to remove interceptor
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Add token to requests if available
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("AuthContext - checking auth, token:", token);
        if (token) {
          setAuthToken(token);

          // Try to verify token with server
          const response = await axios.get(`${API_BASE_URL}/auth/me`, {
            timeout: 5000, // 5 second timeout
          });

          console.log("AuthContext - auth response:", response.data);
          setUser(response.data.data.user);
          setIsOnline(true); // Successfully connected
          console.log("AuthContext - user set:", response.data.data.user);
        }
      } catch (error) {
        console.warn("Auth check failed (possibly offline):", error.message);

        // If we have a token but can't verify it (e.g., offline),
        // keep the user in a "potentially authenticated" state
        const token = localStorage.getItem("token");
        if (
          token &&
          (error.code === "ERR_NETWORK" ||
            error.code === "NETWORK_ERROR" ||
            error.code === "ECONNREFUSED" ||
            error.message === "Network Error" ||
            error.message.includes("ECONNREFUSED"))
        ) {
          console.log("Network error - keeping existing auth state");
          setIsOnline(false);
          // Keep existing auth but don't remove token (offline mode)
        } else {
          // Only remove token for actual auth errors (not network errors)
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
          setUser(null);
          setIsOnline(true);
        }
      } finally {
        setLoading(false);
      }
    };

    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setAuthToken(storedToken);
    }
    checkAuth();
  }, [API_BASE_URL]);

  const setAuthToken = (tokenValue) => {
    if (tokenValue) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${tokenValue}`;
      localStorage.setItem("token", tokenValue);
      setToken(tokenValue);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
      setToken(null);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        {
          email,
          password,
        },
        {
          timeout: 10000, // 10 second timeout for login
        }
      );

      const { token, data } = response.data;
      const { user } = data;

      setAuthToken(token);
      setUser(user);

      return { success: true, user };
    } catch (error) {
      let message;

      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          message = error.response.data?.message || "Invalid email or password";
        } else if (error.response.status === 400) {
          message = error.response.data?.message || "Invalid request";
        } else {
          message = error.response.data?.message || "Login failed";
        }
        setIsOnline(true);
      } else if (
        error.code === "ERR_NETWORK" ||
        error.code === "ECONNREFUSED" ||
        error.message === "Network Error" ||
        error.message.includes("ECONNREFUSED")
      ) {
        message =
          "Cannot connect to server. Please ensure the backend server is running on port 5000.";
        setIsOnline(false);
      } else if (error.code === "ECONNABORTED") {
        message = "Login request timed out. Please try again.";
      } else {
        message = "An unexpected error occurred. Please try again.";
        setIsOnline(false);
      }

      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await axios.post(
        `${API_BASE_URL}/auth/register`,
        userData,
        {
          timeout: 10000, // 10 second timeout for registration
        }
      );

      const { token, data } = response.data;
      const { user } = data;

      setAuthToken(token);
      setUser(user);

      return { success: true, user };
    } catch (error) {
      let message;

      if (error.response) {
        // Server responded with error status
        if (error.response.status === 400) {
          message = error.response.data?.message || "Registration failed";
        } else {
          message = error.response.data?.message || "Registration failed";
        }
        setIsOnline(true);
      } else if (
        error.code === "ERR_NETWORK" ||
        error.code === "ECONNREFUSED" ||
        error.message === "Network Error" ||
        error.message.includes("ECONNREFUSED")
      ) {
        message =
          "Cannot connect to server. Please ensure the backend server is running on port 5000.";
        setIsOnline(false);
      } else if (error.code === "ECONNABORTED") {
        message = "Registration request timed out. Please try again.";
      } else {
        message = "An unexpected error occurred. Please try again.";
        setIsOnline(false);
      }

      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setError(null);
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);

      const response = await axios.put(`${API_BASE_URL}/auth/me`, profileData);
      setUser(response.data.data.user);

      return { success: true, user: response.data.data.user };
    } catch (error) {
      const message = error.response?.data?.message || "Profile update failed";
      setError(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);

      await axios.put(`${API_BASE_URL}/auth/update-password`, {
        currentPassword,
        newPassword,
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Password change failed";
      setError(message);
      return { success: false, error: message };
    }
  };

  const uploadAvatar = async (file) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await axios.post(
        `${API_BASE_URL}/users/avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUser(response.data.data);

      return { success: true, user: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || "Avatar upload failed";
      setError(message);
      return { success: false, error: message };
    }
  };

  const deleteAccount = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/auth/delete-account`);

      // Clear user data and logout
      setUser(null);
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Account deletion failed";
      setError(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    isOnline,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAccount,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isSupervisor: user?.role === "supervisor" || user?.role === "gardener",
    isGardener: user?.role === "gardener" || user?.role === "supervisor",
    isHomeOwner: user?.role === "homeowner",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
