const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api';

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

const requestAuth = async (path: string, payload: RegisterPayload | LoginPayload) => {
  const response = await fetch(`${API_BASE_URL}/auth/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? 'Authentication request failed');
  }

  return data;
};

export const saveAuthToken = (token: string) => {
  window.localStorage.setItem('munchies_token', token);
};

export const getAuthToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem('munchies_token');
};

export const registerUser = (payload: RegisterPayload) => requestAuth('register', payload);

export const loginUser = (payload: LoginPayload) => requestAuth('login', payload);
