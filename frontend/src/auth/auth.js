import { loginApi } from '../api/service';
import { normalizeRole } from './role';

const USER_KEY = 'user';
const TOKEN_KEY = 'token';

export async function loginUser({ email, password, role }) {
  if (!email || !password || !role) {
    throw new Error('Please fill email, password, and role.');
  }

  const selectedRole = normalizeRole(role);
  if (!selectedRole) {
    throw new Error('Invalid role selected. Please choose again.');
  }

  const response = await loginApi({ email, password });
  const data = response?.data || {};

  if (!data.token) {
    throw new Error('Login failed: token not returned by server.');
  }

  const serverRole = normalizeRole(data.role);
  if (!serverRole) {
    throw new Error('Login failed: invalid role from server.');
  }

  if (serverRole !== selectedRole) {
    throw new Error(`Selected role does not match account role (${serverRole}).`);
  }

  const nextUser = {
    fullName: data.fullName || email.split('@')[0],
    email: data.email || email,
    role: serverRole
  };

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  return nextUser;
}

export function logoutUser() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getLoggedInUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const normalizedRole = normalizeRole(parsed.role);
    if (!normalizedRole) {
      logoutUser();
      return null;
    }
    return { ...parsed, role: normalizedRole };
  } catch {
    logoutUser();
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(localStorage.getItem(TOKEN_KEY) && getLoggedInUser());
}
