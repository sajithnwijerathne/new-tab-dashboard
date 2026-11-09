import type { Units } from './storage';

// Weather values are stored in metric; these convert for display.
// Metric wind is shown in m/s, as SMHI and Nordic forecasts do.

export const formatTemp = (c: number, units: Units) =>
  `${Math.round(units === 'imperial' ? (c * 9) / 5 + 32 : c)}°`;

export const formatWind = (ms: number, units: Units) =>
  units === 'imperial' ? `${Math.round(ms * 2.23694)} mph` : `${Math.round(ms)} m/s`;

export const formatPrecip = (mm: number, units: Units) =>
  units === 'imperial' ? `${(mm / 25.4).toFixed(2)} in` : `${mm < 10 ? mm.toFixed(1) : Math.round(mm)} mm`;

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const compass = (deg: number) => COMPASS[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
