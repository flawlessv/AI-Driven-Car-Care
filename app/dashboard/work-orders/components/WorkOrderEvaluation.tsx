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

interface WorkOrderEvaluationProps {
  workOrderId: string;
  evaluation?: WorkOrderEvaluation;
  canEvaluate?: boolean;
  onEvaluationSubmit?: () => void;
}

export default function WorkOrderEvaluationComponent({
  workOrderId,
  evaluation,
  canEvaluate,
  onEvaluationSubmit,
}: WorkOrderEvaluationProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 构建与评价管理系统一致的数据结构
      const submitData = {
        rating: values.rating,
        feedback: values.feedback,
        // 工单评价只能评价技师，不需要选择评价对象类型
        targetType: 'technician',
        workOrder: workOrderId,
        // 添加用户信息
        userId: user?._id,
        userName: user?.username
      };

      console.log('提交评价数据:', submitData);

      const response = await fetch(`/api/work-orders/${workOrderId}/evaluation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok) {
        message.success('评价提交成功');
        form.resetFields();
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

  if (evaluation) {
    
    return (
      <Card title="客户评价">
        <div className="flex items-center mb-4">
          <span className="mr-2">评分：</span>
          <Rate disabled value={evaluation.rating} />
        </div>
        {evaluation.feedback && (
          <div>
            <div className="font-medium mb-2">反馈意见：</div>
            <div className="text-gray-600">{evaluation.feedback}</div>
          </div>
        )}
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

  if (canEvaluate) {
    return (
      <Card title="评价工单">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="rating"
            label="评分"
            rules={[{ required: true, message: '请评分' }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item
            name="feedback"
            label="反馈意见"
          >
            <TextArea
              rows={4}
              placeholder="请输入您的反馈意见"
            />
          </Form.Item>

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

  return null;
} 