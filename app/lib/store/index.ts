/**
 * Redux存储配置文件
 * 
 * 这个文件创建和配置了全局状态存储，集中管理应用的所有状态
 * 所有其他组件可以通过这个存储读取和更新状态
 */

// 导入Redux Toolkit的配置工具
import { configureStore } from '@reduxjs/toolkit';
// 导入认证状态的reducer和所有操作
import authReducer, { 
  login,         // 登录成功
  loginStart,    // 开始登录
  loginFailure,  // 登录失败
  logout,        // 登出
  updateUser,    // 更新用户信息
  setError,      // 设置错误
  clearError     // 清除错误
} from './slices/authSlice';

/**
 * 导出所有认证相关的操作
 * 这样其他文件可以直接从store导入这些操作
 */
export { 
  login, 
  loginStart, 
  loginFailure, 
  logout, 
  updateUser, 
  setError, 
  clearError 
};

/**
 * 创建全局的Redux存储
 * 
 * 这个存储是应用中所有状态的集中管理点
 * 当前只包含了auth（认证）状态切片
 */
export const store = configureStore({
  // 组合所有的reducer，当前只有认证reducer
  reducer: {
    auth: authReducer,
  },
  // Redux开发工具配置，只在非生产环境启用
  devTools: process.env.NODE_ENV !== 'production',
});

// 从存储自动推导出全局状态类型，用于类型检查
export type RootState = ReturnType<typeof store.getState>;
// 从存储自动推导出派发函数类型，用于类型检查
export type AppDispatch = typeof store.dispatch; 