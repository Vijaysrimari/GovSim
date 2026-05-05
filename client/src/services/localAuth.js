const USERS_KEY = 'govsim_local_users';
const SESSION_KEY = 'govsim_local_auth_session';

const normalizeEmail = (email) => email.trim().toLowerCase();

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const storeSession = (auth) => {
  localStorage.setItem('token', auth.token);
  localStorage.setItem('user', JSON.stringify(auth.user));
  writeJson(SESSION_KEY, auth);
};

export const clearAuthSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem(SESSION_KEY);
};

export const getCachedAuth = () => {
  const session = readJson(SESSION_KEY, null);
  if (session?.token && session?.user) return session;

  const token = localStorage.getItem('token');
  const user = readJson('user', null);

  if (token && user) return { token, user };
  return null;
};

export const isAuthNetworkError = (error) => {
  const responseText = typeof error?.response?.data === 'string' ? error.response.data : JSON.stringify(error?.response?.data || {});

  return !error?.response
    || error?.code === 'ERR_NETWORK'
    || error?.message === 'Network Error'
    || /Proxy error|ECONNREFUSED|ENOTFOUND|EHOSTUNREACH|ETIMEDOUT/i.test(responseText)
    || [502, 503, 504].includes(error?.response?.status);
};

export const registerLocalAuth = ({ name, email, password }) => {
  const cleanEmail = normalizeEmail(email);
  const cleanName = name.trim();

  if (!cleanName || !cleanEmail || !password) {
    throw new Error('Name, email, and password are required');
  }

  const users = readJson(USERS_KEY, []);
  if (users.some((user) => user.email === cleanEmail)) {
    throw new Error('Email already registered');
  }

  const userRecord = {
    id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: cleanName,
    email: cleanEmail,
    password,
    role: 'analyst',
  };

  writeJson(USERS_KEY, [...users, userRecord]);

  const auth = {
    token: `local-${userRecord.id}`,
    user: {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
    },
  };

  storeSession(auth);
  return auth;
};

export const loginLocalAuth = ({ email, password }) => {
  const cleanEmail = normalizeEmail(email);
  const users = readJson(USERS_KEY, []);
  const userRecord = users.find((user) => user.email === cleanEmail && user.password === password);

  if (!userRecord) {
    throw new Error('Invalid credentials');
  }

  const auth = {
    token: `local-${userRecord.id}`,
    user: {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
    },
  };

  storeSession(auth);
  return auth;
};