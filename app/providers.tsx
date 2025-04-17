/**
 * 这个文件提供了全局服务提供者(Providers)，为整个应用提供全局功能
 * 'use client' 标记表示这个组件在浏览器端运行，而不是在服务器端
 */
'use client';

// 导入Ant Design的配置提供者，它用于自定义UI组件的主题和样式
import { ConfigProvider } from 'antd';
// 导入中文语言包，使Ant Design组件显示中文文本
import zhCN from 'antd/locale/zh_CN';
// 导入Redux提供者，用于全局状态管理（类似于一个中央数据库，存储应用中共享的数据）
import ReduxProvider from '@/app/lib/store/provider';
// 导入身份验证提供者，用于处理用户登录状态和权限验证
import AuthProvider from './components/AuthProvider';

/**
 * Providers组件整合了所有全局服务
 * 它们的嵌套顺序很重要，外层的提供者可以被内层的提供者使用
 * 
 * @param {object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件，即应用的主要内容
 * @returns {JSX.Element} 返回包含所有全局服务的结构
 */
export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ReduxProvider: 最外层，提供全局状态管理
    <ReduxProvider>
      {/* AuthProvider: 处理用户认证和权限 */}
      <AuthProvider>
        {/* 
          ConfigProvider: Ant Design的配置
          - locale={zhCN}: 设置中文语言
          - theme: 自定义主题
            - colorPrimary: 主色调，天蓝色
            - borderRadius: 边框圆角大小，单位是像素
        */}
        <ConfigProvider
          locale={zhCN}
          theme={{
            token: {
              colorPrimary: '#1890ff',
              borderRadius: 6,
            },
          }}
        >
          {/* children: 应用的主要内容 */}
          {children}
        </ConfigProvider>
      </AuthProvider>
    </ReduxProvider>
  );
} 
