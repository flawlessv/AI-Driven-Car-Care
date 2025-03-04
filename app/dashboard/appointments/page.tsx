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
  const [data, setData] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
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

      // 确保我们获取到正确的数据
      const appointmentsData = Array.isArray(result.data) ? result.data : [];
      console.log('Appointments data:', appointmentsData);
      setData(appointmentsData);
    } catch (error: any) {
      console.error('获取预约列表失败:', error);
      message.error(error.message || '获取预约列表失败');
      setData([]);
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
      title: '客户信息',
      dataIndex: 'customer',
      key: 'customer',
      render: (customer: any) => (
        <div>
          <div>{customer?.name}</div>
          <div className="text-gray-500 text-sm">{customer?.phone}</div>
        </div>
      ),
    },
    {
      title: '车辆信息',
      dataIndex: 'vehicle',
      key: 'vehicle',
      render: (vehicle: any) => 
        vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : '-',
    },
    {
      title: '服务项目',
      dataIndex: ['service', 'name'],
      key: 'serviceName',
    },
    {
      title: '预约时间',
      dataIndex: 'timeSlot',
      key: 'appointmentTime',
      render: (timeSlot: any) => (
        timeSlot ? `${dayjs(timeSlot.date).format('YYYY-MM-DD')} ${timeSlot.startTime}-${timeSlot.endTime}` : '-'
      ),
    },
    {
      title: '技师',
      dataIndex: ['timeSlot', 'technician', 'name'],
      key: 'technicianName',
      render: (name: string) => name || '-',
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
    
    // 打印接收到的数据，方便调试
    console.log('Editing appointment:', record);
    
    const formValues = {
      // 客户信息
      'customer.name': record.customer.name,
      'customer.phone': record.customer.phone,
      'customer.email': record.customer.email,
      
      // 车辆信息 - 直接使用内嵌的车辆信息
      'vehicle.brand': record.vehicle.brand,
      'vehicle.model': record.vehicle.model,
      'vehicle.licensePlate': record.vehicle.licensePlate,
      
      // 服务信息
      'service.type': record.service.type,
      'service.name': record.service.name,
      'service.description': record.service.description,
      'service.duration': record.service.duration,
      'service.basePrice': record.service.basePrice,
      
      // 时间信息
      'timeSlot.technician': record.timeSlot?.technician,
      date: dayjs(record.timeSlot.date),
      startTime: dayjs(record.timeSlot.startTime, 'HH:mm'),
      endTime: dayjs(record.timeSlot.endTime, 'HH:mm'),
      
      // 其他信息
      status: record.status,
      notes: record.notes
    };

    console.log('Form values:', formValues);
    form.setFieldsValue(formValues);
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
      setLoading(true);
      
      const formattedData = {
        customer: {
          name: values['customer.name'],
          phone: values['customer.phone'],
          email: values['customer.email']
        },
        vehicle: {
          brand: values['vehicle.brand'],
          model: values['vehicle.model'],
          licensePlate: values['vehicle.licensePlate']
        },
        service: {
          type: values['service.type'],
          name: values['service.name'],
          description: values['service.description'],
          duration: values['service.duration'],
          basePrice: values['service.basePrice']
        },
        timeSlot: {
          date: values.date.format('YYYY-MM-DD'),
          startTime: values.startTime.format('HH:mm'),
          endTime: values.endTime.format('HH:mm'),
          technician: values['timeSlot.technician']
        },
        status: values.status,
        notes: values.notes
      };

      const response = await fetch(`/api/appointments/${editingAppointment?._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      message.success('更新成功');
      setModalVisible(false);
      form.resetFields();
      setEditingAppointment(null);
      fetchAppointments();
    } catch (error: any) {
      message.error(error.message || '更新失败');
    } finally {
      setLoading(false);
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
            name="customer.name"
            label="客户姓名"
            rules={[{ required: true, message: '请输入客户姓名' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="customer.phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="customer.email"
            label="电子邮箱"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="vehicle.brand"
            label="车辆品牌"
            rules={[{ required: true, message: '请输入车辆品牌' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="vehicle.model"
            label="车型"
            rules={[{ required: true, message: '请输入车型' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="vehicle.licensePlate"
            label="车牌号"
            rules={[{ required: true, message: '请输入车牌号' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="service.type"
            label="服务类型"
            rules={[{ required: true, message: '请选择服务类型' }]}
          >
            <Select placeholder="请选择服务类型">
              <Select.Option value="maintenance">常规保养</Select.Option>
              <Select.Option value="repair">维修</Select.Option>
              <Select.Option value="inspection">检查</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues?.service?.type !== currentValues?.service?.type
            }
          >
            {({ getFieldValue }) => {
              const type = getFieldValue(['service', 'type']);
              const services = serviceOptions.find(opt => opt.category === type)?.items || [];
              
              return type ? (
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
