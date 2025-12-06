/**
 * Authentication Service
 * Handles all authentication related API calls
 */

import api, { apiHelpers } from './api';

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password?: string;
  date_of_birth?: string;
}

export interface RegisterData {
  email: string;
  phone?: string;
  password?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  role_type: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  profile_picture?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  country?: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE';
  is_active: boolean;
  role_type: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'AI_MACHINE';
  role_profile?: any;
  created_at: string;
  last_login?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    user: User;
  };
}

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/users/auth/login/', credentials);
      
      if (response.data.success) {
        // Save auth data to localStorage
        apiHelpers.saveAuthData(response.data.data);
      }
      
      return response.data;
    } catch (error: any) {
      throw apiHelpers.handleError(error);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/users/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth data regardless of API response
      apiHelpers.clearAuthData();
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<any> {
    try {
      const response = await api.post('/users/auth/register/', data);
      return response.data;
    } catch (error: any) {
      throw apiHelpers.handleError(error);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    try {
      const response = await api.get('/users/users/me/');
      
      if (response.data.success) {
        // Update user in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.data));
        return response.data.data;
      }
      
      throw new Error('Failed to fetch profile');
    } catch (error: any) {
      throw apiHelpers.handleError(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await api.put('/users/users/update_profile/', data);
      
      if (response.data.success) {
        // Update user in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.data));
        return response.data.data;
      }
      
      throw new Error('Failed to update profile');
    } catch (error: any) {
      throw apiHelpers.handleError(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(data: {
    old_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<any> {
    try {
      const response = await api.post('/users/users/change_password/', data);
      return response.data;
    } catch (error: any) {
      throw apiHelpers.handleError(error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/users/auth/refresh/', {
        refresh: refreshToken,
      });

      const { access } = response.data;
      localStorage.setItem('access_token', access);
      
      return access;
    } catch (error: any) {
      apiHelpers.clearAuthData();
      throw apiHelpers.handleError(error);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiHelpers.isAuthenticated();
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    return apiHelpers.getCurrentUser();
  }
}

export default new AuthService();


