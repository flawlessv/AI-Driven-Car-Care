# 汽车维修保养管理系统

这是一个基于 [Next.js](https://nextjs.org) 开发的专业汽车维修保养管理系统。

## 功能特点

- 🚗 车辆管理：完整的车辆信息管理，包括基本信息、维修历史等
- 🔧 维修保养：支持预约、维修跟踪、保养提醒等功能
- 📊 数据统计：提供详细的维修数据分析和报表功能
- 👥 客户管理：客户信息管理、服务历史记录等
- 🔐 权限控制：多角色权限管理，确保数据安全
- 📱 响应式设计：支持多种设备访问

## 开始使用

首先，运行开发服务器：

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

你可以通过修改 `app/page.tsx` 来开始编辑页面。当你编辑文件时，页面会自动更新。

本项目使用 [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) 来自动优化和加载 [Geist](https://vercel.com/font)，这是 Vercel 的新字体系列。

## 技术栈

- **前端框架**: Next.js 14
- **UI组件**: Ant Design
- **状态管理**: Redux Toolkit
- **数据库**: MongoDB
- **认证**: JWT
- **样式**: Tailwind CSS

## 系统要求

- Node.js 18.0 或更高版本
- MongoDB 4.4 或更高版本
- 支持现代浏览器

## 环境变量配置

创建 `.env.local` 文件并配置以下环境变量：

```bash
MONGODB_URI=你的MongoDB连接URI
JWT_SECRET=你的JWT密钥
```

## 了解更多

要了解更多关于 Next.js 的信息，请查看以下资源：

- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 特性和 API
- [学习 Next.js](https://nextjs.org/learn) - 交互式 Next.js 教程

欢迎查看 [Next.js GitHub 仓库](https://github.com/vercel/next.js)，欢迎您的反馈和贡献！

## 开发团队

- 技术总监：赵世伟 - 25年前端开发经验
- 首席技师：刘佳- 河南永城深情哥
- 客服主管：小八 - 搞笑的

## 部署

推荐使用 [Vercel 平台](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) 部署，这是 Next.js 创建者开发的平台。

查看 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying) 了解更多部署详情。

## 许可证

[MIT](LICENSE) © 2024 伟佳汽修

## 权限管理功能

系统提供了细粒度的权限管理功能，可以对不同角色和用户分配不同的菜单权限：

### 权限类型

- **只读(read)**: 用户可以查看此功能但不能编辑
- **读写(write)**: 用户可以查看和编辑此功能
- **管理(manage)**: 用户拥有此功能的全部权限，包括高级设置
- **无权限(none)**: 用户无法查看或使用此功能

### 权限控制

1. **基于角色的权限默认规则**: 系统为不同角色(管理员、员工、客户)提供默认权限配置
2. **用户级别的权限配置**: 可以为特定用户设置个性化权限
3. **权限规则管理**: 可以创建和管理权限规则模板，应用到多个用户

### 权限初始化

首次部署系统后，可以运行以下命令初始化默认权限规则：

```bash
npm run init-permissions
```

### 使用权限保护组件

在需要权限控制的组件中使用 `PermissionGuard` 组件：

```tsx
<PermissionGuard requiredPermission="read" menuKey="users">
  <YourComponent />
</PermissionGuard>
```
