const { Role } = require("../models");

// Konstanta nama role (biar typo ketangkep di code)
const ROLES = {
  ADMIN: "admin",
  GENERAL_AFFAIR: "general_affair",
  ADMIN_DEPARTMENT: "admin_department",
  EMPLOYEE: "employee",
  VENDOR_CATERING: "vendor_catering",
};

// Hierarki (nilai makin tinggi makin kuat)
const ROLE_RANK = {
  [ROLES.VENDOR_CATERING]: 1,
  [ROLES.EMPLOYEE]: 2,
  [ROLES.ADMIN_DEPARTMENT]: 3,
  [ROLES.GENERAL_AFFAIR]: 4,
  [ROLES.ADMIN]: 5,
};

// Cache id→name (simple in-memory)
const roleNameCache = new Map();

async function getRoleNameById(role_id) {
  if (!role_id) return null;
  if (roleNameCache.has(role_id)) return roleNameCache.get(role_id);
  const role = await Role.findByPk(role_id);
  const name = role ? role.name : null;
  roleNameCache.set(role_id, name);
  return name;
}

// Helper: ambil nama role user, inject ke req.user.roleName
async function attachRoleName(req, _res) {
  if (!req.user) return null;
  if (req.user.roleName) return req.user.roleName;
  const roleName = await getRoleNameById(req.user.role_id);
  req.user.roleName = roleName;
  return roleName;
}

// 1) Izinkan jika user punya salah satu role
function requireRoles(...allowedRoles) {
  // dukung array juga: requireRoles([ 'admin','employee' ])
  const flat = allowedRoles.flat();
  return async (req, res, next) => {
    try {
      const roleName = await attachRoleName(req, res);
      if (!roleName) {
        return res.status(403).json({ success: false, message: "Forbidden: role not found" });
      }
      if (!flat.includes(roleName)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: requires one of roles [${flat.join(", ")}]`,
        });
      }
      next();
    } catch (err) {
      console.error("[requireRoles] error:", err);
      res.status(500).json({ success: false, message: "Internal error (role check)" });
    }
  };
}

// 2) Izinkan jika level user >= minRole (berdasarkan ROLE_RANK)
function requireAtLeast(minRole) {
  return async (req, res, next) => {
    try {
      const roleName = await attachRoleName(req, res);
      if (!roleName) {
        return res.status(403).json({ success: false, message: "Forbidden: role not found" });
      }
      const userRank = ROLE_RANK[roleName] ?? 0;
      const minRank = ROLE_RANK[minRole] ?? Infinity;
      if (userRank < minRank) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: requires at least role "${minRole}"`,
        });
      }
      next();
    } catch (err) {
      console.error("[requireAtLeast] error:", err);
      res.status(500).json({ success: false, message: "Internal error (role check)" });
    }
  };
}

// 3) Izinkan jika owner resource (mis. /users/:id) ATAU punya salah satu role
//   getParamId: fn(req) -> id pemilik resource (string/number)
//   roles: array nama role yang juga boleh akses
function allowSelfOrRoles({ getParamId, roles = [] }) {
  const allowedRoles = roles.flat();
  return async (req, res, next) => {
    try {
      const roleName = await attachRoleName(req, res);
      if (!roleName) {
        return res.status(403).json({ success: false, message: "Forbidden: role not found" });
      }
      const isAllowedByRole = allowedRoles.includes(roleName);

      // Normalisasi ke string untuk perbandingan aman
      const userIdStr = String(req.user?.id ?? "");
      const ownerIdStr = String(getParamId(req) ?? "");
      const isOwner = userIdStr && ownerIdStr && userIdStr === ownerIdStr;

      if (!isOwner && !isAllowedByRole) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: must be owner or one of roles [${allowedRoles.join(", ")}]`,
        });
      }
      next();
    } catch (err) {
      console.error("[allowSelfOrRoles] error:", err);
      res.status(500).json({ success: false, message: "Internal error (role check)" });
    }
  };
}

module.exports = {
  ROLES,
  requireRoles,
  requireAtLeast,
  allowSelfOrRoles,
};
