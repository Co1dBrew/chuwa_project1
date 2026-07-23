// A small wrapper around fetch for talking to the backend API.
// - Prefixes every path with "/api" (Vite proxies "/api" to the backend).
// - Attaches the logged-in user's token as an "Authorization: Bearer" header.
// - Throws an Error (carrying the backend's message) when the response is not
//   2xx, so callers can rely on try/catch and error.message just like before.

import { loadFromStorage } from "../utils/storage";

// Must match AUTH_STORAGE_KEY in features/auth/authSlice.ts.
const AUTH_STORAGE_KEY = "pms.auth";

// The auth data we persist looks like { user, token }.
interface PersistedAuth {
  token: string | null;
}

// Read the saved login token, or null if nobody is logged in.
function getToken(): string | null {
  const saved = loadFromStorage<PersistedAuth>(AUTH_STORAGE_KEY);
  return saved !== null ? saved.token : null;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  // A plain object that will be sent as a JSON request body.
  body?: unknown;
}

// Make a request to "/api" + path and return the parsed JSON.
// Returns undefined for a 204 (No Content) response.
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {};

  const token = getToken();
  if (token !== null) {
    headers["Authorization"] = "Bearer " + token;
  }

  // Build the request body. A FormData body (used for image uploads) is sent as
  // multipart form-data and the browser sets its Content-Type header itself.
  // Any other body is sent as JSON.
  let body: BodyInit | undefined = undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch("/api" + path, {
    method: method,
    headers: headers,
    body: body,
  });

  // On failure, read the backend's { error: { message } } and throw it.
  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  // 204 No Content (e.g. after a delete) has no body to parse.
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// Try to pull a human-readable message out of an error response body
// (the backend uses { error: { message } }).
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.error?.message === "string") {
      return data.error.message;
    }
  } catch {
    // The body was not JSON; fall through to a generic message.
  }

  return "Request failed (" + response.status + ").";
}
