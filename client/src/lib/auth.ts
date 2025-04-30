import { apiRequest } from './queryClient';
import { User } from './supabase';

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = LoginCredentials & {
  role?: 'user' | 'dev';
};

// Login function
export async function login(credentials: LoginCredentials) {
  const response = await apiRequest('POST', '/api/auth/login', credentials);
  const data = await response.json();
  
  // Save token to local storage
  localStorage.setItem('auth_token', data.token);
  
  return data;
}

// Register function
export async function register(userData: RegisterData) {
  const response = await apiRequest('POST', '/api/auth/register', userData);
  const data = await response.json();
  
  // Save token to local storage
  localStorage.setItem('auth_token', data.token);
  
  return data;
}

// Logout function
export function logout() {
  localStorage.removeItem('auth_token');
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      return null;
    }
    
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      logout(); // Clear invalid token
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Check if user is authenticated
export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}
