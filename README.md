# 佳伟汽车维修保养管理系统

这是一个基于 [Next.js](https://nextjs.org) 开发的专业汽车维修保养管理系统。
## 刘佳看这里！！
 - git pull
 - pnpm i
 - pnpm run clear
 - pnpm run mock
 - pnpm run dev

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

### 核心业务流程（预约和工单）：

#### 预约管理流程

预约是客户获取汽车服务的第一步，通过以下步骤处理：

1. **预约创建**：
   - 系统支持多渠道创建预约：客户自助创建、前台人员代客创建、电话预约录入
   - 创建预约时需指定车辆信息、联系人信息、服务类型和期望时间
   - 系统自动根据服务类型预设服务时长和基础价格
   - 预约创建后状态为"待处理"(pending)

2. **预约处理**：
   - 技师或管理员接收并处理"待处理"的预约请求
   - 根据技师安排情况和工作负载，分配合适的技师和时间段
   - 完善预约详情，包括确认具体服务项目、实际工时和预估费用
   - 预约状态更新为"已处理"(processed)
   - 系统通知客户预约已确认

3. **预约完成或转工单**：
   - 简单的咨询类预约可直接标记为"已完成"(completed)
   - 需要实际维修保养的预约通过"转为工单"功能转换为工单
   - 转换时自动继承预约中的车辆、客户、服务和技师信息
   - 原预约状态自动更新为"已完成"

#### 工单管理流程

工单是汽车维修保养服务的核心业务记录，记录了完整的服务过程：

1. **工单创建**：
   - 工单可从预约转换而来，也可直接创建（车辆已在店内的情况）
   - 工单包含详细的车辆信息、客户信息、问题描述和服务分类
   - 每个工单生成唯一的工单编号，便于追踪
   - 新建工单状态为"待处理"(pending)
   
2. **技师分配**：
   - 管理员根据工单优先级和技师专长分配适合的技师
   - 技师分配后工单状态更新为"已分配"(assigned)
   - 技师可在系统中查看自己负责的工单列表

3. **维修保养处理**：
   - 技师开始处理工单后，状态更新为"处理中"(in_progress)
   - 技师记录故障诊断结果、维修方案和使用的配件
   - 系统自动计算配件费用和工时费用
   - 技师可记录工单进度和技术难点

4. **完工证明提交**：
   - 技师完成工作后需上传完工证明（照片和说明）
   - 完工证明作为工作质量的佐证和客户确认的依据
   - 提交完工证明后工单状态更新为"待审核"(pending_check)

5. **工单审核**：
   - 管理员审核技师提交的完工证明和工单信息
   - 确认服务质量和费用计算无误后，工单状态更新为"已完成"(completed)
   - 系统自动通知客户服务已完成，可以取车

6. **客户评价**：
   - 客户可对已完成的工单进行评分（1-5分）和文字评价
   - 评价信息记录在工单中，并在评价管理模块中可见
   - 系统自动汇总评价数据，用于技师绩效考核

#### 预约与工单的状态流转

##### 预约状态流转:
| 状态 | 状态码 | 描述 | 后续可转换状态 |
|------|------|------|-------------|
| 待处理 | pending | 新创建的预约请求 | 已处理、已取消 |
| 已处理 | processed | 已确认时间和技师 | 已完成、已取消 |
| 已完成 | completed | 服务已完成或已转为工单 | 无（终态） |
| 已取消 | cancelled | 客户取消或无法服务 | 无（终态） |

##### 工单状态流转:
| 状态 | 状态码 | 描述 | 后续可转换状态 |
|------|------|------|-------------|
| 待处理 | pending | 新创建的工单 | 已分配、已取消 |
| 已分配 | assigned | 已分配技师 | 处理中、已取消 |
| 处理中 | in_progress | 技师正在工作 | 待审核、已取消 |
| 待审核 | pending_check | 工作完成待审核 | 已完成、处理中 |
| 已完成 | completed | 工单全部完成 | 无（终态） |
| 已取消 | cancelled | 工单已取消 | 无（终态） |

### 预约和工单的关联与转换

系统设计了便捷的预约转工单功能，在"预约管理"页面中，对于"已处理"状态的预约可以一键转为工单：

1. **数据自动继承**：
   - 从预约转换为工单时，车辆信息、客户信息、服务类型自动继承
   - 预约中的技师分配和时间安排也会自动填入工单
   - 预约中的问题描述和服务要求会作为工单的初始描述

2. **业务统一追踪**：
   - 转换后的工单会记录原预约ID，保持业务追踪的完整性
   - 原预约状态自动更新为"已完成"，并记录关联的工单ID
   - 系统支持通过预约查询关联工单，也可从工单追溯原始预约

3. **完整服务闭环**：
   - 从客户预约开始，到技师服务，再到客户评价，形成完整闭环
   - 系统记录整个服务过程中的每个环节和状态变更
   - 管理员可通过报表和数据分析功能，监控整个服务流程的效率和质量

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

**索引**：licensePlate(唯一)、vin(唯一)、owner

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
| timeSlot | Object | - | 是 | - | 预约时间段 |
| timeSlot.date | Date | - | 是 | - | 预约日期 |
| timeSlot.startTime | String | - | 是 | - | 开始时间 |
| timeSlot.endTime | String | - | 是 | - | 结束时间 |
| timeSlot.technician | ObjectId | - | 否 | - | 分配技师ID |
| status | String | - | 是 | 'pending' | 状态：pending/processed/completed/cancelled |
| estimatedDuration | Number | - | 是 | - | 预计时长(分钟) |
| estimatedCost | Number | - | 是 | - | 预计费用 |
| sourceWorkOrder | ObjectId | - | 否 | - | 关联工单ID |
| user | ObjectId | - | 否 | - | 关联用户ID |
| technician | ObjectId | - | 否 | - | 直接指定的技师ID |
| technicianName | String | - | 否 | - | 技师姓名（冗余字段） |
| createdAt | Date | - | 是 | 自动生成 | 创建时间 |
| updatedAt | Date | - | 是 | 自动生成 | 更新时间 |

**索引**：vehicle、user、technician、status、createdAt

#### 4. 工单模型 (WorkOrder)

| 字段 | 类型 | 长度 | 必填 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | 主键 |
| orderNumber | String | - | 是 | - | 工单编号，唯一 |
| vehicle | ObjectId | - | 是 | - | 关联车辆ID |
| customer | ObjectId | - | 是 | - | 关联客户ID |
| technician | ObjectId | - | 否 | - | 关联技师ID |
| type | String | - | 是 | - | 工单类型：repair/maintenance/inspection |
| status | String | - | 是 | 'pending' | 状态：pending/assigned/in_progress/pending_check/completed/cancelled |
| priority | String | - | 是 | 'medium' | 优先级：low/medium/high/urgent |
| description | String | - | 是 | - | 问题描述 |
| diagnosis | String | - | 否 | - | 故障诊断 |
| solution | String | - | 否 | - | 解决方案 |
| parts | Array | - | 否 | [] | 使用的配件列表 |
| parts[].part | ObjectId | - | 是 | - | 配件ID |
| parts[].quantity | Number | - | 是 | - | 数量 |
| parts[].price | Number | - | 是 | - | 价格 |
| estimatedHours | Number | - | 是 | - | 预计工时 |
| actualHours | Number | - | 否 | - | 实际工时 |
| startDate | Date | - | 是 | - | 开始日期 |
| completionDate | Date | - | 否 | - | 完成日期 |
| customerNotes | String | - | 否 | - | 客户备注 |
| technicianNotes | String | - | 否 | - | 技师备注 |
| completionProof | Object | - | 否 | - | 完成证明 |
| completionProof.proofImages | Array | - | 否 | [] | 证明图片 |
| completionProof.notes | String | - | 否 | - | 备注 |
| completionProof.submittedBy | ObjectId | - | 是 | - | 提交人ID |
| completionProof.submittedAt | Date | - | 是 | 当前时间 | 提交时间 |
| completionProof.approved | Boolean | - | 是 | false | 是否审批通过 |
| completionProof.approvedBy | ObjectId | - | 否 | - | 审批人ID |
| completionProof.approvedAt | Date | - | 否 | - | 审批时间 |
| progress | Array | - | 否 | [] | 工单进度记录 |
| progress[].status | String | - | 是 | - | 状态 |
| progress[].notes | String | - | 否 | - | 备注 |
| progress[].timestamp | Date | - | 是 | 当前时间 | 时间戳 |
| progress[].user | ObjectId | - | 是 | - | 操作人ID |
| rating | Number | - | 否 | - | 评分(1-5) |
| feedback | String | - | 否 | - | 客户反馈 |
| createdBy | ObjectId | - | 否 | - | 创建人ID |
| updatedBy | ObjectId | - | 否 | - | 最后更新人ID |
| createdAt | Date | - | 是 | 自动生成 | 创建时间 |
| updatedAt | Date | - | 是 | 自动生成 | 更新时间 |

**索引**：orderNumber(唯一)、vehicle、customer、technician、status、createdAt

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
| category | String | - | 是 | - | 服务类型：maintenance/repair/inspection |
| duration | Number | - | 是 | - | 预计时长(分钟) |
| basePrice | Number | - | 是 | - | 基础价格 |
| isActive | Boolean | - | 是 | true | 是否启用 |
| createdAt | Date | - | 是 | 自动生成 | 创建时间 |
| updatedAt | Date | - | 是 | 自动生成 | 更新时间 |

**索引**：name、category

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
| images | Array | - | 否 | [] | 图片列表 |
| tags | Array | - | 否 | [] | 标签列表 |
| likes | Number | - | 是 | 0 | 点赞数 |
| status | String | - | 是 | 'published' | 状态：published/hidden/deleted |
| workOrder | ObjectId | - | 否 | - | 关联工单ID |
| workOrderNumber | String | - | 否 | - | 工单编号 |
| createdAt | Date | - | 是 | 自动生成 | 创建时间 |
| updatedAt | Date | - | 是 | 自动生成 | 更新时间 |

**索引**：author、targetId、workOrder、createdAt

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

#### 9. 维护记录模型 (Maintenance)

| 字段 | 类型 | 长度 | 必填 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | 主键 |
| vehicle | ObjectId | - | 是 | - | 关联车辆ID |
| technician | ObjectId | - | 是 | - | 关联技师ID |
| type | String | - | 是 | - | 类型：regular/repair/inspection |
| status | String | - | 是 | 'pending' | 状态：pending/in_progress/completed/cancelled |
| description | String | - | 是 | - | 维护描述 |
| startDate | Date | - | 是 | - | 开始日期 |
| completionDate | Date | - | 否 | - | 完成日期 |
| mileage | Number | - | 是 | - | 当前里程数 |
| cost | Number | - | 是 | 0 | 总费用 |
| parts | Array | - | 否 | [] | 使用的配件 |
| parts[].part | ObjectId | - | 是 | - | 配件ID |
| parts[].quantity | Number | - | 是 | 1 | 数量 |
| parts[].unitPrice | Number | - | 是 | 0 | 单价 |
| parts[].totalPrice | Number | - | 是 | 0 | 总价 |
| customer | Object | - | 是 | - | 客户信息 |
| customer.name | String | - | 是 | - | 客户姓名 |
| customer.contact | String | - | 是 | - | 联系方式 |
| notes | String | - | 否 | - | 备注 |
| statusHistory | Array | - | 否 | [] | 状态历史 |
| statusHistory[].status | String | - | 是 | - | 状态 |
| statusHistory[].note | String | - | 否 | - | 备注 |
| statusHistory[].timestamp | Date | - | 是 | 当前时间 | 时间 |
| statusHistory[].updatedBy | ObjectId | - | 是 | - | 更新人ID |
| createdBy | ObjectId | - | 是 | - | 创建人ID |
| updatedBy | ObjectId | - | 否 | - | 更新人ID |
| createdAt | Date | - | 是 | 自动生成 | 创建时间 |
| updatedAt | Date | - | 是 | 自动生成 | 更新时间 |

**索引**：vehicle、technician、status、createdAt

#### 10. 工单评估模型 (WorkOrderEvaluation)

| 字段 | 类型 | 长度 | 必填 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | 主键 |
| workOrder | ObjectId | - | 是 | - | 关联工单ID，唯一 |
| customer | ObjectId | - | 是 | - | 客户ID |
| technician | ObjectId | - | 是 | - | 技师ID |
| rating | Number | - | 是 | - | 评分(1-5) |
| feedback | String | - | 否 | '' | 评价内容 |
| createdAt | Date | - | 是 | 当前时间 | 创建时间 |

**索引**：workOrder(唯一)、technician

#### 11. 工单进度模型 (WorkOrderProgress)

| 字段 | 类型 | 长度 | 必填 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | 主键 |
| workOrder | ObjectId | - | 是 | - | 关联工单ID |
| status | String | - | 是 | - | 状态 |
| note | String | - | 否 | - | 备注 |
| operator | ObjectId | - | 是 | - | 操作人ID |
| timestamp | Date | - | 是 | 当前时间 | 操作时间 |

**索引**：workOrder、timestamp

### 数据库表关联关系

1. **用户(User) 与 车辆(Vehicle)**
   - User.\_id → Vehicle.owner (一对多，一个用户可以拥有多个车辆)

2. **用户(User) 与 工单(WorkOrder)**
   - User.\_id → WorkOrder.customer (一对多，一个用户可以有多个工单)
   - User.\_id → WorkOrder.technician (一对多，一个技师可以负责多个工单)
   - User.\_id → WorkOrder.createdBy (一对多，一个用户可以创建多个工单)
   - User.\_id → WorkOrder.updatedBy (一对多，一个用户可以更新多个工单)
   - User.\_id → WorkOrder.completionProof.submittedBy (一对多)
   - User.\_id → WorkOrder.completionProof.approvedBy (一对多)
   - User.\_id → WorkOrder.progress[].user (一对多)

3. **用户(User) 与 预约(Appointment)**
   - User.\_id → Appointment.technician (一对多，一个技师可以有多个预约)
   - User.\_id → Appointment.user (一对多，一个用户可以有多个预约)
   - User.\_id → Appointment.timeSlot.technician (一对多)

4. **用户(User) 与 评价(Review)**
   - User.\_id → Review.author (一对多，一个用户可以发表多个评价)
   - User.\_id → Review.targetId (当targetType为technician时，一对多)

5. **用户(User) 与 维护记录(Maintenance)**
   - User.\_id → Maintenance.technician (一对多，一个技师可以有多个维护记录)
   - User.\_id → Maintenance.createdBy (一对多)
   - User.\_id → Maintenance.updatedBy (一对多)
   - User.\_id → Maintenance.statusHistory[].updatedBy (一对多)

6. **用户(User) 与 工单评估(WorkOrderEvaluation)**
   - User.\_id → WorkOrderEvaluation.customer (一对多，一个客户可以评价多个工单)
   - User.\_id → WorkOrderEvaluation.technician (一对多，一个技师可以被多次评价)

7. **用户(User) 与 工单进度(WorkOrderProgress)**
   - User.\_id → WorkOrderProgress.operator (一对多，一个用户可以更新多个工单进度)

8. **车辆(Vehicle) 与 工单(WorkOrder)**
   - Vehicle.\_id → WorkOrder.vehicle (一对多，一个车辆可以有多个工单)

9. **车辆(Vehicle) 与 预约(Appointment)**
   - Vehicle.\_id → Appointment.vehicle (一对多，一个车辆可以有多个预约)

10. **车辆(Vehicle) 与 维护记录(Maintenance)**
    - Vehicle.\_id → Maintenance.vehicle (一对多，一个车辆可以有多个维护记录)

11. **配件(Part) 与 工单(WorkOrder)**
    - Part.\_id → WorkOrder.parts[].part (多对多，一个工单可以使用多个配件，一个配件可以用于多个工单)

12. **配件(Part) 与 维护记录(Maintenance)**
    - Part.\_id → Maintenance.parts[].part (多对多，一个维护记录可以使用多个配件，一个配件可以用于多个维护记录)

13. **服务(Service) 与 预约(Appointment)**
    - Service.\_id → Appointment.service (一对多，一个服务项目可以有多个预约)

14. **工单(WorkOrder) 与 评价(Review)**
    - WorkOrder.\_id → Review.workOrder (一对一，一个工单可以有一个评价)

15. **工单(WorkOrder) 与 工单评估(WorkOrderEvaluation)**
    - WorkOrder.\_id → WorkOrderEvaluation.workOrder (一对一，一个工单可以有一个评估)

16. **工单(WorkOrder) 与 工单进度(WorkOrderProgress)**
    - WorkOrder.\_id → WorkOrderProgress.workOrder (一对多，一个工单可以有多个进度记录)

17. **工单(WorkOrder) 与 预约(Appointment)**
    - WorkOrder.\_id → Appointment.sourceWorkOrder (多对一，一个工单可以来源于一个预约)

18. **维护记录(Maintenance) 与 评价(Review)**
    - Maintenance.\_id → Review.maintenanceRecord (一对一，一个维护记录可以有一个评价)

19. **角色权限(RolePermission) 与 用户(User)**
    - RolePermission.role → User.role (一对多，一个角色可以分配给多个用户)
    - RolePermission.permissions → User.permissions (继承关系，用户的权限继承自角色权限)

### 数据模型之间的业务关系

1. **预约转工单流程**
   - 客户创建预约 (Appointment)
   - 技师处理预约，确认时间和服务
   - 预约转换为工单 (WorkOrder)，继承预约信息
   - 预约状态更新为completed，并记录关联工单ID

2. **工单完成与评价流程**
   - 技师处理工单，录入维护记录 (Maintenance)
   - 技师上传完工证明，更新工单状态
   - 管理员审核工单，确认完工
   - 客户评价服务，创建工单评估 (WorkOrderEvaluation)

3. **车辆健康评分与维护记录**
   - 系统根据车辆信息 (Vehicle) 和维护记录 (Maintenance) 计算健康评分
   - 健康评分用于预测车辆状况和推荐保养计划
   - 评分结果影响下次维护建议

## 车辆健康评分算法

系统基于多维度数据分析为每辆车辆提供健康状况评估，生成0-100分的健康评分，帮助车主和技师掌握车辆状况。

### 评分构成与权重

健康评分由四个主要部分组成，总分为100分：

| 评分因素 | 权重 | 满分 | 说明 |
|---------|------|------|------|
| 车龄评分 | 20% | 20分 | 根据车辆使用年限评估 |
| 里程评分 | 30% | 30分 | 根据累计行驶里程评估 |
| 保养评分 | 30% | 30分 | 根据保养记录及时性评估 |
| 状态评分 | 20% | 20分 | 根据车辆当前使用状态评估 |

### 计算方法

```
健康总分 = 车龄评分 + 里程评分 + 保养评分 + 状态评分
```

#### 1. 车龄评分（满分20分）
- 基础分值：20分
- 计算公式：`Math.max(20 - age * 2, 0)`
- 每年车龄扣2分，最低0分
- 车龄超过5年会添加额外健康建议

#### 2. 里程评分（满分30分）
- 基础分值：30分
- 计算公式：`Math.max(30 - Math.floor(mileage / 50000) * 5, 0)`
- 每行驶5万公里扣5分，最低0分
- 里程超过10万公里会添加额外健康建议

#### 3. 保养评分（满分30分）
- 基础分值：30分
- 最近6个月无保养记录：减10分
- 存在未完成的维修项目：减5分
- 根据保养记录自动生成相关建议

#### 4. 状态评分（满分20分）
- 正常使用状态：20分
- 维修中状态：10分
- 停用状态：0分

### 健康等级划分

| 分数范围 | 健康等级 | 状态指示颜色 |
|---------|---------|------------|
| 80-100 | 良好 | 绿色 #52c41a |
| 60-79 | 一般 | 黄色 #faad14 |
| 0-59 | 需注意 | 红色 #f5222d |

### 智能健康建议

系统会根据评分结果和车辆状况自动生成健康建议，包括：

1. **车龄相关建议**
   - 车龄较高时：建议更频繁地进行检查和保养

2. **里程相关建议**
   - 里程较高时：建议注意关键部件的检查和更换

3. **保养相关建议**
   - 长期未保养：已超过6个月未进行保养，建议尽快进行常规保养
   - 未完成维修：存在未完成的维修项目，建议及时处理

4. **状态相关建议**
   - 维修中状态：建议完成维修后重新评估车况
   - 停用状态：建议检查停用原因并进行必要维护

5. **综合建议**
   - 总分低于60分：车辆整体状况需要注意，建议进行全面检查和必要的维修保养
   - 总分60-79分：车辆状况一般，建议按计划进行保养维护

### 评分展示方式

系统提供多种形式展示车辆健康评分：

1. **健康评分仪表盘**
   - 圆形进度条显示总体健康分数
   - 不同分数范围以不同颜色直观展示健康状态

2. **分项评分统计卡片**
   - 车龄评分：xx/20
   - 里程评分：xx/30
   - 保养评分：xx/30
   - 状态评分：xx/20

3. **健康建议列表**
   - 根据评分和各项指标自动生成的维护建议
   - 提供车主可执行的具体保养维修指导

### 应用场景

1. **车主自查**
   - 了解爱车健康状况
   - 获取专业保养建议

2. **技师分析**
   - 快速评估车辆整体状况
   - 有针对性地制定维修保养方案

3. **服务提醒**
   - 基于健康评分生成保养提醒
   - 对评分较低的车辆进行重点关注

4. **数据统计**
   - 管理层分析车辆健康状况整体分布
   - 评估维修保养服务的有效性

此算法将复杂的车辆状况以简单直观的分数呈现，帮助用户理解车辆健康状态，并提供及时的维护建议，同时为技师提供专业评估依据。

## 许可证

[MIT](LICENSE) © 2024 佳伟汽修
