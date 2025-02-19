import React, { useState } from 'react';
import {
  Card,
  Rate,
  Button,
  Form,
  Input,
  message,
} from 'antd';
import type { WorkOrderEvaluation } from '@/types/workOrder';

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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const response = await fetch(`/api/work-orders/${workOrderId}/evaluation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (response.ok) {
        message.success('评价提交成功');
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
        <div className="text-gray-400 text-sm mt-4">
          评价时间：{new Date(evaluation.createdAt).toLocaleString()}
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