import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/app/lib/auth';
import WorkOrder from '@/app/models/workOrder';
import WorkOrderProgress from '@/app/models/workOrderProgress';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/app/lib/mongodb';
import { checkRole } from '@/app/lib/auth';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/app/lib/api-response';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { readdirSync } from 'fs';

// 定义工单状态常量
const WORK_ORDER_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  PENDING_CHECK: 'pending_check',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// POST 方法：提交工作完成证明
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const workOrderId = params.id;

    // 获取工单信息
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      return notFoundResponse('工单不存在');
    }

    // 解析表单数据
    const formData = await request.formData();
    const notes = formData.get('notes') as string;
    const proofImages = formData.getAll('proofImages') as File[];

    console.log('收到的表单数据:', {
      workOrderId,
      notes,
      proofImagesCount: proofImages.length
    });

    if (!proofImages || proofImages.length === 0) {
      return errorResponse('请至少上传一张完成证明照片', 400);
    }

    // 检查并记录表单数据
    console.log('开始处理完成证明图片上传，共' + proofImages.length + '张图片');
    
    // 检查文件是否是图片
    for (const file of proofImages) {
      if (!file.type.startsWith('image/')) {
        return errorResponse('只能上传图片文件', 400);
      }
      
      // 检查文件大小（限制为2MB）
      if (file.size > 2 * 1024 * 1024) {
        return errorResponse('图片大小不能超过2MB', 400);
      }
      
      console.log('图片类型:', file.type, '大小:', Math.round(file.size / 1024), 'KB');
    }

    // 创建保存图片的目录
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'work-orders', workOrderId);
    try {
      // 确保父目录存在
      await mkdir(join(process.cwd(), 'public', 'uploads', 'work-orders'), { recursive: true });
      // 确保工单目录存在
      await mkdir(uploadDir, { recursive: true });
      console.log('成功创建目录:', uploadDir);
    } catch (err) {
      console.error('创建目录失败:', err);
      return errorResponse(`创建上传目录失败: ${err.message}`, 500);
    }
    
    console.log('图片保存目录:', uploadDir);

    // 保存图片并获取URL
    const imageUrls: string[] = [];
    for (const [index, file] of proofImages.entries()) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `proof_${Date.now()}_${index}.${file.type.split('/')[1]}`;
        const filePath = join(uploadDir, fileName);
        
        console.log(`尝试保存图片到: ${filePath}`);
        await writeFile(filePath, buffer);
        
        // 验证文件是否成功写入
        if (!existsSync(filePath)) {
          console.error(`文件写入后无法验证: ${filePath}`);
          continue;
        }
        
        // 构建图片URL（相对路径）- 注意使用正确斜杠
        const imageUrl = `/uploads/work-orders/${workOrderId}/${fileName}`;
        
        // 测试图片可访问性
        const publicPath = join('public', 'uploads', 'work-orders', workOrderId, fileName);
        const fullPublicPath = join(process.cwd(), 'public', 'uploads', 'work-orders', workOrderId, fileName);
        
        console.log(`已保存图片 ${index + 1}/${proofImages.length}:`, { 
          filePath,
          imageUrl,
          publicPath,
          fullPublicPath,
          exists: existsSync(filePath),
          publicExists: existsSync(fullPublicPath),
          size: buffer.length
        });
        
        imageUrls.push(imageUrl);
      } catch (err: any) {
        console.error(`保存图片 ${index + 1} 失败:`, err.message);
      }
    }
    
    // 检查是否成功保存了图片
    if (imageUrls.length === 0) {
      console.error('没有成功保存任何图片');
      return errorResponse('保存图片失败', 500);
    }

    // 更新工单完成证明
    const proofObject = {
      workOrderId: workOrder._id,
      proofImages: imageUrls,
      notes: notes || '',
      submittedBy: null,
      submittedAt: new Date(),
      approved: false
    };

    // 添加日志输出以便调试
    console.log('保存完成证明数据:', proofObject);
    
    // 更新工单完成证明和状态
    let updatedWorkOrder;
    try {
      updatedWorkOrder = await WorkOrder.findByIdAndUpdate(
        workOrderId, 
        {
          $set: {
            completionProof: proofObject,
            status: WORK_ORDER_STATUS.PENDING_CHECK
          }
        },
        { new: true }
      );
      
      if (!updatedWorkOrder) {
        throw new Error('数据库更新返回空结果');
      }
    } catch (err: any) {
      console.error('更新工单失败:', err);
      return errorResponse(`更新工单数据库记录失败: ${err.message}`, 500);
    }
    
    console.log('工单更新后的completionProof类型:', typeof updatedWorkOrder.completionProof);
    console.log('工单更新后的completionProof:', 
      typeof updatedWorkOrder.completionProof === 'object' 
        ? JSON.stringify(updatedWorkOrder.completionProof) 
        : updatedWorkOrder.completionProof);
    
    // 再次检查数据库中的工单，确认completionProof已正确保存
    try {
      const verifyWorkOrder = await WorkOrder.findById(workOrderId);
      if (!verifyWorkOrder) {
        console.warn('无法验证工单更新，查询返回null');
      } else {
        console.log('验证工单更新 - completionProof:', 
          typeof verifyWorkOrder.completionProof === 'object'
            ? JSON.stringify(verifyWorkOrder.completionProof)
            : verifyWorkOrder.completionProof);
            
        // 检查图片文件是否实际存在
        if (typeof verifyWorkOrder.completionProof === 'object' && 
            verifyWorkOrder.completionProof && 
            Array.isArray(verifyWorkOrder.completionProof.proofImages)) {
          
          console.log('验证图片文件存在性:');
          for (const [index, imgPath] of verifyWorkOrder.completionProof.proofImages.entries()) {
            // 从URL路径获取服务器物理路径
            const relativePath = imgPath.startsWith('/') ? imgPath.substring(1) : imgPath;
            const fullPath = join(process.cwd(), 'public', relativePath);
            const exists = existsSync(fullPath);
            
            console.log(`图片 ${index + 1}:`, {
              url: imgPath,
              fullPath,
              exists
            });
            
            // 如果文件不存在，从proofImages中移除
            if (!exists && Array.isArray(verifyWorkOrder.completionProof.proofImages)) {
              console.warn(`图片文件不存在，将从记录中移除: ${imgPath}`);
              // 注意：此处不直接修改数据库，只是记录问题
            }
          }
        } else {
          console.warn('无法验证图片文件: completionProof格式不正确或proofImages不是数组');
        }
      }
    } catch (err) {
      console.warn('验证工单更新失败:', err);
    }
    
    return successResponse({
      message: '完成证明上传成功',
      imageUrls,
      completionProof: updatedWorkOrder.completionProof,
      fullObject: proofObject,
      workOrderId: workOrderId,
      status: updatedWorkOrder.status
    });
  } catch (error: any) {
    console.error('上传完成证明失败:', error);
    return errorResponse(error.message || '上传完成证明失败');
  }
}

