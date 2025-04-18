import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import Review from '@/app/models/review';
import WorkOrder from '@/app/models/workOrder';
import User from '@/app/models/user';
import { authMiddleware } from '@/app/lib/auth';
import { errorResponse } from '@/app/lib/api-response';

/**
 * 获取评价列表的函数
 * 
 * 这个函数用来获取系统中的评价信息。
 * 就像商城中的评价系统，可以查看客户对技师或服务的评价。
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份，确认是谁在查询评价信息
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      // 如果身份验证失败，返回未授权错误
      return errorResponse('未授权访问', 401);
    }
    
    // 确保用户信息存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
    }
    
    // 获取当前用户信息
    const user = authResult.user;
    
    // 获取查询参数，用于筛选评价
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');           // 页码，默认第1页
    const limit = parseInt(searchParams.get('limit') || '10');        // 每页数量，默认10条
    const targetType = searchParams.get('targetType');                // 评价对象类型（技师或门店）
    const rating = searchParams.get('rating');                        // 评分筛选
    const status = searchParams.get('status');                        // 状态筛选

    // 连接到数据库
    await connectDB();

    // 准备查询条件
    const query: any = {};
    if (targetType) query.targetType = targetType;                    // 按评价对象类型筛选
    if (rating) query.rating = parseInt(rating);                      // 按评分筛选
    if (status) query.status = status;                                // 按状态筛选
    
    // 记录查询条件，方便调试
    console.log('评价查询条件:', query);
    console.log('分页参数: page=', page, 'limit=', limit);

    // 获取评价总数
    const total = await Review.countDocuments(query);
    console.log('评价总数:', total);

    // 获取评价列表
    const reviews = await Review.find(query)
      .populate('author', 'username email phone')                     // 填充评价作者信息
      .populate('targetId', 'username name')                          // 填充评价对象信息
      .sort({ createdAt: -1 })                                        // 按创建时间倒序排序，最新评价在前
      .skip((page - 1) * limit)                                       // 分页：跳过之前页的数据
      .limit(limit);                                                  // 分页：限制每页数量

    console.log('找到评价数量:', reviews.length);
    
    // 处理评价数据，填充关联信息
    const formattedReviews = await Promise.all(reviews.map(async review => {
      const reviewObj = review.toObject();
      
      // 确保评价作者信息完整，避免显示错误
      if (!reviewObj.author || typeof reviewObj.author !== 'object') {
        // 如果作者信息缺失，使用备用信息
        reviewObj.author = {
          _id: reviewObj.author || '',
          username: reviewObj.authorName || ('用户' + review._id.toString().substring(review._id.toString().length - 4))
        };
      }
      
      // 确保评价对象信息完整，避免显示错误
      if (!reviewObj.targetId || typeof reviewObj.targetId !== 'object') {
        // 如果评价对象信息缺失，使用备用信息
        reviewObj.targetId = {
          _id: reviewObj.targetId || '',
          name: reviewObj.targetType === 'technician' ? '技师' : '门店'
        };
      }
      
      // 获取关联的工单信息
      if (reviewObj.workOrder) {
        try {
          // 查询工单信息，以便显示工单编号
          const workOrder = await WorkOrder.findById(reviewObj.workOrder).lean();
          if (workOrder) {
            reviewObj.workOrderNumber = workOrder.orderNumber;
          }
        } catch (err) {
          // 如果查询工单出错，记录错误但继续处理
          console.error('获取工单信息失败:', err);
        }
      }
      
      return reviewObj;
    }));

    // 返回评价列表和分页信息
    return NextResponse.json({
      success: true,
      data: {
        total,                      // 评价总数
        page,                       // 当前页码
        limit,                      // 每页数量
        items: formattedReviews,    // 评价列表
      },
    });
  } catch (error: any) {
    // 如果出现错误，记录错误并返回错误响应
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

/**
 * 创建新评价的函数
 * 
 * 这个函数用来在系统中添加新的评价记录。
 * 就像在商城中购买商品后，提交对商品或服务的评价。
 */
export async function POST(request: Request) {
  try {
    // 获取提交的评价数据
    const data = await request.json();
    
    // 连接到数据库
    await connectDB();

    // 记录即将创建的评价数据
    console.log('创建评价数据:', data);
    
    // 填充评价作者姓名（如果有提供作者ID）
    if (data.author && !data.authorName) {
      try {
        // 根据作者ID查询用户信息
        const user = await User.findById(data.author).lean();
        if (user) {
          // 使用用户名或姓名作为评价作者名称
          data.authorName = user.username || user.name;
        }
      } catch (err) {
        // 如果查询用户出错，记录错误但继续处理
        console.error('获取用户信息失败:', err);
      }
    }
    
    // 如果评价关联了工单，获取工单相关信息
    if (data.workOrder) {
      try {
        // 查询工单信息
        const workOrder = await WorkOrder.findById(data.workOrder).lean();
        if (workOrder) {
          // 保存工单编号，方便展示
          data.workOrderNumber = workOrder.orderNumber;
          
          // 如果没有指定维修记录ID，使用工单ID
          if (!data.maintenanceRecord) {
            data.maintenanceRecord = data.workOrder;
          }
        }
      } catch (err) {
        // 如果查询工单出错，记录错误但继续处理
        console.error('获取工单信息失败:', err);
      }
    }
    
    // 创建新的评价记录
    const review = await Review.create(data);
    console.log('评价创建成功:', review._id);

    // 返回创建成功的评价信息
    return NextResponse.json({
      success: true,
      message: '评价创建成功',
      data: review,
    });
  } catch (error: any) {
    // 如果出现错误，记录错误并返回错误响应
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