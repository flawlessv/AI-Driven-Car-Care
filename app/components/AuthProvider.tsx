/**
 * 身份验证提供者组件
 * 
 * 这个文件负责在应用启动时检查用户的登录状态，并在整个应用中提供这些信息
 * 'use client' 标记表示这个组件在浏览器端运行，而不是在服务器端
 */
'use client';

// 导入React钩子和组件类型
import { ReactNode, useEffect, useState } from 'react';
// 导入Redux钩子，用于读取和更新全局状态
import { useDispatch, useSelector } from 'react-redux';
// 导入登录action，用于更新认证状态
import { login } from '@/app/lib/store/slices/authSlice';
// 导入根状态类型
import { RootState } from '@/app/lib/store';

/**
 * AuthProvider组件的属性接口
 * 
 * @property {ReactNode} children - 子组件，即被包裹的应用内容
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 身份验证提供者组件
 * 负责检查和维护用户的登录状态
 * 
 * @param {AuthProviderProps} props - 组件属性
 * @returns {JSX.Element} 返回子组件，同时在后台处理认证逻辑
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  // 获取派发函数，用于向Redux发送action
  const dispatch = useDispatch();
  // 从Redux状态中获取认证信息
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  // 创建加载状态，表示是否正在检查用户会话
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 使用useEffect钩子在组件挂载和依赖项变化时执行代码
   * 这里的代码会在组件第一次渲染时执行，以及当isAuthenticated或user变化时重新执行
   */
  useEffect(() => {
    // 在控制台打印认证状态，用于调试
    console.log('AuthProvider初始化，检查用户认证状态:', {
      isAuthenticated,  // 用户是否已认证
      hasUser: !!user,  // 是否有用户信息
      userId: user?._id,  // 用户ID
      role: user?.role,  // 用户角色
      hasPermissions: !!user?.permissions,  // 是否有权限信息
      permissionsCount: user?.permissions?.length  // 权限数量
    });
    
    // 条件判断：如果用户未认证，则获取会话信息
    if (!isAuthenticated) {
      fetchUserSession();  // 调用获取用户会话的函数
    } else {
      // 如果用户已认证，设置加载状态为false
      setIsLoading(false);
      // 在控制台打印用户权限信息
      console.log('用户已认证，权限信息:', {
        permissions: user?.permissions || []
      });
    }
  }, [isAuthenticated, user]);  // 依赖项：当这些值变化时重新执行

  /**
   * 获取用户会话信息的异步函数
   * 向服务器发送请求，检查用户是否已登录
   */
  const fetchUserSession = async () => {
    try {
      // 记录开始获取会话的日志
      console.log('开始获取用户会话...');
      // 设置加载状态为true
      setIsLoading(true);
      
      // 向服务器发送获取会话的请求
      const response = await fetch('/api/auth/session');
      // 解析返回的JSON数据
      const data = await response.json();

      // 记录会话API返回的结果
      console.log('会话API返回结果:', data);

      // 如果返回成功且有用户数据
      if (data.success && data.data?.user) {
        // 记录成功获取会话的日志和用户信息
        console.log('成功获取会话，用户信息:', {
          username: data.data.user.username,
          role: data.data.user.role,
          permissionsCount: data.data.user.permissions?.length || 0,
          permissions: data.data.user.permissions || []
        });
        
        // 通过Redux更新全局状态，存储用户信息和令牌
        dispatch(login({
          user: data.data.user,  // 用户信息
          token: localStorage.getItem('token') || '',  // 从本地存储获取令牌
        }));
      } else {
        // 记录没有有效会话的日志
        console.log('没有有效的会话或会话已过期');
      }
    } catch (error) {
      // 捕获并处理任何可能发生的错误
      console.error('获取会话时出错:', error);
    } finally {
      // 无论成功还是失败，都设置加载状态为false
      setIsLoading(false);
    }
  };

  // 注释掉的加载指示器代码
  // 如果正在加载，可以显示加载指示器，但当前代码选择不显示
  // if (isLoading) {
  //   return <div>加载用户信息中...</div>;
  // }

  // 返回子组件
  // 无论认证状态如何，都渲染子组件，但在后台已经处理了认证状态
  return <>{children}</>;
} 