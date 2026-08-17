/*
* The 'storage' type is just a wrapper over the chromeStorage, 
* with a local implementation that works when not in extension mode.
* It's main purpose is the ease development using stencil
* and to allow more functionnality during the development phase ('npm start').
*/
type StorageData = Record<string, any>;

const isChromeExtension = typeof chrome !== 'undefined' && !!chrome.storage?.local;
const RECENT_FILES_ITEM_NAME = '__Recent__Files__';

const chromeStorage = {
  async get<T = any>(key: string): Promise<T | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key] ?? null);
      });
    });
  },

  async set<T = any>(key: string, value: T): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => resolve());
    });
  },

  async remove(key: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, () => resolve());
    });
  },

  async getAll(): Promise<StorageData> {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (items) => resolve(items));
    });
  },

  async addToRecentFiles(filename: string): Promise<string[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get(RECENT_FILES_ITEM_NAME, (items) => {
        let recentFiles: string[] = items[RECENT_FILES_ITEM_NAME] || [];
        recentFiles = [filename, ...recentFiles.filter((item) => item !== filename)];
        chrome.storage.local.set({ [RECENT_FILES_ITEM_NAME]: recentFiles }, () => {
          resolve(recentFiles);
        });
      });
    });
  }

};

const localFallback = {
  async get<T = any>(key: string): Promise<T | null> {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },

  async set<T = any>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  },

  async getAll(): Promise<StorageData> {
    const all: StorageData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        all[key] = JSON.parse(localStorage.getItem(key) || 'null');
      }
    }
    return all;
  },

  async addToRecentFiles(filename: string): Promise<string[]> {
    const existing = (await localFallback.get<string[]>(RECENT_FILES_ITEM_NAME)) || [];
    const updated = [filename, ...existing.filter((item) => item !== filename)];
    await localFallback.set(RECENT_FILES_ITEM_NAME, updated);
    return updated;
  }
};

const storage = isChromeExtension ? chromeStorage : localFallback;
export default storage;