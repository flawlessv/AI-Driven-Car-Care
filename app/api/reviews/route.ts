import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import Review from '../../../models/review';
import WorkOrder from '../../../models/workOrder';
import User from '../../../models/user';
import { authMiddleware } from '@/lib/auth';
import { errorResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse('未授权访问', 401);
    }
    
    // 确保用户存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
    }
    
    const user = authResult.user;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const targetType = searchParams.get('targetType');
    const rating = searchParams.get('rating');
    const status = searchParams.get('status');

    await connectDB();

    // 构建查询条件
    const query: any = {};
    if (targetType) query.targetType = targetType;
    if (rating) query.rating = parseInt(rating);
    if (status) query.status = status;
    
    // 客户角色只能查看自己的评价
    if (user.role === 'customer') {
      console.log('客户查询评价，只显示自己的：', user._id);
      query.author = user._id;
    }

    console.log('评价查询条件:', query);
    console.log('分页参数: page=', page, 'limit=', limit);

    // 获取总数
    const total = await Review.countDocuments(query);
    console.log('评价总数:', total);

    // 获取评价列表
    const reviews = await Review.find(query)
      .populate('author', 'username email phone')
      .populate('targetId', 'username name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    console.log('找到评价数量:', reviews.length);
    
    // 获取关联的工单信息
    const formattedReviews = await Promise.all(reviews.map(async review => {
      const reviewObj = review.toObject();
      
      // 确保author是对象
      if (!reviewObj.author || typeof reviewObj.author !== 'object') {
        reviewObj.author = {
          _id: reviewObj.author || '',
          username: reviewObj.authorName || ('用户' + review._id.toString().substring(review._id.toString().length - 4))
        };
      }
      
      // 确保targetId是对象
      if (!reviewObj.targetId || typeof reviewObj.targetId !== 'object') {
        reviewObj.targetId = {
          _id: reviewObj.targetId || '',
          name: reviewObj.targetType === 'technician' ? '技师' : '门店'
        };
      }
      
      // 获取关联工单信息
      if (reviewObj.workOrder) {
        try {
          const workOrder = await WorkOrder.findById(reviewObj.workOrder).lean();
          if (workOrder) {
            reviewObj.workOrderNumber = workOrder.orderNumber;
          }
        } catch (err) {
          console.error('获取工单信息失败:', err);
        }
      }
      
      return reviewObj;
    }));

    return NextResponse.json({
      success: true,
      data: {
        total,
        page,
        limit,
        items: formattedReviews,
      },
    });
  } catch (error: any) {
    console.error('获取评价列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '获取评价列表失败',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await connectDB();

    console.log('创建评价数据:', data);
    
    // 确保保存评价人信息
    if (data.author && !data.authorName) {
      try {
        const user = await User.findById(data.author).lean();
        if (user) {
          data.authorName = user.username || user.name;
        }
      } catch (err) {
        console.error('获取用户信息失败:', err);
      }
    }
    
    // 如果有关联的工单，获取工单信息
    if (data.workOrder) {
      try {
        const workOrder = await WorkOrder.findById(data.workOrder).lean();
        if (workOrder) {
          // 保存工单编号
          data.workOrderNumber = workOrder.orderNumber;
          
          // 如果没有指定maintenanceRecord，使用工单ID
          if (!data.maintenanceRecord) {
            data.maintenanceRecord = data.workOrder;
          }
        }
      } catch (err) {
        console.error('获取工单信息失败:', err);
      }
    }
    
    const review = await Review.create(data);
    console.log('评价创建成功:', review._id);

    return NextResponse.json({
      success: true,
      message: '评价创建成功',
      data: review,
    });
  } catch (error: any) {
    console.error('创建评价失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '创建评价失败',
      },
      { status: 500 }
    );
  }
} 