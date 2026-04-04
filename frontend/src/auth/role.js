export const ROLES = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF_MEMBER: "Staff Member",
  RECEPTIONIST: "Receptionist",
  RESTAURANT_MANAGER: "Restaurant Manager",
  EVENT_MANAGER: "Event Manager",
  CUSTOMER: "Customer",
  HOUSEKEEPER: "Housekeeper",
  MAINTENANCE_STAFF: "Maintenance Staff",
};

export const roomServiceRoles = [ROLES.HOUSEKEEPER, ROLES.MAINTENANCE_STAFF];

export const registrationRoles = [
  ROLES.CUSTOMER,
  ROLES.MANAGER,
  ROLES.STAFF_MEMBER,
  ROLES.RECEPTIONIST,
];

export const roleMenus = {
  [ROLES.ADMIN]: [
    { path: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
    { path: "/payroll-center", label: "Payroll Center", icon: "bi-cash-stack" },
    { path: "/users", label: "User Management", icon: "bi-people" },
    { path: "/rooms", label: "Rooms", icon: "bi-building" },
    {
      path: "/restaurant-buffet",
      label: "Restaurant & Buffet",
      icon: "bi-cup-hot",
    },
    { path: "/events", label: "Events", icon: "bi-calendar-event" },
    { path: "/payroll", label: "Payroll Records", icon: "bi-receipt" },
    { path: "/reports", label: "Reports", icon: "bi-bar-chart" },
    { path: "/room-service", label: "Room Services", icon: "bi-stars" },
    {
      path: "/room-service/housekeeping",
      label: "Housekeeping",
      icon: "bi-brush",
    },
    {
      path: "/room-service/maintenance",
      label: "Maintenance",
      icon: "bi-tools",
    },
    {
      path: "/room-service/staff",
      label: "Service Staff",
      icon: "bi-person-workspace",
    },
  ],
  [ROLES.MANAGER]: [
    { path: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
    { path: "/payroll-center", label: "Payroll Center", icon: "bi-cash-stack" },
    { path: "/payroll", label: "Payroll Records", icon: "bi-receipt" },
    { path: "/rooms", label: "Rooms", icon: "bi-building" },
    { path: "/restaurant", label: "Restaurant", icon: "bi-cup-straw" },
    { path: "/events", label: "Events", icon: "bi-calendar-event" },
    { path: "/reports", label: "View Reports", icon: "bi-bar-chart" },
    { path: "/room-service", label: "Room Services", icon: "bi-stars" },
    {
      path: "/room-service/housekeeping",
      label: "Housekeeping",
      icon: "bi-brush",
    },
    {
      path: "/room-service/maintenance",
      label: "Maintenance",
      icon: "bi-tools",
    },
    {
      path: "/room-service/staff",
      label: "Service Staff",
      icon: "bi-person-workspace",
    },
  ],
  [ROLES.STAFF_MEMBER]: [
    { path: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
    { path: "/payroll-center", label: "Payroll Center", icon: "bi-cash-stack" },
  ],
  [ROLES.RECEPTIONIST]: [
    { path: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
    { path: "/room-booking", label: "Room Booking", icon: "bi-door-open" },
    {
      path: "/customers",
      label: "Customer Management",
      icon: "bi-person-badge",
    },
    {
      path: "/booking-history",
      label: "Booking History",
      icon: "bi-clock-history",
    },
  ],
  [ROLES.RESTAURANT_MANAGER]: [
    { path: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
    {
      path: "/menu-management",
      label: "Menu Management",
      icon: "bi-journal-richtext",
    },
    {
      path: "/buffet-management",
      label: "Buffet Management",
      icon: "bi-grid-3x3-gap",
    },
    { path: "/orders", label: "View Orders", icon: "bi-receipt" },
  ],
  [ROLES.EVENT_MANAGER]: [
    { path: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
    {
      path: "/event-booking",
      label: "Event Booking",
      icon: "bi-calendar-check",
    },
    { path: "/event-management", label: "Event Management", icon: "bi-kanban" },
    { path: "/guest-list", label: "Guest List", icon: "bi-list-check" },
  ],
  [ROLES.CUSTOMER]: [
    { path: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
    { path: "/view-rooms", label: "View Rooms", icon: "bi-building" },
    { path: "/book-room", label: "Book Room", icon: "bi-door-open" },
    { path: "/view-menu", label: "View Menu", icon: "bi-cup-hot" },
    { path: "/book-event", label: "Book Event", icon: "bi-calendar-plus" },
    { path: "/profile", label: "My Profile", icon: "bi-person-circle" },
  ],
  [ROLES.HOUSEKEEPER]: [
    { path: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
    { path: "/room-service", label: "Room Services", icon: "bi-stars" },
    {
      path: "/room-service/housekeeping",
      label: "Housekeeping",
      icon: "bi-brush",
    },
  ],
  [ROLES.MAINTENANCE_STAFF]: [
    { path: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
    { path: "/room-service", label: "Room Services", icon: "bi-stars" },
    {
      path: "/room-service/maintenance",
      label: "Maintenance",
      icon: "bi-tools",
    },
  ],
};

export const routeAccess = {
  "/dashboard": Object.values(ROLES),
  "/payroll-center": [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF_MEMBER],
  "/users": [ROLES.ADMIN],
  "/rooms": [ROLES.ADMIN, ROLES.MANAGER],
  "/restaurant-buffet": [ROLES.ADMIN],
  "/events": [ROLES.ADMIN, ROLES.MANAGER],
  "/payroll": [ROLES.ADMIN, ROLES.MANAGER],
  "/reports": [ROLES.ADMIN, ROLES.MANAGER],
  "/restaurant": [ROLES.MANAGER],
  "/room-booking": [ROLES.RECEPTIONIST],
  "/customers": [ROLES.RECEPTIONIST],
  "/booking-history": [ROLES.RECEPTIONIST],
  "/menu-management": [ROLES.RESTAURANT_MANAGER],
  "/buffet-management": [ROLES.RESTAURANT_MANAGER],
  "/orders": [ROLES.RESTAURANT_MANAGER],
  "/event-booking": [ROLES.EVENT_MANAGER],
  "/event-management": [ROLES.EVENT_MANAGER],
  "/guest-list": [ROLES.EVENT_MANAGER],
  "/view-rooms": [ROLES.CUSTOMER],
  "/book-room": [ROLES.CUSTOMER],
  "/view-menu": [ROLES.CUSTOMER],
  "/book-event": [ROLES.CUSTOMER],
  "/profile": [ROLES.CUSTOMER],
  "/room-service": [
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.HOUSEKEEPER,
    ROLES.MAINTENANCE_STAFF,
  ],
  "/room-service/housekeeping": [ROLES.ADMIN, ROLES.MANAGER, ROLES.HOUSEKEEPER],
  "/room-service/maintenance": [
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.MAINTENANCE_STAFF,
  ],
  "/room-service/staff": [ROLES.ADMIN, ROLES.MANAGER],
};

const normalizedRoleMap = Object.values(ROLES).reduce((acc, role) => {
  acc[role.toLowerCase()] = role;
  return acc;
}, {});

const backendRoleMap = Object.entries(ROLES).reduce((acc, [key, label]) => {
  acc[key] = key;
  acc[key.toLowerCase()] = key;
  acc[label] = key;
  acc[label.toLowerCase()] = key;
  return acc;
}, {});

Object.entries(ROLES).forEach(([key, label]) => {
  normalizedRoleMap[key.toLowerCase()] = label;
});

// Backend role aliases
normalizedRoleMap.staff = ROLES.STAFF_MEMBER;
normalizedRoleMap.staff_member = ROLES.STAFF_MEMBER;
normalizedRoleMap.housekeeper = ROLES.HOUSEKEEPER;
normalizedRoleMap.maintenance_staff = ROLES.MAINTENANCE_STAFF;
normalizedRoleMap["maintenance staff"] = ROLES.MAINTENANCE_STAFF;

export function normalizeRole(role) {
  if (!role || typeof role !== "string") return null;
  return normalizedRoleMap[role.trim().toLowerCase()] || null;
}

export function toBackendRole(role) {
  if (!role || typeof role !== "string") return null;
  return (
    backendRoleMap[role.trim()] ||
    backendRoleMap[role.trim().toLowerCase()] ||
    null
  );
}

export function isValidRole(role) {
  return Boolean(normalizeRole(role));
}

export function isRoomServiceRole(role) {
  const normalized = normalizeRole(role);
  return roomServiceRoles.includes(normalized);
}

export function getCurrentRole() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return normalizeRole(JSON.parse(raw).role);
  } catch {
    return null;
  }
}

export function getAllowedMenuForRole(role) {
  return roleMenus[role] || [];
}

export function checkRoleAccess(allowedRoles) {
  const role = getCurrentRole();
  if (!role) return false;
  return allowedRoles.includes(role);
}
