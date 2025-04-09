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
import { StarOutlined, UploadOutlined, CheckOutlined, CloseOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import WorkOrderCompletion from './components/WorkOrderCompletion';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useParams } from 'next/navigation';
import { RcFile } from 'antd/es/upload';
import { statusText, statusColor } from '../components/StatusTag';

const { TextArea } = Input;

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
  const [debugInfo, setDebugInfo] = useState('');
  const [completionProofData, setCompletionProofData] = useState<any>(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [statusOptions, setStatusOptions] = useState<Array<{value: string, label: string, color: string}>>([]);

  const params = useParams();
  const user = useSelector((state: RootState) => state.auth.user);

  // 获取可用的状态选项
  const fetchStatusOptions = async () => {
    try {
      const response = await fetch('/api/work-orders/status-options');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.statusOptions) {
          console.log('获取到的状态选项:', result.data.statusOptions);
          setStatusOptions(result.data.statusOptions);
        }
      }
    } catch (error) {
      console.error('获取状态选项失败:', error);
    }
  };

  useEffect(() => {
    fetchWorkOrder();
    if (['admin',  'technician'].includes(user?.role || '')) {
      fetchTechnicians();
      fetchStatusOptions();
    }
  }, [params.id, user?.role]);

  useEffect(() => {
    if (workOrder && (workOrder.status === 'pending_check' || workOrder.status === 'completed')) {
      fetchCompletionProof();
    }
  }, [workOrder?.status]);

  const fetchWorkOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/work-orders/${params.id}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取工单详情失败');
      }
      
      // 获取工单数据
      if (result.data) {
        console.log('获取到的工单数据:', result.data);
        setWorkOrder(result.data);
      } else {
        console.error('工单数据格式错误:', result);
        throw new Error('工单数据格式错误');
      }
      
      // 获取进度数据
      if (result.progress && Array.isArray(result.progress)) {
        console.log('获取到的进度数据:', result.progress);
        
        // 对进度记录按创建时间排序，确保显示正确顺序
        const sortedProgress = [...result.progress].sort((a, b) => {
          // 使用时间戳比较
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        console.log('排序后的进度数据:', sortedProgress);
        
        setProgress(sortedProgress);
      } else {
        // 如果没有获取到进度数据，使用空数组
        setProgress([]);
        console.warn('未获取到进度记录');
        
        // 尝试单独获取进度记录
        fetchProgress();
      }
    } catch (error: any) {
      console.error('获取工单详情失败:', error);
      message.error(error.message || '获取工单详情失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 单独获取工单进度
  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/work-orders/${params.id}/progress`);
      const result = await response.json();
      
      if (response.ok && result.data) {
        console.log('单独获取的进度记录:', result.data);
        
        // 对进度记录按创建时间排序，确保显示正确顺序
        const sortedProgress = [...result.data].sort((a, b) => {
          // 使用时间戳比较
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        console.log('排序后的进度记录:', sortedProgress);
        
        setProgress(sortedProgress);
      }
    } catch (error) {
      console.error('获取工单进度失败:', error);
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

  const fetchCompletionProof = async () => {
    if (!params.id) return;
    
    setLoadingProof(true);
    try {
      console.log('获取工单完成证明:', params.id);
      const response = await fetch(`/api/work-orders/${params.id}/completion-proof`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('工单完成证明响应:', result);
        
        if (result.success && result.data && result.data.proofImages && result.data.proofImages.length > 0) {
          setCompletionProofData(result.data);
          console.log('使用完成证明API返回的数据');
        } else if (!completionProofData) {
          // 只有在之前没有从工单详情获取到数据时才更新
          console.log('完成证明API返回空数据，保持现有数据不变');
        }
      } else {
        console.error('获取完成证明接口错误:', response.status);
        // 不清空completionProofData，可能已经从工单详情中获取了数据
      }
    } catch (error) {
      console.error('获取工单完成证明错误:', error);
    } finally {
      setLoadingProof(false);
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
          body: JSON.stringify({ 
            status,
            notes: progressNotes
          }),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || '更新状态失败');
        }
        
        // 如果接口返回了最新的进度记录，对其进行排序后使用
        if (result.progress && Array.isArray(result.progress)) {
          console.log('API返回的进度记录:', result.progress);
          // 对进度记录按创建时间排序，确保显示正确顺序
          const sortedProgress = [...result.progress].sort((a, b) => {
            // 使用时间戳比较
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
          
          console.log('排序后的进度记录:', sortedProgress);
          
          setProgress(sortedProgress);
        }
        
        // 更新工单状态
        if (result.workOrder) {
          setWorkOrder(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              status: result.workOrder.status,
              completionDate: result.workOrder.completionDate
            };
          });
        }
        
        setStatusModalVisible(false);
        setProgressNotes(''); // 清空进度备注
        message.success('工单状态更新成功');
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
    // 只有当工单已完成、尚未评价，并且当前用户是工单客户时才可以添加评价
    if (workOrder && workOrder.status === 'completed' && !workOrder.rating) {
      if (canEvaluate) {
        return (
          <Button 
            type="primary"
            icon={<StarOutlined />}
            onClick={() => setReviewModalVisible(true)}
          >
            添加评价
          </Button>
        );
      } else if (user?.role !== 'customer') {
        // 对于非客户角色，显示禁用的按钮
        return (
          <Button 
            icon={<StarOutlined />}
            disabled
            title="只有客户可以评价"
          >
            添加评价
          </Button>
        );
      }
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

      message.success('完成证明提交成功，工单已变更为待审核状态');
      fetchWorkOrder();
      setCompletionModalVisible(false);
      setStatusModalVisible(false);
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
      
      // 如果接口返回了最新的进度记录，直接使用
      if (result.progress && Array.isArray(result.progress)) {
        console.log('API返回的进度记录:', result.progress);
        // 确保每条进度记录都有正确的时间戳
        const formattedProgress = result.progress.map((item: any) => ({
          ...item,
          createdAt: item.createdAt || new Date().toISOString()
        }));
        setProgress(formattedProgress);
      }
      
      // 更新工单状态
      if (result.data?.workOrder) {
        setWorkOrder(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            status: result.data.workOrder.status,
            completionDate: result.data.workOrder.completionDate
          };
        });
      }
      
      message.success('工单已审核通过，状态已更新为已完成');
    } catch (error: any) {
      message.error(error.message || '审核工单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectWorkOrder = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/work-orders/${params.id}/completion-proof`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          approved: false,
          notes: rejectionNotes 
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '驳回工单失败');
      }
      
      // 如果接口返回了最新的进度记录，直接使用
      if (result.progress && Array.isArray(result.progress)) {
        console.log('API返回的进度记录:', result.progress);
        // 确保每条进度记录都有正确的时间戳
        const formattedProgress = result.progress.map((item: any) => ({
          ...item,
          createdAt: item.createdAt || new Date().toISOString()
        }));
        setProgress(formattedProgress);
      }
      
      // 更新工单状态
      if (result.data) {
        setWorkOrder(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            status: result.data.status,
            completionDate: result.data.completionDate
          };
        });
      }
      
      setRejectModalVisible(false);
      setRejectionNotes('');
      message.success('工单已驳回，状态已更新为进行中');
    } catch (error: any) {
      message.error(error.message || '驳回工单失败');
    } finally {
      setLoading(false);
    }
  };

  const displayData = formatDisplayData(workOrder);

  if (loading || !workOrder) {
    return <div className="p-6">加载中...</div>;
  }

  const canEdit = user?.role === 'admin' || user?.role === 'technician'
  
  const canAssign = ['admin', 'technician'].includes(user?.role || '') && 
    workOrder.status === 'pending';

  const canChangeStatus =workOrder.status !== 'completed' && workOrder.status !== 'cancelled';

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
            <Button 
              type="default"
              onClick={fetchWorkOrder}
              loading={loading}
            >
              刷新
            </Button>
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
              progress={progress.map(item => {
                // 检查notes是否包含状态代码并替换为对应的中文状态名
                let noteText = item.notes || '';
                if (noteText && noteText.includes('状态更新为')) {
                  Object.entries(statusText).forEach(([code, text]) => {
                    noteText = noteText.replace(
                      new RegExp(`状态更新为 ${code}`, 'g'), 
                      `状态更新为 ${text}`
                    );
                  });
                }
                
                return {
                  _id: item._id,
                  status: item.status,
                  note: noteText,
                  timestamp: item.createdAt,
                  // 处理可能的不同数据结构
                  updatedBy: item.updatedBy || { 
                    username: item.user?.username || '未知' 
                  }
                };
              })} 
            />
            {/* 仅当工单有评价且评价未被隐藏时显示评价组件 */}
            {(workOrder.rating && workOrder.feedback && workOrder.feedback !== '已隐藏') && (
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
            {canEvaluate && !workOrder.rating && (
              <div className="mt-4">
                <WorkOrderEvaluation
                  workOrderId={params.id}
                  canEvaluate={true}
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

      {/* 在待审批状态下允许管理员和技师查看完成证明卡片 */}
      {workOrder && workOrder.status === 'pending_check' && 
        (user?.role === 'admin' || user?.role === 'technician') && (
        <Card title="完成证明" className="mb-6">
          <div>
            {loadingProof ? (
              <div className="text-center py-10">
                <div className="text-lg mb-2">加载完成证明中...</div>
              </div>
            ) : completionProofData?.proofImages?.length > 0 ? (
              <>
                {/* 展示完成证明图片 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {completionProofData.proofImages.map((image: string, index: number) => {
                    if (!image) return null;
                    
                    // 确保图片路径格式正确，添加域名前缀
                    const imgSrc = image.startsWith('http') 
                      ? image 
                      : `${window.location.origin}${image}`;
                    
                    return (
                      <div key={index} className="relative border border-gray-300 p-1 group cursor-pointer">
                        <div 
                          className="relative w-40 h-40 bg-gray-50 overflow-hidden"
                          onClick={() => {
                            console.log('点击图片，打开预览', imgSrc);
                            setPreviewImage(imgSrc);
                            setPreviewTitle(`完成证明图片 ${index + 1}`);
                            setPreviewOpen(true);
                          }}
                        >
                          <img 
                            src={imgSrc} 
                            alt={`完成证明图片 ${index + 1}`} 
                            className="w-full h-full object-cover rounded transition-transform duration-300 group-hover:scale-110" 
                            onError={(e) => {
                              console.error(`图片加载失败: ${imgSrc}`);
                              // 使用一个内联的占位图替代
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
                              // 添加提示边框
                              e.currentTarget.style.border = '2px solid red';
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300">
                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                              <SearchOutlined /> 点击查看
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-center mt-1 text-blue-600">点击放大</div>
                      </div>
                    );
                  })}
                </div>
                
                {completionProofData.notes && (
                  <Typography.Paragraph className="mb-4">
                    <strong>技师备注:</strong> {completionProofData.notes}
                  </Typography.Paragraph>
                )}
              </>
            ) : (
              <Alert
                message="暂无完成证明图片"
                description="技师尚未上传工单完成证明图片或数据格式不正确"
                type="info"
                showIcon
              />
            )}
            
            {/* 审批按钮区域 */}
            {user?.role === 'admin' && workOrder.status === 'pending_check' && (
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
          </div>
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
              {statusOptions.map(option => (
                <Select.Option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
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
          canEvaluate={canEvaluate}
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
        centered
        width={1000}
        destroyOnClose
        maskStyle={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
        bodyStyle={{ padding: '24px' }}
      >
        <div className="flex justify-center items-center">
          <img 
            alt={previewTitle || "预览图片"} 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '80vh',
              objectFit: 'contain',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }} 
            src={previewImage} 
            onError={(e) => {
              console.error('预览图片加载失败:', previewImage);
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
            }}
          />
        </div>
        <div className="text-center mt-4 text-gray-500">
          <Typography.Text>
            使用鼠标滚轮可缩放图片，点击蒙层或按ESC键关闭预览
          </Typography.Text>
        </div>
      </Modal>
    </div>
  );
};

export default WorkOrderDetailPage; 