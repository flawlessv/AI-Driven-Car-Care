/**
 * Redux提供者组件
 * 
 * 这个文件创建了一个组件，将Redux存储提供给整个应用
 * 这样应用中的任何组件都可以访问和更新全局状态
 * 'use client' 标记表示这个组件在浏览器端运行，而不是在服务器端
 */
'use client';

// 导入React的ReactNode类型，用于定义子组件
import { ReactNode } from 'react';
// 导入Redux的Provider组件，用于提供全局状态
import { Provider } from 'react-redux';
// 导入在index.ts中创建的全局存储
import { store } from './index';

/**
 * Redux提供者组件
 * 包装整个应用，使所有子组件都能访问Redux状态
 * 
 * @param {object} props - 组件属性
 * @param {ReactNode} props.children - 子组件，即应用的主要内容
 * @returns {JSX.Element} 返回包含Redux Provider的组件
 */
export default function ReduxProvider({ children }: { children: ReactNode }) {
  // 将Redux存储提供给所有子组件
  return <Provider store={store}>{children}</Provider>;
} 