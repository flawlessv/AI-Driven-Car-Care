import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/app/lib/auth';
import getWorkOrderModel from '@/app/models/workOrder';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/app/lib/mongodb';

// POST 方法：追加工作完成证明（在待审核状态）
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
    
    // 仅技师可以提交补充证明
    if (role !== 'technician') {
      return NextResponse.json(
        { success: false, message: '只有技师才能提交补充证明' }, 
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
      technician: userId,
      status: 'pending_check'
    });

    if (!workOrder) {
      return NextResponse.json(
        { success: false, message: '找不到处于待审核状态的工单' }, 
        { status: 404 }
      );
    }

    // 获取现有的证明图片
    const existingProofImages = 
      workOrder.completionProof && Array.isArray(workOrder.completionProof.proofImages) 
        ? workOrder.completionProof.proofImages 
        : [];
    
    // 合并现有图片和新上传的图片
    const allProofImages = [...existingProofImages, ...proofImages];
    
    // 更新工单的完成证明（但不改变工单状态）
    const result = await WorkOrder.findOneAndUpdate(
      { _id: new ObjectId(workOrderId) },
      { 
        $set: {
          'completionProof.proofImages': allProofImages,
          'completionProof.notes': notes || workOrder.completionProof?.notes || ''
        },
        $push: {
          progress: {
            status: 'pending_check',
            notes: `技师提交了补充完成证明${notes ? `: ${notes}` : ''}`,
            timestamp: new Date(),
            user: userId
          }
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, message: '更新工单证明失败' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: '补充证明提交成功',
      data: result
    });
  } catch (error: any) {
    console.error('提交补充证明发生错误:', error);
    return NextResponse.json(
      { success: false, message: `提交补充证明失败: ${error.message}` }, 
      { status: 500 }
    );
  }
} 