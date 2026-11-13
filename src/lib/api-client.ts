/**
 * Standard Frontend API Client Wrapper
 * Handles JSON parsing, NextAuth credentials, and structured error throwing
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  warning?: string;
}

export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });

  let parsed: ApiResponse<T>;
  try {
    parsed = await response.json();
  } catch {
    throw new Error(`Server returned HTTP ${response.status} with invalid JSON.`);
  }

  if (!response.ok || parsed.success === false) {
    const errorMsg =
      parsed.error || parsed.message || `Request failed with HTTP status ${response.status}.`;
    throw new Error(errorMsg);
  }

  // Return parsed.data if provided, otherwise the whole parsed payload (e.g. for delete/messages)
  return (parsed.data !== undefined ? parsed.data : (parsed as unknown)) as T;
}

export async function apiGet<T>(url: string): Promise<T> {
  return apiRequest<T>(url, { method: "GET" });
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  return apiRequest<T>(url, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  return apiRequest<T>(url, {
    method: "PUT",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T>(url: string): Promise<T> {
  return apiRequest<T>(url, { method: "DELETE" });
}
