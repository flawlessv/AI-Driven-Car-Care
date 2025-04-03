'use client';

import { Timeline } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { WorkOrderProgress } from '@/types/workOrder';

const statusColor = {
  pending: 'orange',
  assigned: 'blue',
  in_progress: 'processing',
  pending_check: 'purple',
  completed: 'green',
  cancelled: 'red',
};

interface WorkOrderProgressTimelineProps {
  progress: WorkOrderProgress[];
}

const WorkOrderProgressTimeline: React.FC<WorkOrderProgressTimelineProps> = ({ progress }) => {
  if (!progress || progress.length === 0) {
    return <div>暂无进度记录</div>;
  }

  return (
    <div className="p-2">
      <h3 className="text-lg font-medium mb-3">工单进度</h3>
      <Timeline
        mode="left"
        items={progress.map((item) => {
          const timestamp = typeof item.timestamp === 'string' 
            ? new Date(item.timestamp).toLocaleString() 
            : item.timestamp.toLocaleString();
            
          const username = typeof item.user === 'string' 
            ? '用户' 
            : item.user.username || '用户';
            
          return {
            color: statusColor[item.status] || 'blue',
            label: timestamp,
            children: (
              <div>
                <strong>{getStatusText(item.status)}</strong>
                <div>{item.notes}</div>
                <div className="text-gray-500 text-sm">操作人: {username}</div>
              </div>
            )
          };
        })}
      />
    </div>
  );
};

function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    assigned: '已分配',
    in_progress: '进行中',
    pending_check: '待检查',
    completed: '已完成',
    cancelled: '已取消'
  };
  
  return statusMap[status] || status;
}

export default WorkOrderProgressTimeline; 