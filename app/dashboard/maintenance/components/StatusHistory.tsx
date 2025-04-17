/**
 * 状态历史记录组件
 * 用于展示保养记录的状态变更历史，以时间线形式呈现
 * 包含状态、说明和时间信息
 */
import React from 'react';
import { Timeline, Typography, Tag } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

// 状态文本映射，将状态码转换为中文显示
const statusText = {
  pending: '待处理',
  assigned: '已分配',
  in_progress: '进行中',
  pending_check: '待审核',
  completed: '已完成',
  cancelled: '已取消',
};

// 状态颜色映射，不同状态使用不同颜色标签
const statusColors = {
  pending: 'orange',
  assigned: 'blue',
  in_progress: 'processing',
  pending_check: 'purple',
  completed: 'green',
  cancelled: 'red',
};

/**
 * 状态历史记录组件属性接口
 * @param history - 可选的状态历史记录数组
 */
interface StatusHistoryProps {
  history?: Array<{
    _id: string;       // 记录唯一标识
    status: string;    // 状态值
    note?: string;     // 可选的状态说明
    timestamp: string; // 状态变更时间戳
  }>;
}

/**
 * 状态历史记录组件
 * 将状态变更历史以时间线形式展示
 */
export default function StatusHistory({ history = [] }: StatusHistoryProps) {
  // 添加调试日志，记录接收到的历史数据
  console.log('StatusHistory received history:', history);

  return (
    <Timeline>
      {history.map((record) => {
        // 添加每条记录的调试日志，帮助排查问题
        console.log('Record data:', {
          status: record.status,
          note: record.note,
          timestamp: record.timestamp
        });

        return (
          <Timeline.Item 
            key={record._id}
            dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />}
          >
            <div>
              {/* 状态标签，根据状态类型显示不同颜色 */}
              <Tag color={statusColors[record.status as keyof typeof statusColors]}>
                {statusText[record.status as keyof typeof statusText] || record.status}
              </Tag>
              
              {/* 若有状态说明则显示 */}
              {record.note && (
                <div className="mt-1">
                  <Text>{record.note}</Text>
                </div>
              )}
              
              {/* 显示状态变更时间 */}
              <div>
                <Text type="secondary" className="text-sm">
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