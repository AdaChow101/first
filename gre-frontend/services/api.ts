import { Token, User } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8001';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('gre_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('gre_token');
    }
    return this.token;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('gre_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      ...options.headers,
    };

    if (this.token) {
      (headers as any)['Authorization'] = `Bearer ${this.token}`;
    }

    // Default to JSON unless strictly specified (like for form data)
    if (!(options.body instanceof URLSearchParams)) {
       (headers as any)['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || 'API request failed');
      }

      return response.json();
    } catch (error) {
      console.error(`API Error at ${endpoint}:`, error);
      throw error;
    }
  }

  async checkHealth(): Promise<{ database_status: string }> {
    return this.request('/health-check');
  }

  // Matches Python: @app.post("/login") with OAuth2PasswordRequestForm
  async login(email: string, password: string): Promise<Token> {
    const formData = new URLSearchParams();
    formData.append('username', email); // OAuth2 expects 'username' field
    formData.append('password', password);

    const data = await this.request<Token>('/login', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    this.setToken(data.access_token);
    return data;
  }

  // Matches Python: @app.post("/users/register")
  async register(email: string, password: string): Promise<User> {
    return this.request<User>('/users/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Matches Python: @app.get("/users/me")
  async getMe(): Promise<User> {
    return this.request<User>('/users/me');
  }
}

export const api = new ApiService();