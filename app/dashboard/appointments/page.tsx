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
  Tooltip,
  Row,
  Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, PlusOutlined, SyncOutlined, CalendarOutlined, ClockCircleOutlined, CarOutlined, UserOutlined, ToolOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Appointment } from '@/types/appointment';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/lib/store';

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
  
  // 获取当前用户信息和角色
  const { user } = useSelector((state: RootState) => state.auth);
  const isCustomer = user?.role === 'customer';

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

  // 预约状态标签渲染函数
  const renderStatusTag = (status: string) => {
    const statusClass = `status-badge status-badge-${status === 'processed' ? 'in-progress' : status === 'completed' ? 'completed' : status === 'cancelled' ? 'cancelled' : 'pending'}`;
    
    return (
      <span className={statusClass}>
        {statusText[status as keyof typeof statusText] || status}
      </span>
    );
  };

  const columns: ColumnsType<Appointment> = [
    {
      title: '预约编号',
      dataIndex: '_id',
      key: '_id',
      width: 100,
      render: (id: string) => <span className="font-medium">{id.slice(-8)}</span>,
    },
    {
      title: '客户信息',
      dataIndex: 'customer',
      key: 'customer',
      width: 180,
      render: (customer: any) => (
        <div>
          <div className="font-medium flex items-center"><UserOutlined className="mr-1 text-blue-500" /> {customer?.name}</div>
          <div className="text-gray-500 text-sm">{customer?.phone}</div>
        </div>
      ),
    },
    {
      title: '车辆信息',
      dataIndex: 'vehicle',
      key: 'vehicle',
      width: 200,
      render: (vehicle: any) => 
        vehicle ? (
          <div className="flex items-center">
            <CarOutlined className="mr-1 text-green-500" />
            <span>{vehicle.brand} {vehicle.model} <span className="text-gray-600">({vehicle.licensePlate})</span></span>
          </div>
        ) : '-',
    },
    {
      title: '服务项目',
      dataIndex: ['service', 'name'],
      key: 'serviceName',
      ellipsis: true,
      width: 150,
      render: (name: string, record: any) => (
        <div className="flex items-center">
          <ToolOutlined className="mr-1 text-purple-500" />
          <Tooltip title={name}>
            <span>{name}</span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: '预约时间',
      dataIndex: 'timeSlot',
      key: 'appointmentTime',
      width: 180,
      render: (timeSlot: any, record: any) => {
        // 支持扁平结构和嵌套结构
        const date = record.date || (timeSlot?.date ? timeSlot.date : null);
        const startTime = record.startTime || (timeSlot?.startTime || '');
        const endTime = record.endTime || (timeSlot?.endTime || '');
        
        if (!date) return '-';
        
        // 确保日期是有效的
        let formattedDate = '-';
        try {
          formattedDate = typeof date === 'string' 
            ? dayjs(date).format('YYYY年MM月DD日') 
            : dayjs(date).format('YYYY年MM月DD日');
        } catch (error) {
          console.error('日期格式化错误:', error);
        }
          
        return (
          <span>
            <div className="flex items-center"><CalendarOutlined className="mr-1 text-blue-500" /> {formattedDate}</div>
            <div className="text-gray-500 flex items-center"><ClockCircleOutlined className="mr-1" /> {startTime} - {endTime || '未指定'}</div>
          </span>
        );
      },
    },
    {
      title: '技师',
      key: 'technicianName',
      width: 120,
      render: (_, record: any) => {
        const technician = record.technician || {};
        return technician?.name ? (
          <div className="flex items-center">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-500 mr-1">
              {technician.name.charAt(0)}
            </span>
            {technician.name}
          </div>
        ) : '未分配';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatusTag,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" direction="vertical" style={{ width: '100%' }}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="text-blue-500 hover:text-blue-600"
            style={{ padding: '0 4px', width: '100%', textAlign: 'left' }}
          >
            编辑
          </Button>
          {record.status !== 'completed' && record.status !== 'cancelled' && (
            <Button
              type="text"
              className="text-green-500 hover:text-green-600"
              onClick={() => handleConvertToWorkOrder(record)}
              style={{ padding: '0 4px', width: '100%', textAlign: 'left' }}
            >
              转工单
            </Button>
          )}
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            style={{ padding: '0 4px', width: '100%', textAlign: 'left' }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (record: any) => {
    console.log(record,'record');
    
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
    
    // 设置表单值，字段名称必须与表单中的字段名称完全一致
    const formValues = {
      vehicleId: record.vehicle?._id || '',
      technicianId: technicianId || '',
      serviceType: serviceType,
      serviceId: record.service?.name || '',
      date: dateValue ? dayjs(dateValue) : null,
      time: [
        startTimeValue ? dayjs(startTimeValue, 'HH:mm') : null,
        endTimeValue ? dayjs(endTimeValue, 'HH:mm') : null
      ],
      description: record.notes || '',
      status: record.status || 'pending'
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
      if (!values.serviceType || !values.serviceId) {
        message.error('请完善服务信息');
        setLoading(false);
        return;
      }
      
      if (!values.technicianId) {
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
      
      if (!values.time || !values.time[0]) {
        message.error('请选择开始时间');
        setLoading(false);
        return;
      }
      
      // 打印关键字段的值
      console.log('日期:', values.date);
      console.log('时间范围:', values.time);
      console.log('技师ID:', values.technicianId);
      
      // 步骤1: 获取车辆信息
      let vehicleId = values.vehicleId;
      const selectedVehicle = vehicles.find(v => v._id === values.vehicleId);
      console.log({values,vehicles,selectedVehicle},'selectedVehicle');
      
      const vehicleData = selectedVehicle ? {
        brand: selectedVehicle.brand,
        model: selectedVehicle.model,
        licensePlate: selectedVehicle.licensePlate
      } : {
        brand: '',
        model: '',
        licensePlate: ''
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
          body: JSON.stringify({
            ...vehicleData,
            ownerName: values['customer.name'],
            ownerContact: values['customer.phone'],
            status: 'active',
            year: new Date().getFullYear(),
            vin: `TEMP${Date.now()}`, // 临时VIN，可以后续更新
            mileage: 0
          }),
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
      const selectedService = serviceOptions
        .flatMap(opt => opt.items)
        .find(item => item.name === values.serviceId);
      
      const serviceData = {
        name: values.serviceId,
        category: values.serviceType,
        duration: selectedService?.duration || 60,
        basePrice: selectedService?.basePrice || 0,
        description: values.description || ''
      };
      
      // 创建API期望的精确格式
      const formattedData = {
        customer: editingAppointment ? {
          name: editingAppointment.customer?.name || '',
          phone: editingAppointment.customer?.phone || '',
          email: editingAppointment.customer?.email || ''
        } : {
          name: values['customer.name'] || '',
          phone: values['customer.phone'] || '',
          email: values['customer.email'] || ''
        },
        vehicle: selectedVehicle?._id,
        service: serviceData,
        // 同时提供扁平结构和嵌套结构，确保两种格式的接口都能正常工作
        date: values.date.format('YYYY-MM-DD'),
        startTime: values.time[0].format('HH:mm'),
        endTime: values.time[1] ? values.time[1].format('HH:mm') : null,
        technician: values.technicianId,
        // 保留嵌套结构，确保兼容性
        timeSlot: {
          date: values.date.format('YYYY-MM-DD'),
          startTime: values.time[0].format('HH:mm'),
          endTime: values.time[1] ? values.time[1].format('HH:mm') : null,
          technician: values.technicianId
        },
        status: values.status || 'pending',
        estimatedDuration: serviceData.duration,
        estimatedCost: serviceData.basePrice,
        notes: values.description || ''
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
  const handleServiceSelect = (serviceName: string) => {
    const selectedService = serviceOptions
      .flatMap(opt => opt.items)
      .find(item => item.name === serviceName);
    
    if (selectedService) {
      console.log('选择的服务数据:', selectedService);
      form.setFieldsValue({
        duration: selectedService.duration,
        basePrice: selectedService.basePrice,
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
    <div className="page-transition">
      <div className="page-title">
        <h1>预约管理</h1>
        <div className="description">管理客户预约安排和服务日程</div>
      </div>
      
      <div className="mb-4 flex justify-between items-center">
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            className="admin-btn admin-btn-primary"
          >
            新增预约
          </Button>
          <Button 
            icon={<SyncOutlined />} 
            onClick={fetchAppointments}
            className="admin-btn"
          >
            刷新数据
          </Button>
        </Space>
      </div>
      
      <Card className="dashboard-card fade-in">
        <Table 
          columns={columns} 
          dataSource={data}
          rowKey="_id"
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
          }}
          scroll={{ x: 1300 }} 
          className="dashboard-table"
        />
      </Card>
      
      <Modal
        title={editingAppointment ? '编辑预约' : '新增预约'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        className="enhanced-modal appointment-modal"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="admin-form appointment-form mt-4"
          initialValues={{
            status: 'pending',
            serviceType: 'maintenance',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vehicleId"
                label="选择车辆"
                rules={[{ required: true, message: '请选择车辆' }]}
              >
                <Select
                  placeholder="选择车辆"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label as string).toLowerCase().includes(input.toLowerCase())
                  }
                  options={vehicles.map(v => ({
                    value: v._id,
                    label: `${v.licensePlate} (${v.brand} ${v.model})`,
                  }))}
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="technicianId"
                label="指定技师"
                rules={[{ required: true, message: '请选择技师' }]}
              >
                <Select
                  placeholder="选择技师"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label as string).toLowerCase().includes(input.toLowerCase())
                  }
                  options={technicians.map(t => ({
                    value: t._id,
                    label: t.name,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="serviceType"
                label="服务类型"
                rules={[{ required: true, message: '请选择服务类型' }]}
              >
                <Select
                  placeholder="选择服务类型"
                  options={[
                    { value: 'maintenance', label: '保养' },
                    { value: 'repair', label: '维修' },
                    { value: 'inspection', label: '检查' },
                  ]}
                  onChange={value => {
                    // 当服务类型改变时，重置服务项目
                    form.setFieldsValue({ serviceId: undefined });
                  }}
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="serviceId"
                label="服务项目"
                rules={[{ required: true, message: '请选择服务项目' }]}
              >
                <Select
                  placeholder="选择服务项目"
                  onChange={handleServiceSelect}
                  options={
                    serviceOptions
                      .find(opt => opt.category === form.getFieldValue('serviceType'))
                      ?.items.map(item => ({
                        value: item.name,
                        label: `${item.name} (¥${item.basePrice})`,
                      })) || []
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="预约日期"
                rules={[{ required: true, message: '请选择预约日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="time"
                label="预约时间"
                rules={[{ required: true, message: '请选择预约时间' }]}
              >
                <TimePicker.RangePicker
                  format="HH:mm"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="问题描述"
            rules={[{ required: true, message: '请输入问题描述' }]}
          >
            <TextArea rows={4} placeholder="请描述您的车辆问题或服务需求" />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="预约状态"
            rules={[{ required: true, message: '请选择预约状态' }]}
          >
            <Select
              placeholder="选择状态"
              options={[
                { value: 'pending', label: '待处理' },
                { value: 'processed', label: '已处理' },
                { value: 'completed', label: '已完成' },
                { value: 'cancelled', label: '已取消' },
              ]}
            />
          </Form.Item>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}
            >
              取消
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              className="admin-btn admin-btn-primary"
            >
              提交
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
