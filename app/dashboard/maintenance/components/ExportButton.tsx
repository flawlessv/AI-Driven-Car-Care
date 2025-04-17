'use client';

/**
 * 导出按钮组件
 * 用于导出保养记录或保养报告为文件
 * 支持导出单个报告或多条记录
 */
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { exportMaintenanceRecords, exportMaintenanceReport } from '@/app/lib/export-utils';
import type { MaintenanceRecord } from '../types';

/**
 * 导出按钮组件属性接口
 * @param type - 导出类型，'records'表示导出多条记录，'report'表示导出单个报告
 * @param data - 要导出的数据，可以是单个记录或记录数组
 * @param loading - 是否显示加载状态
 */
interface ExportButtonProps {
  type: 'records' | 'report';
  data: MaintenanceRecord | MaintenanceRecord[];
  loading?: boolean;
}

export default function ExportButton({ type, data, loading = false }: ExportButtonProps) {
  /**
   * 处理导出操作
   * 根据类型调用不同的导出工具函数，并显示相应的成功或失败消息
   */
  const handleExport = async () => {
    try {
      if (type === 'records') {
        // 导出多条保养记录
        if (!Array.isArray(data)) {
          throw new Error('Data must be an array for records export');
        }
        await exportMaintenanceRecords(data);
        message.success('保养记录导出成功');
      } else {
        // 导出单个保养报告
        if (Array.isArray(data)) {
          throw new Error('Data must be a single record for report export');
        }
        await exportMaintenanceReport(data);
        message.success('保养报告导出成功');
      }
    } catch (error) {
      // 导出失败时记录错误并提示用户
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