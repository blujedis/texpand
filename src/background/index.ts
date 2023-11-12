import type { Message, ReceiveHandler, StorageSettings } from 'src/types';
import Storage from '../storage';
import { log } from 'src/utils';

let cache = {} as StorageSettings;

function sendMessage(idOrMessage: string | number | Message, messageOrReceiver: Message | ReceiveHandler, receiver?: ReceiveHandler) {

  let id = idOrMessage as string;
  let message: Message;

  if (typeof messageOrReceiver === 'function') {
    receiver = messageOrReceiver;
    message = idOrMessage as Message;
    id = undefined;
  }

  receiver = receiver || ((response: Message) => { });

  if (typeof idOrMessage === 'number') {
    chrome.runtime.sendMessage(id, message, receiver);
  }
  else {
    chrome.runtime.sendMessage(message, receiver);
  }

}

function handleMessage(message: Message, sender: chrome.runtime.MessageSender, send?: (response?: any) => void) {
  if (message.type.startsWith('storage')) {
    // send(null);
  }
}

async function handleInstalled(details: chrome.runtime.InstalledDetails) {
  if (details.reason == 'install')
    cache = await Storage.init();
  else if (details.reason == 'update')
    cache = await Storage.upgrade();
}

// function handleActivated(activeInfo: chrome.tabs.TabActiveInfo) {
//   const tabId = activeInfo.tabId;
//   sendMessage(tabId, { type: 'ping' }, (response = {} as Message) => {
//     console.info(response);
//     const lastError = chrome.runtime.lastError;
//     if (lastError)
//       return console.warn(lastError.message);
//     if (!response.payload) {
//       // chrome.scripting.executeScript({ target: { tabId }, files: ['src/content/index.ts'] }, (results) => {
//       //   console.log(results);
//       // });
//     }
//   });
// }

function handleOnChanged(changes: Record<keyof StorageSettings, chrome.storage.StorageChange>, area: 'sync' | 'local' | 'managed' | 'session' | 'help') {
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
}

function unbindEvents() {
  chrome.runtime.onMessage.removeListener(handleMessage);
  chrome.runtime.onInstalled.removeListener(handleInstalled);
  chrome.storage.onChanged.removeListener(handleOnChanged);
}

function bindEvents() {
  unbindEvents();
  // chrome.tabs.onActivated.addListener(handleActivated);
  chrome.runtime.onMessage.addListener(handleMessage);
  chrome.runtime.onInstalled.addListener(handleInstalled);
  chrome.storage.onChanged.addListener(handleOnChanged);
}




bindEvents();


