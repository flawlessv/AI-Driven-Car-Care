'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Table,
  Button,
  Space,
  Modal,
  message,
  Tag,
  Select,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Card,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HistoryOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import type { MaintenanceRecord, MaintenanceFormData, MaintenanceReport } from './types';
import type { RootState } from '@/lib/store';
import type { Vehicle } from '@/types/vehicle';
import type { Part } from '../parts/types';
import type { User } from '@/types/user';
import dayjs, { Dayjs } from 'dayjs';
import StatusHistoryTimeline from './components/StatusHistory';
import StatusUpdateModal from './components/StatusUpdateModal';
import MaintenanceReport from './components/MaintenanceReport';
import ExportButton from './components/ExportButton';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;

const statusColors = {
  pending: 'orange',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'red',
};

const statusText = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

const typeText = {
  regular: '常规保养',
  repair: '维修',
  inspection: '检查',
};

interface Filters {
  status?: string;
  type?: string;
  vehicle?: string;
  dateRange?: [Dayjs | null, Dayjs | null] | null;
}

export default function MaintenancePage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MaintenanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [filters, setFilters] = useState<Filters>({
    status: undefined,
    type: undefined,
    vehicle: undefined,
    dateRange: null,
  });
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportData, setReportData] = useState<MaintenanceReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();
  const [form] = Form.useForm();

  useEffect(() => {
    fetchVehicles();
    fetchParts();
    fetchTechnicians();
    fetchMaintenanceRecords();
  }, [page, pageSize, filters]);

  const fetchVehicles = async () => {
    try {
      console.log('Fetching vehicles...');
      const response = await fetch('/api/vehicles');
      const result = await response.json();
      console.log('Vehicles API response:', result);
      
      if (response.ok && result?.data?.data) {
        console.log('Setting vehicles:', result.data.data);
        setVehicles(result.data.data);
      } else {
        console.error('获取车辆列表失败:', result.message);
        setVehicles([]);
      }
    } catch (error) {
      console.error('获取车辆列表失败:', error);
      message.error('获取车辆列表失败');
      setVehicles([]);
    }
  };

  const fetchParts = async () => {
    try {
      console.log('Fetching parts...');
      const response = await fetch('/api/parts');
      const result = await response.json();
      console.log('Parts API response:', result);
      
      if (response.ok && result?.data?.data) {
        console.log('Setting parts:', result.data.data);
        setParts(result.data.data);
      } else {
        console.error('获取配件列表失败:', result.message);
        setParts([]);
      }
    } catch (error) {
      console.error('获取配件列表失败:', error);
      message.error('获取配件列表失败');
      setParts([]);
    }
  };

  const fetchTechnicians = async () => {
    try {
      console.log('Fetching technicians...');
      const response = await fetch('/api/users?role=technician');
      const result = await response.json();
      console.log('Technicians API response:', result);
      
      if (response.ok && result?.data) {
        console.log('Setting technicians:', result.data);
        setTechnicians(result.data);
      } else {
        console.error('获取技师列表失败:', result.message);
        setTechnicians([]);
      }
    } catch (error) {
      console.error('获取技师列表失败:', error);
      message.error('获取技师列表失败');
      setTechnicians([]);
    }
  };

  const fetchMaintenanceRecords = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (filters.status) queryParams.append('status', filters.status);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.vehicle) queryParams.append('vehicle', filters.vehicle);
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        queryParams.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
        queryParams.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
      }

      console.log('Fetching maintenance records with params:', queryParams.toString());
      const response = await fetch(`/api/maintenance?${queryParams}`);
      const result = await response.json();
      
      console.log('Maintenance API Response:', result);

      if (response.ok && result?.data) {
        // 处理嵌套的data结构
        const records = result.data.data || result.data;
        const totalCount = result.data.total || result.total || 0;
        
        console.log('Setting maintenance records:', records);
        console.log('Total count:', totalCount);
        
        setData(Array.isArray(records) ? records : []);
        setTotal(totalCount);
      } else {
        console.error('获取维修记录失败:', result.message);
        setData([]);
        setTotal(0);
        message.error(result.message || '获取维修记录失败');
      }
    } catch (error) {
      console.error('获取维修记录失败:', error);
      setData([]);
      setTotal(0);
      message.error('获取维修记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    console.log('Current vehicles state:', vehicles);
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      vehicle: record.vehicle._id,
      startDate: dayjs(record.startDate),
      completionDate: record.completionDate ? dayjs(record.completionDate) : undefined,
      technician: record.technician?._id,
      parts: record.parts.map(part => ({
        part: part.part._id,
        quantity: part.quantity,
        unitPrice: part.unitPrice,
      })),
    });
    setModalVisible(true);
  };

  const handleDelete = async (record: MaintenanceRecord) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条维修记录吗？',
      onOk: async () => {
        try {
          const response = await fetch(`/api/maintenance/${record._id}`, {
            method: 'DELETE',
          });
          const result = await response.json();
          if (response.ok) {
            message.success('删除成功');
            fetchMaintenanceRecords();
          } else {
            message.error(result.message || '删除失败');
          }
        } catch (error) {
          console.error('删除维修记录失败:', error);
          message.error('删除维修记录失败');
        }
      },
    });
  };

  const handleSubmit = async (values: MaintenanceFormData) => {
    try {
      const url = editingRecord
        ? `/api/maintenance/${editingRecord._id}`
        : '/api/maintenance';
      const method = editingRecord ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      if (response.ok) {
        message.success(editingRecord ? '更新成功' : '创建成功');
        setModalVisible(false);
        fetchMaintenanceRecords();
      } else {
        message.error(result.message || (editingRecord ? '更新失败' : '创建失败'));
      }
    } catch (error) {
      console.error(editingRecord ? '更新维修记录失败:' : '创建维修记录失败:', error);
      message.error(editingRecord ? '更新维修记录失败' : '创建维修记录失败');
    }
  };

  const handleStatusUpdate = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setStatusModalVisible(true);
  };

  const handleViewHistory = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setHistoryModalVisible(true);
  };

  const handleStatusUpdateSuccess = () => {
    setStatusModalVisible(false);
    setSelectedRecord(null);
    fetchMaintenanceRecords();
  };

  const handleViewReport = async (record: MaintenanceRecord) => {
    try {
      setLoadingReport(true);
      const response = await fetch(`/api/maintenance/${record._id}/report`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取报告失败');
      }

      setReportData(result.data);
      setReportModalVisible(true);
    } catch (error: any) {
      console.error('获取维修报告失败:', error);
      message.error(error.message);
    } finally {
      setLoadingReport(false);
    }
  };

  const columns: ColumnsType<MaintenanceRecord> = [
    {
      title: '车辆信息',
      dataIndex: ['vehicle'],
      key: 'vehicle',
      render: (vehicle: any) => 
        `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
    },
    {
      title: '保养类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: { [key: string]: string } = {
          regular: '常规保养',
          repair: '维修',
          inspection: '年检',
        };
        return typeMap[type] || type;
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
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '完成日期',
      dataIndex: 'completionDate',
      key: 'completionDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '技师',
      dataIndex: ['technician', 'name'],
      key: 'technician',
    },
    {
      title: '费用',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => `¥${cost.toLocaleString()}`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/dashboard/maintenance/${record._id}`)}
          >
            查看
          </Button>
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
      <Card className="mb-6">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Select
                placeholder="保养类型"
                style={{ width: 120 }}
                allowClear
                onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <Select.Option value="regular">常规保养</Select.Option>
                <Select.Option value="repair">维修</Select.Option>
                <Select.Option value="inspection">年检</Select.Option>
              </Select>
              <Select
                placeholder="状态"
                style={{ width: 120 }}
                allowClear
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <Select.Option value="pending">待处理</Select.Option>
                <Select.Option value="in_progress">进行中</Select.Option>
                <Select.Option value="completed">已完成</Select.Option>
                <Select.Option value="cancelled">已取消</Select.Option>
              </Select>
              <RangePicker
                onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <ExportButton type="records" data={data} loading={loading} />
              <Button type="primary" onClick={handleAdd}>
                新增记录
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="_id"
        loading={loading}
      />

      <Modal
        title={editingRecord ? '编辑维修记录' : '添加维修记录'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'pending',
            type: 'regular',
            parts: [{ part: undefined, quantity: 1, unitPrice: 0 }],
          }}
        >
          <Form.Item
            name="vehicle"
            label="车辆"
            rules={[{ required: true, message: '请选择车辆' }]}
          >
            <Select placeholder="请选择车辆">
              {Array.isArray(vehicles) && vehicles.map(vehicle => (
                <Select.Option key={vehicle._id} value={vehicle._id}>
                  {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label="维修类型"
            rules={[{ required: true, message: '请选择维修类型' }]}
          >
            <Select placeholder="请选择维修类型">
              {Object.entries(typeText).map(([key, text]) => (
                <Select.Option key={key} value={key}>
                  {text}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入维修描述" />
          </Form.Item>

          <Form.Item
            name="mileage"
            label="里程数"
            rules={[{ required: true, message: '请输入里程数' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="请输入里程数"
              addonAfter="km"
            />
          </Form.Item>

          <Form.Item
            name="cost"
            label="费用"
            rules={[{ required: true, message: '请输入费用' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              placeholder="请输入费用"
              addonBefore="¥"
            />
          </Form.Item>

          <Form.Item
            name="startDate"
            label="开始日期"
            rules={[{ required: true, message: '请选择开始日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="completionDate" label="完成日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              {Object.entries(statusText).map(([key, text]) => (
                <Select.Option key={key} value={key}>
                  {text}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="technician"
            label="技师"
            rules={[{ required: true, message: '请选择技师' }]}
          >
            <Select placeholder="请选择技师">
              {Array.isArray(technicians) && technicians.map(tech => (
                <Select.Option key={tech._id} value={tech._id}>
                  {tech.name} ({tech.username})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.List name="parts">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Space key={field.key} align="baseline">
                    <Form.Item
                      {...field}
                      label={index === 0 ? '配件' : ''}
                      name={[field.name, 'part']}
                      rules={[{ required: true, message: '请选择配件' }]}
                    >
                      <Select style={{ width: 200 }} placeholder="选择配件">
                        {Array.isArray(parts) && parts.map(part => (
                          <Select.Option key={part._id} value={part._id}>
                            {part.name} - {part.code}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'quantity']}
                      rules={[{ required: true, message: '请输入数量' }]}
                    >
                      <InputNumber min={1} placeholder="数量" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'unitPrice']}
                      rules={[{ required: true, message: '请输入单价' }]}
                    >
                      <InputNumber
                        min={0}
                        precision={2}
                        placeholder="单价"
                        addonBefore="¥"
                      />
                    </Form.Item>
                    <Button onClick={() => remove(field.name)} type="link" danger>
                      删除
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>
                    添加配件
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={4} placeholder="请输入备注" />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <StatusUpdateModal
        open={statusModalVisible}
        currentStatus={selectedRecord?.status || 'pending'}
        maintenanceId={selectedRecord?._id || ''}
        onSuccess={handleStatusUpdateSuccess}
        onCancel={() => {
          setStatusModalVisible(false);
          setSelectedRecord(null);
        }}
      />

      <Modal
        title="状态历史"
        open={historyModalVisible}
        onCancel={() => {
          setHistoryModalVisible(false);
          setSelectedRecord(null);
        }}
        footer={null}
        width={600}
      >
        {selectedRecord && (
          <StatusHistoryTimeline history={selectedRecord.statusHistory} />
        )}
      </Modal>

      <Modal
        title="维修报告"
        open={reportModalVisible}
        onCancel={() => {
          setReportModalVisible(false);
          setReportData(null);
        }}
        width={1000}
        footer={null}
      >
        {reportData && (
          <MaintenanceReport report={reportData} />
        )}
      </Modal>
    </div>
  );
} 