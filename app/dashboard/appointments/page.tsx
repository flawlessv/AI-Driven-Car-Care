'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Card,
  InputNumber,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Appointment } from '@/types/appointment';

const { TextArea } = Input;

const statusColors = {
  pending: 'orange',
  confirmed: 'blue',
  in_progress: 'processing',
  completed: 'green',
  cancelled: 'red',
};

const statusText = {
  pending: '待确认',
  confirmed: '已确认',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

// 添加服务项目预设选项
const serviceOptions = [
  {
    category: 'regular',
    items: [
      { name: '常规保养', duration: 60, basePrice: 300 },
      { name: '机油更换', duration: 30, basePrice: 200 },
      { name: '轮胎更换', duration: 45, basePrice: 400 },
      { name: '刹车检查', duration: 30, basePrice: 150 },
    ],
  },
  {
    category: 'repair',
    items: [
      { name: '发动机维修', duration: 180, basePrice: 1500 },
      { name: '变速箱维修', duration: 240, basePrice: 2000 },
      { name: '空调维修', duration: 120, basePrice: 800 },
      { name: '底盘维修', duration: 150, basePrice: 1000 },
    ],
  },
  {
    category: 'inspection',
    items: [
      { name: '年度检查', duration: 90, basePrice: 500 },
      { name: '故障诊断', duration: 60, basePrice: 300 },
      { name: '排放检测', duration: 45, basePrice: 250 },
      { name: '安全检查', duration: 60, basePrice: 300 },
    ],
  },
];

export default function AppointmentsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Appointment[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAppointments();
    fetchVehicles();
    fetchTechnicians();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/appointments');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取预约列表失败');
      }

      setData(result.data);
    } catch (error: any) {
      message.error(error.message || '获取预约列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取车辆列表失败');
      }

      setVehicles(result.data?.data || []);
    } catch (error: any) {
      console.error('获取车辆列表失败:', error);
      message.error(error.message || '获取车辆列表失败');
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await fetch('/api/users?role=technician');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取技师列表失败');
      }

      // 确保只获取在职的技师
      const activeTechnicians = (result.data || []).filter((tech: any) => tech.status === 'active');
      setTechnicians(activeTechnicians);
    } catch (error: any) {
      console.error('获取技师列表失败:', error);
      message.error(error.message || '获取技师列表失败');
    }
  };

  const columns: ColumnsType<Appointment> = [
    {
      title: '预约编号',
      dataIndex: '_id',
      key: '_id',
      render: (id: string) => id.slice(-8),
    },
    {
      title: '客户姓名',
      dataIndex: ['customer', 'name'],
      key: 'customerName',
    },
    {
      title: '联系电话',
      dataIndex: ['customer', 'phone'],
      key: 'customerPhone',
    },
    {
      title: '车辆信息',
      dataIndex: 'vehicle',
      key: 'vehicle',
      render: (vehicle: any) => 
        `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
    },
    {
      title: '服务项目',
      dataIndex: ['service', 'name'],
      key: 'serviceName',
    },
    {
      title: '预约时间',
      dataIndex: ['timeSlot'],
      key: 'appointmentTime',
      render: (timeSlot: any) => (
        `${dayjs(timeSlot.date).format('YYYY-MM-DD')} ${timeSlot.startTime}-${timeSlot.endTime}`
      ),
    },
    {
      title: '技师',
      dataIndex: ['timeSlot', 'technician', 'name'],
      key: 'technicianName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusColors) => (
        <Tag color={statusColors[status]}>
          {statusText[status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
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

  const handleEdit = (record: Appointment) => {
    setEditingAppointment(record);
    form.setFieldsValue({
      ...record,
      vehicle: record.vehicle._id,
      'timeSlot.technician': record.timeSlot.technician._id,
      date: dayjs(record.timeSlot.date),
      startTime: dayjs(record.timeSlot.startTime, 'HH:mm'),
      endTime: dayjs(record.timeSlot.endTime, 'HH:mm'),
    });
    setModalVisible(true);
  };

  const handleDelete = (record: Appointment) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条预约记录吗？',
      onOk: async () => {
        try {
          const response = await fetch(`/api/appointments/${record._id}`, {
            method: 'DELETE',
          });
          const result = await response.json();
          
          if (!response.ok) {
            throw new Error(result.message || '删除预约失败');
          }

          message.success('删除成功');
          fetchAppointments();
        } catch (error: any) {
          message.error(error.message || '删除预约失败');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = editingAppointment
        ? `/api/appointments/${editingAppointment._id}`
        : '/api/appointments';
      const method = editingAppointment ? 'PUT' : 'POST';

      // 构造正确的数据格式
      const formattedValues = {
        customer: {
          name: values.customer.name,
          phone: values.customer.phone,
          email: values.customer.email,
        },
        vehicle: values.vehicle,
        service: {
          name: values.service.name,
          description: values.service.description,
          category: values.service.category,
          duration: values.service.duration,
          basePrice: values.service.basePrice,
        },
        timeSlot: {
          date: dayjs(values.date).toDate(),
          startTime: dayjs(values.startTime).format('HH:mm'),
          endTime: dayjs(values.endTime).format('HH:mm'),
          technician: values.timeSlot.technician,
        },
        status: values.status || 'pending',
        notes: values.notes,
        estimatedDuration: values.service.duration,
        estimatedCost: values.service.basePrice,
      };

      console.log('提交的数据:', formattedValues);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '保存预约失败');
      }

      message.success(editingAppointment ? '更新成功' : '创建成功');
      setModalVisible(false);
      form.resetFields();
      setEditingAppointment(null);
      fetchAppointments();
    } catch (error: any) {
      console.error('提交失败:', error);
      message.error(error.message || '保存预约失败');
    }
  };

  const handleAdd = () => {
    setEditingAppointment(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 添加服务选择后的处理函数
  const handleServiceSelect = (serviceData: any) => {
    form.setFieldsValue({
      'service.duration': serviceData.duration,
      'service.basePrice': serviceData.basePrice,
      estimatedDuration: serviceData.duration,
      estimatedCost: serviceData.basePrice,
    });
  };

  return (
    <div className="p-6">
      <Card
        title="预约管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增预约
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingAppointment ? '编辑预约' : '新增预约'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingAppointment(null);
        }}
        footer={null}
        width={720}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name={['customer', 'name']}
            label="客户姓名"
            rules={[{ required: true, message: '请输入客户姓名' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name={['customer', 'phone']}
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name={['customer', 'email']}
            label="电子邮箱"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="vehicle"
            label="选择车辆"
            rules={[{ required: true, message: '请选择车辆' }]}
          >
            <Select>
              {vehicles.map(vehicle => (
                <Select.Option 
                  key={vehicle._id} 
                  value={vehicle._id}
                >
                  {`${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name={['service', 'category']}
            label="服务类型"
            rules={[{ required: true, message: '请选择服务类型' }]}
          >
            <Select placeholder="请选择服务类型">
              <Select.Option value="regular">常规保养</Select.Option>
              <Select.Option value="repair">维修</Select.Option>
              <Select.Option value="inspection">检查</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues?.service?.category !== currentValues?.service?.category
            }
          >
            {({ getFieldValue }) => {
              const category = getFieldValue(['service', 'category']);
              const services = serviceOptions.find(opt => opt.category === category)?.items || [];
              
              return category ? (
                <Form.Item
                  name={['service', 'name']}
                  label="服务项目"
                  rules={[{ required: true, message: '请选择服务项目' }]}
                >
                  <Select
                    placeholder="请选择服务项目"
                    onChange={(_, option: any) => handleServiceSelect(option.data)}
                  >
                    {services.map(service => (
                      <Select.Option
                        key={service.name}
                        value={service.name}
                        data={service}
                      >
                        {service.name} (¥{service.basePrice} / {service.duration}分钟)
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null;
            }}
          </Form.Item>

          <Form.Item
            name={['service', 'description']}
            label="服务描述"
          >
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name={['service', 'duration']}
            label="预计时长(分钟)"
            rules={[{ required: true, message: '请输入预计时长' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>

          <Form.Item
            name={['service', 'basePrice']}
            label="基础价格"
            rules={[{ required: true, message: '请输入基础价格' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
          </Form.Item>

          <Form.Item
            name="date"
            label="预约日期"
            rules={[{ required: true, message: '请选择预约日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="startTime"
            label="开始时间"
            rules={[{ required: true, message: '请选择开始时间' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="endTime"
            label="结束时间"
            rules={[{ required: true, message: '请选择结束时间' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name={['timeSlot', 'technician']}
            label="选择技师"
            rules={[{ required: true, message: '请选择技师' }]}
          >
            <Select placeholder="请选择技师">
              {technicians.map((technician: any) => (
                <Select.Option 
                  key={technician._id} 
                  value={technician._id}
                >
                  {technician.name || technician.username}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {editingAppointment && (
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select>
                <Select.Option value="pending">待确认</Select.Option>
                <Select.Option value="confirmed">已确认</Select.Option>
                <Select.Option value="in_progress">进行中</Select.Option>
                <Select.Option value="completed">已完成</Select.Option>
                <Select.Option value="cancelled">已取消</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
                setEditingAppointment(null);
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 
