import { Tag } from 'antd';
import { WorkOrderStatus } from '@/types/workOrder';

// 工单状态显示文本
export const statusText: Record<string, string> = {
  pending: '待处理',
  assigned: '已分配',
  in_progress: '进行中',
  pending_check: '待审核',
  completed: '已完成',
  cancelled: '已取消',
};

// 工单状态颜色
export const statusColor: Record<string, string> = {
  pending: 'orange',
  assigned: 'blue',
  in_progress: 'processing',
  pending_check: 'purple',
  completed: 'green',
  cancelled: 'red',
};

interface StatusTagProps {
  status: WorkOrderStatus;
}

const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  return (
    <Tag color={statusColor[status] || 'default'}>
      {statusText[status] || status}
    </Tag>
  );
};

export default StatusTag; 