'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, message, Spin } from 'antd';
import type { MaintenanceStats, MaintenanceTimeGroupBy, MaintenanceType } from '../types';
import MaintenanceStatsView from '../components/MaintenanceStats';
import MaintenanceCharts from '../components/MaintenanceCharts';

export default function MaintenanceStatisticsPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [timeGroup, setTimeGroup] = useState<MaintenanceTimeGroupBy>('month');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [type, setType] = useState<MaintenanceType | undefined>();
  const [vehicle, setVehicle] = useState<string | undefined>();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      queryParams.append('groupBy', timeGroup);
      if (dateRange[0]) queryParams.append('startDate', dateRange[0].toISOString());
      if (dateRange[1]) queryParams.append('endDate', dateRange[1].toISOString());
      if (type) queryParams.append('type', type);
      if (vehicle) queryParams.append('vehicle', vehicle);

      const response = await fetch(`/api/maintenance/statistics?${queryParams}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取统计数据失败');
      }

      setStats(result.data);
    } catch (error: any) {
      console.error('获取维修统计失败:', error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeGroup, dateRange, type, vehicle]);

  const handleExport = async () => {
    try {
      // 构建导出数据
      if (!stats) return;

      const workbook = {
        SheetNames: ['基础统计', '类型统计', '车辆统计', '时间统计'],
        Sheets: {
          '基础统计': {
            '!ref': 'A1:B5',
            A1: { v: '指标' }, B1: { v: '数值' },
            A2: { v: '总维修次数' }, B2: { v: stats.basic.totalCount },
            A3: { v: '总维修费用' }, B3: { v: stats.basic.totalCost },
            A4: { v: '平均维修费用' }, B4: { v: stats.basic.avgCost },
            A5: { v: '平均配件数量' }, B5: { v: stats.summary.avgPartsPerMaintenance },
          },
          '类型统计': {
            '!ref': `A1:D${stats.byType.length + 1}`,
            A1: { v: '维修类型' }, B1: { v: '维修次数' }, C1: { v: '总费用' }, D1: { v: '平均费用' },
            ...stats.byType.reduce((acc, item, index) => ({
              ...acc,
              [`A${index + 2}`]: { v: item._id },
              [`B${index + 2}`]: { v: item.count },
              [`C${index + 2}`]: { v: item.totalCost },
              [`D${index + 2}`]: { v: item.avgCost },
            }), {}),
          },
          '车辆统计': {
            '!ref': `A1:D${stats.byVehicle.length + 1}`,
            A1: { v: '车辆' }, B1: { v: '维修次数' }, C1: { v: '总费用' }, D1: { v: '平均费用' },
            ...stats.byVehicle.reduce((acc, item, index) => ({
              ...acc,
              [`A${index + 2}`]: { v: `${item.vehicle.brand} ${item.vehicle.model}` },
              [`B${index + 2}`]: { v: item.count },
              [`C${index + 2}`]: { v: item.totalCost },
              [`D${index + 2}`]: { v: item.avgCost },
            }), {}),
          },
          '时间统计': {
            '!ref': `A1:E${stats.byTime.length + 1}`,
            A1: { v: '时间' }, B1: { v: '维修次数' }, C1: { v: '总费用' },
            D1: { v: '配件费用' }, E1: { v: '工时费用' },
            ...stats.byTime.reduce((acc, item, index) => ({
              ...acc,
              [`A${index + 2}`]: { v: item._id },
              [`B${index + 2}`]: { v: item.count },
              [`C${index + 2}`]: { v: item.totalCost },
              [`D${index + 2}`]: { v: item.partsCost },
              [`E${index + 2}`]: { v: item.laborCost },
            }), {}),
          },
        },
      };

      // 导出Excel文件
      const XLSX = await import('xlsx');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `维修统计_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success('导出成功');
    } catch (error: any) {
      console.error('导出统计数据失败:', error);
      message.error('导出失败');
    }
  };

  const items = [
    {
      key: 'table',
      label: '数据视图',
      children: stats ? (
        <MaintenanceStatsView
          stats={stats}
          loading={loading}
          onTimeGroupChange={setTimeGroup}
          onDateRangeChange={setDateRange}
          onTypeChange={setType}
          onVehicleChange={setVehicle}
          onExport={handleExport}
        />
      ) : null,
    },
    {
      key: 'chart',
      label: '图表视图',
      children: stats ? (
        <MaintenanceCharts stats={stats} />
      ) : null,
    },
  ];

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Tabs
        items={items}
        defaultActiveKey="table"
        destroyInactiveTabPane
      />
    </div>
  );
} 