// PUT 方法：审批工作完成证明
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // 解析请求数据
    const { approved, notes } = await request.json();
    
    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { success: false, message: '请提供审批结果' }, 
        { status: 400 }
      );
    }

    // 连接数据库并获取工单信息
    const workOrderId = params.id;
    
    const workOrder = await WorkOrder.findOne({
      _id: new ObjectId(workOrderId),
      status: 'pending_check'
    });

    if (!workOrder) {
      return NextResponse.json(
        { success: false, message: '找不到待审批的工单' }, 
        { status: 404 }
      );
    }

    if (!workOrder.completionProof) {
      return NextResponse.json(
        { success: false, message: '该工单没有提交完成证明' }, 
        { status: 400 }
      );
    }

    // 获取当前用户ID用于记录谁执行了审批操作
    const session = await authMiddleware(request);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: '未授权操作' }, 
        { status: 401 }
      );
    }

    // 检查权限 - 只有管理员可以审批
    const hasPermission = await checkRole(session.user.id, ["admin"]);
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, message: '没有权限执行此操作' }, 
        { status: 403 }
      );
    }

    // 更新完成证明对象
    const updateData: any = {
      $set: {
        'completionProof.approved': approved,
        'completionProof.approvedBy': session.user.id,
        'completionProof.approvedAt': new Date(),
        'completionProof.reviewNotes': notes || ''
      }
    };

    // 如果批准，将工单更新为已完成状态
    // 如果驳回，将工单更新为进行中状态
    if (approved) {
      updateData.$set.status = 'completed';
      updateData.$set.completionDate = new Date();
    } else {
      updateData.$set.status = 'in_progress';
    }

    // 更新工单
    const updatedWorkOrder = await WorkOrder.findByIdAndUpdate(
      workOrderId, 
      updateData,
      { new: true }
    )
    .populate('vehicle')
    .populate('customer')
    .populate('technician');
    
    if (!updatedWorkOrder) {
      return errorResponse('无法更新工单', 500);
    }

    // 创建进度记录，确保使用当前时间戳
    const progressStatus = approved ? 'completed' : 'in_progress';
    const progressNotes = approved
      ? `管理员已批准完成证明: ${notes || '无备注'}`
      : `管理员已驳回完成证明: ${notes || '无备注'}`;

    const progressRecord = new WorkOrderProgress({
      workOrder: workOrderId,
      status: progressStatus,
      notes: progressNotes,
      updatedBy: session.user.id,
      createdAt: new Date() // 确保使用当前时间
    });

    await progressRecord.save();
    console.log('创建工单进度记录:', progressRecord);

    // 获取最新的进度记录
    const progress = await WorkOrderProgress.find({ workOrder: workOrderId })
      .populate('updatedBy', 'username role')
      .sort({ createdAt: -1 });

    // 返回统一的响应结构
    return successResponse({
      message: approved ? '工单完成证明已批准' : '工单完成证明已驳回',
      workOrder: updatedWorkOrder,
      progress
    });

  } catch (error: any) {
    console.error('评审完成证明失败:', error);
    return errorResponse(error.message || '评审完成证明失败');
  }
}

