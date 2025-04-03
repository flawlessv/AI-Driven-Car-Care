'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Card,
  Button,
  Space,
  Modal,
  message,
  Tag,
  Descriptions,
  Divider,
  Row,
  Col,
  Select,
  Input,
  Form,
} from 'antd';
import type { RootState } from '@/lib/store';
import type { WorkOrder, WorkOrderProgress } from '@/types/workOrder';
import type { User } from '@/types/user';
import WorkOrderForm from '../components/WorkOrderForm';
import WorkOrderProgressTimeline from '../components/WorkOrderProgress';
import WorkOrderEvaluation from '../components/WorkOrderEvaluation';
import dayjs from 'dayjs';
import MaintenanceForm from './components/MaintenanceForm';
import { StarOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const statusText = {
  pending: '待处理',
  assigned: '已分配',
  in_progress: '进行中',
  pending_check: '待检查',
  completed: '已完成',
  cancelled: '已取消',
};

const statusColor = {
  pending: 'orange',
  assigned: 'blue',
  in_progress: 'processing',
  pending_check: 'purple',
  completed: 'green',
  cancelled: 'red',
};

const priorityText = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

const priorityColor = {
  low: 'green',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

interface PageProps {
  params: {
    id: string;
  };
}

export default function WorkOrderDetailPage({ params }: PageProps) {
  const [loading, setLoading] = useState(true);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [progress, setProgress] = useState<WorkOrderProgress[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>();
  const [progressNotes, setProgressNotes] = useState('');
  const [form] = Form.useForm();
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    fetchWorkOrder();
    if (['admin', 'staff', 'technician'].includes(user?.role || '')) {
      fetchTechnicians();
    }
  }, [params.id]);

  const fetchWorkOrder = async () => {
    try {
      const response = await fetch(`/api/work-orders/${params.id}`);
      const result = await response.json();
      if (response.ok) {
        console.log('获取到的工单数据:', result.data);
        setWorkOrder(result.data.workOrder);
        setProgress(result.data.progress);
      } else {
        message.error(result.message || '获取工单详情失败');
      }
    } catch (error) {
      console.error('获取工单详情失败:', error);
      message.error('获取工单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      console.log('开始获取技师列表...');
      
      const response = await fetch('/api/users?role=technician');
      const result = await response.json();
      
      console.log('技师列表响应:', result);

      if (!response.ok) {
        throw new Error(result.message || '获取技师列表失败');
      }

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('技师列表数据格式错误');
      }

      setTechnicians(result.data);
      console.log('成功设置技师列表:', result.data);

    } catch (error: any) {
      console.error('获取技师列表失败:', error);
      message.error(error.message || '获取技师列表失败');
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    const initialValues = {
      ...workOrder,
      vehicle: workOrder?.vehicle._id,
      startDate: workOrder?.startDate ? dayjs(workOrder.startDate) : undefined,
      completionDate: workOrder?.completionDate ? dayjs(workOrder.completionDate) : undefined
    };
    
    console.log('编辑工单初始值:', initialValues);
    form.setFieldsValue(initialValues);
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const submitData = {
        ...values,
        startDate: values.startDate?.toISOString(),
        completionDate: values.completionDate?.toISOString()
      };

      const response = await fetch(`/api/work-orders/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();
      if (response.ok) {
        message.success('工单更新成功');
        setEditModalVisible(false);
        fetchWorkOrder();
      } else {
        message.error(result.message || '工单更新失败');
      }
    } catch (error) {
      console.error('更新工单失败:', error);
      message.error('工单更新失败');
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      const response = await fetch(`/api/work-orders/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          progressNotes,
        }),
      });

      const result = await response.json();
      console.log('状态更新响应:', result);

      if (response.ok) {
        message.success('状态更新成功');
        setStatusModalVisible(false);
        setProgressNotes('');
        
        fetchWorkOrder();
      } else {
        message.error(result.message || '状态更新失败');
      }
    } catch (error) {
      console.error('更新状态失败:', error);
      message.error('状态更新失败');
    }
  };

  const handleAssign = async () => {
    try {
      const response = await fetch(`/api/work-orders/${params.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          technicianId: selectedTechnician,
          notes: progressNotes,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        message.success('分配成功');
        setAssignModalVisible(false);
        setSelectedTechnician(undefined);
        setProgressNotes('');
        fetchWorkOrder();
      } else {
        message.error(result.message || '分配失败');
      }
    } catch (error) {
      console.error('分配工单失败:', error);
      message.error('分配工单失败');
    }
  };

  const handleEvaluationSubmit = () => {
    fetchWorkOrder();
  };

  const handleAddReview = () => {
    if (workOrder.status === 'completed' && !workOrder.review) {
      return (
        <Button 
          type="primary"
          icon={<StarOutlined />}
          onClick={() => setReviewModalVisible(true)}
        >
          添加评价
        </Button>
      );
    }
    return null;
  };

  if (loading || !workOrder) {
    return <div className="p-6">加载中...</div>;
  }

  const canEdit = user?.role === 'admin' || 
    (user?.role === 'staff' && workOrder.technician?._id === user._id);
  
  const canAssign = ['admin', 'staff'].includes(user?.role || '') && 
    workOrder.status === 'pending';

  const canChangeStatus = canEdit && workOrder.status !== 'completed' && 
    workOrder.status !== 'cancelled';

  const canEvaluate = user?.role === 'customer' && 
    workOrder.customer._id === user._id &&
    workOrder.status === 'completed' &&
    !workOrder.rating;

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-medium mb-2">
              工单详情 - {workOrder.orderNumber}
            </h2>
            <Space>
              <Tag color={statusColor[workOrder.status]}>
                {statusText[workOrder.status]}
              </Tag>
              <Tag color={priorityColor[workOrder.priority]}>
                {priorityText[workOrder.priority]}
              </Tag>
            </Space>
          </div>
          <Space>
            {canAssign && (
              <Button
                type="primary"
                onClick={() => setAssignModalVisible(true)}
              >
                分配技师
              </Button>
            )}
            {canChangeStatus && (
              <Button
                type="primary"
                onClick={() => setStatusModalVisible(true)}
              >
                更新状态
              </Button>
            )}
            {canEdit && (
              <Button
                onClick={handleEdit}
              >
                编辑工单
              </Button>
            )}
            {handleAddReview()}
          </Space>
        </div>

        <Divider />

        <Row gutter={24}>
          <Col span={16}>
            <Descriptions
              title="基本信息"
              column={2}
              bordered
            >
              <Descriptions.Item label="车辆">
                {workOrder.vehicle.brand} {workOrder.vehicle.model}
                <br />
                {workOrder.vehicle.licensePlate}
              </Descriptions.Item>
              <Descriptions.Item label="维修类型">
                {workOrder.type}
              </Descriptions.Item>
              <Descriptions.Item label="客户">
                {workOrder.customer?.username || '未分配客户'}
              </Descriptions.Item>
              <Descriptions.Item label="技师">
                {workOrder.technician?.username || '未分配技师'}
              </Descriptions.Item>
              <Descriptions.Item label="创建者">
                {workOrder.createdBy?.username || '未知'}
              </Descriptions.Item>
              <Descriptions.Item label="预计工时">
                {workOrder.estimatedHours ? `${workOrder.estimatedHours}小时` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="实际工时">
                {workOrder.actualHours ? `${workOrder.actualHours}小时` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="期望开始日期" span={2}>
                {workOrder.startDate ? new Date(workOrder.startDate).toLocaleDateString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完成日期" span={2}>
                {workOrder.completionDate ? new Date(workOrder.completionDate).toLocaleDateString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="问题描述" span={2}>
                {workOrder.description}
              </Descriptions.Item>
              {workOrder.diagnosis && (
                <Descriptions.Item label="故障诊断" span={2}>
                  {workOrder.diagnosis}
                </Descriptions.Item>
              )}
              {workOrder.solution && (
                <Descriptions.Item label="解决方案" span={2}>
                  {workOrder.solution}
                </Descriptions.Item>
              )}
              {workOrder.customerNotes && (
                <Descriptions.Item label="客户备注" span={2}>
                  {workOrder.customerNotes}
                </Descriptions.Item>
              )}
              {workOrder.technicianNotes && (
                <Descriptions.Item label="技师备注" span={2}>
                  {workOrder.technicianNotes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Col>
          <Col span={8}>
            <WorkOrderProgressTimeline 
              progress={progress} 
            />
            {(workOrder.rating || canEvaluate) && (
              <div className="mt-4">
                <WorkOrderEvaluation
                  workOrderId={params.id}
                  evaluation={workOrder.rating ? {
                    workOrder: params.id,
                    rating: workOrder.rating,
                    feedback: workOrder.feedback,
                    createdBy: workOrder.customer?._id || user?._id || '',
                    createdAt: workOrder.updatedAt,
                    _id: '',
                  } : undefined}
                  canEvaluate={canEvaluate}
                  onEvaluationSubmit={handleEvaluationSubmit}
                />
              </div>
            )}
          </Col>
        </Row>

        {user?.role === 'technician' && workOrder.status === 'in_progress' && (
          <div className="mt-4">
            <Divider />
            <h3 className="text-lg font-medium mb-4">添加维修记录</h3>
            <MaintenanceForm 
              workOrderId={params.id}
              workOrder={workOrder}
              onSuccess={fetchWorkOrder}
            />
          </div>
        )}
      </Card>

      <Modal
        title="编辑工单"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
        width={800}
      >
        <WorkOrderForm
          form={form}
          vehicles={[{
            _id: workOrder?.vehicle._id,
            brand: workOrder?.vehicle.brand,
            model: workOrder?.vehicle.model,
            licensePlate: workOrder?.vehicle.licensePlate
          }]}
          initialValues={workOrder}
          mode="edit"
        />
      </Modal>

      <Modal
        title="更新状态"
        open={statusModalVisible}
        onOk={() => handleStatusChange(workOrder.status)}
        onCancel={() => setStatusModalVisible(false)}
      >
        <div className="mb-4">
          <div className="mb-2">新状态</div>
          <Select
            style={{ width: '100%' }}
            value={workOrder.status}
            onChange={value => setWorkOrder({ ...workOrder, status: value })}
          >
            {Object.entries(statusText).map(([key, text]) => (
              <Select.Option
                key={key}
                value={key}
                disabled={!['admin'].includes(user?.role || '') && 
                  !['pending', 'assigned', 'in_progress', 'pending_check'].includes(key)}
              >
                {text}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div>
          <div className="mb-2">进度说明</div>
          <TextArea
            rows={4}
            value={progressNotes}
            onChange={e => setProgressNotes(e.target.value)}
            placeholder="请输入状态变更的原因或说明"
          />
        </div>
      </Modal>

      <Modal
        title="分配技师"
        open={assignModalVisible}
        onOk={handleAssign}
        onCancel={() => setAssignModalVisible(false)}
      >
        <div className="mb-4">
          <div className="mb-2">选择技师</div>
          <Select
            style={{ width: '100%' }}
            value={selectedTechnician}
            onChange={setSelectedTechnician}
            placeholder="请选择技师"
          >
            {Array.isArray(technicians) && technicians.map(tech => (
              <Select.Option key={tech._id} value={tech._id}>
                {tech.username}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div>
          <div className="mb-2">分配说明</div>
          <TextArea
            rows={4}
            value={progressNotes}
            onChange={e => setProgressNotes(e.target.value)}
            placeholder="请输入分配说明"
          />
        </div>
      </Modal>

      <Modal
        title="添加评价"
        open={reviewModalVisible}
        onOk={() => {
          // Handle adding a review
          setReviewModalVisible(false);
        }}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={600}
      >
        <WorkOrderEvaluation
          workOrderId={params.id}
          canEvaluate={true}
          onEvaluationSubmit={() => {
            setReviewModalVisible(false);
            fetchWorkOrder();
          }}
        />
      </Modal>
    </div>
  );
} 