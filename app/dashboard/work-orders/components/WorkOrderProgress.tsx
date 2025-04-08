import React from 'react';
import { Timeline, Typography, Tag } from 'antd';
import { ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

// 状态文本映射
const statusText = {
  pending: '待处理',
  assigned: '已分配',
  in_progress: '进行中',
  pending_check: '待审核',
  completed: '已完成',
  cancelled: '已取消',
};

// 状态颜色映射
const statusColors = {
  pending: 'orange',
  assigned: 'blue',
  in_progress: 'processing',
  pending_check: 'purple',
  completed: 'green',
  cancelled: 'red',
};

interface WorkOrderProgressProps {
  progress: Array<{
    _id: string;
    status: string;
    note?: string;
    timestamp: string;
    updatedBy?: {
      _id?: string;
      username?: string;
    };
    user?: {
      _id?: string;
      username?: string;
    };
  }>;
}

export default function WorkOrderProgressTimeline({ progress }: WorkOrderProgressProps) {
  return (
    <Timeline>
      {progress.map((record) => {
        const operator = record.updatedBy?.username || record.user?.username || '系统';
        
        return (
          <Timeline.Item 
            key={record._id}
            dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />}
          >
            <div>
              <Tag color={statusColors[record.status as keyof typeof statusColors]}>
                {statusText[record.status as keyof typeof statusText] || record.status}
              </Tag>
              {record.note && (
                <div className="mt-1">
                  <Text>{record.note}</Text>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <UserOutlined /> 
                <Text type="secondary">{operator}</Text>
                <span className="mx-1">·</span>
                <Text type="secondary">
                  {dayjs(record.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                </Text>
              </div>
            </div>
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
} 