import type { Condition, ConditionKind } from '@/lib/storage';

/** SMHI "symbol_code" (Wsymb2, 1–27) → normalized condition. */
const SMHI_SYMBOLS: Record<number, [ConditionKind, string]> = {
  1: ['clear', 'Clear sky'],
  2: ['clear', 'Nearly clear sky'],
  3: ['partly-cloudy', 'Variable cloudiness'],
  4: ['partly-cloudy', 'Half clear sky'],
  5: ['cloudy', 'Cloudy'],
  6: ['cloudy', 'Overcast'],
  7: ['fog', 'Fog'],
  8: ['showers', 'Light rain showers'],
  9: ['showers', 'Rain showers'],
  10: ['showers', 'Heavy rain showers'],
  11: ['thunder', 'Thunderstorm'],
  12: ['sleet', 'Light sleet showers'],
  13: ['sleet', 'Sleet showers'],
  14: ['sleet', 'Heavy sleet showers'],
  15: ['snow', 'Light snow showers'],
  16: ['snow', 'Snow showers'],
  17: ['snow', 'Heavy snow showers'],
  18: ['rain', 'Light rain'],
  19: ['rain', 'Rain'],
  20: ['rain', 'Heavy rain'],
  21: ['thunder', 'Thunder'],
  22: ['sleet', 'Light sleet'],
  23: ['sleet', 'Sleet'],
  24: ['sleet', 'Heavy sleet'],
  25: ['snow', 'Light snowfall'],
  26: ['snow', 'Snowfall'],
  27: ['snow', 'Heavy snowfall'],
};

export function fromSmhiSymbol(code: number): Condition {
  const [kind, label] = SMHI_SYMBOLS[code] ?? ['cloudy', 'Unknown'];
  return { kind, label };
}

/** WMO weather interpretation code (Open-Meteo) → normalized condition. */
export function fromWmoCode(code: number): Condition {
  if (code === 0) return { kind: 'clear', label: 'Clear sky' };
  if (code === 1) return { kind: 'clear', label: 'Mainly clear' };
  if (code === 2) return { kind: 'partly-cloudy', label: 'Partly cloudy' };
  if (code === 3) return { kind: 'cloudy', label: 'Overcast' };
  if (code <= 48) return { kind: 'fog', label: 'Fog' };
  if (code <= 57) return { kind: 'drizzle', label: 'Drizzle' };
  if (code === 66 || code === 67) return { kind: 'sleet', label: 'Freezing rain' };
  if (code <= 67) return { kind: 'rain', label: code === 65 ? 'Heavy rain' : 'Rain' };
  if (code <= 77) return { kind: 'snow', label: 'Snowfall' };
  if (code <= 82) return { kind: 'showers', label: 'Rain showers' };
  if (code <= 86) return { kind: 'snow', label: 'Snow showers' };
  return { kind: 'thunder', label: 'Thunderstorm' };
}

export function conditionIcon(kind: ConditionKind, isDay = true): string {
  switch (kind) {
    case 'clear':
      return isDay ? '☀️' : '🌙';
    case 'partly-cloudy':
      return isDay ? '⛅' : '☁️';
    case 'cloudy':
      return '☁️';
    case 'fog':
      return '🌫️';
    case 'drizzle':
      return '🌦️';
    case 'rain':
      return '🌧️';
    case 'showers':
      return isDay ? '🌦️' : '🌧️';
    case 'sleet':
      return '🌨️';
    case 'snow':
      return '❄️';
    case 'thunder':
      return '⛈️';
  }
}
