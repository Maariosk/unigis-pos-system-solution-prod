import http from './http';

export type AuthUser = {
  id: number;
  username: string;
  displayName: string;
  zone: string;
};

export type LoginRequest = { username: string; password: string };
export type LoginResponse = { success: boolean; message?: string; user?: AuthUser };
export type RegisterRequest = { username: string; password: string; displayName: string; zone: string };
export type ApiResponse = { success: boolean; message?: string };

export const login = (data: LoginRequest) =>
  http.post<LoginResponse>('/auth/login', data).then(r => r.data);

export const register = (data: RegisterRequest) =>
  http.post<ApiResponse>('/auth/register', data).then(r => r.data);

const authApi = { login, register };
export default authApi;
