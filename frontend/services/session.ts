const TOKEN_STORAGE_KEY = 'munchies_token';

export const saveAuthToken = (token: string) => {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.dispatchEvent(new Event('munchies-auth-changed'));
};

export const clearAuthToken = () => {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.dispatchEvent(new Event('munchies-auth-changed'));
};

export const getAuthToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
};
