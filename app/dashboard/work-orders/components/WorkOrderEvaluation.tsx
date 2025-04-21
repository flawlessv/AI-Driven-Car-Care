/**
 * 工单评价组件
 * 
 * 这个组件用于显示和提交对工单服务的评价
 * 根据不同状态显示评价表单或已提交的评价内容
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Rate,
  Button,
  Form,
  Input,
  message,
  Space,
  Avatar,
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { WorkOrderEvaluation } from '@/types/workOrder';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/lib/store';

const { TextArea } = Input;

/**
 * 工单评价组件的属性接口
 * 
 * @property {string} workOrderId - 工单ID
 * @property {WorkOrderEvaluation} evaluation - 可选的现有评价数据，用于显示模式
 * @property {boolean} canEvaluate - 是否允许用户提交评价
 * @property {Function} onEvaluationSubmit - 评价提交成功后的回调函数
 */
interface WorkOrderEvaluationProps {
  workOrderId: string;
  evaluation?: WorkOrderEvaluation;
  canEvaluate?: boolean;
  onEvaluationSubmit?: () => void;
}

/**
 * 工单评价组件
 * 提供评价表单和评价展示功能
 * 
 * @param {WorkOrderEvaluationProps} props - 组件属性
 * @returns {JSX.Element | null} 返回评价表单、评价展示卡片或null
 */
export default function WorkOrderEvaluationComponent({
  workOrderId,
  evaluation,
  canEvaluate,
  onEvaluationSubmit,
}: WorkOrderEvaluationProps) {
  // 创建表单实例
  const [form] = Form.useForm();
  // 提交状态
  const [submitting, setSubmitting] = useState(false);
  // 获取当前用户信息
  const user = useSelector((state: RootState) => state.auth.user);

  /**
   * 处理评价表单提交
   * 将评价数据发送到服务器并处理响应
   */
  const handleSubmit = async () => {
    try {
      // 验证表单字段
      const values = await form.validateFields();
      setSubmitting(true);

      // 构建与评价管理系统一致的数据结构
      const submitData = {
        rating: values.rating,          // 评分
        feedback: values.feedback,      // 反馈意见
        // 工单评价只能评价技师，不需要选择评价对象类型
        targetType: 'technician',
        workOrder: workOrderId,         // 关联工单ID
        // 添加用户信息
        userId: user?._id,
        userName: user?.username
      };

      console.log('提交评价数据:', submitData);

      // 发送评价请求到服务器
      const response = await fetch(`/api/work-orders/${workOrderId}/evaluation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      // 处理响应
      if (response.ok) {
        message.success('评价提交成功');
        form.resetFields();
        // 调用成功回调
        onEvaluationSubmit?.();
      } else {
        message.error(result.message || '评价提交失败');
      }
    } catch (error) {
      console.error('提交评价失败:', error);
      message.error('评价提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 如果已有评价，显示评价内容
  if (evaluation) {
    return (
      <Card title="客户评价">
        {/* 评分显示 */}
        <div className="flex items-center mb-4">
          <span className="mr-2">评分：</span>
          <Rate disabled value={evaluation.rating} />
        </div>
        {/* 反馈意见显示（如果有） */}
        {evaluation.feedback && (
          <div>
            <div className="font-medium mb-2">反馈意见：</div>
            <div className="text-gray-600">{evaluation.feedback}</div>
          </div>
        )}
        {/* 评价者信息和时间 */}
        <div className="flex items-center mt-4 text-gray-500">
          <Avatar size="small" icon={<UserOutlined />} className="mr-2" />
          <Space>
            <span>{evaluation.customer?.username || '客户'}</span>
            <span>评价时间：{new Date(evaluation.createdAt).toLocaleString()}</span>
          </Space>
        </div>
      </Card>
    );
  }

  // 如果可以评价，显示评价表单
  if (canEvaluate) {
    return (
      <Card title="评价工单">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* 评分字段 */}
          <Form.Item
            name="rating"
            label="评分"
            rules={[{ required: true, message: '请评分' }]}
          >
            <Rate />
          </Form.Item>

          {/* 反馈意见字段 */}
          <Form.Item
            name="feedback"
            label="反馈意见"
          >
            <TextArea
              rows={4}
              placeholder="请输入您的反馈意见"
            />
          </Form.Item>

          {/* 提交按钮 */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
            >
              提交评价
            </Button>
          </Form.Item>
        </Form>
      </Card>
    );
  }

  // 如果不需要显示评价，也不能评价，则不渲染任何内容
  return null;
} 