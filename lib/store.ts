import { configureStore } from '@reduxjs/toolkit';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 认证状态接口
interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  loading: boolean;
  phone: string | null;
}

// 从localStorage获取初始状态
const loadState = (): AuthState => {
  try {
    const serializedState = localStorage.getItem('auth');
    if (serializedState === null) {
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        phone: null,
      };
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error('加载状态失败:', err);
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      phone: null,
    };
  }
};

// 保存状态到localStorage
const saveState = (state: AuthState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('auth', serializedState);
  } catch (err) {
    console.error('保存状态失败:', err);
  }
};

// 创建认证slice
const authSlice = createSlice({
  name: 'auth',
  initialState: loadState(),
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: any; token: string }>
    ) => {
      const { user, token } = action.payload;
      console.log('user123', user,action.payload);
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.phone = user.phone || null;
      saveState(state);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('auth');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

// 导出actions
export const { setCredentials, logout, setLoading } = authSlice.actions;

// 配置store
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  preloadedState: {
    auth: loadState(),
  },
});

// 订阅store变化，保存状态
store.subscribe(() => {
  const state = store.getState();
  saveState(state.auth);
});

// 导出类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 