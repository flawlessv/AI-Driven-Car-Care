'use client';

import { Timeline } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { statusText, statusColor } from '../../components/StatusTag';

// 定义组件内部使用的进度记录接口
interface ProgressRecord {
  _id: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedBy: {
    _id: string;
    username: string;
    role?: string;
  };
}

interface WorkOrderProgressTimelineProps {
  progress: ProgressRecord[];
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
          const timestamp = new Date(item.createdAt).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          
          const username = item.updatedBy?.username || '未知用户';
            
          return {
            color: statusColor[item.status] || 'blue',
            label: timestamp,
            children: (
              <div>
                <strong>{statusText[item.status] || getStatusText(item.status)}</strong>
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
  return statusText[status as keyof typeof statusText] || status;
}

export default WorkOrderProgressTimeline; 