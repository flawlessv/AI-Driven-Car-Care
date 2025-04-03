import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import Review from '../../../models/review';

export async function GET(request: Request) {
  try {
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

    console.log('评价查询条件:', query);
    console.log('分页参数: page=', page, 'limit=', limit);

    // 获取总数
    const total = await Review.countDocuments(query);
    console.log('评价总数:', total);

    // 获取评价列表
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    console.log('找到评价数量:', reviews.length);
    
    // 格式化评价数据，处理可能的引用问题
    const formattedReviews = reviews.map(review => {
      const reviewObj = review.toObject();
      
      // 确保author是对象
      if (reviewObj.author && typeof reviewObj.author === 'object') {
        if (!reviewObj.author.name && review._id) {
          reviewObj.author = {
            name: '用户' + review._id.toString().substr(-4),
            phone: '未提供'
          };
        }
      } else if (reviewObj.author) {
        // 如果author是ID，创建一个临时的author对象
        reviewObj.author = {
          name: '用户' + reviewObj.author.toString().substr(-4),
          phone: '未提供'
        };
      }
      
      // 确保targetId是对象
      if (reviewObj.targetId && typeof reviewObj.targetId !== 'object') {
        reviewObj.targetId = {
          _id: reviewObj.targetId,
          name: reviewObj.targetType === 'technician' ? '技师' : '门店'
        };
      }
      
      return reviewObj;
    });

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