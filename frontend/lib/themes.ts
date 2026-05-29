export const THEME_STORAGE_KEY = 'munchies-theme';

export const themes = [
  { id: 'dark', label: 'Dark', vibe: 'Clean modern marketplace aesthetic', colors: ['#111114', '#18181c', '#f97316'] },
  { id: 'light', label: 'Light', vibe: 'Crisp bright modern workspace design', colors: ['#ffffff', '#f4f4f6', '#f97316'] },
  { id: 'ice', label: 'Ice blue', vibe: 'Chilly professional arctic deep-sea glow', colors: ['#0a0e17', '#111827', '#38bdf8'] },
  { id: 'purple', label: 'Purple', vibe: 'Sleek neon dark violet cyberpunk magic', colors: ['#0b0813', '#130f20', '#a78bfa'] },
  { id: 'emerald', label: 'Emerald', vibe: 'Fresh calming dynamic organic forest vibes', colors: ['#070c0a', '#0f1714', '#34d399'] },
  { id: 'ghibli', label: 'Ghibli', vibe: 'Warm cozy magical countryside watercolor aesthetic', colors: ['#f7f3e3', '#efeada', '#d96b43'] },
] as const;

export type ThemeId = (typeof themes)[number]['id'];

export const DEFAULT_THEME: ThemeId = 'dark';

export function isThemeId(value: string): value is ThemeId {
  return themes.some((theme) => theme.id === value);
}
