/**
 * 保养统计图表组件
 * 用于展示保养数据的多种统计图表，包括费用趋势、类型分布、车辆对比等
 * 使用Ant Design Plots库实现可视化效果
 */
import React from 'react';
import { Card, Row, Col } from 'antd';
import {
  Line,
  Pie,
  Bar,
  BarConfig,
  LineConfig,
  PieConfig,
} from '@ant-design/plots';
import type {
  MaintenanceStats,
  MaintenanceTimeStats,
  MaintenanceTypeStats,
  MaintenanceVehicleStats,
} from '../types';

// 保养类型的中文显示映射
const typeText = {
  regular: '常规保养',
  repair: '维修',
  inspection: '检查',
};

/**
 * 保养图表组件属性接口
 * @param stats - 保养统计数据
 */
interface MaintenanceChartsProps {
  stats: MaintenanceStats;
}

export default function MaintenanceCharts({ stats }: MaintenanceChartsProps) {
  /**
   * 费用趋势折线图配置
   * 展示不同时间段的保养费用变化趋势
   */
  const costTrendConfig: LineConfig = {
    data: stats.byTime,
    xField: '_id',
    yField: 'totalCost',
    seriesField: 'type',
    meta: {
      totalCost: {
        alias: '费用',
        formatter: (v: number) => `¥${v.toFixed(2)}`,
      },
    },
    xAxis: {
      title: {
        text: '时间',
      },
    },
    yAxis: {
      title: {
        text: '费用',
      },
    },
    tooltip: {
      formatter: (datum: MaintenanceTimeStats) => {
        return {
          name: '费用',
          value: `¥${datum.totalCost.toFixed(2)}`,
        };
      },
    },
  };

  /**
   * 维修类型饼图配置
   * 展示不同类型保养的占比分布
   */
  const typeDistributionConfig: PieConfig = {
    data: stats.byType.map(item => ({
      type: typeText[item._id],
      value: item.count,
    })),
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      formatter: (datum: any) => `${datum.type}: ${datum.value}`,
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: datum.type,
          value: datum.value,
        };
      },
    },
  };

  /**
   * 车辆维修对比柱状图配置
   * 展示不同车辆的维修次数和费用对比
   */
  const vehicleComparisonConfig: BarConfig = {
    data: stats.byVehicle.map(item => ({
      vehicle: `${item.vehicle.brand} ${item.vehicle.model}`,
      count: item.count,
      cost: item.totalCost,
    })),
    xField: 'cost',
    yField: 'vehicle',
    seriesField: 'vehicle',
    meta: {
      cost: {
        alias: '总费用',
        formatter: (v: number) => `¥${v.toFixed(2)}`,
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        return [
          { name: '车辆', value: datum.vehicle },
          { name: '总费用', value: `¥${datum.cost.toFixed(2)}` },
        ];
      },
    },
  };

  /**
   * 费用构成堆叠图配置
   * 展示各时间段的费用构成（工时费用和配件费用）
   */
  const costCompositionConfig: BarConfig = {
    data: stats.byTime.map(item => [
      {
        time: item._id,
        type: '工时费用',
        value: item.laborCost,
      },
      {
        time: item._id,
        type: '配件费用',
        value: item.partsCost,
      },
    ]).flat(),
    xField: 'time',
    yField: 'value',
    seriesField: 'type',
    isStack: true,
    label: {
      position: 'middle',
      formatter: (datum: any) => `¥${datum.value.toFixed(2)}`,
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: datum.type,
          value: `¥${datum.value.toFixed(2)}`,
        };
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* 第一行图表：费用趋势和维修类型分布 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="维修费用趋势">
            <Line {...costTrendConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="维修类型分布">
            <Pie {...typeDistributionConfig} />
          </Card>
        </Col>
      </Row>

      {/* 第二行图表：车辆对比和费用构成 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="车辆维修费用对比">
            <Bar {...vehicleComparisonConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="费用构成分析">
            <Bar {...costCompositionConfig} />
          </Card>
        </Col>
      </Row>
    </div>
  );
} 