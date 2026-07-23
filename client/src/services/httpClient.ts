// Fetch wrapper for /api. Authenticated 401 responses refresh once, then retry.

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  skipAuthRecovery?: boolean;
}

interface AuthConfiguration {
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<boolean>;
  clearSession: () => void;
}

let authConfiguration: AuthConfiguration | undefined;
let refreshInFlight: Promise<boolean> | undefined;

export function configureHttpClientAuth(configuration: AuthConfiguration): void {
  authConfiguration = configuration;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = authConfiguration?.getAccessToken() ?? null;
  let response = await sendRequest(path, options, token);

  if (
    response.status === 401 &&
    token !== null &&
    !options.skipAuthRecovery &&
    authConfiguration !== undefined
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await sendRequest(
        path,
        options,
        authConfiguration.getAccessToken(),
      );
    }

    if (!refreshed || response.status === 401) {
      authConfiguration.clearSession();
    }
  }

  return parseResponse<T>(response);
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight === undefined) {
    refreshInFlight = authConfiguration!
      .refreshAccessToken()
      .finally(function () {
        refreshInFlight = undefined;
      });
  }

  return await refreshInFlight;
}

async function sendRequest(
  path: string,
  options: RequestOptions,
  token: string | null,
): Promise<Response> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {};

  if (token !== null) {
    headers["Authorization"] = "Bearer " + token;
  }

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
    credentials: "same-origin",
  });

  return response;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.error?.message === "string") {
      return data.error.message;
    }
  } catch {}

  return "Request failed (" + response.status + ").";
}
