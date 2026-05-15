import apiClient from '../client';
import type { AuthResponse, LoginRequest, RegisterRequest } from './auth.types';

export const authApi = {
  login: (payload: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', payload),

  register: (payload: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', payload),

  logout: () => apiClient.post('/auth/logout'),

  me: () => apiClient.get<AuthResponse['user']>('/auth/me'),
};
