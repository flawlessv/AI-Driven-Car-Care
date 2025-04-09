import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authMiddleware } from '@/app/lib/auth';
import Part from '@/app/models/part';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
} from '@/app/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse('未授权访问', 401);
    }

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
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse(authResult.message || '未授权访问', 401);
    }

    // 确保用户存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
    }

    // 检查用户权限
    if (authResult.user.role !== 'admin' && authResult.user.role !== 'technician') {
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
      status
    } = data;

    // 验证必填字段
    const requiredFields = ['name', 'code', 'price', 'stock'];
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      const errorObj: Record<string, string[]> = {};
      missingFields.forEach(field => {
        errorObj[field] = [`${field}是必需的`];
      });
      return validationErrorResponse(errorObj);
    }

    // 检查编号是否已被其他配件使用
    const existingPart = await Part.findOne({
      code,
      _id: { $ne: params.id },
    });
    if (existingPart) {
      return validationErrorResponse({
        code: ['配件编号已存在'],
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
        unit: unit || '个', // 确保有默认单位
        location,
        status: status || 'active', // 默认状态
      },
      { new: true }
    );

    if (!updatedPart) {
      return errorResponse('更新配件失败', 500);
    }

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
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse(authResult.message || '未授权访问', 401);
    }

    // 确保用户存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
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