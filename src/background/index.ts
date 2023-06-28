import type { StorageSettings } from 'src/types';
import Storage from '../storage';

chrome.runtime.onInstalled.addListener((details) => {
  console.log(details);
  if (details.reason == 'install')
    Storage.init();
  else if (details.reason == 'update')
    Storage.upgrade();
});

chrome.storage.onChanged.addListener((changes: Record<keyof StorageSettings, chrome.storage.StorageChange>, area: 'sync' | 'local' | 'managed' | 'session' | 'help') => {

  // Dynamically changes the icon so you know Texpand is active, listening for shortcut codes.
  if (area === 'sync') {
    const changed = changes.active?.newValue !== changes.active?.oldValue;
    if (changed) {
      const path = changes.active?.newValue === true
        ? {
          "16": "src/assets/icons/icon_active_16.png",
          "32": "src/assets/icons/icon_active_32.png",
          "48": "src/assets/icons/icon_active_48.png",
          "128": "src/assets/icons/icon_active_128.png"
        }
        : {
          "16": "src/assets/icons/icon_16.png",
          "32": "src/assets/icons/icon_32.png",
          "48": "src/assets/icons/icon_48.png",
          "128": "src/assets/icons/icon_128.png"
        };
      chrome.action.setIcon({ path });
    }
  }
});

// let settingsCache = {} as StorageSettings;

// async function handleInit() {
//   settingsCache = await Storage.init();
// }

// async function handleUpgrade() {
//   settingsCache = await Storage.upgrade();
// }


// Only runs when there is no Popup Page
// 
// chrome.action.onClicked.addListener(async (tab) => {
//   try {
//     await Storage.init();
//     console.log(`Initialized: tab ${tab.url} (${tab.id})`)
//   } catch (e) {
//     console.warn(`Failed Initialization: tab ${tab.url} (${tab.id})`);
//     console.warn(e.message);
//   }
// });


// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   // sendResponse(`success!`);
// });