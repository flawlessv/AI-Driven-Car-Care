import { User } from '@/types/user';

// Auth状态接口
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

// 根状态接口
export interface RootState {
  auth: AuthState;
}

// 仓库dispatch接口
export type AppDispatch = any;

// 导出登录登出动作
export function login(payload: { user: User; token: string }): void;
export function logout(): void; 