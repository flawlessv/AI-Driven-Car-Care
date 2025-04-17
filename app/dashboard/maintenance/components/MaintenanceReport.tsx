/**
 * 保养报告组件
 * 用于展示完整的保养记录报告，包括车辆信息、保养详情、配件清单等
 * 支持打印功能
 */
import React from 'react';
import { Card, Descriptions, Table, Typography, Divider, Tag, Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import type { MaintenanceReport } from '../types';

const { Title, Text } = Typography;

// 保养状态的中文映射
const statusText = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

// 保养类型的中文映射
const typeText = {
  regular: '常规保养',
  repair: '维修',
  inspection: '检查',
};

/**
 * 保养报告组件属性接口
 * @param report - 保养报告数据
 * @param onPrint - 可选的打印回调函数
 */
interface MaintenanceReportProps {
  report: any;
  onPrint?: () => void;
}

export default function MaintenanceReport({ report, onPrint }: MaintenanceReportProps) {
  // 数据加载时的处理
  if (!report || !report.data) {
    return <div>加载中...</div>;
  }

  const reportData = report.data;

  // 解构报告数据，提供默认值防止渲染错误
  const {
    reportId = '',
    generatedAt = '',
    generatedBy = '',
    maintenance = {
      status: 'pending',
      type: '',
      description: '',
      startDate: '',
      completionDate: '',
      mileage: 0,
      cost: 0,
      technician: '',
      notes: ''
    },
    vehicle = {
      brand: '',
      model: '',
      licensePlate: '',
      vin: '',
      year: ''
    },
    summary = {
      totalParts: 0,
      totalPartsPrice: 0,
      laborCost: 0,
      totalCost: 0
    },
    metadata = {
      createdBy: '',
      createdAt: new Date().toISOString(),
      updatedBy: '',
      updatedAt: new Date().toISOString()
    },
    statusHistory = [],
    parts = []
  } = reportData;

  /**
   * 处理打印功能
   * 如果提供了onPrint回调则使用它，否则使用浏览器默认打印
   */
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  // 配件表格列定义
  const partsColumns = [
    {
      title: '配件名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '配件编号',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '制造商',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* 报告标题和打印按钮 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Title level={2}>维修保养报告</Title>
          <Text type="secondary">报告编号: {reportId}</Text>
        </div>
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
        >
          打印报告
        </Button>
      </div>

      {/* 基本信息卡片 */}
      <Card title="基本信息" className="mb-6">
        <Descriptions column={2}>
          <Descriptions.Item label="生成时间">
            {new Date(generatedAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="生成人">
            {generatedBy}
          </Descriptions.Item>
          <Descriptions.Item label="维修类型">
            {maintenance.type}
          </Descriptions.Item>
          <Descriptions.Item label="维修状态">
            <Tag color={maintenance.status === 'completed' ? 'green' : 'blue'}>
              {statusText[maintenance.status as keyof typeof statusText] || '未知状态'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="开始日期">
            {maintenance.startDate ? new Date(maintenance.startDate).toLocaleDateString() : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="完成日期">
            {maintenance.completionDate ? new Date(maintenance.completionDate).toLocaleDateString() : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 车辆信息卡片 */}
      <Card title="车辆信息" className="mb-6">
        <Descriptions column={2}>
          <Descriptions.Item label="品牌型号">
            {vehicle.brand} {vehicle.model}
          </Descriptions.Item>
          <Descriptions.Item label="车牌号">
            {vehicle.licensePlate}
          </Descriptions.Item>
          <Descriptions.Item label="车架号">
            {vehicle.vin}
          </Descriptions.Item>
          <Descriptions.Item label="年份">
            {vehicle.year}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 维修详情卡片 */}
      <Card title="维修详情" className="mb-6">
        <Descriptions column={2}>
          <Descriptions.Item label="维修里程">
            {maintenance.mileage} km
          </Descriptions.Item>
          <Descriptions.Item label="维修技师">
            {maintenance.technician}
          </Descriptions.Item>
        </Descriptions>
        <Divider orientation="left">维修描述</Divider>
        <Text>{maintenance.description}</Text>
        {maintenance.notes && (
          <>
            <Divider orientation="left">备注</Divider>
            <Text>{maintenance.notes}</Text>
          </>
        )}
      </Card>

      {/* 配件清单卡片 */}
      <Card title="配件清单" className="mb-6">
        <Table
          columns={partsColumns}
          dataSource={parts}
          pagination={false}
          rowKey="code"
        />
      </Card>

      {/* 费用汇总卡片 */}
      <Card title="费用汇总" className="mb-6">
        <Descriptions column={2}>
          <Descriptions.Item label="配件总数">
            {summary.totalParts} 个
          </Descriptions.Item>
          <Descriptions.Item label="配件总价">
            ¥{summary.totalPartsPrice.toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="工时费">
            ¥{summary.laborCost.toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="总费用">
            <Text strong>¥{summary.totalCost.toFixed(2)}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 状态变更历史记录卡片 */}
      <Card title="状态记录" className="mb-6">
        <Table
          dataSource={statusHistory}
          pagination={false}
          rowKey="timestamp"
          columns={[
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              render: (status: keyof typeof statusText) => (
                <Tag color={status === 'completed' ? 'green' : 'blue'}>
                  {statusText[status]}
                </Tag>
              ),
            },
            {
              title: '时间',
              dataIndex: 'timestamp',
              key: 'timestamp',
              render: (timestamp: string) => new Date(timestamp).toLocaleString(),
            },
            {
              title: '操作人',
              dataIndex: 'updatedBy',
              key: 'updatedBy',
            },
            {
              title: '备注',
              dataIndex: 'note',
              key: 'note',
            },
          ]}
        />
      </Card>

      {/* 元数据卡片 */}
      <Card title="元数据">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="创建人">
            {metadata.createdBy}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(metadata.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="更新人">
            {metadata.updatedBy || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(metadata.updatedAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <style jsx global>{`
        @media print {
          .ant-card {
            border: none !important;
            margin-bottom: 20px !important;
          }
          .ant-card-head {
            border-bottom: 2px solid #000 !important;
          }
          .ant-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
} 