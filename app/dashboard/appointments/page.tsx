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
  processed: 'blue',
  completed: 'green',
  cancelled: 'red',
};

const statusText = {
  pending: '待处理',
  processed: '已处理',
  completed: '已完成',
  cancelled: '已取消',
};

// 添加服务项目预设选项
const serviceOptions = [
  {
    category: 'maintenance',
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

// 添加调试代码，将选项打印到控制台
console.log('可用的服务类型选项:', serviceOptions.map(opt => opt.category));

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
      console.log('开始获取预约列表...');
      
      // 使用fetch的完整选项，确保正确处理响应
      const response = await fetch('/api/appointments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // 包含cookie
      });
      
      console.log('API响应状态:', response.status);
      const result = await response.json();
      console.log('API响应:', result);
      
      if (!response.ok) {
        throw new Error(result.message || '获取预约列表失败');
      }

      // 确保我们获取到正确的数据
      const appointmentsData = Array.isArray(result.data) ? result.data : [];
      console.log('获取到预约数据:', appointmentsData.length, '条记录');
      
      if (appointmentsData.length > 0) {
        console.log('第一条预约示例:', JSON.stringify(appointmentsData[0], null, 2));
      }
      
      // 按创建日期降序排序，使最新创建的预约显示在最上方
      const sortedData = [...appointmentsData].sort((a, b) => {
        // 如果有createdAt字段，按创建日期降序排序
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // 作为备选，也可以按预约日期排序
        const aDate = a.date || a.timeSlot?.date;
        const bDate = b.date || b.timeSlot?.date;
        if (aDate && bDate) {
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        }
        return 0;
      });
      
      setData(sortedData);
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
      render: (timeSlot: any, record: any) => {
        // 支持扁平结构和嵌套结构
        const date = record.date || (timeSlot?.date ? timeSlot.date : null);
        const startTime = record.startTime || (timeSlot?.startTime || '');
        const endTime = record.endTime || (timeSlot?.endTime || '');
        
        if (!date) return '-';
        
        const formattedDate = typeof date === 'string' 
          ? date 
          : dayjs(date).format('YYYY-MM-DD');
          
        return `${formattedDate} ${startTime}-${endTime}`;
      },
    },
    {
      title: '技师',
      key: 'technicianName',
      render: (_, record: any) => {
        // 先尝试从已填充的对象中获取技师名称
        if (record.technician?.name) {
          return record.technician.name;
        }
        
        if (record.technician?.username) {
          return record.technician.username;
        }
        
        // 再尝试从timeSlot嵌套结构获取
        if (record.timeSlot?.technician?.name) {
          return record.timeSlot.technician.name;
        }
        
        if (record.timeSlot?.technician?.username) {
          return record.timeSlot.technician.username;
        }
        
        return '-';
      },
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
          {record.status === 'processed' && (
            <Button
              type="primary"
              onClick={() => handleConvertToWorkOrder(record)}
            >
              转为工单
            </Button>
          )}
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

  const handleEdit = (record: any) => {
    // 打印接收到的数据，方便调试
    console.log('编辑预约数据:', JSON.stringify(record, null, 2));
    
    setEditingAppointment(record);
    
    // 处理服务类型
    let serviceType = '';
    if (record.service?.category) {
      // 将中文服务类型转换为英文
      const category = record.service.category;
      if (category === '保养' || category.includes('保养')) {
        serviceType = 'maintenance';
      } else if (category === '维修' || category.includes('维修')) {
        serviceType = 'repair';
      } else if (category === '检查' || category.includes('检查')) {
        serviceType = 'inspection';
      } else {
        serviceType = record.service.category;
      }
    } else if (record.service?.type) {
      serviceType = record.service.type;
    }
    
    // 处理技师ID
    const technicianId = record.technician?._id || record.technician || record.timeSlot?.technician?._id || record.timeSlot?.technician;

    // 处理日期和时间 - 支持扁平结构和嵌套结构
    const dateValue = record.date || record.timeSlot?.date;
    const startTimeValue = record.startTime || record.timeSlot?.startTime;
    const endTimeValue = record.endTime || record.timeSlot?.endTime;
    
    // 确保timeSlot和其中的属性存在，支持两种数据结构
    const formValues = {
      // 客户信息
      'customer.name': record.customer?.name || '',
      'customer.phone': record.customer?.phone || '',
      'customer.email': record.customer?.email || '',
      
      // 车辆信息 - 添加空值检查
      'vehicle.brand': record.vehicle?.brand || '',
      'vehicle.model': record.vehicle?.model || '',
      'vehicle.licensePlate': record.vehicle?.licensePlate || '',
      
      // 服务信息 - 添加空值检查和类型转换
      'service.type': serviceType,
      'service.name': record.service?.name || '',
      'service.description': record.service?.description || '',
      'service.duration': record.service?.duration || 60,
      'service.basePrice': record.service?.basePrice || 0,
      
      // 时间信息 - 支持扁平结构和嵌套结构
      'timeSlot.technician': technicianId || '',
      date: dateValue ? dayjs(dateValue) : null,
      startTime: startTimeValue ? dayjs(startTimeValue, 'HH:mm') : null,
      endTime: endTimeValue ? dayjs(endTimeValue, 'HH:mm') : null,
      
      // 其他信息
      status: record.status || 'pending',
      notes: record.notes || ''
    };

    console.log('设置表单值:', formValues);
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
    console.log(values,'values');
    
    try {
      setLoading(true);
      
      // 确保所有必填字段都已填写
      if (!values['service.type'] || !values['service.name'] || 
          !values['service.duration'] || !values['service.basePrice']) {
        message.error('请完善服务信息');
        setLoading(false);
        return;
      }
      
      if (!values['timeSlot.technician']) {
        message.error('请选择技师');
        setLoading(false);
        return;
      }
      
      // 验证日期和时间
      if (!values.date) {
        message.error('请选择预约日期');
        setLoading(false);
        return;
      }
      
      if (!values.startTime) {
        message.error('请选择开始时间');
        setLoading(false);
        return;
      }
      
      if (!values.endTime) {
        message.error('请选择结束时间');
        setLoading(false);
        return;
      }
      
      // 打印关键字段的值
      console.log('日期:', values.date);
      console.log('开始时间:', values.startTime);
      console.log('结束时间:', values.endTime);
      console.log('技师ID:', values['timeSlot.technician']);
      
      // 步骤1: 先获取或创建车辆ID
      let vehicleId;
      
      // 检查是否有匹配的车辆
      const vehicleData = {
        brand: values['vehicle.brand'],
        model: values['vehicle.model'],
        licensePlate: values['vehicle.licensePlate']
      };
      
      // 尝试根据车牌号查找现有车辆
      const vehicleResponse = await fetch(`/api/vehicles?licensePlate=${vehicleData.licensePlate}`);
      const vehicleResult = await vehicleResponse.json();
      
      if (vehicleResponse.ok && vehicleResult.data?.data?.length > 0) {
        // 使用现有车辆ID
        vehicleId = vehicleResult.data.data[0]._id;
      } else {
        // 创建新车辆
        const createVehicleResponse = await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vehicleData),
        });
        
        if (!createVehicleResponse.ok) {
          throw new Error('创建车辆失败');
        }
        
        const createVehicleResult = await createVehicleResponse.json();
        vehicleId = createVehicleResult.data._id;
      }
      
      // 步骤2: 使用获取到的车辆ID创建预约
      // 完全模仿API的数据格式
      // 准备serviceData
      const serviceData = {
        name: values['service.name'],
        category: values['service.type'],
        duration: Number(values['service.duration']),
        basePrice: Number(values['service.basePrice']),
        description: values['service.description'] || ''
      };
      
      // 创建API期望的精确格式
      const formattedData = {
        customer: {
          name: values['customer.name'],
          phone: values['customer.phone'],
          email: values['customer.email'] || ''
        },
        vehicle: vehicleId,
        service: serviceData,
        // 同时提供扁平结构和嵌套结构，确保两种格式的接口都能正常工作
        date: values.date.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
        technician: values['timeSlot.technician'],
        // 保留嵌套结构，确保兼容性
        timeSlot: {
          date: values.date.format('YYYY-MM-DD'),
          startTime: values.startTime.format('HH:mm'),
          endTime: values.endTime.format('HH:mm'),
          technician: values['timeSlot.technician']
        },
        status: values.status || 'pending',
        estimatedDuration: Number(values['service.duration']),
        estimatedCost: Number(values['service.basePrice']),
        notes: values.notes || ''
      };
      
      console.log('正在提交特殊格式数据:', JSON.stringify(formattedData, null, 2));

      // 根据是否有编辑中的预约决定使用POST还是PUT
      const url = editingAppointment?._id 
        ? `/api/appointments/${editingAppointment._id}` 
        : `/api/appointments`;
      
      const method = editingAppointment?._id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      message.success(editingAppointment ? '更新成功' : '创建成功');
      setModalVisible(false);
      form.resetFields();
      setEditingAppointment(null);
      fetchAppointments();
    } catch (error: any) {
      message.error(error.message || (editingAppointment ? '更新失败' : '创建失败'));
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
    console.log('选择的服务数据:', serviceData);
    if (serviceData) {
      form.setFieldsValue({
        'service.duration': serviceData.duration,
        'service.basePrice': serviceData.basePrice,
      });
      
    }
  };

  // 添加转换为工单的处理函数
  const handleConvertToWorkOrder = async (record: Appointment) => {
    try {
      setLoading(true);
      
      console.log('正在转换预约为工单:', record._id);
      
      const response = await fetch('/api/work-orders/convert-from-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: record._id,
        }),
      });
      
      const result = await response.json();
      console.log('转换结果:', result);
      
      if (!response.ok) {
        const errorMsg = result.message || '转换工单失败';
        console.error('转换失败:', errorMsg);
        throw new Error(errorMsg);
      }
      
      message.success('已成功转换为工单');
      fetchAppointments(); // 刷新列表
    } catch (error: any) {
      console.error('转换工单失败:', error);
      message.error(`转换工单失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
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
              prevValues?.['service.type'] !== currentValues?.['service.type']
            }
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('service.type');
              console.log('服务类型:', type);
              const services = serviceOptions.find(opt => opt.category === type)?.items || [];
              console.log('找到的服务项目:', services);
              return type && services.length > 0 ? (
                <Form.Item
                  name="service.name"
                  label="服务项目"
                  rules={[{ required: true, message: '请选择服务项目' }]}
                >
                  <Select
                    placeholder="请选择服务项目"
                    onChange={(value, option: any) => {
                      console.log('选择的值:', value);
                      console.log('选择的选项:', option);
                      handleServiceSelect(option.data);
                    }}
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
            name="service.description"
            label="服务描述"
          >
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="service.duration"
            label="预计时长(分钟)"
            rules={[{ required: true, message: '请输入预计时长' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>

          <Form.Item
            name="service.basePrice"
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
            name="timeSlot.technician"
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
                <Select.Option value="pending">待处理</Select.Option>
                <Select.Option value="processed">已处理</Select.Option>
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
