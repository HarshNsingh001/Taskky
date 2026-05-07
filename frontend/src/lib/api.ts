const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/v1";

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 15_000;

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, ts: Date.now() });
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(auth = true): HeadersInit {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (auth) {
      const token = localStorage.getItem("access_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse(response: Response, auth = true) {
    const data = await response.json();

    if (response.status === 401 && auth) {
      const refreshed = await this.tryRefreshToken();
      if (!refreshed) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        throw new Error("Session expired");
      }
      return null;
    }

    if (!response.ok) {
      throw { status: response.status, ...data };
    }

    return data;
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      if (data.success && data.data) {
        localStorage.setItem("access_token", data.data.access_token);
        localStorage.setItem("refresh_token", data.data.refresh_token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async get(endpoint: string, useCache = true, auth = true) {
    if (useCache) {
      const cached = getCached(endpoint);
      if (cached) return cached;
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(auth),
    });
    const data = await this.handleResponse(res, auth);

    if (data === null) {
      const retry = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders(auth),
      });
      const retryData = await this.handleResponse(retry, auth);
      if (retryData && useCache) setCache(endpoint, retryData);
      return retryData;
    }

    if (useCache) setCache(endpoint, data);
    return data;
  }

  async post(endpoint: string, body?: any, auth = true) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: this.getHeaders(auth),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await this.handleResponse(res, auth);
    invalidateCache();
    return data;
  }

  async put(endpoint: string, body: any) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await this.handleResponse(res, true);
    invalidateCache();
    return data;
  }

  async patch(endpoint: string, body: any) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await this.handleResponse(res, true);
    invalidateCache();
    return data;
  }

  async delete(endpoint: string) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    const data = await this.handleResponse(res, true);
    invalidateCache();
    return data;
  }
}

export const api = new ApiClient(API_BASE);

export const authApi = {
  signup: (data: { full_name: string; email: string; password: string; role?: string; invite_code?: string }) =>
    api.post("/auth/signup", data, false),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data, false),
  me: () => api.get("/auth/me", false),
  logout: () => api.post("/auth/logout"),
};

export const usersApi = {
  list: () => api.get("/users"),
  updateMe: (data: { full_name?: string; avatar_url?: string }) => api.put("/users/me", data),
};

export const projectsApi = {
  list: () => api.get("/projects"),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post("/projects", data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  addMember: (projectId: string, userId: string) =>
    api.post(`/projects/${projectId}/members`, { user_id: userId }),
  getMembers: (projectId: string) => api.get(`/projects/${projectId}/members`),
};

export const tasksApi = {
  list: (projectId?: string) =>
    api.get(`/tasks${projectId ? `?project_id=${projectId}` : ""}`),
  get: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post("/tasks", data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/tasks/${id}/status`, { status }),
  assign: (id: string, userId: string) =>
    api.patch(`/tasks/${id}/assign`, { assigned_to: userId }),
};

export const analyticsApi = {
  dashboard: () => api.get("/analytics/dashboard"),
};
