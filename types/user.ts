export type UserRole = 'admin' | 'staff' | 'customer';

export interface User {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff' | 'customer';
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm extends LoginForm {
  username: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
} 