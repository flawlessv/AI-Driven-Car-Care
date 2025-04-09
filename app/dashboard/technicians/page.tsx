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

interface TechnicianStats {
  totalOrders: number;
  completedOrders: number;
  completionRate: number;
  averageRating: number;
}

interface TechnicianWithStats extends User {
  stats?: TechnicianStats;
}

const TechniciansPage = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState<TechnicianWithStats[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<TechnicianWithStats | null>(null);
  const [form] = Form.useForm();
  const [technicianStats, setTechnicianStats] = useState<Record<string, TechnicianStats>>({});
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianWithStats | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');

  useEffect(() => {
    // 检查用户是否登录
    if (!user) {
      console.log('用户未登录，重定向到登录页面');
      router.push('/login');
      return;
    }

    console.log('用户已登录，角色:', user.role);
    fetchTechnicians();
  }, [user, router]);

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
      
      if (Array.isArray(result.data)) {
        setTechnicians(result.data);
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

  const handleEdit = (record: TechnicianWithStats) => {
    setEditingTechnician(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (record: TechnicianWithStats) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除技师 ${record.name} 吗？`,
      onOk: async () => {
        try {
          const response = await fetch(`/api/users/${record._id}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error('删除失败');
          }

          message.success('删除成功');
          fetchTechnicians();
        } catch (error) {
          console.error('删除技师失败:', error);
          message.error('删除技师失败');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      // 确保技师信息完整
      if (!values.name) {
        values.name = values.username;
      }
      
      if (!values.level) {
        values.level = '初级技师';
      }
      
      // 转换数值类型
      if (values.workExperience) {
        values.workExperience = Number(values.workExperience);
      }
      
      const url = editingTechnician
        ? `/api/users/${editingTechnician._id}`
        : '/api/users';
      const method = editingTechnician ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          role: 'technician'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '操作失败');
      }

      message.success('操作成功');
      setModalVisible(false);
      form.resetFields();
      fetchTechnicians();
    } catch (error: any) {
      console.error('保存技师信息失败:', error);
      message.error(error.message || '保存失败');
    }
  };

  const showTechnicianDetail = (record: TechnicianWithStats) => {
    setSelectedTechnician(record);
    setDetailModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    const statusMap = {
      active: { color: 'green', text: '在岗' },
      leave: { color: 'orange', text: '请假' },
      busy: { color: 'blue', text: '工作中' },
      inactive: { color: 'red', text: '离职' }
    };
    const currentStatus = statusMap[status as keyof typeof statusMap] || { color: 'default', text: '未知' };
    return currentStatus;
  };

  const getLevelColor = (level: string) => {
    const levelMap = {
      '初级技师': { color: 'blue', text: '初级技师' },
      '中级技师': { color: 'purple', text: '中级技师' },
      '高级技师': { color: 'gold', text: '高级技师' },
      '专家技师': { color: 'magenta', text: '专家技师' }
    };
    return levelMap[level as keyof typeof levelMap] || { color: 'default', text: level };
  };

  const columns = [
    {
      title: '技师信息',
      key: 'info',
      render: (record: TechnicianWithStats) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{record.name || record.username || '未命名'}</div>
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
              percent={Number(record.stats.completionRate) || 0}
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
              onClick: () => handleEdit(record)
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
            onChange={setAvailabilityFilter}
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
            onChange={setSpecialtyFilter}
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
            onClick={() => {
              setEditingTechnician(null);
              setModalVisible(true);
            }}
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
          dataSource={technicians}
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
                <div className="text-2xl font-bold mb-2">{selectedTechnician.name}</div>
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
                    handleEdit(selectedTechnician);
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
          onFinish={handleSubmit}
          className="admin-form mt-4"
        >
          <Form.Item
            name="username"
            label="登录账号"
            rules={[{ required: true, message: '请输入登录账号' }]}
            tooltip="用于技师登录系统的账号名"
          >
            <Input placeholder="请输入英文字母或数字的组合" />
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
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入技师姓名" />
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