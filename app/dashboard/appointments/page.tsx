/**
 * 预约管理页面
 * 
 * 这个页面用于管理车辆保养和维修预约，提供预约的创建、编辑、删除和查看功能
 * 'use client' 标记表示这个组件在浏览器端运行，而不是在服务器端
 */
'use client';

// 导入React钩子，用于状态管理和副作用
import { useState, useEffect } from 'react';
// 导入Ant Design组件，用于构建用户界面
import {
  Table,        // 表格组件
  Button,       // 按钮组件
  Space,        // 间距容器
  Tag,          // 标签组件
  message,      // 消息提示
  Modal,        // 模态框
  Form,         // 表单
  Input,        // 输入框
  Select,       // 下拉选择框
  DatePicker,   // 日期选择器
  TimePicker,   // 时间选择器
  Card,         // 卡片容器
  InputNumber,  // 数字输入框
  Tooltip,      // 文字提示
  Row,          // 行布局
  Col,          // 列布局
} from 'antd';
// 导入表格列类型定义
import type { ColumnsType } from 'antd/es/table';
// 导入各种图标组件
import { EditOutlined, DeleteOutlined, PlusOutlined, SyncOutlined, CalendarOutlined, ClockCircleOutlined, CarOutlined, UserOutlined, ToolOutlined } from '@ant-design/icons';
// 导入日期处理库
import dayjs from 'dayjs';
// 导入预约类型定义
import type { Appointment } from '@/types/appointment';
// 导入Redux选择器，用于获取全局状态
import { useSelector } from 'react-redux';
// 导入根状态类型
import type { RootState } from '@/app/lib/store';

// 从Input组件中提取TextArea子组件
const { TextArea } = Input;

/**
 * 预约状态颜色映射
 * 不同状态对应不同的标签颜色
 */
const statusColors = {
  pending: 'orange',     // 待处理：橙色
  processed: 'blue',     // 已处理：蓝色
  completed: 'green',    // 已完成：绿色
  cancelled: 'red',      // 已取消：红色
};

/**
 * 预约状态文本映射
 * 将英文状态转换为用户友好的中文显示
 */
const statusText = {
  pending: '待处理',      // 待处理状态
  processed: '已处理',    // 已处理状态
  completed: '已完成',    // 已完成状态
  cancelled: '已取消',    // 已取消状态
};

/**
 * 服务项目预设选项
 * 按类别分组的预设服务列表，包含名称、时长和基础价格
 */
const serviceOptions = [
  {
    category: 'maintenance', // 保养类别
    items: [
      { name: '常规保养', duration: 60, basePrice: 300 },  // 1小时，300元
      { name: '机油更换', duration: 30, basePrice: 200 },  // 30分钟，200元
      { name: '轮胎更换', duration: 45, basePrice: 400 },  // 45分钟，400元
      { name: '刹车检查', duration: 30, basePrice: 150 },  // 30分钟，150元
    ],
  },
  {
    category: 'repair', // 维修类别
    items: [
      { name: '发动机维修', duration: 180, basePrice: 1500 },  // 3小时，1500元
      { name: '变速箱维修', duration: 240, basePrice: 2000 },  // 4小时，2000元
      { name: '空调维修', duration: 120, basePrice: 800 },     // 2小时，800元
      { name: '底盘维修', duration: 150, basePrice: 1000 },    // 2.5小时，1000元
    ],
  },
  {
    category: 'inspection', // 检查类别
    items: [
      { name: '年度检查', duration: 90, basePrice: 500 },     // 1.5小时，500元
      { name: '故障诊断', duration: 60, basePrice: 300 },     // 1小时，300元
      { name: '排放检测', duration: 45, basePrice: 250 },     // 45分钟，250元
      { name: '安全检查', duration: 60, basePrice: 300 },     // 1小时，300元
    ],
  },
];

// 开发调试代码，将服务类型选项打印到控制台
console.log('可用的服务类型选项:', serviceOptions.map(opt => opt.category));

/**
 * 预约管理页面组件
 * 展示预约列表并提供管理功能
 */
