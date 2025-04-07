'use client';

import React, { useState } from 'react';
import { Rate, Button, Input, message, Card, Space, Typography, Avatar, Tag } from 'antd';
import { StarOutlined, UserOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

export interface WorkOrderEvaluation {
  _id: string;
  workOrder: string;
  rating: number;
  feedback?: string;
  createdBy: {
    _id: string;
    username?: string;
    email?: string;
  };
  evaluator?: {
    _id: string;
    username?: string;
    email?: string;
  };
  evaluatorInfo?: {
    userId: string;
    username: string;
    email?: string;
  };
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

  // 获取评价人信息
  const getEvaluatorInfo = () => {
    if (!evaluation) return null;
    
    // 从多个可能的字段获取评价人信息
    let name = '';
    let email = '';
    
    if (evaluation.evaluatorInfo) {
      name = evaluation.evaluatorInfo.username;
      email = evaluation.evaluatorInfo.email || '';
    } else if (evaluation.evaluator) {
      name = evaluation.evaluator.username || '';
      email = evaluation.evaluator.email || '';
    } else if (evaluation.createdBy) {
      name = evaluation.createdBy.username || '';
      email = evaluation.createdBy.email || '';
    }
    
    if (!name && evaluation._id) {
      name = '用户' + evaluation._id.toString().substring(evaluation._id.toString().length - 4);
    }
    
    return { name, email };
  };

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
    const evaluatorInfo = getEvaluatorInfo();
    const evaluationDate = evaluation.createdAt ? new Date(evaluation.createdAt).toLocaleString() : '';
    
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
        {evaluatorInfo && (
          <div className="mt-4 text-right">
            <Space>
              <Avatar icon={<UserOutlined />} size="small" />
              <Text type="secondary">{evaluatorInfo.name}</Text>
              {evaluationDate && <Text type="secondary">评价于 {evaluationDate}</Text>}
            </Space>
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