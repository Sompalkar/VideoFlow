const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string,
    config?: { withCredentials?: boolean }
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Support both token-based and cookie-based auth
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const requestConfig: RequestInit = {
      ...options,
      headers,
      credentials: config?.withCredentials ? "include" : "same-origin",
    };

    try {
      const response = await fetch(url, requestConfig);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async get<T>(
    endpoint: string,
    token?: string,
    config?: { withCredentials?: boolean }
  ): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" }, token, config);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    token?: string,
    config?: { withCredentials?: boolean }
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      },
      token,
      config
    );
  }

  async put<T>(
    endpoint: string,
    data?: any,
    token?: string,
    config?: { withCredentials?: boolean }
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
      },
      token,
      config
    );
  }

  async delete<T>(
    endpoint: string,
    token?: string,
    config?: { withCredentials?: boolean }
  ): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" }, token, config);
  }

  async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    token?: string,
    config?: { withCredentials?: boolean }
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
        credentials: config?.withCredentials ? "include" : "same-origin",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("File upload failed:", error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
