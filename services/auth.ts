// API URL from environment variable (no hardcoded IPs)
// Default to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  client_id: string | null;  // Link to client (contact)
  role?: string;
  email_verified?: boolean;
  is_approved?: boolean;  // Admin approval status
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  captcha_token?: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  captcha_token?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Use JSON for login to support CAPTCHA token
    const loginData: any = {
      username: credentials.username,
      password: credentials.password,
    };
    
    // Only include captcha_token if it's provided (not null/undefined)
    if (credentials.captcha_token) {
      loginData.captcha_token = credentials.captcha_token;
    }

    try {
      // Debug: Log what we're sending
      console.log('🔍 Login request:', {
        url: `${API_BASE_URL}/api/auth/login`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
        loginData
      });
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
      
      // Debug: Log response
      console.log('🔍 Login response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        let errorDetail = 'Login failed';
        try {
          const error = await response.json();
          console.error('Login API error:', error); // Debug log
          
          // Handle FastAPI validation errors (422)
          if (response.status === 422) {
            if (Array.isArray(error.detail)) {
              const validationErrors = error.detail.map((e: any) => 
                `${e.loc?.join('.')}: ${e.msg}`
              ).join(', ');
              errorDetail = `Validation error: ${validationErrors}`;
            } else if (typeof error.detail === 'string') {
              errorDetail = error.detail;
            } else {
              errorDetail = `Validation error: ${JSON.stringify(error.detail)}`;
            }
          } else {
            errorDetail = error.detail || error.message || 'Login failed';
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          // If JSON parsing fails, try to get text response
          try {
            const text = await response.text();
            errorDetail = text || `Login failed: ${response.status} ${response.statusText}`;
          } catch {
            errorDetail = response.status === 401 
              ? 'Incorrect username or password' 
              : `Login failed: ${response.status} ${response.statusText}`;
          }
        }
        
        // Always ensure we have a string error message, never "[object Object]"
        const finalError = typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail);
        throw new Error(finalError);
      }

      const data: AuthResponse = await response.json();
      this.setToken(data.access_token);
      // Don't fetch user here - let handleLoginSuccess do it to avoid duplicate calls
      // The user will be fetched in handleLoginSuccess
      return data;
    } catch (err) {
      // Re-throw with better error message if it's a network error
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      throw err;
    }
  }

  async register(data: RegisterData): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(error.detail || 'Registration failed');
    }

    return await response.json();
  }

  async fetchCurrentUser(retryCount: number = 0): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Handle rate limiting (429) with retry
    if (response.status === 429 && retryCount < 2) {
      // Wait 1 second before retrying (exponential backoff)
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.fetchCurrentUser(retryCount + 1);
    }

    if (!response.ok) {
      // Don't logout on 429 errors - just throw
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      this.logout();
      throw new Error('Failed to fetch user');
    }

    const user: User = await response.json();
    this.setUser(user);
    return user;
  }

  // Alias for fetchCurrentUser (for backward compatibility)
  // Checks cache first, then fetches if needed
  async getCurrentUser(forceRefresh: boolean = false): Promise<User> {
    // If we have a cached user and not forcing refresh, return it
    if (!forceRefresh) {
      const cachedUser = this.getUser();
      if (cachedUser) {
        // Still fetch in background to ensure data is fresh, but return cached immediately
        this.fetchCurrentUser().catch(err => {
          console.warn('Background user fetch failed:', err);
        });
        return cachedUser;
      }
    }
    // No cache or force refresh - fetch from API
    return this.fetchCurrentUser();
  }

  async googleLogin(credential: string): Promise<AuthResponse> {
    if (!credential) {
      throw new Error('Google credential is missing');
    }
    
    const requestBody = { token: credential };
    console.log('Google login request:', { 
      hasToken: !!credential, 
      tokenLength: credential.length,
      tokenPreview: credential.substring(0, 50) + '...',
      requestBody: { token: '[REDACTED]' }
    });
    
    const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = 'Google login failed';
      try {
        const error = await response.json();
        // Handle FastAPI validation errors (422)
        if (error.detail) {
          if (Array.isArray(error.detail)) {
            // Validation errors come as an array
            errorMessage = error.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ');
          } else if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else {
            errorMessage = JSON.stringify(error.detail);
          }
        } else if (error.message) {
          errorMessage = error.message;
        } else {
          errorMessage = JSON.stringify(error);
        }
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data: AuthResponse = await response.json();
    this.setToken(data.access_token);
    // Don't fetch user here - let handleLoginSuccess do it to avoid duplicate calls
    return data;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }
}

export const authService = new AuthService();

