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
import type { RootState } from '@/lib/store';
import type { User } from '@/types/user';
import PermissionChecker from '@/app/components/PermissionChecker';

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

  const columns = [
    {
      title: '技师信息',
      key: 'info',
      render: (record: TechnicianWithStats) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{record.name || record.username || '未命名'}</div>
            <div className="text-gray-500 text-sm">{record.level || '初级技师'}</div>
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

  return (
    <div className="p-6">
      <Card
        title="技师团队"
        extra={
          <PermissionChecker
            menuKey="technicians"
            requiredPermission="write"
            buttonProps={{
              type: "primary",
              icon: <PlusOutlined />
            }}
            noPermissionTip="您没有添加技师的权限"
          >
            添加技师
          </PermissionChecker>
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