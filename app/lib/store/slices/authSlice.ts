/**
 * 认证状态管理模块
 * 
 * 这个文件管理整个应用的用户认证状态，包括用户信息、登录凭证、认证状态等
 * 使用Redux Toolkit实现状态管理，方便在应用的任何部分获取和更新认证信息
 */

// 导入Redux Toolkit的工具函数和类型
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// 导入用户类型定义
import type { User } from '@/types/user';

/**
 * 认证状态接口
 * 定义了认证状态包含的所有信息
 * 
 * @property {User | null} user - 用户信息，未登录时为null
 * @property {string | null} token - 认证令牌，未登录时为null
 * @property {boolean} isAuthenticated - 是否已认证
 * @property {boolean} loading - 是否正在加载（如登录中）
 * @property {string | null} error - 错误信息，没有错误时为null
 */
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * 认证状态的初始值
 * 
 * 初始时：
 * - 用户信息为空
 * - 尝试从本地存储获取令牌（如果在浏览器环境）
 * - 未认证
 * - 不在加载状态
 * - 没有错误
 */
const initialState: AuthState = {
  user: null,
  // 检查是否在浏览器环境，是则尝试从localStorage获取令牌
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

/**
 * 创建认证状态切片
 * 定义了所有可以修改认证状态的操作（reducers）
 */
const authSlice = createSlice({
  name: 'auth', // 切片名称，用于Redux开发工具
  initialState,  // 初始状态
  reducers: {    // 状态更新函数
    /**
     * 登录成功
     * 设置用户信息和令牌，更新认证状态
     * 
     * @param {AuthState} state - 当前状态
     * @param {PayloadAction<{user: User; token: string}>} action - 包含用户信息和令牌的action
     */
    login: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.loading = false;  // 加载完成
      state.isAuthenticated = true;  // 已认证
      state.user = action.payload.user;  // 设置用户信息
      state.token = action.payload.token;  // 设置令牌
      state.error = null;  // 清除错误
      // 如果在浏览器环境，将令牌保存到本地存储
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.token);
      }
    },
    
    /**
     * 开始登录
     * 设置加载状态，清除之前的错误
     * 
     * @param {AuthState} state - 当前状态
     */
    loginStart: (state) => {
      state.loading = true;  // 正在加载
      state.error = null;    // 清除错误
    },
    
    /**
     * 登录失败
     * 清除用户信息和令牌，设置错误信息
     * 
     * @param {AuthState} state - 当前状态
     * @param {PayloadAction<string>} action - 包含错误信息的action
     */
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;  // 加载完成
      state.isAuthenticated = false;  // 未认证
      state.user = null;  // 清除用户信息
      state.token = null;  // 清除令牌
      state.error = action.payload;  // 设置错误信息
    },
    
    /**
     * 登出
     * 清除所有认证信息
     * 
     * @param {AuthState} state - 当前状态
     */
    logout: (state) => {
      state.user = null;  // 清除用户信息
      state.token = null;  // 清除令牌
      state.isAuthenticated = false;  // 未认证
      state.loading = false;  // 不在加载状态
      state.error = null;  // 清除错误
      // 如果在浏览器环境，从本地存储中移除令牌
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    },
    
    /**
     * 更新用户信息
     * 仅更新用户信息，不改变认证状态
     * 
     * @param {AuthState} state - 当前状态
     * @param {PayloadAction<User>} action - 包含新用户信息的action
     */
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;  // 更新用户信息
    },
    
    /**
     * 设置错误信息
     * 
     * @param {AuthState} state - 当前状态
     * @param {PayloadAction<string>} action - 包含错误信息的action
     */
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;  // 设置错误信息
    },
    
    /**
     * 清除错误信息
     * 
     * @param {AuthState} state - 当前状态
     */
    clearError: (state) => {
      state.error = null;  // 清除错误
    },
  },
});

/**
 * 导出所有action创建函数
 * 这些函数用于创建可以派发的action对象
 */
export const {
  login,        // 登录成功
  loginStart,   // 开始登录
  loginFailure, // 登录失败
  logout,       // 登出
  updateUser,   // 更新用户信息
  setError,     // 设置错误
  clearError,   // 清除错误
} = authSlice.actions;

/**
 * 导出reducer函数
 * 这个函数会被添加到根reducer中，处理认证相关的状态更新
 */
export default authSlice.reducer; 