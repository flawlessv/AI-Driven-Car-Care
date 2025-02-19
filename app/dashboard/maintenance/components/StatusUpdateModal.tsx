import React from 'react';
import { Modal, Form, Select, Input, message } from 'antd';
import type { MaintenanceStatus, StatusUpdateData } from '../types';

const { TextArea } = Input;

const statusText = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

interface StatusUpdateModalProps {
  open: boolean;
  currentStatus: MaintenanceStatus;
  maintenanceId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StatusUpdateModal({
  open,
  currentStatus,
  maintenanceId,
  onSuccess,
  onCancel,
}: StatusUpdateModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = React.useState(false);

  // 获取可选的下一个状态
  const getNextStatuses = (current: MaintenanceStatus): MaintenanceStatus[] => {
    const transitions: { [key in MaintenanceStatus]: MaintenanceStatus[] } = {
      pending: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };
    return transitions[current] || [];
  };

  const handleSubmit = async (values: StatusUpdateData) => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/maintenance/${maintenanceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || '状态更新失败');
      }

      message.success('状态更新成功');
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="更新维修状态"
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={form.submit}
      okText="确认"
      cancelText="取消"
      confirmLoading={submitting}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="status"
          label="新状态"
          rules={[{ required: true, message: '请选择新状态' }]}
        >
          <Select placeholder="请选择新状态">
            {getNextStatuses(currentStatus).map((status) => (
              <Select.Option key={status} value={status}>
                {statusText[status]}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="note"
          label="备注"
          rules={[{ required: true, message: '请输入状态变更备注' }]}
        >
          <TextArea
            rows={4}
            placeholder="请输入状态变更的原因或其他相关说明"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
} 