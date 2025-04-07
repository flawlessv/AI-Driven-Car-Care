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
  Upload,
  Typography,
  Alert,
} from 'antd';
import type { RootState } from '@/lib/store';
import type { WorkOrder, WorkOrderProgress } from '@/types/workOrder';
import type { User } from '@/types/user';
import type { Vehicle } from '@/types/vehicle';
import WorkOrderForm from '../components/WorkOrderForm';
import WorkOrderProgressTimeline from '../components/WorkOrderProgress';
import WorkOrderEvaluation from '../components/WorkOrderEvaluation';
import dayjs from 'dayjs';
import MaintenanceForm from './components/MaintenanceForm';
import { StarOutlined, UploadOutlined, CheckOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import WorkOrderCompletion from './components/WorkOrderCompletion';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useParams } from 'next/navigation';
import { RcFile } from 'antd/es/upload';

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

const formatDisplayData = (workOrder: WorkOrder | null) => {
  if (!workOrder) return null;

  const vehicle = typeof workOrder.vehicle === 'string' 
    ? { _id: workOrder.vehicle } as Vehicle 
    : workOrder.vehicle;
    
  const customer = typeof workOrder.customer === 'string'
    ? { _id: workOrder.customer } as User
    : workOrder.customer;
    
  const technician = workOrder.technician && typeof workOrder.technician === 'string'
    ? { _id: workOrder.technician } as User
    : workOrder.technician;

  return {
    vehicle,
    customer,
    technician
  };
};

