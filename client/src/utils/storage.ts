/*
 * A small, safe wrapper around the browser's localStorage.
 *
 * localStorage lets us save small pieces of data in the browser so they survive
 * a page refresh. It can only store strings, so we use JSON.stringify to turn
 * an object into a string when saving, and JSON.parse to turn it back into an
 * object when loading.
 *
 * Reading or writing localStorage can throw an error (for example if the user
 * has disabled it, or if the stored text is not valid JSON). We wrap everything
 * in try/catch so a storage problem never crashes the whole application.
 */

/**
 * Load a value that was previously saved under the given key.
 *
 * @param key The name the value was saved under.
 * @returns The saved value, or null if nothing was found or an error happened.
 */
export function loadFromStorage<T>(key: string): T | null {
  try {
    const rawText = window.localStorage.getItem(key);

    // If there is nothing saved under this key, getItem returns null.
    if (rawText === null) {
      return null;
    }

    // Turn the saved text back into a real JavaScript object.
    const parsedValue = JSON.parse(rawText) as T;
    return parsedValue;
  } catch (error) {
    // If anything goes wrong, log it and behave as if nothing was saved.
    console.error("Failed to load key from storage:", key, error);
    return null;
  }
}

/**
 * Save a value under the given key so it survives a page refresh.
 *
 * @param key The name to save the value under.
 * @param value The value to save (any object that can be turned into JSON).
 */
export function saveToStorage<T>(key: string, value: T): void {
  try {
    const rawText = JSON.stringify(value);
    window.localStorage.setItem(key, rawText);
  } catch (error) {
    console.error("Failed to save key to storage:", key, error);
  }
}

/**
 * Remove whatever is saved under the given key.
 *
 * @param key The name of the value to remove.
 */
export function removeFromStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to remove key from storage:", key, error);
  }
}
