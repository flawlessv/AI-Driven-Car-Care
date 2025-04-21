/**
 * 工单进度时间线组件
 * 
 * 这个组件用于显示工单状态变更的历史记录
 * 以时间线方式呈现工单的各个状态变更、备注和操作人
 */
import React from 'react';
import { Timeline, Typography, Tag } from 'antd';
import { ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

/**
 * 状态文本映射
 * 将状态英文标识符映射为中文显示文本
 */
const statusText = {
  pending: '待处理',
  assigned: '已分配',
  in_progress: '进行中',
  pending_check: '待审核',
  completed: '已完成',
  cancelled: '已取消',
};

/**
 * 状态颜色映射
 * 将不同状态映射为对应的标签颜色
 */
const statusColors = {
  pending: 'orange',       // 待处理 - 橙色
  assigned: 'blue',        // 已分配 - 蓝色
  in_progress: 'processing', // 进行中 - 处理中色(蓝色动效)
  pending_check: 'purple', // 待审核 - 紫色
  completed: 'green',      // 已完成 - 绿色
  cancelled: 'red',        // 已取消 - 红色
};

/**
 * 工单进度组件的属性接口
 * 
 * @property {Array} progress - 工单进度记录数组，包含状态变更历史
 */
interface WorkOrderProgressProps {
  progress: Array<{
    _id: string;           // 进度记录ID
    status: string;        // 状态值
    note?: string;         // 可选的状态备注
    timestamp: string;     // 时间戳
    updatedBy?: {          // 更新操作人信息
      _id?: string;
      username?: string;
    };
    user?: {               // 兼容旧版API的用户信息
      _id?: string;
      username?: string;
    };
  }>;
}

/**
 * 工单进度时间线组件
 * 将工单状态变更历史显示为时间线
 * 
 * @param {WorkOrderProgressProps} props - 组件属性
 * @returns {JSX.Element} 返回时间线组件
 */
export default function WorkOrderProgressTimeline({ progress }: WorkOrderProgressProps) {
  return (
    <Timeline>
      {progress.map((record) => {
        console.log('record', record);
        
        // 获取操作人名称，优先使用updatedBy，其次使用user，最后显示"系统"
        const operator = record.updatedBy?.username || record.user?.username || '系统';
        
        return (
          <Timeline.Item 
            key={record._id}
            dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />} // 使用时钟图标作为时间线节点
          >
            <div>
              {/* 状态标签，根据状态显示对应颜色和文本 */}
              <Tag color={statusColors[record.status as keyof typeof statusColors]}>
                {statusText[record.status as keyof typeof statusText] || record.status}
              </Tag>
              
              {/* 备注信息（如果存在） */}
              {record.note && (
                <div className="mt-1">
                  <Text>{record.note}</Text>
                </div>
              )}
              
              {/* 操作人和时间信息 */}
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