const WorkOrderDetailPage = () => {
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
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [uploadForm] = Form.useForm();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const params = useParams();
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
    if (!workOrder) return;
    
    const vehicleId = typeof workOrder.vehicle === 'string' 
      ? workOrder.vehicle 
      : workOrder.vehicle._id;
      
    const initialValues = {
      ...workOrder,
      vehicle: vehicleId,
      startDate: workOrder.startDate ? dayjs(workOrder.startDate) : undefined,
      completionDate: workOrder.completionDate ? dayjs(workOrder.completionDate) : undefined
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
    if (status === 'completed') {
      setCompletionModalVisible(true);
    } else {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/work-orders/${params.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || '更新状态失败');
        }
        
        message.success('状态更新成功');
        fetchWorkOrder();
      } catch (error: any) {
        message.error(error.message || '更新状态失败');
      } finally {
        setLoading(false);
      }
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

  const handleUploadChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setFileList(fileList);
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmitCompletionProof = async () => {
    try {
      if (fileList.length === 0) {
        message.error('请至少上传一张完成证明照片');
        return;
      }

      setLoading(true);

      const formData = new FormData();
      fileList.forEach(file => {
        if (file.originFileObj) {
          formData.append('proofImages', file.originFileObj);
        }
      });
      
      formData.append('notes', completionNotes);
      formData.append('workOrderId', params.id);

      const uploadResponse = await fetch(`/api/work-orders/${params.id}/completion-proof`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || '上传完成证明失败');
      }

      const updateResponse = await fetch(`/api/work-orders/${params.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending_check' }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || '更新工单状态失败');
      }

      message.success('完成证明提交成功，工单已变更为待审核状态');
      fetchWorkOrder();
      setCompletionModalVisible(false);
      setFileList([]);
      setCompletionNotes('');
    } catch (error: any) {
      console.error('提交完成证明失败:', error);
      message.error(error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWorkOrder = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/work-orders/${params.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '审核工单失败');
      }
      
      message.success('工单已审核通过，状态已更新为已完成');
      fetchWorkOrder();
    } catch (error: any) {
      message.error(error.message || '审核工单失败');
    } finally {
      setLoading(false);
    }
  };

  const displayData = formatDisplayData(workOrder);

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
              {displayData && (
                <>
                  <Descriptions.Item label="车辆">
                    {displayData.vehicle?.brand} {displayData.vehicle?.model}
                    <br />
                    {displayData.vehicle?.licensePlate}
                  </Descriptions.Item>
                  <Descriptions.Item label="维修类型">
                    {workOrder.type}
                  </Descriptions.Item>
                  <Descriptions.Item label="客户">
                    {displayData.customer?.username || '未分配客户'}
                  </Descriptions.Item>
                  <Descriptions.Item label="技师">
                    {displayData.technician?.username || '未分配技师'}
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
                </>
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

      {workOrder && (
        <WorkOrderCompletion
          workOrderId={workOrder._id}
          status={workOrder.status}
          completionProof={workOrder.completionProof}
          onSubmitSuccess={fetchWorkOrder}
        />
      )}

      {workOrder?.completionProof && displayData && (
        <Card title="完成证明" className="mb-6">
          <div className="mb-2">
            {workOrder.completionProof.notes && (
              <Typography.Paragraph className="mb-4">
                <strong>技师备注:</strong> {workOrder.completionProof.notes}
              </Typography.Paragraph>
            )}
            
            <div className="flex flex-wrap gap-2">
              {workOrder.completionProof.proofImages && 
               Array.isArray(workOrder.completionProof.proofImages) && 
               workOrder.completionProof.proofImages.map((image, index) => (
                <div key={index} className="relative">
                  <img 
                    src={image} 
                    alt={`完成证明图片 ${index + 1}`} 
                    className="w-40 h-40 object-cover rounded"
                    onClick={() => window.open(image, '_blank')}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {user?.role === 'admin' && 
           workOrder.status === 'pending_check' && 
           typeof workOrder.completionProof.approved === 'boolean' && 
           !workOrder.completionProof.approved && (
            <div className="mt-4">
              <Space>
                <Button 
                  type="primary" 
                  icon={<CheckOutlined />}
                  onClick={handleApproveWorkOrder}
                  loading={loading}
                >
                  通过审批
                </Button>
                <Button 
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    Modal.confirm({
                      title: '拒绝审批',
                      content: '确定拒绝这项工作的完成证明吗？',
                      okType: 'danger',
                      onOk: async () => {
                        try {
                          const response = await fetch(`/api/work-orders/${params.id}/completion-proof`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              approved: false,
                              notes: '管理员已拒绝，请重新完成工作'
                            }),
                          });
                          
                          if (response.ok) {
                            message.success('已拒绝通过');
                            fetchWorkOrder();
                          } else {
                            const data = await response.json();
                            message.error(data.message || '操作失败');
                          }
                        } catch (error) {
                          console.error('审批操作失败:', error);
                          message.error('审批操作失败');
                        }
                      }
                    });
                  }}
                >
                  拒绝通过
                </Button>
              </Space>
            </div>
          )}
          
          {workOrder.completionProof.approved && (
            <Tag color="green" className="mt-2">已审核通过</Tag>
          )}
        </Card>
      )}

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
            _id: displayData?.vehicle?._id,
            brand: displayData?.vehicle?.brand,
            model: displayData?.vehicle?.model,
            licensePlate: displayData?.vehicle?.licensePlate
          }]}
          initialValues={workOrder}
          mode="edit"
        />
      </Modal>

      <Modal
        title="更新状态"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setStatusModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting || uploading}
            onClick={() => {
              if (workOrder) {
                handleStatusChange(workOrder.status);
              }
            }}
          >
            提交
          </Button>
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="新状态">
            <Select
              value={workOrder?.status}
              onChange={value => setWorkOrder({ ...workOrder, status: value })}
              style={{ width: '100%' }}
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
          </Form.Item>
          
          <Form.Item label="进度备注">
            <Input.TextArea
              rows={4}
              value={progressNotes}
              onChange={(e) => setProgressNotes(e.target.value)}
              placeholder="请输入工作进度备注..."
            />
          </Form.Item>
        </Form>
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

      <Modal
        title="提交完成证明"
        open={completionModalVisible}
        onCancel={() => {
          setCompletionModalVisible(false);
          setFileList([]);
          setCompletionNotes('');
        }}
        footer={[
          <Button key="cancel" onClick={() => setCompletionModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmitCompletionProof} loading={loading}>
            提交
          </Button>
        ]}
      >
        <Form form={uploadForm} layout="vertical">
          <Form.Item
            label="完成证明照片"
            name="proofImages"
            rules={[{ required: true, message: '请上传至少一张完成证明照片' }]}
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleUploadChange}
              onPreview={handlePreview}
              beforeUpload={() => false}
              accept="image/*"
            >
              {fileList.length >= 8 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item label="备注" name="notes">
            <Input.TextArea
              rows={4}
              placeholder="请填写完成工作的相关说明"
              value={completionNotes}
              onChange={e => setCompletionNotes(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img alt="预览图片" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default WorkOrderDetailPage; 