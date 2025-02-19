import { NextResponse } from 'next/server';
import type { Service } from '@/types/appointment';

// 模拟服务项目数据
const mockServices: Service[] = [
  {
    _id: 'service1',
    name: '常规保养',
    description: '包括机油更换、机滤更换、空滤检查等',
    category: 'regular',
    duration: 60,
    basePrice: 580,
  },
  {
    _id: 'service2',
    name: '轮胎更换',
    description: '更换轮胎，包括动平衡调整',
    category: 'repair',
    duration: 45,
    basePrice: 200,
  },
  {
    _id: 'service3',
    name: '刹车系统检修',
    description: '刹车片更换、刹车油检查等',
    category: 'repair',
    duration: 90,
    basePrice: 800,
  },
  {
    _id: 'service4',
    name: '年度检查',
    description: '全面检查车辆各系统状况',
    category: 'inspection',
    duration: 120,
    basePrice: 1200,
  },
  {
    _id: 'service5',
    name: '空调检修',
    description: '空调系统检查、冷媒加注等',
    category: 'repair',
    duration: 60,
    basePrice: 400,
  },
  {
    _id: 'service6',
    name: '变速箱油更换',
    description: '自动变速箱油更换及清洗',
    category: 'regular',
    duration: 90,
    basePrice: 880,
  },
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: mockServices,
    });
  } catch (error: any) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '获取服务项目列表失败',
      },
      { status: 500 }
    );
  }
} 