export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = import.meta.env.VITE_API_BASE_URL ?? "/api") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { Accept: "application/json", ...init.headers },
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`${init.method ?? "GET"} ${path} failed (${res.status})${detail ? `: ${detail}` : ""}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }
}

export const apiClient = new ApiClient();
