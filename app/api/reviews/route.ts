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

    // 获取总数
    const total = await Review.countDocuments(query);

    // 获取评价列表
    const reviews = await Review.find(query)
      .populate('author', 'name phone')
      .populate('maintenanceRecord', 'date type cost')
      .populate({
        path: 'target',
        select: 'name level',
        model: 'User'
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: {
        total,
        page,
        limit,
        items: reviews,
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

    const review = await Review.create(data);
    await review.populate('author', 'name phone');
    await review.populate('maintenanceRecord', 'date type cost');
    await review.populate({
      path: 'target',
      select: 'name level',
      model: 'User'
    });

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