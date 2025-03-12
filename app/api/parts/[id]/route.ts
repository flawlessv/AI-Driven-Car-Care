import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import Part from '@/models/part';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
} from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {user} = await authMiddleware(request);
    if ('status' in user) return user;

    await connectDB();

    const part = await Part.findById(params.id);
    if (!part) {
      return notFoundResponse('配件不存在');
    }

    return successResponse(part);
  } catch (error: any) {
    console.error('获取配件详情失败:', error);
    return errorResponse(error.message || '获取配件详情失败');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {user} = await authMiddleware(request);
    if ('status' in user) return user;

    // 检查用户权限
    if (user.role !== 'admin' && user.role !== 'staff') {
      return errorResponse('没有权限更新配件', 403);
    }

    await connectDB();

    const part = await Part.findById(params.id);
    if (!part) {
      return notFoundResponse('配件不存在');
    }

    const data = await request.json();
    const {
      name,
      code,
      description,
      category,
      manufacturer,
      price,
      stock,
      minStock,
      unit,
      location,
    } = data;

    // 验证必填字段
    const requiredFields = ['name', 'code', 'price', 'stock'];
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      return validationErrorResponse(
        missingFields.reduce((acc, field) => ({
          ...acc,
          [field]: `${field}是必需的`,
        }), {})
      );
    }

    // 检查编号是否已被其他配件使用
    const existingPart = await Part.findOne({
      code,
      _id: { $ne: params.id },
    });
    if (existingPart) {
      return validationErrorResponse({
        code: '配件编号已存在',
      });
    }

    // 更新配件
    const updatedPart = await Part.findByIdAndUpdate(
      params.id,
      {
        name,
        code,
        description,
        category,
        manufacturer,
        price,
        stock,
        minStock,
        unit,
        location,
      },
      { new: true }
    );

    return successResponse(updatedPart);
  } catch (error: any) {
    console.error('更新配件失败:', error);
    return errorResponse(error.message || '更新配件失败');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {user} = await authMiddleware(request);
    if ('status' in user) return user;

    // 检查用户权限
    if (user.role !== 'admin' && user.role !== 'staff') {
      return errorResponse('没有权限删除配件', 403);
    }

    await connectDB();

    const part = await Part.findById(params.id);
    if (!part) {
      return notFoundResponse('配件不存在');
    }

    await Part.findByIdAndDelete(params.id);

    return successResponse({ message: '配件已删除' });
  } catch (error: any) {
    console.error('删除配件失败:', error);
    return errorResponse(error.message || '删除配件失败');
  }
} 