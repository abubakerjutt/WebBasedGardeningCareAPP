// Simple location service
export const locationService = {
  // Get user's current position
  getCurrentPosition: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          timeout: 10000,
        }
      );
    });
  },

  // Format location for display
  formatLocation: (location) => {
    if (!location) return "Unknown Location";

    if (location.name && location.country) {
      return `${location.name}, ${location.country}`;
    }

    if (location.name) {
      return location.name;
    }

    if (location.lat && location.lon) {
      return `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`;
    }

    return "Unknown Location";
  },

  // Check if location services are available
  isGeolocationAvailable: () => {
    return "geolocation" in navigator;
  },

  // Get location with fallback
  getLocationWithFallback: async () => {
    try {
      return await locationService.getCurrentPosition();
    } catch (error) {
      console.warn("Could not get user location:", error.message);
      // Return null so API can use default location
      return null;
    }
  },
};

export default locationService;
