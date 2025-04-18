import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authMiddleware } from '@/app/lib/auth';
import Part from '@/app/models/part';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/app/lib/api-response';

/**
 * 获取零部件列表的函数
 * 
 * 这个函数用来获取系统中所有汽车零配件的信息。
 * 就像汽车维修店的库存系统，可以查看有哪些零部件以及库存情况。
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份，确认是谁在查询零件信息
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      // 如果身份验证失败，返回未授权错误
      return errorResponse('未授权访问', 401);
    }
    // 获取当前用户信息
    const user = authResult.user;

    // 连接到数据库
    await connectDB();

    // 获取查询参数，用于筛选零件
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');          // 页码，默认第1页
    const limit = parseInt(searchParams.get('limit') || '10');       // 每页数量，默认10条
    const search = searchParams.get('search') || '';                 // 搜索关键词
    const category = searchParams.get('category') || '';             // 零件分类
    const manufacturer = searchParams.get('manufacturer') || '';     // 生产厂商
    const lowStock = searchParams.get('lowStock') === 'true';        // 是否只显示库存不足的零件
    const skip = (page - 1) * limit;                                 // 计算需要跳过的记录数

    // 准备查询条件
    const query: any = {};
    if (search) {
      // 如果有搜索关键词，在名称和编码中查找匹配项
      query.$or = [
        { name: { $regex: search, $options: 'i' } },    // 在名称中搜索（不区分大小写）
        { code: { $regex: search, $options: 'i' } },    // 在编码中搜索（不区分大小写）
      ];
    }
    if (category) {
      // 如果指定了分类，只显示该分类的零件
      query.category = category;
    }
    if (manufacturer) {
      // 如果指定了生产厂商，只显示该厂商的零件
      query.manufacturer = manufacturer;
    }
    if (lowStock) {
      // 如果要显示库存不足的零件，添加库存<=最小库存的条件
      query.$expr = {
        $lte: ['$stock', '$minStock'],  // 库存小于等于最小库存量
      };
    }

    // 同时执行两个查询：获取零件列表和总数
    const [parts, total] = await Promise.all([
      Part.find(query)               // 查询符合条件的零件
        .sort({ createdAt: -1 })     // 按创建时间倒序排列，最新添加的零件排在前面
        .skip(skip)                  // 跳过前面的记录（分页）
        .limit(limit),               // 限制返回数量（分页）
      Part.countDocuments(query),    // 计算符合条件的零件总数
    ]);

    // 获取所有零件分类和制造商，用于前端筛选功能
    const [categories, manufacturers] = await Promise.all([
      Part.distinct('category'),        // 获取所有不重复的分类
      Part.distinct('manufacturer'),    // 获取所有不重复的制造商
    ]);

    // 返回零件列表、分页信息和筛选选项
    return successResponse({
      data: parts,                          // 零件数据
      total,                                // 总记录数
      page,                                 // 当前页码
      limit,                                // 每页数量
      totalPages: Math.ceil(total / limit), // 总页数
      filters: {
        // 返回可选的筛选条件，过滤掉空值
        categories: categories.filter(Boolean),       // 所有可选的分类
        manufacturers: manufacturers.filter(Boolean), // 所有可选的制造商
      },
    });
  } catch (error: any) {
    // 如果出现错误，记录错误并返回错误响应
    console.error('获取配件列表失败:', error);
    return errorResponse(error.message || '获取配件列表失败');
  }
}

/**
 * 创建新零部件的函数
 * 
 * 这个函数用来在系统中添加新的零部件记录。
 * 就像汽车维修店进货时，需要登记新进的零部件信息。
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份，确认是谁在添加零件
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

    // 检查用户权限，只有管理员和技师才能添加零件
    console.log(user, 'user123');
    if (user.role !== 'admin' && user.role !== 'technician') {
      // 如果不是管理员或技师，返回权限不足错误
      return errorResponse('没有权限添加配件', 403);
    }

    // 连接到数据库
    await connectDB();

    // 获取提交的零件数据
    const data = await request.json();
    // 解构提取各个字段
    const {
      name,           // 零件名称
      code,           // 零件编码
      description,    // 零件描述
      category,       // 分类
      manufacturer,   // 生产厂商
      price,          // 价格
      stock,          // 库存量
      minStock,       // 最小库存量
      unit,           // 单位
      location,       // 存放位置
    } = data;

    // 验证必填字段是否都已提供
    const requiredFields = ['name', 'code', 'price', 'stock'];
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      // 如果有缺少的字段，返回格式化的错误信息
      const errorObj: Record<string, string[]> = {};
      missingFields.forEach(field => {
        errorObj[field] = [`${field}是必需的`];
      });
      return validationErrorResponse(errorObj);
    }

    // 检查零件编码是否已存在（防止重复添加）
    const existingPart = await Part.findOne({ code });
    if (existingPart) {
      // 如果编码已存在，返回错误提示
      return validationErrorResponse({
        code: ['配件编号已存在'],
      });
    }

    // 创建新零件记录
    const part = new Part({
      name,                     // 零件名称
      code,                     // 零件编码
      description,              // 零件描述
      category,                 // 分类
      manufacturer,             // 生产厂商
      price,                    // 价格
      stock,                    // 库存量
      minStock,                 // 最小库存量
      unit: unit || '个',        // 单位，默认为"个"
      location,                 // 存放位置
      status: data.status || 'active'  // 状态，默认为"激活"
    });

    // 保存零件记录到数据库
    await part.save();

    // 返回成功响应，包含新创建的零件信息
    return successResponse({
      data: part,
      message: '配件添加成功'
    });
  } catch (error: any) {
    // 如果出现错误，记录错误并返回错误响应
    console.error('创建配件失败:', error);
    return errorResponse(error.message || '创建配件失败');
  }
} 