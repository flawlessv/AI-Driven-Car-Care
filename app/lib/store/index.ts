import { configureStore } from '@reduxjs/toolkit';
import authReducer, { 
  login, 
  loginStart, 
  loginFailure, 
  logout, 
  updateUser, 
  setError, 
  clearError 
} from './slices/authSlice';

// 导出action creators
export { 
  login, 
  loginStart, 
  loginFailure, 
  logout, 
  updateUser, 
  setError, 
  clearError 
};

// 创建全局的store
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  // 开发工具配置
  devTools: process.env.NODE_ENV !== 'production',
});

// 从store本身推导出RootState和AppDispatch类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 