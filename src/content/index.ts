import type { SpecialChar, StorageSettings } from 'src/types';
import Storage from 'src/storage';

let settingsCache: StorageSettings;
let keys = [] as string[];
let prefixes = [] as string[];
let active = false;
let buffer = '';
let timeoutid: NodeJS.Timeout;

function hasPrefix(key: string) {
  if (!prefixes.length) {
    // if (!keys.length) keys = KEY_VALUES.map(v => v.key);
    if (!keys.length)
      keys = Object.keys(settingsCache.expanders);
    if (!settingsCache.settings.casesensitive)
      keys = keys.map(k => k.toLowerCase())
    if (!prefixes.length) prefixes = keys.reduce((a, c) => {
      const prefix = c.charAt(0);
      if (!a.includes(prefix))
        a = [...a, prefix]
      return a;
    }, [] as string[]);
  }
  return prefixes.includes(key.charAt(0));
}

function hasMatch(key: string) {
  if (!keys.length) keys = Object.keys(settingsCache.expanders);
  if (!settingsCache.settings.casesensitive) {
    keys = keys.map(k => k.toLowerCase())
    key = key.toLowerCase();
  }
  return keys.includes(key);
}

function setActivity(value: boolean) {
  return Storage.update({ active: value }).then(s => {
    console.log('[TEXPAND]: active = ' + value);
  });
}

function initTimeout() {
  // -1 do nothing
  // 0 set active status to false
  // > than 0 set active status to false upon expired time.
  if (typeof settingsCache.settings.timeout !== 'number' || settingsCache.settings.timeout === -1)
    return;

  if (settingsCache.settings.timeout) {
    timeoutid = setTimeout(() => {
      active = false;
      setActivity(false);
    }, settingsCache.settings.timeout);
  }
  else {
    active = false;
    setActivity(false);
  }

}

function replaceText({ e, buffer, value, lastChar }: { e: KeyboardEvent, buffer: string, value: string, lastChar: string }) {
  const el = e.target as HTMLElement;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const currentValue = el.value + lastChar;
    e.preventDefault();
    setTimeout(() => {
      el.value = currentValue.replace(buffer, value);
      initTimeout();
    });
  }
}

function handleKeypress(e: KeyboardEvent) {
  if (e.ctrlKey && [settingsCache.settings.enableKey, settingsCache.settings.disableKey].includes(e.key as SpecialChar)) {
    clearTimeout(timeoutid);
    active = e.key === settingsCache.settings.enableKey ? true : e.key === settingsCache.settings.disableKey ? false : active;
    setActivity(active);
    if (active) initTimeout();
  }
  else if (active) {
    if (hasPrefix(buffer) || hasPrefix(e.key)) {
      clearTimeout(timeoutid);
      buffer += e.key;
      if (hasMatch(buffer)) {
        const value = settingsCache.expanders[buffer];
        replaceText({ e, buffer, value, lastChar: e.key });
        buffer = ''; // reset the buffer.
      }
    }
    else {
      buffer = '';
    }
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (active && e.key === 'Backspace')
    buffer = buffer.slice(0, -1);
}

function handleStorageChanged(changes: Record<keyof StorageSettings, chrome.storage.StorageChange>, area: 'sync' | 'local' | 'managed' | 'session' | 'help') {
  if (area === 'sync') {
    if (changes.expanders?.newValue) {
      settingsCache.expanders = changes.expanders.newValue;
    }
    else if (changes.settings?.newValue) {
      settingsCache.settings = changes.settings.newValue;
    }
  }
}

function bindEvents() {
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('keypress', handleKeypress);
  chrome.storage.onChanged.addListener(handleStorageChanged);
}

function unbindEvents() {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('keypress', handleKeypress);
  chrome.storage.onChanged.removeListener(handleStorageChanged);
}

function init() {
  unbindEvents();
  if (!settingsCache)
    Storage.get().then(s => {
      console.log('[TEXPAND]: init');
      (settingsCache = s as any);
      bindEvents();
    });
  else
    bindEvents();
}

init();

// chrome.runtime.sendMessage(null, e.key, (response) => {

// });


