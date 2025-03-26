'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '@/lib/store/slices/authSlice';
import { RootState } from '@/lib/store';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider初始化，检查用户认证状态:', {
      isAuthenticated,
      hasUser: !!user,
      userId: user?._id,
      role: user?.role,
      hasPermissions: !!user?.permissions,
      permissionsCount: user?.permissions?.length
    });
    
    // 用户未认证时获取会话
    if (!isAuthenticated) {
      fetchUserSession();
    } else {
      setIsLoading(false);
      console.log('用户已认证，权限信息:', {
        permissions: user?.permissions || []
      });
    }
  }, [isAuthenticated, user]);

  const fetchUserSession = async () => {
    try {
      console.log('开始获取用户会话...');
      setIsLoading(true);
      
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      console.log('会话API返回结果:', data);

      if (data.success && data.data?.user) {
        console.log('成功获取会话，用户信息:', {
          username: data.data.user.username,
          role: data.data.user.role,
          permissionsCount: data.data.user.permissions?.length || 0,
          permissions: data.data.user.permissions || []
        });
        
        // 更新Redux状态
        dispatch(login({
          user: data.data.user,
          token: localStorage.getItem('token') || '',
        }));
      } else {
        console.log('没有有效的会话或会话已过期');
      }
    } catch (error) {
      console.error('获取会话时出错:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 如果正在加载，可以考虑添加加载指示器
  // if (isLoading) {
  //   return <div>加载用户信息中...</div>;
  // }

  // 返回子组件
  return <>{children}</>;
} 