// GET 方法：获取工单完成证明数据
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const workOrderId = params.id;
    if (!workOrderId) {
      return errorResponse('工单ID不能为空', 400);
    }
    
    console.log('获取工单完成证明:', workOrderId);
    
    // 获取工单信息
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      return notFoundResponse('工单不存在');
    }
    
    console.log('查询到的工单数据:', {
      id: workOrder._id.toString(),
      status: workOrder.status,
      completionProofType: typeof workOrder.completionProof,
      completionProofValue: workOrder.completionProof ? 
        (typeof workOrder.completionProof === 'object' ? 
          JSON.stringify(workOrder.completionProof) : 
          workOrder.completionProof) : 'null'
    });

    // 即使completionProof为空，也返回一个基本结构
    let responseData = {
      workOrderId: workOrderId,
      proofImages: [],
      notes: '',
      submittedAt: new Date(),
      approved: false
    };
    
    // 处理completionProof是对象的情况
    if (typeof workOrder.completionProof === 'object' && workOrder.completionProof !== null) {
      console.log('completionProof是对象类型');
      
      // 检查有哪些键
      if (workOrder.completionProof) {
        console.log('completionProof对象的键:', Object.keys(workOrder.completionProof));
      }
      
      // 合并对象属性
      responseData = {
        ...responseData,
        ...workOrder.completionProof
      };
      
      // 确保proofImages是数组
      if (!Array.isArray(responseData.proofImages)) {
        console.log('proofImages不是数组，重置为空数组');
        responseData.proofImages = [];
      } else if ('proofImages' in workOrder.completionProof && Array.isArray(workOrder.completionProof.proofImages)) {
        responseData.proofImages = [...workOrder.completionProof.proofImages];
        console.log(`找到${responseData.proofImages.length}张图片`);
      }
      
      // 验证图片是否存在
      if (responseData.proofImages.length > 0) {
        console.log('验证图片存在性:');
        for (const [index, imgPath] of responseData.proofImages.entries()) {
          if (typeof imgPath === 'string') {
            // 从URL路径获取服务器物理路径
            const relativePath = imgPath.startsWith('/') ? imgPath.substring(1) : imgPath;
            const fullPath = join(process.cwd(), 'public', relativePath);
            const exists = existsSync(fullPath);
            
            console.log(`图片 ${index + 1}:`, {
              url: imgPath,
              fullPath,
              exists
            });
          }
        }
      }
    }
    // 处理completionProof是数组的情况
    else if (Array.isArray(workOrder.completionProof)) {
      console.log('completionProof是数组类型');
      responseData.proofImages = workOrder.completionProof
        .filter(item => typeof item === 'string')
        .map(item => {
          console.log('数组元素:', item);
          return item;
        });
      console.log(`从数组中提取了${responseData.proofImages.length}张图片`);
    }
    // 处理completionProof是字符串的情况（可能是单张图片）
    else if (typeof workOrder.completionProof === 'string' && workOrder.completionProof.length > 0) {
      console.log('completionProof是字符串类型:', workOrder.completionProof);
      responseData.proofImages = [workOrder.completionProof];
    }
    
    // 检查数据库中是否有相关API上传记录
    try {
      // 尝试直接查询是否有上传记录
      const uploadRecord = await WorkOrder.aggregate([
        { $match: { _id: workOrder._id } },
        { $project: { 
          imageUrls: "$completionProof.proofImages",
          notes: "$completionProof.notes",
          status: 1
        }}
      ]);
      
      console.log('聚合查询结果:', JSON.stringify(uploadRecord));
      
      if (uploadRecord && uploadRecord.length > 0 && uploadRecord[0].imageUrls && Array.isArray(uploadRecord[0].imageUrls)) {
        console.log('找到聚合查询中的图片:', uploadRecord[0].imageUrls);
        responseData.proofImages = responseData.proofImages.length > 0 ? 
          responseData.proofImages : uploadRecord[0].imageUrls;
      }
    } catch (err) {
      console.error('聚合查询失败:', err);
    }
    
    // 尝试从API响应数据中获取
    try {
      const fullResponse = await fetch(`http://localhost:3000/api/work-orders/${workOrderId}`);
      if (fullResponse.ok) {
        const fullData = await fullResponse.json();
        console.log('获取完整工单数据:', JSON.stringify(fullData.data?.workOrder?.completionProof || {}));
        
        if (fullData.success && 
            fullData.data?.workOrder?.completionProof && 
            fullData.data.workOrder.completionProof.proofImages && 
            Array.isArray(fullData.data.workOrder.completionProof.proofImages) &&
            fullData.data.workOrder.completionProof.proofImages.length > 0) {
          
          console.log('从工单API找到图片数据');
          responseData.proofImages = fullData.data.workOrder.completionProof.proofImages;
        }
      }
    } catch (err) {
      console.error('获取完整工单数据失败:', err);
    }
    
    // 如果还没有找到图片，尝试直接使用POST响应中的数据
    if (responseData.proofImages.length === 0 && workOrderId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('尝试查找上传记录');
      try {
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'work-orders', workOrderId);
        if (existsSync(uploadDir)) {
          console.log('找到上传目录:', uploadDir);
          const files = readdirSync(uploadDir);
          if (files.length > 0) {
            console.log('目录中的文件:', files);
            responseData.proofImages = files
              .filter(file => file.startsWith('proof_') && 
                             (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')))
              .map(file => `/uploads/work-orders/${workOrderId}/${file}`);
            console.log('从目录中找到的图片:', responseData.proofImages);
          }
        }
      } catch (err) {
        console.error('查找上传记录失败:', err);
      }
    }

    // 最终检查，如果还是没有找到图片，提醒用户
    const message = responseData.proofImages.length > 0 ? 
      '获取完成证明数据成功' : 
      '未找到完成证明图片，请确认是否成功上传';

    return successResponse({
      message,
      ...responseData
    });
  } catch (error: any) {
    console.error('获取完成证明数据失败:', error);
    return errorResponse(error.message || '获取完成证明数据失败');
  }
} 