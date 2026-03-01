import ApiError from '../utils/apiError.js';

const allowRoles = (...roles) => (req, _res, next) => {
  const normalizedRole = String(req.user?.role || '').trim().toLowerCase();
  const normalizedAllowedRoles = roles.map((role) => String(role).trim().toLowerCase());

  if (!normalizedRole || !normalizedAllowedRoles.includes(normalizedRole)) {
    throw new ApiError(403, 'Forbidden: insufficient role permissions');
  }
  next();
};

export default allowRoles;