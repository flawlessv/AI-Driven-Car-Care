/**
 * 工单状态标签组件
 * 
 * 这个组件用于显示工单的不同状态，根据状态类型显示不同颜色的标签
 * 使用Ant Design的Tag组件，根据工单状态映射为对应的颜色和文本
 */
import { Tag } from 'antd';
import { WorkOrderStatus } from '@/types/workOrder';

/**
 * 工单状态显示文本映射
 * 将英文状态值映射为中文显示文本
 */
export const statusText: Record<string, string> = {
  pending: '待处理',
  assigned: '已分配',
  in_progress: '进行中',
  pending_check: '待审核',
  completed: '已完成',
  cancelled: '已取消',
};

/**
 * 工单状态颜色映射
 * 将不同状态映射为对应的标签颜色
 * 使用Ant Design的预设颜色
 */
export const statusColor: Record<string, string> = {
  pending: 'orange',        // 待处理 - 橙色
  assigned: 'blue',         // 已分配 - 蓝色
  in_progress: 'processing', // 进行中 - 处理中色(蓝色动效)
  pending_check: 'purple',  // 待审核 - 紫色
  completed: 'green',       // 已完成 - 绿色
  cancelled: 'red',         // 已取消 - 红色
};

/**
 * 状态标签组件的属性接口
 * 
 * @property {WorkOrderStatus} status - 工单状态
 */
interface StatusTagProps {
  status: WorkOrderStatus;
}

/**
 * 状态标签组件
 * 根据传入的状态值显示对应颜色和文本的标签
 * 
 * @param {StatusTagProps} props - 组件属性
 * @returns {JSX.Element} 返回状态标签组件
 */
const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  return (
    <Tag color={statusColor[status] || 'default'}>
      {statusText[status] || status}
    </Tag>
  );
};

export default StatusTag; 