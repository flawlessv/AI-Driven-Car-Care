import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db-connect';
import Review from '@/models/review';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const review = await Review.findById(params.id)
      .populate('author', 'name phone')
      .populate('maintenanceRecord', 'date type cost')
      .populate({
        path: 'target',
        model: 'User'
      });

    if (!review) {
      return NextResponse.json(
        { success: false, message: '评价不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error: any) {
    console.error('获取评价详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '获取评价详情失败',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    await dbConnect();

    const review = await Review.findByIdAndUpdate(
      params.id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('author', 'name phone')
      .populate('maintenanceRecord', 'date type cost')
      .populate({
        path: 'target',
        model: data.targetType === 'technician' ? 'User' : 'Shop'
      });

    if (!review) {
      return NextResponse.json(
        { success: false, message: '评价不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '评价更新成功',
      data: review,
    });
  } catch (error: any) {
    console.error('更新评价失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '更新评价失败',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const review = await Review.findByIdAndDelete(params.id);

    if (!review) {
      return NextResponse.json(
        { success: false, message: '评价不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '评价删除成功',
    });
  } catch (error: any) {
    console.error('删除评价失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '删除评价失败',
      },
      { status: 500 }
    );
  }
} 