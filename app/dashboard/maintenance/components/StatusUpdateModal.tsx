/**
 * 保养状态更新模态框组件
 * 用于更新保养记录的状态，并添加状态变更的备注
 * 支持状态流转规则和提交到服务器
 */
import React from 'react';
import { Modal, Form, Select, Input, message } from 'antd';
import type { MaintenanceStatus, StatusUpdateData } from '../types';

const { TextArea } = Input;

// 状态的中文显示文本
const statusText = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

/**
 * 状态更新模态框属性接口
 * @param open - 是否显示模态框
 * @param currentStatus - 当前状态
 * @param maintenanceId - 保养记录ID
 * @param onSuccess - 更新成功回调
 * @param onCancel - 取消操作回调
 */
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
  // 表单实例
  const [form] = Form.useForm();
  // 提交状态
  const [submitting, setSubmitting] = React.useState(false);

  /**
   * 获取当前状态可以转换的下一个状态列表
   * 根据业务规则定义状态流转关系
   * @param current - 当前状态
   * @returns 可选的下一个状态数组
   */
  const getNextStatuses = (current: MaintenanceStatus): MaintenanceStatus[] => {
    // 定义状态流转规则
    const transitions: { [key in MaintenanceStatus]: MaintenanceStatus[] } = {
      pending: ['in_progress', 'cancelled'],    // 待处理 -> 进行中、已取消
      in_progress: ['completed', 'cancelled'],  // 进行中 -> 已完成、已取消
      completed: [],                           // 已完成状态无法再转换
      cancelled: [],                           // 已取消状态无法再转换
    };
    return transitions[current] || [];
  };

  /**
   * 处理表单提交
   * 将状态更新请求发送到服务器
   * @param values - 表单数据
   */
  const handleSubmit = async (values: StatusUpdateData) => {
    try {
      setSubmitting(true);
      // 发送PATCH请求更新状态
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

      // 更新成功处理
      message.success('状态更新成功');
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      // 捕获并显示错误
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
        // 关闭时重置表单
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
        {/* 状态选择字段 */}
        <Form.Item
          name="status"
          label="新状态"
          rules={[{ required: true, message: '请选择新状态' }]}
        >
          <Select placeholder="请选择新状态">
            {/* 根据当前状态动态生成可选的下一状态 */}
            {getNextStatuses(currentStatus).map((status) => (
              <Select.Option key={status} value={status}>
                {statusText[status]}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* 备注字段 */}
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