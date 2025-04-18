import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { getUserModel } from '@/app/lib/db/models';

/**
 * 获取技师列表的函数
 * 
 * 这个函数用来获取系统中所有技师的信息。
 * 就像4S店的员工目录，可以查看所有维修技师的基本信息和技能水平。
 */
export async function GET() {
  try {
    // 连接到数据库
    await connectDB();
    console.log('数据库连接成功');

    // 获取用户数据模型
    const User = getUserModel();
    
    // 从数据库获取所有角色为"技师"的用户
    const technicians = await User.find({ role: 'technician' })
      // 只选择需要的字段，不返回敏感信息
      .select('name email phone level specialties certifications workExperience status stats')
      .select('name email phone level specialties certifications workingYears status stats')
      // 按创建时间倒序排列，最新添加的技师排在前面
      .sort({ createdAt: -1 });
    
    // 记录获取到的技师数量
    console.log('获取到技师数据:', technicians.length, '条记录');
    
    // 返回技师列表
    return NextResponse.json({
      success: true,
      data: technicians
    });
  } catch (error: any) {
    // 如果出现错误，记录错误并返回错误响应
    console.error('获取技师列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '获取技师列表失败'
      },
      { status: 500 }
    );
  }
}

/**
 * 创建新技师的函数
 * 
 * 这个函数用来在系统中添加新的技师记录。
 * 就像4S店招聘了新的维修技师，需要在系统中登记他的信息。
 */
export async function POST(request: Request) {
  try {
    // 连接到数据库
    await connectDB();
    
    // 获取提交的技师数据
    const data = await request.json();
    console.log('创建技师，接收到的数据:', data);

    // 获取用户数据模型
    const User = getUserModel();
    
    // 创建新技师记录
    const technician = await User.create({
      ...data,  // 包含所有提交的数据
      role: 'technician',  // 设置角色为技师
      stats: {
        totalOrders: 0,      // 总工单数，初始为0
        completedOrders: 0,  // 已完成工单数，初始为0
        completionRate: 0,   // 完成率，初始为0
        averageRating: 0     // 平均评分，初始为0
      }
    });
    
    // 记录技师创建成功
    console.log('技师创建成功:', technician);

    // 返回创建成功的技师信息
    return NextResponse.json({
      success: true,
      message: '技师添加成功',
      data: technician
    });
  } catch (error: any) {
    // 如果出现错误，记录错误并返回错误响应
    console.error('创建技师失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '添加技师失败'
      },
      { status: 500 }
    );
  }
} 
