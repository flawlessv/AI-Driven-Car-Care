'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  message,
  Form,
  Input,
  Select,
  Row,
  Col,
  Avatar,
  Rate,
  Statistic,
  Progress,
  Tooltip,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  StarOutlined,
  ToolOutlined,
  PhoneOutlined,
  MailOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SyncOutlined,
  CalendarOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { USER_ROLES, USER_STATUS } from '../../lib/constants';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/lib/store';
import type { User } from '@/types/user';
import PermissionChecker from '@/app/components/PermissionChecker';
import dayjs from 'dayjs';

const { TextArea } = Input;

/**
 * 技师统计信息接口
 * 包含技师完成的订单数量、完成率和平均评分等指标
 */
interface TechnicianStats {
  totalOrders: number;      // 总订单数
  completedOrders: number;  // 已完成订单数
  completionRate: number;   // 完成率
  averageRating: number;    // 平均评分
}

/**
 * 扩展的技师信息接口，包含基本用户信息和统计数据
 */
interface TechnicianWithStats extends User {
  stats?: TechnicianStats;  // 技师统计信息
}

/**
 * 技师管理页面组件
 * 用于展示所有技师信息、统计数据，并提供添加、编辑、删除技师等功能
 */
const TechniciansPage = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState<TechnicianWithStats[]>([]); // 技师列表
  const [modalVisible, setModalVisible] = useState(false);                   // 控制模态框显示
  const [editingTechnician, setEditingTechnician] = useState<TechnicianWithStats | null>(null); // 当前编辑的技师
  const [form] = Form.useForm();
  const [technicianStats, setTechnicianStats] = useState<Record<string, TechnicianStats>>({}); // 技师统计数据映射
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianWithStats | null>(null); // 当前选中的技师
  const [detailModalVisible, setDetailModalVisible] = useState(false);       // 详情模态框显示控制
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all'); // 可用性筛选器
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');      // 专业筛选器

  useEffect(() => {
    // 检查用户是否登录
    if (!user) {
      console.log('用户未登录，重定向到登录页面');
      router.push('/login');
      return;
    }

    console.log('用户已登录，角色:', user.role);
    fetchTechnicians(); // 获取技师列表
  }, [user, router]);

  /**
   * 获取技师列表
   * 从API获取所有技师信息并更新状态
   */
  const fetchTechnicians = async () => {
    try {
      console.log('开始获取技师列表');
      const response = await fetch('/api/users?role=technician', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('技师列表响应状态:', response.status);
      const result = await response.json();
      console.log('技师列表响应数据:', result);
      
      if (!response.ok) {
        throw new Error(result.message || '获取技师列表失败');
      }
      
      /**
       * 验证和完善技师认证信息
       * 确保每个技师都有认证字段，没有则设为空数组
       */
      const checkForCertifications = (techniciansList: TechnicianWithStats[]) => {
        // 检查每个技师是否有认证字段，如果没有，设置为空数组
        return techniciansList.map(tech => {
          if (!tech.certifications) {
            return {
              ...tech,
              certifications: []
            };
          }
          return tech;
        });
      };

      if (Array.isArray(result.data)) {
        // 确保技师数据有正确的认证字段
        const validatedTechnicians = checkForCertifications(result.data);
        setTechnicians(validatedTechnicians);
        // 获取技师统计数据
        fetchTechnicianStats(validatedTechnicians);
      } else {
        console.error('技师列表数据格式错误:', result);
        setTechnicians([]);
      }
    } catch (error: any) {
      console.error('获取技师列表失败:', error);
      message.error(error.message || '获取技师列表失败');
      setTechnicians([]);
    }
  };

  /**
   * 获取技师统计数据
   * 为每个技师获取工作统计信息，包括完成订单数、评分等
   * @param techniciansList 技师列表
   */
  const fetchTechnicianStats = async (techniciansList: TechnicianWithStats[]) => {
    try {
      setLoading(true);
      // 创建一个Promise数组来并行获取所有技师的统计数据
      const statsPromises = techniciansList.map(async (technician) => {
        try {
          const response = await fetch(`/api/technicians/${technician._id}/statistics`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            console.warn(`获取技师${technician._id}的统计数据失败:`, response.status);
            return { technicianId: technician._id, stats: null };
          }
          
          const statsData = await response.json();
          console.log(`技师${technician._id}的统计数据:`, statsData);
          return { 
            technicianId: technician._id, 
            stats: statsData.data || null 
          };
        } catch (error) {
          console.warn(`获取技师${technician._id}的统计数据失败:`, error);
          return { technicianId: technician._id, stats: null };
        }
      });
      
      // 等待所有请求完成
      const results = await Promise.all(statsPromises);
      
      // 更新技师统计数据状态
      const newStatsMap: Record<string, TechnicianStats> = {};
      results.forEach(result => {
        if (result.stats) {
          newStatsMap[result.technicianId] = result.stats;
        }
      });
      
      setTechnicianStats(newStatsMap);
      
      // 更新技师列表，将统计数据关联到每个技师对象
      setTechnicians(prevTechnicians => {
        return prevTechnicians.map(tech => {
          if (newStatsMap[tech._id]) {
            console.log(`更新技师${tech._id}的统计数据:`, newStatsMap[tech._id]);
            return { ...tech, stats: newStatsMap[tech._id] };
          }
          // 如果没有获取到统计数据，设置默认值
          return { 
            ...tech, 
            stats: {
              totalOrders: 0,
              completedOrders: 0,
              completionRate: 0,
              averageRating: 0
            } 
          };
        });
      });
    } catch (error: any) {
      console.error('获取技师统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理技师删除
   * 向API发送删除请求并更新本地技师列表
   * @param technician 要删除的技师对象
   */
  const handleDelete = async (technician: TechnicianWithStats) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除技师 ${technician.username} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          
          const response = await fetch(`/api/users/${technician._id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const result = await response.json();
          
          if (!response.ok) {
            throw new Error(result.message || '删除技师失败');
          }
          
          message.success('技师删除成功');
          // 从本地列表中移除删除的技师
          setTechnicians(prev => prev.filter(tech => tech._id !== technician._id));
        } catch (error: any) {
          console.error('删除技师失败:', error);
          message.error(error.message || '删除技师失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  /**
   * 打开添加/编辑技师模态框
   * @param technician 要编辑的技师对象（为null时表示添加新技师）
   */
  const openModal = (technician: TechnicianWithStats | null = null) => {
    setEditingTechnician(technician);
    form.resetFields();
    
    if (technician) {
      // 编辑现有技师，填充表单数据
      form.setFieldsValue({
        username: technician.username,
        email: technician.email,
        phone: technician.phone,
        specialties: technician.specialties || [],
        certifications: technician.certifications || [],
        status: technician.status,
        description: technician.description || '',
        level: technician.level || '初级技师',
        workExperience: technician.workExperience || '',
      });
    }
    
    setModalVisible(true);
  };

  /**
   * 处理表单提交
   * 创建新技师或更新现有技师信息
   */
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // 确保认证字段是一个数组
      if (!Array.isArray(values.certifications)) {
        values.certifications = values.certifications 
          ? values.certifications.split(',').map((cert: string) => cert.trim()) 
          : [];
      }
      
      // 确保专业字段是一个数组
      if (!Array.isArray(values.specialties)) {
        values.specialties = values.specialties 
          ? values.specialties.split(',').map((specialty: string) => specialty.trim()) 
          : [];
      }
      
      if (editingTechnician) {
        // 更新现有技师
        const response = await fetch(`/api/users/${editingTechnician._id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...values,
            role: USER_ROLES.TECHNICIAN
          })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || '更新技师失败');
        }
        
        message.success('技师信息更新成功');
        
        // 更新本地技师列表
        setTechnicians(prev => 
          prev.map(tech => tech._id === editingTechnician._id ? { ...tech, ...values } : tech)
        );
      } else {
        // 创建新技师
        const response = await fetch('/api/users', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...values,
            role: USER_ROLES.TECHNICIAN,
            password: values.phone.slice(-6) // 默认密码为手机号后6位
          })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || '创建技师失败');
        }
        
        message.success('技师创建成功');
        
        // 添加新技师到列表
        fetchTechnicians(); // 重新获取列表以确保有完整的数据
      }
      
      // 关闭模态框
      setModalVisible(false);
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误
        message.error('请检查表单中的错误');
      } else {
        console.error('提交技师表单失败:', error);
        message.error(error.message || '提交失败');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 打开技师详情模态框
   * @param technician 要查看详情的技师对象
   */
  const openDetailModal = (technician: TechnicianWithStats) => {
    setSelectedTechnician(technician);
    setDetailModalVisible(true);
  };

  /**
   * 根据可用性过滤技师列表
   * @param availability 可用性状态
   */
  const handleAvailabilityFilterChange = (availability: string) => {
    setAvailabilityFilter(availability);
  };

  /**
   * 根据专业过滤技师列表
   * @param specialty 专业类型
   */
  const handleSpecialtyFilterChange = (specialty: string) => {
    setSpecialtyFilter(specialty);
  };

  /**
   * 过滤技师列表
   * 根据当前设置的可用性和专业过滤条件筛选技师
   */
  const filteredTechnicians = technicians.filter(technician => {
    // 根据可用性过滤
    if (availabilityFilter !== 'all' && technician.status !== availabilityFilter) {
      return false;
    }
    
    // 根据专业过滤
    if (specialtyFilter !== 'all' && !(technician.specialties || []).includes(specialtyFilter)) {
      return false;
    }
    
    return true;
  });

  /**
   * 获取所有唯一的专业列表
   * 从所有技师数据中提取不重复的专业类型
   */
  const getAllSpecialties = () => {
    const specialtiesSet = new Set<string>();
    
    technicians.forEach(technician => {
      if (Array.isArray(technician.specialties)) {
        technician.specialties.forEach(specialty => {
          if (specialty) specialtiesSet.add(specialty);
        });
      }
    });
    
    return Array.from(specialtiesSet);
  };

  // 获取所有专业选项
  const allSpecialties = getAllSpecialties();

  const columns = [
    {
      title: '技师信息',
      key: 'info',
      render: (record: TechnicianWithStats) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{record.username || '未命名'}</div>
            <div className="text-gray-500 text-sm">{getLevelColor(record.level || '初级技师').text}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '联系方式',
      key: 'contact',
      render: (record: TechnicianWithStats) => (
        <div>
          <div className="flex items-center mb-1">
            <PhoneOutlined className="text-green-500 mr-1" />
            <span>{record.phone || '-'}</span>
          </div>
          <div className="flex items-center">
            <MailOutlined className="text-blue-500 mr-1" />
            <span>{record.email || '-'}</span>
          </div>
        </div>
      ),
    },
    {
      title: '专长',
      dataIndex: 'specialties',
      key: 'specialties',
      render: (specialties: string[]) => (
        <Space wrap>
          {Array.isArray(specialties) && specialties.length > 0 ? specialties.map(specialty => (
            <Tag key={specialty} color="blue">{specialty}</Tag>
          )) : <span className="text-gray-400">暂无专长</span>}
        </Space>
      ),
    },
    {
      title: '认证',
      dataIndex: 'certifications',
      key: 'certifications',
      render: (certifications: string[]) => (
        <Space wrap>
          {Array.isArray(certifications) && certifications.length > 0 ? certifications.map(cert => (
            <Tag key={cert} color="green">{cert}</Tag>
          )) : <span className="text-gray-400">暂无认证</span>}
        </Space>
      ),
    },
    {
      title: '工作年限',
      dataIndex: 'workExperience',
      key: 'workExperience',
      render: (years: string | number) => years ? `${years}年` : '未填写',
    },
    {
      title: '完成率',
      key: 'completion',
      render: (record: TechnicianWithStats) => {
        if (!record.stats?.completionRate && record.stats?.completionRate !== 0) {
          return <span className="text-gray-400">无数据</span>;
        }
        return (
          <Tooltip title={`完成${record.stats?.completedOrders || 0}个订单，共${record.stats?.totalOrders || 0}个订单`}>
            <Progress
              percent={Number(record.stats.completionRate * 100) || 0}
              size="small"
              format={percent => percent ? `${percent.toFixed(1)}%` : '0%'}
            />
          </Tooltip>
        );
      }
    },
    {
      title: '评分',
      key: 'rating',
      render: (record: TechnicianWithStats) => {
        if (!record.stats?.averageRating && record.stats?.averageRating !== 0) {
          return <span className="text-gray-400">无评分</span>;
        }
        return (
          <Space>
            <StarOutlined style={{ color: '#faad14' }} />
            <span>{record.stats.averageRating.toFixed(1)}</span>
          </Space>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusInfo = getStatusColor(status);
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TechnicianWithStats) => (
        <Space>
          <PermissionChecker
            menuKey="technicians"
            requiredPermission="write"
            buttonProps={{
              size: "small",
              icon: <EditOutlined />,
              onClick: () => openModal(record)
            }}
            noPermissionTip="您没有编辑技师信息的权限"
          >
            编辑
          </PermissionChecker>
          
          <PermissionChecker
            menuKey="technicians"
            requiredPermission="manage"
            buttonProps={{
              size: "small",
              danger: true,
              icon: <DeleteOutlined />,
              onClick: () => handleDelete(record)
            }}
            noPermissionTip="您没有删除技师的权限"
          >
            删除
          </PermissionChecker>
        </Space>
      ),
    },
  ];

  const specialtyOptions = [
    {
      value: '发动机维修',
      label: '发动机维修',
    },
    {
      value: '变速箱维修',
      label: '变速箱维修',
    },
    {
      value: '底盘维修',
      label: '底盘维修',
    },
    {
      value: '电气系统',
      label: '电气系统',
    },
    {
      value: '空调系统',
      label: '空调系统',
    },
    {
      value: '钣金喷漆',
      label: '钣金喷漆',
    },
    {
      value: '轮胎更换',
      label: '轮胎更换',
    },
    {
      value: '制动系统',
      label: '制动系统',
    },
    {
      value: '常规保养',
      label: '常规保养',
    },
    {
      value: '诊断检测',
      label: '诊断检测',
    },
  ];

  return (
    <div className="page-transition">
      <div className="page-title">
        <h1>技师管理</h1>
        <div className="description">管理工厂的技师团队和分配工作任务</div>
      </div>
      
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <Select
            defaultValue="all"
            style={{ width: 120 }}
            onChange={handleAvailabilityFilterChange}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'active', label: '在职' },
              { value: 'inactive', label: '离职' },
              { value: 'vacation', label: '休假' },
              { value: 'sick', label: '病假' },
            ]}
          />
          <Select
            defaultValue="all"
            style={{ width: 120 }}
            onChange={handleSpecialtyFilterChange}
            options={[
              { value: 'all', label: '全部专长' },
              ...specialtyOptions
            ]}
          />
        </div>
        
        <Space>
          <Button 
            icon={<SyncOutlined />} 
            onClick={fetchTechnicians}
            className="admin-btn"
          >
            刷新数据
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => openModal()}
            className="admin-btn admin-btn-primary"
          >
            新增技师
          </Button>
        </Space>
      </div>
      
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">技师总数</div>}
                value={technicians.length}
                prefix={<TeamOutlined className="text-blue-500 mr-1" />}
                valueStyle={{ color: '#1890ff', fontWeight: 500 }}
              />
            </Card>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">在职技师</div>}
                value={technicians.filter(t => t.status === 'active').length}
                prefix={<CheckCircleOutlined className="text-green-500 mr-1" />}
                valueStyle={{ color: '#52c41a', fontWeight: 500 }}
              />
            </Card>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">高级技师</div>}
                value={technicians.filter(t => t.level === '高级技师' || t.level === '专家技师').length}
                prefix={<TrophyOutlined className="text-yellow-500 mr-1" />}
                valueStyle={{ color: '#faad14', fontWeight: 500 }}
              />
            </Card>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">平均评分</div>}
                value={Object.values(technicianStats).reduce((acc, stat) => acc + stat.averageRating, 0) / 
                      (Object.values(technicianStats).length || 1)}
                precision={1}
                prefix={<StarOutlined className="text-purple-500 mr-1" />}
                valueStyle={{ color: '#722ed1', fontWeight: 500 }}
                suffix="/5"
              />
            </Card>
          </div>
        </Col>
      </Row>
      
      <Card className="dashboard-card fade-in">
        <Table
          columns={columns}
          dataSource={filteredTechnicians}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
          }}
          className="dashboard-table"
        />
      </Card>
      
      {/* 技师详情模态框 */}
      <Modal
        title="技师详情"
        open={detailModalVisible}
        footer={null}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        className="enhanced-modal"
      >
        {selectedTechnician && (
          <div>
            <div className="flex items-center mb-6">
              <Avatar 
                size={80} 
                icon={<UserOutlined />} 
                style={{ backgroundColor: '#1890ff' }}
                className="mr-6"
              />
              <div>
                <div className="text-2xl font-bold mb-2">{selectedTechnician.username}</div>
                <div className="flex space-x-2 mb-2">
                  <Tag color={getLevelColor(selectedTechnician.level || '初级技师').color}>
                    {getLevelColor(selectedTechnician.level || '初级技师').text}
                  </Tag>
                  <Tag color={getStatusColor(selectedTechnician.status || 'active').color}>
                    {getStatusColor(selectedTechnician.status || 'active').text}
                  </Tag>
                </div>
                <div className="flex items-center">
                  <Rate 
                    disabled 
                    value={technicianStats[selectedTechnician._id]?.averageRating || 4.5} 
                    className="text-sm"
                  />
                  <span className="ml-2 text-gray-500">
                    {(technicianStats[selectedTechnician._id]?.averageRating || 4.5).toFixed(1)}/5
                  </span>
                </div>
              </div>
            </div>
            
            <Tabs defaultActiveKey="1">
              <Tabs.TabPane tab="基本信息" key="1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-500 mb-1">联系电话</p>
                      <p className="flex items-center">
                        <PhoneOutlined className="mr-2 text-green-500" /> 
                        {selectedTechnician.phone || '未设置'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 mb-1">电子邮箱</p>
                      <p className="flex items-center">
                        <MailOutlined className="mr-2 text-blue-500" /> 
                        {selectedTechnician.email || '未设置'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 mb-1">入职日期</p>
                      <p className="flex items-center">
                        <CalendarOutlined className="mr-2 text-purple-500" /> 
                        {selectedTechnician.hireDate 
                          ? dayjs(selectedTechnician.hireDate).format('YYYY-MM-DD') 
                          : '未设置'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-500 mb-1">专长领域</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedTechnician.specialties && selectedTechnician.specialties.length > 0 
                          ? selectedTechnician.specialties.map(spec => (
                              <Tag key={spec} color="blue" className="mb-1">
                                <span className="flex items-center">
                                  <ToolOutlined className="mr-1" /> {spec}
                                </span>
                              </Tag>
                            ))
                          : <span className="text-gray-400">未设置专长</span>
                        }
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 mb-1">技师等级</p>
                      <p>{getLevelColor(selectedTechnician.level || '初级技师').text}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 mb-1">技师介绍</p>
                      <p>{selectedTechnician.description || '暂无介绍'}</p>
                    </div>
                  </div>
                </div>
              </Tabs.TabPane>
              
              <Tabs.TabPane tab="工作统计" key="2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Card className="dashboard-card">
                      <Statistic
                        title="已完成工单"
                        value={technicianStats[selectedTechnician._id]?.completedOrders || 0}
                        prefix={<CheckCircleOutlined className="text-green-500" />}
                      />
                    </Card>
                    
                    <Card className="dashboard-card">
                      <Statistic
                        title="待处理工单"
                        value={technicianStats[selectedTechnician._id]?.totalOrders || 0}
                        prefix={<ClockCircleOutlined className="text-orange-500" />}
                      />
                    </Card>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium mb-2">工作效率</p>
                      <Progress 
                        percent={technicianStats[selectedTechnician._id]?.completionRate || 0}
                        status="active"
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                      />
                    </div>
                    
                    <div>
                      <p className="font-medium mb-2">客户满意度</p>
                      <Progress 
                        percent={(technicianStats[selectedTechnician._id]?.averageRating || 0) * 20}
                        status="active"
                        strokeColor={{
                          '0%': '#faad14',
                          '100%': '#52c41a',
                        }}
                      />
                    </div>
                    
                    <div>
                      <p className="font-medium mb-2">技能评级</p>
                      <div className="flex items-center">
                        <Rate 
                          disabled 
                          value={technicianStats[selectedTechnician._id]?.averageRating || 4.5} 
                        />
                        <span className="ml-2 text-gray-500">
                          {(technicianStats[selectedTechnician._id]?.averageRating || 4.5).toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Tabs.TabPane>
            </Tabs>
            
            <div className="flex justify-end mt-6">
              <Space>
                <Button onClick={() => setDetailModalVisible(false)}>关闭</Button>
                <Button 
                  type="primary" 
                  onClick={() => {
                    setDetailModalVisible(false);
                    openModal(selectedTechnician);
                  }}
                  className="admin-btn admin-btn-primary"
                >
                  编辑
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
      
      {/* 添加/编辑技师模态框 */}
      <Modal
        title={editingTechnician ? '编辑技师' : '新增技师'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        className="enhanced-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          className="admin-form mt-4"
        >
          <Form.Item
            name="username"
            label="用户名/姓名"
            rules={[{ required: true, message: '请输入用户名/姓名' }]}
            tooltip="用于技师登录系统的账号名和显示名称"
          >
            <Input placeholder="请输入技师姓名" />
          </Form.Item>

          <Form.Item
            name="password"
            label="登录密码"
            rules={[{ required: !editingTechnician, message: '请输入登录密码' }]}
            tooltip={editingTechnician ? "修改密码，留空则保持不变" : "设置技师初始登录密码"}
          >
            <Input.Password placeholder="请输入至少6位的密码" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="电子邮箱"
            rules={[
              { required: true, message: '请输入电子邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="level"
            label="技师等级"
            rules={[{ required: true, message: '请选择技师等级' }]}
          >
            <Select>
              <Select.Option value="初级技师">初级技师</Select.Option>
              <Select.Option value="中级技师">中级技师</Select.Option>
              <Select.Option value="高级技师">高级技师</Select.Option>
              <Select.Option value="专家技师">专家技师</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="specialties"
            label="专长领域"
            rules={[{ required: true, message: '请选择专长领域' }]}
          >
            <Select mode="multiple">
              <Select.Option value="发动机维修">发动机维修</Select.Option>
              <Select.Option value="变速箱维修">变速箱维修</Select.Option>
              <Select.Option value="底盘维修">底盘维修</Select.Option>
              <Select.Option value="电气系统">电气系统</Select.Option>
              <Select.Option value="空调系统">空调系统</Select.Option>
              <Select.Option value="钣金喷漆">钣金喷漆</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="certifications"
            label="持有证书"
            rules={[{ required: true, message: '请选择持有证书' }]}
          >
            <Select mode="multiple">
              <Select.Option value="ASE认证">ASE认证</Select.Option>
              <Select.Option value="本田认证技师">本田认证技师</Select.Option>
              <Select.Option value="丰田认证技师">丰田认证技师</Select.Option>
              <Select.Option value="奔驰认证技师">奔驰认证技师</Select.Option>
              <Select.Option value="宝马认证技师">宝马认证技师</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="workExperience"
            label="工作年限"
            rules={[{ required: true, message: '请输入工作年限' }]}
          >
            <Input type="number" min={0} />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            initialValue="active"
          >
            <Select>
              <Select.Option value="active">在岗</Select.Option>
              <Select.Option value="leave">请假</Select.Option>
              <Select.Option value="busy">工作中</Select.Option>
              <Select.Option value="inactive">离职</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="技师介绍"
          >
            <Input.TextArea rows={4} placeholder="请输入技师介绍" />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              className="admin-btn admin-btn-primary"
            >
              {editingTechnician ? '更新' : '保存'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default TechniciansPage; 