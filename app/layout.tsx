/**
 * 这个文件是整个网站的基础布局文件，它定义了所有页面的共同结构
 * 类似于一个网页的"骨架"，所有其他页面内容都会放在这个骨架里面
 */

// 导入全局CSS样式文件，这个文件包含了整个网站通用的样式设置
import './globals.css';
// 导入元数据类型，用于设置网页的标题、描述等信息
import type { Metadata } from "next";
// 导入Inter字体，这是一种谷歌提供的网页字体
import { Inter } from "next/font/google";
// 导入Providers组件，它提供了一些全局功能，比如状态管理、主题等
import Providers from './providers';

/**
 * 设置Inter字体的配置
 * subsets: ["latin"] - 只加载拉丁字符集，减少加载时间
 * variable: "--font-inter" - 创建一个CSS变量，可以在样式中使用这个字体
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

/**
 * 设置网站的元数据信息
 * title - 浏览器标签页显示的标题
 * description - 网站描述，用于搜索引擎优化和社交媒体分享
 */
export const metadata: Metadata = {
  title: "佳伟汽车保养系统",
  description: "佳伟汽车保养系统",
};

/**
 * RootLayout是网站的根布局组件
 * @param {object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件，即所有页面的实际内容
 * @returns {JSX.Element} 返回网站的HTML结构
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // html标签，设置网站的语言为中文
    <html lang="zh-CN">
      <head>
        {/* 视口设置，确保网站在各种设备上都能正确显示 */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* 网站图标设置 */}
        <link rel="icon" href="/favicon.ico" />
      </head>
      {/* 
        body标签，应用了以下样式：
        - inter.variable: 使用Inter字体
        - antialiased: 使文字显示更平滑
      */}
      <body className={`${inter.variable} antialiased`}>
        {/* Providers组件包裹所有内容，提供全局功能 */}
        <Providers>
          {/* children是实际页面内容，会根据用户访问的路径不同而变化 */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