export default function AppointmentsPage() {
  // 状态管理：预约数据列表
  const [data, setData] = useState<Appointment[]>([]);
  // 状态管理：加载状态
  const [loading, setLoading] = useState(true);
  // 状态管理：模态框显示状态
  const [modalVisible, setModalVisible] = useState(false);
  // 状态管理：当前正在编辑的预约
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  // 状态管理：车辆列表
  const [vehicles, setVehicles] = useState<any[]>([]);
  // 状态管理：技师列表
  const [technicians, setTechnicians] = useState<any[]>([]);
  // 创建表单实例
  const [form] = Form.useForm();
  
  // 从Redux状态中获取当前用户信息
  const { user } = useSelector((state: RootState) => state.auth);
  // 判断当前用户是否为客户角色
  const isCustomer = user?.role === 'customer';

  /**
   * 使用useEffect钩子在组件挂载时获取数据
   */
  useEffect(() => {
    fetchAppointments(); // 获取预约列表
    fetchVehicles();     // 获取车辆列表
    fetchTechnicians();  // 获取技师列表
  }, []);

  /**
   * 获取预约列表的异步函数
   * 从服务器获取全部预约数据
   */
  const fetchAppointments = async () => {
    try {
      // 设置加载状态为true，显示加载动画
      setLoading(true);
      console.log('开始获取预约列表...');
      
      // 发送获取预约列表的请求，使用fetch的完整选项确保正确处理响应
      const response = await fetch('/api/appointments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // 包含cookie以确保认证状态
      });
      
      // 记录响应状态码
      console.log('API响应状态:', response.status);
      // 解析返回的JSON数据
      const result = await response.json();
      // 记录完整响应
      console.log('API响应:', result);
      
      // 如果响应不成功，抛出错误
      if (!response.ok) {
        throw new Error(result.message || '获取预约列表失败');
      }

      // 确保我们获取到正确格式的数据
      const appointmentsData = Array.isArray(result.data) ? result.data : [];
      console.log('获取到预约数据:', appointmentsData.length, '条记录');
      
      // 输出第一条预约记录作为示例，方便调试
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
      
      // 更新预约数据状态
      setData(sortedData);
    } catch (error: any) {
      // 记录错误信息到控制台
      console.error('获取预约列表失败:', error);
      // 向用户显示错误提示
      message.error(error.message || '获取预约列表失败');
      // 出错时设置为空数组
      setData([]);
    } finally {
      // 无论成功还是失败，都设置加载状态为false，隐藏加载动画
      setLoading(false);
    }
  };

  /**
   * 获取车辆列表的异步函数
   * 从服务器获取所有车辆数据，用于预约创建和编辑
   */
  const fetchVehicles = async () => {
    try {
      // 发送获取车辆列表的请求
      const response = await fetch('/api/vehicles');
      // 解析返回的JSON数据
      const result = await response.json();
      
      // 如果响应不成功，抛出错误
      if (!response.ok) {
        throw new Error(result.message || '获取车辆列表失败');
      }

      // 更新车辆列表状态
      setVehicles(result.data?.data || []);
    } catch (error: any) {
      // 记录错误信息到控制台
      console.error('获取车辆列表失败:', error);
      // 向用户显示错误提示
      message.error(error.message || '获取车辆列表失败');
    }
  };

  /**
   * 获取技师列表的异步函数
   * 从服务器获取所有技师数据，用于预约分配
   */
  const fetchTechnicians = async () => {
    try {
      // 发送获取技师列表的请求，过滤出技师角色的用户
      const response = await fetch('/api/users?role=technician');
      // 解析返回的JSON数据
      const result = await response.json();
      
      // 如果响应不成功，抛出错误
      if (!response.ok) {
        throw new Error(result.message || '获取技师列表失败');
      }

      // 确保只获取在职的技师（状态为active的技师）
      const activeTechnicians = (result.data || []).filter((tech: any) => tech.status === 'active');
      // 更新技师列表状态
      setTechnicians(activeTechnicians);
    } catch (error: any) {
      // 记录错误信息到控制台
      console.error('获取技师列表失败:', error);
      // 向用户显示错误提示
      message.error(error.message || '获取技师列表失败');
    }
  };

  /**
   * 预约状态标签渲染函数
   * 根据不同状态使用不同的样式渲染状态标签
   * 
   * @param {string} status - 预约状态值
   * @returns {JSX.Element} 状态标签元素
   */
  const renderStatusTag = (status: string) => {
    // 根据状态值确定CSS类名
    const statusClass = `status-badge status-badge-${status === 'processed' ? 'in-progress' : status === 'completed' ? 'completed' : status === 'cancelled' ? 'cancelled' : 'pending'}`;
    
    // 返回带有相应类名的状态标签
    return (
      <span className={statusClass}>
        {statusText[status as keyof typeof statusText] || status}
      </span>
    );
  };

  /**
   * 表格列配置
   * 定义了预约列表中每一列的标题、数据源和渲染方式
   */
  const columns: ColumnsType<Appointment> = [
    {
      title: '预约编号',  // 列标题
      dataIndex: '_id',  // 数据字段名
      key: '_id',        // 唯一键
      width: 100,        // 列宽度
      // 自定义渲染函数，只显示ID的后8位，更简洁美观
      render: (id: string) => <span className="font-medium">{id.slice(-8)}</span>,
    },
    {
      title: '客户信息',  // 列标题
      dataIndex: 'customer',  // 数据字段名
      key: 'customer',        // 唯一键
      width: 180,             // 列宽度
      // 自定义渲染函数，显示客户姓名和电话
      render: (customer: any) => (
        <div>
          <div className="font-medium flex items-center">
            <UserOutlined className="mr-1 text-blue-500" /> {/* 用户图标 */}
            {customer?.name} {/* 客户姓名 */}
          </div>
          <div className="text-gray-500 text-sm">{customer?.phone}</div> {/* 客户电话 */}
        </div>
      ),
    },
    {
      title: '车辆信息',  // 列标题
      dataIndex: 'vehicle',  // 数据字段名
      key: 'vehicle',        // 唯一键
      width: 200,            // 列宽度
      // 自定义渲染函数，显示车辆品牌、型号和车牌号
      render: (vehicle: any) => 
        vehicle ? (
          <div className="flex items-center">
            <CarOutlined className="mr-1 text-green-500" /> {/* 汽车图标 */}
            <span>
              {vehicle.brand} {vehicle.model} {/* 车辆品牌和型号 */}
              <span className="text-gray-600">({vehicle.licensePlate})</span> {/* 车牌号 */}
            </span>
          </div>
        ) : '-', // 如果没有车辆信息，显示短横线
    },
    {
      title: '服务项目',  // 列标题
      dataIndex: ['service', 'name'],  // 嵌套数据字段路径
      key: 'serviceName',              // 唯一键
      ellipsis: true,                  // 文本过长时显示省略号
      width: 150,                      // 列宽度
      // 自定义渲染函数，显示服务项目名称，带工具图标
      render: (name: string, record: any) => (
        <div className="flex items-center">
          <ToolOutlined className="mr-1 text-purple-500" /> {/* 工具图标 */}
          <Tooltip title={name}> {/* 鼠标悬停时显示完整名称 */}
            <span>{record.service?.name || name}</span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: '预约时间',  // 列标题
      dataIndex: 'timeSlot',  // 数据字段名
      key: 'appointmentTime',  // 唯一键
      width: 180,              // 列宽度
      // 自定义渲染函数，显示预约日期和时间段
      render: (timeSlot: any, record: any) => {
        // 支持扁平结构和嵌套结构的数据格式
        const date = record.date || (timeSlot?.date ? timeSlot.date : null);
        const startTime = record.startTime || (timeSlot?.startTime || '');
        const endTime = record.endTime || (timeSlot?.endTime || '');
        
        // 如果没有日期，显示短横线
        if (!date) return '-';
        
        // 确保日期是有效的，格式化为中文日期格式
        let formattedDate = '-';
        try {
          formattedDate = typeof date === 'string' 
            ? dayjs(date).format('YYYY年MM月DD日') 
            : dayjs(date).format('YYYY年MM月DD日');
        } catch (error) {
          // 记录日期格式化错误
          console.error('日期格式化错误:', error);
        }
          
        // 返回格式化的日期和时间段
        return (
          <span>
            <div className="flex items-center">
              <CalendarOutlined className="mr-1 text-blue-500" /> {/* 日历图标 */}
              {formattedDate}
            </div>
            <div className="text-gray-500 flex items-center">
              <ClockCircleOutlined className="mr-1" /> {/* 时钟图标 */}
              {startTime} - {endTime || '未指定'}
            </div>
          </span>
        );
      },
    },
    {
      title: '技师',  // 列标题
      key: 'technicianName',  // 唯一键
      dataIndex: 'technician', // 添加dataIndex字段
      width: 120,             // 列宽度
      // 自定义渲染函数，显示负责的技师信息
      render: (technician: any) => {
        console.log(technician,'technician');
        // 如果已分配技师，显示技师姓名和头像，否则显示"未分配"
        return technician?.username ? (
          <div className="flex items-center">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-500 mr-1">
              {technician.username.charAt(0)} {/* 显示技师姓名首字母作为头像 */}
            </span>
            {technician.username}
          </div>
        ) : '未分配';
      },
    },
    {
      title: '状态',  // 列标题
      dataIndex: 'status',  // 数据字段名
      key: 'status',        // 唯一键
      width: 100,           // 列宽度
      render: renderStatusTag,  // 使用上面定义的状态标签渲染函数
    },
    {
      title: '操作',  // 列标题
      key: 'action',  // 唯一键
      width: 200,     // 列宽度
      fixed: 'right', // 固定在右侧
      // 自定义渲染函数，显示操作按钮
      render: (_, record) => (
        <Space size="small" direction="vertical" style={{ width: '100%' }}>
          {/* 编辑按钮 */}
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="text-blue-500 hover:text-blue-600"
            // 客户角色且非自己创建的预约不能编辑
            disabled={isCustomer && (record.user !== user?._id)}
          >
            编辑
          </Button>
          
          {/* 将预约转换为工单的按钮，仅管理员和技师可见 */}
          {!isCustomer && record.status !== 'cancelled' && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleConvertToWorkOrder(record)}
              className="text-green-500 hover:text-green-600"
              disabled={record.status === 'completed'}
            >
              转为工单
            </Button>
          )}
          
          {/* 删除按钮 */}
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            className="text-red-500 hover:text-red-600"
            // 客户角色且非自己创建的预约不能删除
            disabled={isCustomer && (record.user !== user?._id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  /**
   * 处理编辑预约按钮点击事件
   * 打开编辑模态框并填充当前预约数据
   * 
   * @param {any} record - 要编辑的预约记录
   */
  const handleEdit = (record: any) => {
    console.log('编辑预约:', record);
    
    // 设置正在编辑的预约
    setEditingAppointment(record);
    
    // 准备预约日期和时间数据
    const appointmentDate = record.date || (record.timeSlot?.date ? record.timeSlot.date : null);
    const startTime = record.startTime ? dayjs(`2022-01-01 ${record.startTime}`) : (record.timeSlot?.startTime ? dayjs(`2022-01-01 ${record.timeSlot.startTime}`) : null);
    const endTime = record.endTime ? dayjs(`2022-01-01 ${record.endTime}`) : (record.timeSlot?.endTime ? dayjs(`2022-01-01 ${record.timeSlot.endTime}`) : null);
    
    // 创建表单初始值对象
    const initialValues = {
      // 客户信息
      'customer.name': record.customer?.name || '',
      'customer.phone': record.customer?.phone || '',
      'customer.email': record.customer?.email || '',
      
      // 车辆信息
      vehicleId: record.vehicle?._id || '',
      
      // 服务信息
      serviceType: record.service?.category || 'maintenance',
      serviceId: record.service?.name || '',
      estimatedDuration: record.estimatedDuration || 60,
      estimatedCost: record.estimatedCost || 0,
      description: record.notes || '',
      
      // 预约时间信息
      date: appointmentDate ? dayjs(appointmentDate) : null,
      time: [startTime, endTime],
      
      // 技师信息
      technicianId: record.technician?._id || '',
      
      // 状态信息
      status: record.status || 'pending',
    };
    
    // 在控制台记录表单初始值，用于调试
    console.log('表单初始值:', initialValues);
    
    // 重置并设置表单字段值
    form.resetFields();
    form.setFieldsValue(initialValues);
    
    // 显示编辑模态框
    setModalVisible(true);
  };

  /**
   * 处理删除预约按钮点击事件
   * 显示确认对话框并执行删除操作
   * 
   * @param {Appointment} record - 要删除的预约记录
   */
  const handleDelete = (record: Appointment) => {
    // 显示确认对话框
    Modal.confirm({
      title: '确认删除',
      content: `您确定要删除此预约吗？此操作不可撤销。`,
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 发送删除预约的请求
          const response = await fetch(`/api/appointments/${record._id}`, {
            method: 'DELETE',
          });
          
          const result = await response.json();
          
          // 如果响应不成功，抛出错误
          if (!response.ok) {
            throw new Error(result.message || '删除预约失败');
          }
          
          // 显示成功消息
          message.success('预约已成功删除');
          // 刷新预约列表
          fetchAppointments();
        } catch (error: any) {
          // 显示错误消息
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
            ownerPhone: values['customer.phone'],
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
                    label: t.username || t.name,
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
                    // 触发表单值变化，确保服务项目下拉菜单更新
                    form.validateFields(['serviceId']);
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
                  notFoundContent="请先选择服务类型"
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
