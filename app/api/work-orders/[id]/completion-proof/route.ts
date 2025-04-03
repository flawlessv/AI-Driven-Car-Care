import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import getWorkOrderModel from '@/models/workOrder';
import User from '@/models/user';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/mongodb';

// POST 方法：提交工作完成证明
export async function POST(
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
    
    // 仅技师可以提交完成证明
    if (role !== 'technician') {
      return NextResponse.json(
        { success: false, message: '只有技师才能提交完成证明' }, 
        { status: 403 }
      );
    }

    // 解析请求数据
    const { proofImages, notes } = await req.json();
    
    if (!proofImages || !Array.isArray(proofImages) || proofImages.length === 0) {
      return NextResponse.json(
        { success: false, message: '请提供至少一张完成证明图片' }, 
        { status: 400 }
      );
    }

    // 连接数据库并获取工单信息
    await connectDB();
    const WorkOrder = getWorkOrderModel();
    const workOrderId = params.id;
    
    const workOrder = await WorkOrder.findOne({
      _id: new ObjectId(workOrderId),
      technician: userId
    });

    if (!workOrder) {
      return NextResponse.json(
        { success: false, message: '找不到您负责的工单' }, 
        { status: 404 }
      );
    }

    if (workOrder.status !== 'in_progress') {
      return NextResponse.json(
        { success: false, message: '只有进行中的工单才能提交完成证明' }, 
        { status: 400 }
      );
    }

    // 更新工单状态为待检查
    const result = await WorkOrder.findOneAndUpdate(
      { _id: new ObjectId(workOrderId) },
      { 
        $set: {
          status: 'pending_check',
          completionProof: {
            workOrderId: workOrderId,
            proofImages: proofImages,
            notes: notes || '',
            submittedBy: userId,
            submittedAt: new Date(),
            approved: false
          } 
        },
        $push: {
          progress: {
            status: 'pending_check',
            notes: `技师提交了完成证明${notes ? `: ${notes}` : ''}`,
            timestamp: new Date(),
            user: userId
          }
        }
      },
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
      message: '完成证明提交成功',
      data: result
    });
  } catch (error: any) {
    console.error('提交完成证明发生错误:', error);
    return NextResponse.json(
      { success: false, message: `提交完成证明失败: ${error.message}` }, 
      { status: 500 }
    );
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