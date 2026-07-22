// Safe wrapper around localStorage. Values are JSON-encoded and all access is
// wrapped in try/catch so a storage failure never crashes the app.

// Load a value previously saved under the given key, or null if missing/on error.
export function loadFromStorage<T>(key: string): T | null {
  try {
    const rawText = window.localStorage.getItem(key);

    if (rawText === null) {
      return null;
    }

    const parsedValue = JSON.parse(rawText) as T;
    return parsedValue;
  } catch (error) {
    console.error("Failed to load key from storage:", key, error);
    return null;
  }
}

// Save a value under the given key.
export function saveToStorage<T>(key: string, value: T): void {
  try {
    const rawText = JSON.stringify(value);
    window.localStorage.setItem(key, rawText);
  } catch (error) {
    console.error("Failed to save key to storage:", key, error);
  }
}

// Remove whatever is saved under the given key.
export function removeFromStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to remove key from storage:", key, error);
  }
}
