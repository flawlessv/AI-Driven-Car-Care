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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { USER_ROLES, USER_STATUS } from '../../lib/constants';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '../../lib/store';
import type { User } from '@/types/user';

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

  useEffect(() => {
    // 检查用户是否登录
    if (!user) {
      console.log('用户未登录，重定向到登录页面');
      router.push('/login');
      return;
    }

    // 检查用户权限
    if (!['admin', 'staff'].includes(user.role)) {
      console.log('用户无权限访问，重定向到首页', user.role);
      router.push('/dashboard');
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
    } catch (error) {
      console.error('获取技师列表失败:', error);
      message.error(error.message || '获取技师列表失败');
      setTechnicians([]);
    }
  };

  const handleAdd = () => {
    setEditingTechnician(null);
    form.resetFields();
    setModalVisible(true);
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
        throw new Error('操作失败');
      }

      message.success('操作成功');
      setModalVisible(false);
      form.resetFields();
      fetchTechnicians();
    } catch (error) {
      console.error('保存技师信息失败:', error);
      message.error('保存失败');
    }
  };

  const columns = [
    {
      title: '技师信息',
      key: 'info',
      render: (record: TechnicianWithStats) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{record.name}</div>
            <div className="text-gray-500 text-sm">{record.level}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '专长',
      dataIndex: 'specialties',
      key: 'specialties',
      render: (specialties: string[]) => (
        <Space wrap>
          {specialties.map(specialty => (
            <Tag key={specialty} color="blue">{specialty}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '认证',
      dataIndex: 'certifications',
      key: 'certifications',
      render: (certifications: string[]) => (
        <Space wrap>
          {certifications.map(cert => (
            <Tag key={cert} color="green">{cert}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '工作年限',
      dataIndex: 'workExperience',
      key: 'workExperience',
      render: (years: number) => `${years}年`,
    },
    {
      title: '完成率',
      key: 'completion',
      render: (record: TechnicianWithStats) => (
        <Tooltip title={`完成${record.stats?.completedOrders || 0}个订单，共${record.stats?.totalOrders || 0}个订单`}>
          <Progress
            percent={record.stats?.completionRate || 0}
            size="small"
            format={percent => `${percent?.toFixed(1)}%`}
          />
        </Tooltip>
      ),
    },
    {
      title: '评分',
      key: 'rating',
      render: (record: TechnicianWithStats) => (
        <Space>
          <StarOutlined style={{ color: '#faad14' }} />
          <span>{record.stats?.averageRating?.toFixed(1) || '-'}</span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          active: { color: 'green', text: '在岗' },
          leave: { color: 'orange', text: '请假' },
          busy: { color: 'blue', text: '工作中' },
          inactive: { color: 'red', text: '离职' }
        };
        const currentStatus = statusMap[status as keyof typeof statusMap] || { color: 'default', text: '未知' };
        return <Tag color={currentStatus.color}>{currentStatus.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TechnicianWithStats) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card
        title="技师团队"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加技师
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={technicians}
          rowKey="_id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingTechnician ? '编辑技师信息' : '添加技师'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
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

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default TechniciansPage; 