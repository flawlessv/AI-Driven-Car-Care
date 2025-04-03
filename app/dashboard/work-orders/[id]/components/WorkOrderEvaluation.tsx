'use client';

import React, { useState } from 'react';
import { Rate, Button, Input, message, Card } from 'antd';
import { StarOutlined } from '@ant-design/icons';

const { TextArea } = Input;

export interface WorkOrderEvaluation {
  _id: string;
  workOrder: string;
  rating: number;
  feedback?: string;
  createdBy: string;
  createdAt: string;
}

interface WorkOrderEvaluationProps {
  workOrderId: string | string[];
  evaluation?: WorkOrderEvaluation;
  canEvaluate?: boolean;
  onEvaluationSubmit?: () => void;
}

const WorkOrderEvaluationComponent: React.FC<WorkOrderEvaluationProps> = ({
  workOrderId,
  evaluation,
  canEvaluate = false,
  onEvaluationSubmit
}) => {
  const [rating, setRating] = useState<number>(evaluation?.rating || 0);
  const [feedback, setFeedback] = useState<string>(evaluation?.feedback || '');
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // 确保workOrderId是字符串
  const id = Array.isArray(workOrderId) ? workOrderId[0] : workOrderId;

  const handleSubmit = async () => {
    if (rating === 0) {
      message.warning('请评分');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/work-orders/${id}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          feedback,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        message.success('评价提交成功');
        if (onEvaluationSubmit) {
          onEvaluationSubmit();
        }
      } else {
        message.error(result.message || '评价提交失败');
      }
    } catch (error) {
      console.error('评价提交失败:', error);
      message.error('评价提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 只读评价展示
  if (evaluation && !canEvaluate) {
    return (
      <Card title="客户评价" bordered={false}>
        <div className="mb-2">
          <Rate disabled value={evaluation.rating} />
          <span className="ml-2">{evaluation.rating} 分</span>
        </div>
        {evaluation.feedback && (
          <div className="border-t pt-2 mt-2">
            <p className="text-gray-700">{evaluation.feedback}</p>
          </div>
        )}
      </Card>
    );
  }

  // 可评价表单
  if (canEvaluate) {
    return (
      <Card title="评价服务" bordered={false}>
        <div className="mb-4">
          <div className="mb-2">评分:</div>
          <Rate value={rating} onChange={setRating} />
          {rating > 0 && <span className="ml-2">{rating} 分</span>}
        </div>
        <div className="mb-4">
          <div className="mb-2">反馈意见 (可选):</div>
          <TextArea
            rows={4}
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="请分享您对本次服务的评价..."
          />
        </div>
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={submitting}
          icon={<StarOutlined />}
        >
          提交评价
        </Button>
      </Card>
    );
  }

  return null;
};

export default WorkOrderEvaluationComponent; 