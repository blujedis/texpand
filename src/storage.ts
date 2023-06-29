import type { StorageSettings } from './types';
import defaults, { updateDefaults } from './defaults';

// Simply perform a get with complete settings object.
async function initStorage() {
  return setStorage({ ...defaults });
}

function getStorage<K extends keyof StorageSettings>(key: K): Promise<Record<K, StorageSettings[K]>>;
function getStorage<K extends keyof StorageSettings>(keys: K[]): Promise<Record<K, StorageSettings[K]>>;
function getStorage(defaults?: StorageSettings): Promise<StorageSettings>;
function getStorage(keysOrDefaults?: keyof StorageSettings | (keyof StorageSettings)[] | StorageSettings) {
  return chrome.storage.sync.get(keysOrDefaults);
}

async function updateStorage(key: keyof StorageSettings, value: any): Promise<StorageSettings>;
async function updateStorage(settings: Partial<StorageSettings>): Promise<StorageSettings>;
async function updateStorage(keyOrSettings: keyof StorageSettings | Partial<StorageSettings>, value?: any) {
  let obj = keyOrSettings as Partial<StorageSettings>;
  try {
    const current = await getStorage();
    let merged = {} as StorageSettings;
    const propValue = current[keyOrSettings as any];
    // rather not include lib for merging probably sufficient for now.
    // never more than one level deep, to merge nested array or object
    // must specify the key and value of same type.
    if (typeof keyOrSettings === 'string') {
        if (Array.isArray(propValue)) {
          merged[keyOrSettings as any] = [ ...propValue, ...(value || [])];
        }
        else if (typeof propValue === 'object' && propValue !== null ) {
          merged[keyOrSettings as any] = { ...propValue, ...(value || {})};
        }
        else {
          merged[keyOrSettings as any] = value;
        }
    }
    else {
      merged = { ...current, ...obj }
    }
    await chrome.storage.sync.set(merged);
    return merged;
  }
  catch (ex) {
    console.warn(ex.message);
    return null;
  }
}

async function setStorage(settings: StorageSettings) {
  try {
    await chrome.storage.sync.set(settings);
    return settings;
  }
  catch (ex) {
    console.warn(ex.message);
    return null;
  }
}

async function upgradeStorage() {
  try {
    const current = await chrome.storage.sync.get() as StorageSettings;
    const updated = updateDefaults(current);
    await setStorage(updated);
    return updated;
  }
  catch (ex) {
    console.warn(ex.message);
    return null;
  }
}

export default {
  init: initStorage,
  get: getStorage,
  set: setStorage,
  update: updateStorage,
  upgrade: upgradeStorage
};
