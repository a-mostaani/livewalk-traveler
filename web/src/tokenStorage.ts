const TOKEN_KEY = 'livelywalk.traveler.session';

export type TokenStore = {
  read: () => string;
  write: (token: string) => void;
  clear: () => void;
};

export const browserTokenStore: TokenStore = {
  read: () => typeof sessionStorage === 'undefined' ? '' : sessionStorage.getItem(TOKEN_KEY) || '',
  write: (token) => {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(TOKEN_KEY, token);
  },
  clear: () => {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(TOKEN_KEY);
  },
};
