/**
 * 这个文件定义了网站的根页面(网站首页)
 * 'use client' 标记表示这个组件在浏览器端运行，而不是在服务器端
 */
'use client';

// 导入React的useEffect钩子，它用于处理组件生命周期中的副作用(比如页面跳转)
import { useEffect } from 'react';
// 导入Next.js的路由功能，用于页面导航
import { useRouter } from 'next/navigation';

/**
 * RootPage组件 - 网站的根页面
 * 这个页面的唯一功能是自动将用户重定向到首页(/home)
 * 
 * @returns {null} 不渲染任何内容，因为会立即重定向
 */
export default function RootPage() {
  // 获取路由器实例，用于页面导航
  const router = useRouter();
  
  // useEffect会在组件加载后执行
  // 这里的作用是自动将用户导航到/home页面
  // [router]表示只有当router变化时才重新执行，实际上它只会执行一次
  useEffect(() => {
    // 将用户重定向到主页
    router.push('/home');
  }, [router]);

  // 返回null，表示这个页面不显示任何内容
  // 因为用户会被立即重定向到首页
  return null;
}

