export const THEME_STORAGE_KEY = 'munchies-theme';

export const themes = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'ice', label: 'Ice blue' },
  { id: 'purple', label: 'Purple' },
  { id: 'emerald', label: 'Emerald' },
] as const;

export type ThemeId = (typeof themes)[number]['id'];

export const DEFAULT_THEME: ThemeId = 'dark';

export function isThemeId(value: string): value is ThemeId {
  return themes.some((theme) => theme.id === value);
}
