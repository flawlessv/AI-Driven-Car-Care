import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import Part from '@/models/part';
import {
  successResponse,
  createdResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse('未授权访问', 401);
    }
    const user = authResult.user;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const manufacturer = searchParams.get('manufacturer') || '';
    const lowStock = searchParams.get('lowStock') === 'true';
    const skip = (page - 1) * limit;

    // 构建查询条件
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) {
      query.category = category;
    }
    if (manufacturer) {
      query.manufacturer = manufacturer;
    }
    if (lowStock) {
      query.$expr = {
        $lte: ['$stock', '$minStock'],
      };
    }

    const [parts, total] = await Promise.all([
      Part.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Part.countDocuments(query),
    ]);

    // 获取所有分类和制造商（用于筛选）
    const [categories, manufacturers] = await Promise.all([
      Part.distinct('category'),
      Part.distinct('manufacturer'),
    ]);

    return successResponse({
      data: parts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: {
        categories: categories.filter(Boolean),
        manufacturers: manufacturers.filter(Boolean),
      },
    });
  } catch (error: any) {
    console.error('获取配件列表失败:', error);
    return errorResponse(error.message || '获取配件列表失败');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse('未授权访问', 401);
    }
    const user = authResult.user;

    // 检查用户权限
    console.log(user, 'user123');
    if (user.role !== 'admin') {
      return errorResponse('没有权限添加配件1'+user.role, 403);
    }

    await connectDB();

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

    // 检查编号是否已存在
    const existingPart = await Part.findOne({ code });
    if (existingPart) {
      return validationErrorResponse({
        code: '配件编号已存在',
      });
    }

    // 创建配件
    const part = new Part({
      name,
      code,
      description,
      category,
      manufacturer,
      price,
      stock,
      minStock,
      unit: unit || '个',
      location,
      status: data.status || 'active'
    });

    await part.save();

    return successResponse({
      data: part,
      message: '配件添加成功'
    });
  } catch (error: any) {
    console.error('创建配件失败:', error);
    return errorResponse(error.message || '创建配件失败');
  }
} 