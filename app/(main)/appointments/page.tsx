'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Steps,
  Form,
  Select,
  DatePicker,
  Button,
  List,
  Space,
  Typography,
  Tag,
  message,
  Alert,
  Result,
} from 'antd';
import {
  CarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { Vehicle } from '@/types/vehicle';
import type {
  MaintenanceService,
  TimeSlot,
  AppointmentRecommendation,
} from '@/types/appointment';

const { Title, Text } = Typography;

export default function AppointmentPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<MaintenanceService[]>([]);
  const [recommendations, setRecommendations] = useState<AppointmentRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  useEffect(() => {
    fetchVehicles();
    fetchServices();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取车辆列表失败');
      }

      // 处理嵌套的数据结构
      const { data: responseData } = result;
      setVehicles(Array.isArray(responseData.data) ? responseData.data : []);
    } catch (error: any) {
      message.error(error.message || '获取车辆列表失败');
      setVehicles([]); // 发生错误时设置空数组
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/maintenance-services');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取服务列表失败');
      }

      const { data: responseData } = result;
      setServices(Array.isArray(responseData) ? responseData : []);
    } catch (error: any) {
      message.error(error.message || '获取服务列表失败');
      setServices([]); // 发生错误时设置空数组
    }
  };

  const handleServiceSelect = async (values: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/appointments/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: values.service,
          preferredDate: values.date?.toISOString(),
          preferredTime: values.time,
        }),
      });
      
      if (!response.ok) {
        throw new Error('获取推荐时间失败');
      }

      const result = await response.json();
      setRecommendations(Array.isArray(result.data) ? result.data : []);
      setCurrentStep(1);
    } catch (error: any) {
      message.error(error.message || '获取推荐时间失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSelect = (recommendation: AppointmentRecommendation) => {
    setSelectedSlot(recommendation.timeSlot);
    setCurrentStep(2);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          timeSlot: selectedSlot,
        }),
      });

      if (!response.ok) {
        throw new Error('预约失败');
      }

      message.success('预约成功');
      setCurrentStep(3);
    } catch (error: any) {
      message.error(error.message || '预约失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const renderServiceSelection = () => (
    <Form form={form} onFinish={handleServiceSelect} layout="vertical" className="bg-white p-6 rounded-lg shadow">
      <Form.Item
        name="vehicle"
        label="选择车辆"
        rules={[{ required: true, message: '请选择车辆' }]}
      >
        <Select placeholder="请选择车辆" className="w-full">
          {vehicles.map(vehicle => (
            <Select.Option key={vehicle._id} value={vehicle._id}>
              {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="service"
        label="选择服务"
        rules={[{ required: true, message: '请选择服务' }]}
      >
        <Select placeholder="请选择服务" className="w-full">
          {services.map(service => (
            <Select.Option key={service._id} value={service._id}>
              {service.name} - ¥{service.basePrice}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="date" label="期望日期">
        <DatePicker className="w-full" />
      </Form.Item>

      <Form.Item name="time" label="期望时间">
        <Select placeholder="请选择时间" className="w-full">
          <Select.Option value="morning">上午</Select.Option>
          <Select.Option value="afternoon">下午</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} className="w-full">
          查看推荐时间
        </Button>
      </Form.Item>
    </Form>
  );

  const renderTimeSelection = () => (
    <List
      loading={loading}
      dataSource={recommendations}
      className="bg-white p-6 rounded-lg shadow"
      renderItem={recommendation => (
        <List.Item
          actions={[
            <Button
              key="select"
              type="primary"
              onClick={() => handleTimeSelect(recommendation)}
            >
              选择此时间
            </Button>,
          ]}
        >
          <List.Item.Meta
            avatar={<ClockCircleOutlined className="text-2xl text-blue-500" />}
            title={
              <Space>
                <Text strong>
                  {new Date(recommendation.timeSlot.date).toLocaleDateString()}{' '}
                  {recommendation.timeSlot.startTime}-{recommendation.timeSlot.endTime}
                </Text>
                <Tag color="blue">推荐度 {recommendation.score}%</Tag>
              </Space>
            }
            description={
              <Space direction="vertical">
                <Space>
                  <UserOutlined className="text-gray-500" />
                  推荐技师：{recommendation.technician.name}
                </Space>
                <div className="text-gray-500">
                  推荐原因：
                  {recommendation.reasons.map((reason, index) => (
                    <div key={index} className="ml-4">• {reason}</div>
                  ))}
                </div>
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );

  const renderConfirmation = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <Alert
        message="请确认预约信息"
        description="预约成功后，我们会通过短信和邮件通知您"
        type="info"
        showIcon
        className="mb-6"
      />
      <Card className="mb-6">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Text type="secondary">预约时间</Text>
            <br />
            <Text strong>
              {new Date(selectedSlot!.date).toLocaleDateString()}{' '}
              {selectedSlot!.startTime}-{selectedSlot!.endTime}
            </Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">服务项目</Text>
            <br />
            <Text strong>
              {services.find(s => s._id === form.getFieldValue('service'))?.name}
            </Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">车辆信息</Text>
            <br />
            <Text strong>
              {vehicles.find(v => v._id === form.getFieldValue('vehicle'))?.licensePlate}
            </Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">预计费用</Text>
            <br />
            <Text strong className="text-red-500">
              ¥{services.find(s => s._id === form.getFieldValue('service'))?.basePrice}
            </Text>
          </Col>
        </Row>
      </Card>
      <Button type="primary" onClick={handleSubmit} loading={loading} className="w-full">
        确认预约
      </Button>
    </div>
  );

  const renderSuccess = () => (
    <Result
      status="success"
      title="预约成功！"
      subTitle="我们会通过短信和邮件通知您预约详情"
      className="bg-white p-6 rounded-lg shadow"
      extra={[
        <Button type="primary" key="appointments" href="/appointments/list">
          查看我的预约
        </Button>,
        <Button key="home" href="/">
          返回首页
        </Button>,
      ]}
    />
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card className="mb-6">
        <Steps
          current={currentStep}
          items={[
            {
              title: '选择服务',
              icon: <CarOutlined />,
            },
            {
              title: '选择时间',
              icon: <ClockCircleOutlined />,
            },
            {
              title: '确认信息',
              icon: <UserOutlined />,
            },
            {
              title: '预约成功',
              icon: <CheckCircleOutlined />,
            },
          ]}
        />
      </Card>

      <div>
        {currentStep === 0 && renderServiceSelection()}
        {currentStep === 1 && renderTimeSelection()}
        {currentStep === 2 && renderConfirmation()}
        {currentStep === 3 && renderSuccess()}
      </div>
    </div>
  );
} 
