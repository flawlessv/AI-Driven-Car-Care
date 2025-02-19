'use client';

import { configureStore, Middleware } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

// 从localStorage加载初始状态
const loadAuthState = () => {
  if (typeof window === 'undefined') return undefined;
  
  try {
    const serializedAuth = localStorage.getItem('auth');
    if (serializedAuth === null) return undefined;
    return JSON.parse(serializedAuth);
  } catch (err) {
    console.error('Error loading auth state:', err);
    return undefined;
  }
};

// 创建一个防抖函数
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 创建持久化中间件
const persistMiddleware: Middleware = (store) => {
  // 使用防抖来避免频繁写入
  const debouncedSave = debounce((state) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth', JSON.stringify(state.auth));
    }
  }, 1000);

  return next => action => {
    const result = next(action);
    
    // 只有在auth相关的action时才保存状态
    if (action.type.startsWith('auth/')) {
      debouncedSave(store.getState());
    }
    
    return result;
  };
};

// 创建store
const createStore = () => {
  const preloadedState = {
    auth: loadAuthState() || {
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
    }
  };

  return configureStore({
    reducer: {
      auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(persistMiddleware),
    preloadedState,
  });
};

// 使用单例模式
let store: ReturnType<typeof createStore>;

const initializeStore = () => {
  if (typeof window === 'undefined') return createStore();
  return store ?? (store = createStore());
};

// 导出store单例
const storeInstance = initializeStore();

export type RootState = ReturnType<typeof storeInstance.getState>;
export type AppDispatch = typeof storeInstance.dispatch;

export { login, logout } from './slices/authSlice';
export default storeInstance;