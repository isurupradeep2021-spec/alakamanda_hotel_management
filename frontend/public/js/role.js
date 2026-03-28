window.roles = ['Admin', 'Manager', 'Receptionist', 'Restaurant Manager', 'Event Manager', 'Customer'];

window.checkRoleAccess = function checkRoleAccess(allowedRoles) {
  const raw = localStorage.getItem('user');
  if (!raw) return false;
  const role = JSON.parse(raw).role;
  return allowedRoles.includes(role);
};
