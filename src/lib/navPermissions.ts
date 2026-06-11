/**
 * Role-based navigation permissions.
 * Each nav key maps to the roles that can see it.
 * If a key is not listed here, it's visible to ALL roles.
 */

export type AppRole =
  | "SUPER_ADMIN" | "DIRECTOR" | "MANAGER"
  | "WAREHOUSE_STAFF" | "AGENT" | "ACCOUNTANT" | "SUPPORT";

// Director-level roles (management)
const DIRECTOR = ["SUPER_ADMIN", "DIRECTOR", "MANAGER"] as AppRole[];
// All internal roles
const ALL = ["SUPER_ADMIN", "DIRECTOR", "MANAGER", "WAREHOUSE_STAFF", "AGENT", "ACCOUNTANT", "SUPPORT"] as AppRole[];
// Commercial roles
const COMMERCIAL = ["SUPER_ADMIN", "DIRECTOR", "MANAGER", "AGENT", "ACCOUNTANT"] as AppRole[];
// Admin only
const ADMIN = ["SUPER_ADMIN", "DIRECTOR"] as AppRole[];

/**
 * Nav items visible per role.
 * Key = nav item key from AppSidebar NAV array.
 * Value = roles that CAN see this item.
 */
export const NAV_PERMISSIONS: Record<string, AppRole[]> = {
  // Dashboard — everyone
  dashboard: ALL,

  // Inventory — warehouse & management
  inventory:     ["SUPER_ADMIN", "DIRECTOR", "MANAGER", "WAREHOUSE_STAFF"],
  products:      ["SUPER_ADMIN", "DIRECTOR", "MANAGER", "WAREHOUSE_STAFF", "AGENT"],
  brands:        DIRECTOR,
  categories:    DIRECTOR,
  suppliers:     ["SUPER_ADMIN", "DIRECTOR", "MANAGER", "ACCOUNTANT"],

  // Operations — warehouse & management
  warehouses:    DIRECTOR,
  purchaseOrders:["SUPER_ADMIN", "DIRECTOR", "MANAGER", "ACCOUNTANT"],
  orders:        ["SUPER_ADMIN", "DIRECTOR", "MANAGER", "WAREHOUSE_STAFF"],
  receivings:    ["SUPER_ADMIN", "DIRECTOR", "MANAGER", "WAREHOUSE_STAFF"],
  shipments:     ["SUPER_ADMIN", "DIRECTOR", "MANAGER", "WAREHOUSE_STAFF"],
  cycleCounts:   ["SUPER_ADMIN", "DIRECTOR", "MANAGER", "WAREHOUSE_STAFF"],
  ops:           DIRECTOR,

  // Logistics
  logistics:     ["SUPER_ADMIN", "DIRECTOR", "MANAGER"],
  fleet:         ["SUPER_ADMIN", "DIRECTOR", "MANAGER"],
  shops:         COMMERCIAL,
  driver:        ["SUPER_ADMIN", "DIRECTOR", "MANAGER", "WAREHOUSE_STAFF", "AGENT"],

  // Agent-specific
  agentVisits:   ["SUPER_ADMIN", "DIRECTOR", "MANAGER", "AGENT"],
  agentPricing:  ["SUPER_ADMIN", "DIRECTOR", "MANAGER", "AGENT"],

  // System
  notifications: ALL,
  users:         DIRECTOR,
  permissions:   ADMIN,
  reports:       ["SUPER_ADMIN", "DIRECTOR", "MANAGER", "ACCOUNTANT"],
  settings:      ALL,
};

/** Returns true if the given role can see this nav item */
export function canSeeNav(key: string, role?: string): boolean {
  if (!role) return false;
  const allowed = NAV_PERMISSIONS[key];
  if (!allowed) return true; // not restricted = visible to all
  return allowed.includes(role as AppRole);
}
