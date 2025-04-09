import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import Appointment from '@/app/models/appointment';  // 直接导入模型

// 使这个API不需要token验证
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('正在连接数据库...');
    let connection;
    try {
      connection = await connectDB();
      console.log('数据库连接成功:', connection ? '已连接' : '连接对象为空');
    } catch (dbError: any) {
      console.error('数据库连接失败:', {
        message: dbError.message,
        stack: dbError.stack
      });
      return NextResponse.json(
        { 
          success: false, 
          message: '数据库连接失败',
          error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    console.log('开始查询预约...');
    
    try {
      // 使用修改后的模型进行查询
      const upcomingAppointments = await Appointment.find({
        date: { $gte: new Date() }
      })
        .sort({ date: 1 })
        .limit(5)
        .populate('vehicle')
        .populate('service')
        .lean();  // 转换为普通JavaScript对象
      
      // 处理返回结果，确保数据格式正确
      const formattedAppointments = upcomingAppointments.map(appointment => {
        // 构建前端需要的数据结构
        return {
          _id: appointment._id,
          vehicleName: appointment.vehicle 
            ? `${appointment.vehicle.brand || ''} ${appointment.vehicle.model || ''}`
            : '未知车辆',
          licensePlate: appointment.vehicle?.licensePlate || '',
          service: appointment.service?.name || '未知服务',
          date: appointment.date 
            ? new Date(appointment.date).toLocaleDateString('zh-CN')
            : '未知日期',
          startTime: appointment.startTime || '',
          status: appointment.status || 'pending'
        };
      });

      console.log('处理后的查询结果:', formattedAppointments);
      
      return NextResponse.json({
        success: true,
        data: formattedAppointments
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (queryError: any) {
      console.error('查询失败:', {
        message: queryError.message,
        stack: queryError.stack,
        code: queryError.code
      });
      
      // 尝试获取模型信息以进行调试
      try {
        const modelInfo = {
          modelName: Appointment.modelName,
          collection: Appointment.collection.name,
          schema: Object.keys(Appointment.schema.paths)
        };
        console.log('Appointment模型信息:', modelInfo);
      } catch (modelError) {
        console.error('获取模型信息失败:', modelError);
      }
      
      throw queryError;
    }
  } catch (error: any) {
    console.error('获取即将到来的预约失败:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    return NextResponse.json(
      { 
        success: false, 
        message: '获取即将到来的预约失败',
        error: process.env.NODE_ENV === 'development' ? `${error.name}: ${error.message}` : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
} 