import { useAuth } from "../contexts/AuthContext";

// Hook to check if user has specific role(s)
export const useRole = () => {
  const { user } = useAuth();

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === "string") roles = [roles];
    return roles.includes(user.role);
  };

  const isAdmin = () => hasRole("admin");
  const isSupervisor = () => hasRole(["admin", "supervisor", "gardener"]);
  const isHomeowner = () =>
    hasRole(["admin", "supervisor", "homeowner", "gardener"]);
  const isGardener = () =>
    hasRole(["admin", "supervisor", "homeowner", "gardener"]);

  const canAccess = (requiredRoles) => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return hasRole(requiredRoles);
  };

  return {
    user,
    userRole: user?.role,
    hasRole,
    isAdmin,
    isSupervisor,
    isHomeowner,
    isGardener,
    canAccess,
  };
};

// Navigation items with role-based access
export const getNavigationItems = (userRole) => {
  const baseItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "Dashboard",
      roles: ["admin", "supervisor", "homeowner", "gardener"],
    },
    {
      name: "Plants",
      path: "/plants",
      icon: "LocalFlorist",
      roles: ["admin", "supervisor", "homeowner", "gardener"],
    },
    {
      name: "Weather",
      path: "/weather",
      icon: "WbSunny",
      roles: ["admin", "supervisor", "homeowner", "gardener"],
    },
    {
      name: "Community",
      path: "/community",
      icon: "Forum",
      roles: ["admin", "supervisor", "homeowner", "gardener"],
    },
  ];

  const adminItems = [
    {
      name: "Admin Panel",
      path: "/admin",
      icon: "AdminPanelSettings",
      roles: ["admin"],
    },
    {
      name: "User Management",
      path: "/admin/users",
      icon: "People",
      roles: ["admin"],
    },
    {
      name: "Plant Management",
      path: "/admin/plants",
      icon: "LocalFlorist",
      roles: ["admin"],
    },
    {
      name: "System Settings",
      path: "/admin/settings",
      icon: "Settings",
      roles: ["admin"],
    },
  ];

  const supervisorItems = [
    {
      name: "Care Reports",
      path: "/supervisor/reports",
      icon: "Assessment",
      roles: ["admin", "supervisor"],
    },
  ];

  const allItems = [...baseItems, ...supervisorItems, ...adminItems];

  // Filter items based on user role
  return allItems.filter((item) => item.roles.includes(userRole));
};

// Role-based feature permissions
export const getFeaturePermissions = (userRole) => {
  const permissions = {
    // Plant management
    canCreatePlant: ["admin", "supervisor"].includes(userRole),
    canEditPlant: ["admin", "supervisor"].includes(userRole),
    canDeletePlant: ["admin"].includes(userRole),
    canViewAllPlants: ["admin", "supervisor", "homeowner", "gardener"].includes(
      userRole
    ),

    // User management
    canViewUsers: ["admin"].includes(userRole),
    canEditUsers: ["admin"].includes(userRole),
    canDeleteUsers: ["admin"].includes(userRole),
    canChangeUserRoles: ["admin"].includes(userRole),

    // Community features
    canModerateContent: ["admin", "supervisor"].includes(userRole),
    canDeletePosts: ["admin", "supervisor"].includes(userRole),
    canBanUsers: ["admin"].includes(userRole),

    // Educational content
    canCreateContent: ["admin", "supervisor"].includes(userRole),
    canEditContent: ["admin", "supervisor"].includes(userRole),
    canDeleteContent: ["admin"].includes(userRole),

    // System settings
    canAccessAdminPanel: ["admin"].includes(userRole),
    canChangeSystemSettings: ["admin"].includes(userRole),
    canViewAnalytics: ["admin", "supervisor"].includes(userRole),

    // Weather and care recommendations
    canViewWeather: ["admin", "supervisor", "homeowner", "gardener"].includes(
      userRole
    ),
    canSetLocation: ["admin", "supervisor", "homeowner", "gardener"].includes(
      userRole
    ),
  };

  return permissions;
};

export default useRole;
