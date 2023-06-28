import type { StorageSettings } from './types';

export const defaults: StorageSettings = {
  active: false,
  settings: {
    timeout: 6000, // > 0 disable after timeout, 0 disable immediately, -1 do nothing.
    casesensitive: false,
    prefixKey: '/',
    enableKey: '[',
    disableKey: ']',
  },
  expanders: {
    '/exp': 'General Expense Fee:',
    '/tra': 'Travel Expense:'
  }
};

// Takes current storage object and merges with
// defaults ensuring all required keys/properties.
export function updateDefaults(current: StorageSettings, preserved = ['expanders'] as string[]) {
  const clone = JSON.parse(JSON.stringify(current));
  const updated = { ...defaults };
  for (const [key, value] of Object.entries(clone)) {
    if (preserved.includes(key))
      updated[key] = typeof value === 'undefined' ? updated[key] : value;
    else if (updated.hasOwnProperty(key) && typeof value !== 'undefined')
      updated[key] = value;
  }
  for (const [key, value] of Object.entries(defaults.settings)) {
    if (!updated.settings.hasOwnProperty(key))
      updated.settings[key] = value;
  }
  updated.active = false; // always set to false when upgrading.
  return updated;
}

export default defaults;