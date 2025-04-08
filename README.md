# 汽车维修保养管理系统

这是一个基于 [Next.js](https://nextjs.org) 开发的专业汽车维修保养管理系统。

## 功能特点

- 🚗 车辆管理：完整的车辆信息管理，包括基本信息、维修历史等
- 🔧 维修保养：支持预约、维修跟踪、保养提醒等功能
- 📊 数据统计：提供详细的维修数据分析和报表功能
- 👥 客户管理：客户信息管理、服务历史记录等
- 🔐 权限控制：多角色权限管理，确保数据安全
- 📱 响应式设计：支持多种设备访问
- 📝 工单管理：完整的工单生命周期管理
- 🔄 预约流程：客户友好的预约系统

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

## 角色与权限系统

系统定义了三种主要角色，每种角色具有不同的默认权限：

### 角色类型

1. **管理员 (admin)**
   - 拥有系统内所有功能的完全访问权限
   - 可以管理所有用户、技师、工单和预约
   - 可以配置系统设置和权限规则

2. **技师 (technician)**
   - 仪表盘：只读权限
   - 车辆管理：只读权限
   - 保养维修：读写权限
   - 工单管理：只读权限
   - 预约管理：只读权限
   - 技师团队：只读权限
   - 配件库存：读写权限
   - 评价管理：只读权限
   - 无权访问权限管理和用户管理

3. **客户 (customer)**
   - 仪表盘：只读权限
   - 车辆管理：只读权限
   - 工单管理：只读权限（仅限自己的工单）
   - 预约管理：读写权限
   - 技师团队：只读权限
   - 评价管理：读写权限
   - 无权访问保养维修、配件库存、用户管理和权限管理

### 权限级别表格

| 菜单/功能 | 管理员(admin) | 技师(technician) | 客户(customer) |
|---------|--------------|-----------------|--------------|
| 仪表盘 | 管理(manage) | 只读(read) | 只读(read) |
| 车辆管理 | 管理(manage) | 只读(read) | 只读(read) |
| 车辆列表 | 管理(manage) | 只读(read) | 只读(read) |
| 车辆档案 | 管理(manage) | 只读(read) | 只读(read) |
| 健康评分 | 管理(manage) | 只读(read) | 只读(read) |
| 保养维修 | 管理(manage) | 读写(write) | 无权限(none) |
| 维修记录 | 管理(manage) | 读写(write) | 无权限(none) |
| 保养规则 | 管理(manage) | 只读(read) | 无权限(none) |
| 工单管理 | 管理(manage) | 读写(write) | 只读(read) |
| 预约管理 | 管理(manage) | 读写(write) | 读写(write) |
| 技师团队 | 管理(manage) | 只读(read) | 只读(read) |
| 用户管理 | 管理(manage) | 无权限(none) | 无权限(none) |
| 配件库存 | 管理(manage) | 读写(write) | 无权限(none) |
| 评价管理 | 管理(manage) | 只读(read) | 读写(write) |
| 权限管理 | 管理(manage) | 无权限(none) | 无权限(none) |

### 按钮级权限控制

系统实现了细粒度的按钮级权限控制，确保用户只能执行其角色允许的操作：

#### 预约管理按钮权限

| 按钮/操作 | 管理员(admin) | 技师(technician) | 客户(customer) |
|----------|--------------|-----------------|--------------|
| 创建预约 | ✅ | ✅ | ✅ |
| 编辑预约 | ✅ | ✅ | ✅(仅自己的) |
| 取消预约 | ✅ | ✅ | ✅(仅自己的) |
| 预约转工单 | ✅ | ✅ | ❌ |

#### 工单管理按钮权限

| 按钮/操作 | 管理员(admin) | 技师(technician) | 客户(customer) |
|----------|--------------|-----------------|--------------|
| 创建工单 | ✅ | ✅ | ❌ |
| 编辑工单 | ✅ | ✅ | ❌ |
| 分配技师 | ✅ | ❌ | ❌ |
| 更改状态 | ✅ | ✅ | ❌ |
| 上传证明 | ✅ | ✅ | ❌ |
| 审核工单 | ✅ | ❌ | ❌ |
| 评价工单 | ✅ | ❌ | ✅(仅自己的) |
| 删除工单 | ✅ | ❌ | ❌ |

#### 用户管理按钮权限

| 按钮/操作 | 管理员(admin) | 技师(technician) | 客户(customer) |
|----------|--------------|-----------------|--------------|
| 创建用户 | ✅ | ❌ | ❌ |
| 编辑用户 | ✅ | ❌ | ❌ |
| 删除用户 | ✅ | ❌ | ❌ |
| 重置密码 | ✅ | ❌ | ❌ |

#### 按钮权限实现方式

系统使用以下方式实现按钮级权限控制：

1. **条件渲染**：根据用户角色和权限条件性渲染按钮
   ```tsx
   {userRole === 'admin' && <Button>管理员操作</Button>}
   ```

2. **禁用状态**：对于某些情况，按钮会显示但处于禁用状态
   ```tsx
   <Button disabled={!hasPermission}>操作按钮</Button>
   ```

3. **权限守卫组件**：使用PermissionGuard组件保护按钮
   ```tsx
   <PermissionGuard requiredPermission="write" menuKey="work-orders">
     <Button>创建工单</Button>
   </PermissionGuard>
   ```

### 权限级别

- **只读(read)**: 用户可以查看此功能但不能编辑
- **读写(write)**: 用户可以查看和编辑此功能
- **管理(manage)**: 用户拥有此功能的全部权限，包括高级设置
- **无权限(none)**: 用户无法查看或使用此功能

### 权限初始化

首次部署系统后，可以运行以下命令初始化默认权限规则：

```bash
npm run init-permissions
```

## 预约流程

系统支持完整的预约管理流程，方便客户和技师协调维修保养服务。

### 预约和工单流程图

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|  用户创建预约单   +---->+  技师处理预约单   +---->+  转换为工单      |
|  (状态:待处理)    |     |  (状态:已处理)    |     |  (状态:待处理)   |
|                  |     |                  |     |                  |
+------------------+     +------------------+     +--------+---------+
                                                           |
                                                           v
+-----------------+     +------------------+     +------------------+
|                 |     |                  |     |                  |
|  客户评价服务    +<----+  工单完成确认     |<----+  技师上传证明     |
|  (完成整个流程)   |     |  (状态:已完成)    |     |  (状态:待审核)   |
|                 |     |                  |     |                  |
+-----------------+     +------------------+     +------------------+
```

### 详细流程步骤

1. **用户创建预约**
   - 用户可以在首页简单地创建预约请求
   - 系统记录预约信息并设置状态为"待处理"(pending)
   - 用户可以查看自己的预约状态

2. **技师处理预约**
   - 技师接收并处理"待处理"的预约单
   - 完善预约时间、填写预约费用、分配技师等信息
   - 预约状态更新为"已处理"(processed)

3. **转换为工单**
   - "已处理"的预约单可以在预约管理页面一键转为"工单"
   - 新生成的工单状态为"待处理"(pending)
   - 工单包含预约中的基本信息

4. **技师上传服务证明**
   - 技师完成维修工作后上传服务完成证明（图片）
   - 工单状态更新为"待审核"(pending_check)
   - 系统通知管理员审核工单

5. **管理员确认工单**
   - 管理员查看服务证明照片并确认
   - 确认后工单状态更新为"已完成"(completed)
   - 系统通知客户服务已完成

6. **客户评价**
   - 客户对已完成的工单进行评价和反馈
   - 仅客户可以对自己的工单进行评价
   - 所有评价会在评价管理中展示
   - 只有用户可以修改自己的评价

### 预约状态流转

| 状态 | 描述 | 可执行操作 | 操作人 |
|------|------|-----------|-------|
| 待处理(pending) | 客户新创建的预约 | 完善预约信息 | 技师 |
| 已处理(processed) | 技师已处理的预约 | 转为工单 | 技师/管理员 |
| 已完成(completed) | 服务已完成的预约 | 查看详情 | 所有人 |
| 已取消(cancelled) | 已取消的预约 | 无 | 无 |

### 工单状态流转

| 状态 | 描述 | 可执行操作 | 操作人 |
|------|------|-----------|-------|
| 待处理(pending) | 新创建的工单 | 开始处理 | 技师 |
| 已分配(assigned) | 已分配技师的工单 | 开始维修 | 技师 |
| 处理中(in_progress) | 正在维修的工单 | 上传完成证明 | 技师 |
| 待审核(pending_check) | 等待管理员审核 | 审核通过/退回 | 管理员 |
| 已完成(completed) | 维修已完成的工单 | 评价服务 | 客户 |
| 已取消(cancelled) | 已取消的工单 | 无 | 无 |

### 预约设置选项

系统支持多种预约设置，包括：
- 工作时间设置（开始和结束时间）
- 时间段长度（分钟）
- 最大提前预约天数
- 最小提前预约小时数
- 是否自动确认预约
- 提醒设置（电子邮件、短信、应用内推送）

## 工单管理系统

工单系统是汽车维修保养管理的核心，提供完整的维修服务跟踪。

### 工单状态流程

```
待处理(pending) → 已分配(assigned) → 处理中(in_progress) → 待审核(pending_check) → 已完成(completed)
```

也可以随时标记为：`已取消(cancelled)`

### 工单类型

- **维修(repair)**: 针对车辆故障的修复工作
- **保养(maintenance)**: 定期保养和维护服务
- **检查(inspection)**: 车辆检查和诊断服务

### 工单优先级

- **低(low)**: 不紧急的工作
- **中(medium)**: 标准优先级（默认）
- **高(high)**: 需要优先处理
- **紧急(urgent)**: 最高优先级，需要立即处理

### 工单权限控制

- **管理员**: 可以处理所有工单
- **技师**: 可以处理所有工单
- **客户**: 只能查看和操作自己的工单

### 工单完成流程

1. 技师完成维修工作
2. 上传完成证明（照片和说明）
3. 管理员审核确认
4. 工单状态更新为已完成
5. 客户可以对服务进行评价

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

## 数据库设计

系统使用 MongoDB 作为数据库，以下是主要数据模型的结构和关系：

### 数据库模型结构

#### 1. 用户模型 (User)

| 字段 | 类型 | 长度 | 必填 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | 主键 |
| username | String | - | 是 | - | 用户名，唯一 |
| name | String | - | 否 | - | 姓名 |
| email | String | - | 是 | - | 邮箱，唯一 |
| password | String | - | 是 | - | 密码，自动加密 |
| phone | String | - | 否 | - | 电话，唯一 |
| role | String | - | 是 | 'customer' | 角色：admin/technician/customer |
| permissions | Array | - | 否 | [] | 菜单权限配置 |
| status | String | - | 是 | 'active' | 状态：active/inactive/suspended |
| specialties | Array | - | 否 | [] | 技师专长（仅技师） |
| workExperience | Number | - | 否 | 0 | 工作经验（仅技师） |
| certifications | Array | - | 否 | [] | 证书（仅技师） |
| rating | Number | - | 否 | 0 | 评分（仅技师） |
| totalOrders | Number | - | 否 | 0 | 总订单数 |
| completedOrders | Number | - | 否 | 0 | 已完成订单数 |
| notes | String | - | 否 | - | 备注 |
| createdAt | Date | - | 是 | 自动生成 | 创建时间 |
| updatedAt | Date | - | 是 | 自动生成 | 更新时间 |

**索引**：username(唯一)、email(唯一)、phone(唯一)

#### 2. 车辆模型 (Vehicle)

| 字段 | 类型 | 长度 | 必填 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | 主键 |
| brand | String | - | 是 | - | 品牌 |
| model | String | - | 是 | - | 型号 |
| year | Number | - | 是 | 当前年份 | 年份 |
| licensePlate | String | - | 是 | - | 车牌号，唯一 |
| vin | String | - | 是 | 临时生成 | 车架号，唯一 |
| owner | ObjectId | - | 是 | - | 车主ID，关联User表 |
| ownerName | String | - | 否 | - | 车主姓名 |
| ownerContact | String | - | 否 | - | 车主联系方式 |
| mileage | Number | - | 否 | 0 | 里程数 |
| lastMaintenanceDate | Date | - | 否 | - | 上次保养日期 |
| nextMaintenanceDate | Date | - | 否 | - | 下次保养日期 |
| status | String | - | 是 | 'active' | 状态：active/inactive/maintenance/scrapped |
| notes | String | - | 否 | - | 备注 |
| createdAt | Date | - | 是 | 自动生成 | 创建时间 |
| updatedAt | Date | - | 是 | 自动生成 | 更新时间 |

**索引**：licensePlate(唯一)

#### 3. 预约模型 (Appointment)

| 字段 | 类型 | 长度 | 必填 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | 主键 |
| customer | Object | - | 是 | - | 客户信息 |
| customer.name | String | - | 是 | - | 客户姓名 |
| customer.phone | String | - | 是 | - | 客户电话 |
| customer.email | String | - | 否 | - | 客户邮箱 |
| vehicle | ObjectId | - | 是 | - | 关联车辆ID |
| service | ObjectId | - | 是 | - | 关联服务项目ID |
| date | Date | - | 是 | - | 预约日期 |
| startTime | String | - | 是 | - | 开始时间 |
| endTime | String | - | 否 | - | 结束时间 |
| technician | ObjectId | - | 否 | - | 关联技师ID |
| status | String | - | 是 | 'pending' | 状态：pending/confirmed/in_progress/completed/cancelled |
| notes | String | - | 否 | - | 备注 |
| estimatedDuration | Number | - | 是 | - | 预计时长(分钟) |
| estimatedCost | Number | - | 是 | - | 预计费用 |
| confirmationSent | Boolean | - | 是 | false | 是否已发送确认通知 |
| reminderSent | Boolean | - | 是 | false | 是否已发送提醒通知 |
| sourceWorkOrder | ObjectId | - | 否 | - | 关联工单ID |
| user | ObjectId | - | 否 | - | 关联用户ID |
| createdAt | Date | - | 是 | 自动生成 | 创建时间 |
| updatedAt | Date | - | 是 | 自动生成 | 更新时间 |

#### 4. 工单模型 (WorkOrder)

| 字段 | 类型 | 长度 | 必填 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | 主键 |
| orderNumber | String | - | 是 | - | 工单编号，唯一 |
| vehicle | ObjectId | - | 是 | - | 关联车辆ID |
| customer | ObjectId | - | 是 | - | 关联客户ID |
| technician | ObjectId | - | 否 | - | 关联技师ID |
| maintenanceRecord | ObjectId | - | 否 | - | 关联维修记录ID |
| type | String | - | 是 | - | 工单类型：repair/maintenance/inspection |
| description | String | - | 是 | - | 问题描述 |
| diagnosis | String | - | 否 | - | 故障诊断 |
| solution | String | - | 否 | - | 解决方案 |
| priority | String | - | 是 | 'medium' | 优先级：low/medium/high/urgent |
| status | String | - | 是 | 'pending' | 状态：pending/assigned/in_progress/pending_check/completed/cancelled |
| estimatedHours | Number | - | 是 | - | 预计工时 |
| actualHours | Number | - | 否 | - | 实际工时 |
| startDate | Date | - | 是 | - | 开始日期 |
| completionDate | Date | - | 否 | - | 完成日期 |
| customerNotes | String | - | 否 | - | 客户备注 |
| technicianNotes | String | - | 否 | - | 技师备注 |
| parts | Array | - | 否 | - | 使用的配件列表 |
| parts[].part | ObjectId | - | 是 | - | 配件ID |
| parts[].quantity | Number | - | 是 | - | 数量 |
| parts[].price | Number | - | 是 | - | 价格 |
| completionProof | Object | - | 否 | - | 完成证明 |
| completionProof.proofImages | Array | - | 否 | - | 证明图片 |
| completionProof.notes | String | - | 否 | - | 备注 |
| completionProof.submittedBy | ObjectId | - | 是 | - | 提交人ID |
| completionProof.submittedAt | Date | - | 是 | 当前时间 | 提交时间 |
| completionProof.approved | Boolean | - | 是 | false | 是否审批通过 |
| completionProof.approvedBy | ObjectId | - | 否 | - | 审批人ID |
| completionProof.approvedAt | Date | - | 否 | - | 审批时间 |
| progress | Array | - | 否 | - | 工单进度记录 |
| progress[].status | String | - | 是 | - | 状态 |
| progress[].notes | String | - | 否 | - | 备注 |
| progress[].timestamp | Date | - | 是 | 当前时间 | 时间戳 |
| progress[].user | ObjectId | - | 是 | - | 操作人ID |
| rating | Number | - | 否 | - | 评分(1-5) |
| feedback | String | - | 否 | - | 客户反馈 |
| createdBy | ObjectId | - | 是 | - | 创建人ID |
| createdAt | Date | - | 是 | 自动生成 | 创建时间 |
| updatedAt | Date | - | 是 | 自动生成 | 更新时间 |

**索引**：orderNumber(唯一)

#### 5. 配件模型 (Part)

| 字段 | 类型 | 长度 | 必填 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | 主键 |
| name | String | - | 是 | - | 配件名称 |
| code | String | - | 是 | - | 配件编号，唯一 |
| category | String | - | 是 | - | 类别 |
| description | String | - | 否 | - | 描述 |
| manufacturer | String | - | 是 | - | 制造商 |
| price | Number | - | 是 | - | 单价 |
| stock | Number | - | 是 | 0 | 库存数量 |
| minStock | Number | - | 是 | 5 | 最低库存 |
| unit | String | - | 否 | '个' | 单位 |
| location | String | - | 否 | - | 库存位置 |
| status | String | - | 是 | 'active' | 状态：active/inactive/discontinued |
| createdAt | Date | - | 是 | 自动生成 | 创建时间 |
| updatedAt | Date | - | 是 | 自动生成 | 更新时间 |

**索引**：code(唯一)、name、category、manufacturer

#### 6. 服务项目模型 (Service)

| 字段 | 类型 | 长度 | 必填 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | 主键 |
| name | String | - | 是 | - | 服务名称 |
| description | String | - | 否 | - | 服务描述 |
| category | String | - | 是 | - | 服务类型：维修/保养/检查 |
| duration | Number | - | 是 | - | 预计时长(分钟) |
| basePrice | Number | - | 是 | - | 基础价格 |
| createdAt | Date | - | 是 | 自动生成 | 创建时间 |
| updatedAt | Date | - | 是 | 自动生成 | 更新时间 |

#### 7. 评价模型 (Review)

| 字段 | 类型 | 长度 | 必填 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | 主键 |
| author | ObjectId | - | 是 | - | 评价人ID，关联User表 |
| authorName | String | - | 否 | - | 评价人姓名 |
| authorPhone | String | - | 否 | - | 评价人电话 |
| authorEmail | String | - | 否 | - | 评价人邮箱 |
| targetType | String | - | 是 | - | 评价对象类型：technician/shop |
| targetId | ObjectId | - | 是 | - | 评价对象ID |
| maintenanceRecord | ObjectId | - | 是 | - | 关联维修记录ID |
| rating | Number | - | 是 | - | 评分(1-5) |
| content | String | - | 是 | - | 评价内容 |
| images | Array | - | 否 | - | 图片列表 |
| tags | Array | - | 否 | - | 标签列表 |
| likes | Number | - | 是 | 0 | 点赞数 |
| status | String | - | 是 | 'published' | 状态：published/hidden/deleted |
| workOrder | ObjectId | - | 否 | - | 关联工单ID |
| workOrderNumber | String | - | 否 | - | 工单编号 |
| createdAt | Date | - | 是 | 自动生成 | 创建时间 |
| updatedAt | Date | - | 是 | 自动生成 | 更新时间 |

#### 8. 角色权限模型 (RolePermission)

| 字段 | 类型 | 长度 | 必填 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | 主键 |
| role | String | - | 是 | - | 角色名称，唯一，admin/customer/technician |
| permissions | Array | - | 否 | [] | 权限列表 |
| permissions[].menuKey | String | - | 是 | - | 菜单键名 |
| permissions[].permission | String | - | 是 | 'none' | 权限级别：read/write/manage/none |
| isDefault | Boolean | - | 是 | false | 是否为系统默认 |
| description | String | - | 否 | '' | 描述 |
| createdAt | Date | - | 是 | 自动生成 | 创建时间 |
| updatedAt | Date | - | 是 | 自动生成 | 更新时间 |

**索引**：role(唯一)

### 数据库表关联关系

1. **用户(User) 与 车辆(Vehicle)**
   - User.\_id → Vehicle.owner (一对多，一个用户可以拥有多个车辆)

2. **用户(User) 与 工单(WorkOrder)**
   - User.\_id → WorkOrder.customer (一对多，一个用户可以有多个工单)
   - User.\_id → WorkOrder.technician (一对多，一个技师可以负责多个工单)
   - User.\_id → WorkOrder.createdBy (一对多，一个用户可以创建多个工单)
   - User.\_id → WorkOrder.completionProof.submittedBy (一对多)
   - User.\_id → WorkOrder.completionProof.approvedBy (一对多)
   - User.\_id → WorkOrder.progress[].user (一对多)

3. **用户(User) 与 预约(Appointment)**
   - User.\_id → Appointment.technician (一对多，一个技师可以有多个预约)
   - User.\_id → Appointment.user (一对多，一个用户可以有多个预约)

4. **用户(User) 与 评价(Review)**
   - User.\_id → Review.author (一对多，一个用户可以发表多个评价)
   - User.\_id → Review.targetId (当targetType为technician时，一对多)

5. **车辆(Vehicle) 与 工单(WorkOrder)**
   - Vehicle.\_id → WorkOrder.vehicle (一对多，一个车辆可以有多个工单)

6. **车辆(Vehicle) 与 预约(Appointment)**
   - Vehicle.\_id → Appointment.vehicle (一对多，一个车辆可以有多个预约)

7. **配件(Part) 与 工单(WorkOrder)**
   - Part.\_id → WorkOrder.parts[].part (多对多，一个工单可以使用多个配件，一个配件可以用于多个工单)

8. **服务(Service) 与 预约(Appointment)**
   - Service.\_id → Appointment.service (一对多，一个服务项目可以有多个预约)

9. **工单(WorkOrder) 与 评价(Review)**
   - WorkOrder.\_id → Review.workOrder (一对一，一个工单可以有一个评价)

10. **工单(WorkOrder) 与 预约(Appointment)**
    - WorkOrder.\_id → Appointment.sourceWorkOrder (一对一，一个预约可以转化为一个工单)

11. **角色权限(RolePermission) 与 用户(User)**
    - RolePermission.role → User.role (一对多，一个角色可以分配给多个用户)
    - RolePermission.permissions → User.permissions (继承关系，用户的权限继承自角色权限)

## 许可证

[MIT](LICENSE) © 2024 伟佳汽修
