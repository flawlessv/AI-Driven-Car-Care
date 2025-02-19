'use client';

import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { exportMaintenanceRecords, exportMaintenanceReport } from '@/lib/export-utils';
import type { MaintenanceRecord } from '@/types/maintenance';

interface ExportButtonProps {
  type: 'records' | 'report';
  data: MaintenanceRecord | MaintenanceRecord[];
  loading?: boolean;
}

export default function ExportButton({ type, data, loading = false }: ExportButtonProps) {
  const handleExport = async () => {
    try {
      if (type === 'records') {
        if (!Array.isArray(data)) {
          throw new Error('Data must be an array for records export');
        }
        await exportMaintenanceRecords(data);
        message.success('保养记录导出成功');
      } else {
        if (Array.isArray(data)) {
          throw new Error('Data must be a single record for report export');
        }
        await exportMaintenanceReport(data);
        message.success('保养报告导出成功');
      }
    } catch (error) {
      console.error('Export error:', error);
      message.error('导出失败，请重试');
    }
  };

  return (
    <Button
      type="primary"
      icon={<DownloadOutlined />}
      onClick={handleExport}
      loading={loading}
    >
      {type === 'records' ? '导出记录' : '导出报告'}
    </Button>
  );
} 