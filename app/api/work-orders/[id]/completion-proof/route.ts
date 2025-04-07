import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import getWorkOrderModel from '@/models/workOrder';
import User from '@/models/user';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/mongodb';
import { checkRole } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/api-response';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

// POST 方法：提交工作完成证明
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户权限（技师和管理员可以上传证明）
    const authResult = await checkRole(['admin', 'technician'])(request);
    if (!authResult.success) {
      return errorResponse(authResult.message || '未授权访问', 401);
    }

    // 确保用户存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
    }

    const workOrderId = params.id;

    await connectDB();

    // 获取工单信息
    const workOrder = await getWorkOrderModel().findById(workOrderId);
    if (!workOrder) {
      return notFoundResponse('工单不存在');
    }

    // 解析表单数据
    const formData = await request.formData();
    const notes = formData.get('notes') as string;
    const proofImages = formData.getAll('proofImages') as File[];

    if (!proofImages || proofImages.length === 0) {
      return errorResponse('请至少上传一张完成证明照片', 400);
    }

    // 检查文件是否是图片
    for (const file of proofImages) {
      if (!file.type.startsWith('image/')) {
        return errorResponse('只能上传图片文件', 400);
      }
      
      // 检查文件大小（限制为2MB）
      if (file.size > 2 * 1024 * 1024) {
        return errorResponse('图片大小不能超过2MB', 400);
      }
    }

    // 创建保存图片的目录
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'work-orders', workOrderId);
    if (!existsSync(dirname(uploadDir))) {
      await mkdir(dirname(uploadDir), { recursive: true });
    }
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 保存图片并获取URL
    const imageUrls: string[] = [];
    for (const [index, file] of proofImages.entries()) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `proof_${Date.now()}_${index}.${file.type.split('/')[1]}`;
      const filePath = join(uploadDir, fileName);
      
      await writeFile(filePath, buffer);
      imageUrls.push(`/uploads/work-orders/${workOrderId}/${fileName}`);
    }

    // 更新工单完成证明
    workOrder.completionProof = {
      workOrderId: workOrder._id,
      proofImages: imageUrls,
      notes: notes || '',
      submittedBy: authResult.user._id,
      submittedAt: new Date(),
      approved: false
    };

    // 保存工单
    await workOrder.save();

    return successResponse({
      message: '完成证明上传成功',
      imageUrls
    });
  } catch (error: any) {
    console.error('上传完成证明失败:', error);
    return errorResponse(error.message || '上传完成证明失败');
  }
}

// PUT 方法：审批工作完成证明
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户身份和权限
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
    }

    const userId = authResult.user._id.toString();
    const role = authResult.user.role;
    
    // 只有管理员可以审批完成证明
    if (role !== 'admin') {
      return NextResponse.json(
        { success: false, message: '只有管理员才能审批完成证明' }, 
        { status: 403 }
      );
    }

    // 解析请求数据
    const { approved, notes } = await req.json();
    
    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { success: false, message: '请提供审批结果' }, 
        { status: 400 }
      );
    }

    // 连接数据库并获取工单信息
    await connectDB();
    const WorkOrder = getWorkOrderModel();
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

    // 获取用户信息
    const user = await User.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json(
        { success: false, message: '无法获取审批人信息' }, 
        { status: 500 }
      );
    }

    // 更新工单状态和完成证明
    const updateData: any = {
      $set: {
        'completionProof.approved': approved,
        'completionProof.approvedBy': userId,
        'completionProof.approvedAt': new Date()
      }
    };

    // 如果审批通过，更新工单状态为已完成
    if (approved) {
      updateData.$set.status = 'completed';
      updateData.$push = {
        progress: {
          status: 'completed',
          notes: `管理员审批通过了完成证明${notes ? `: ${notes}` : ''}`,
          timestamp: new Date(),
          user: userId
        }
      };
    } else {
      // 如果审批不通过，回退工单状态为进行中
      updateData.$set.status = 'in_progress';
      updateData.$push = {
        progress: {
          status: 'in_progress',
          notes: `管理员拒绝了完成证明${notes ? `: ${notes}` : ''}`,
          timestamp: new Date(),
          user: userId
        }
      };
    }

    const result = await WorkOrder.findOneAndUpdate(
      { _id: new ObjectId(workOrderId) },
      updateData,
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, message: '更新工单状态失败' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `完成证明审批${approved ? '通过' : '拒绝'}成功`,
      data: result
    });
  } catch (error: any) {
    console.error('审批完成证明发生错误:', error);
    return NextResponse.json(
      { success: false, message: `审批完成证明失败: ${error.message}` }, 
      { status: 500 }
    );
  }
} 