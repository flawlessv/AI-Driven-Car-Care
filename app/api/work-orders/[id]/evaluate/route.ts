import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      );
    }

    // 重定向到evaluation接口
    const data = await request.json();
    
    // 转发请求到评价接口
    const evaluationResponse = await fetch(
      `${request.nextUrl.origin}/api/work-orders/${params.id}/evaluation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
          'Authorization': request.headers.get('authorization') || ''
        },
        body: JSON.stringify(data)
      }
    );
    
    // 返回评价接口的响应
    const result = await evaluationResponse.json();
    return NextResponse.json(result, { status: evaluationResponse.status });
    
  } catch (error: any) {
    console.error('评价提交失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || '评价提交失败' },
      { status: 500 }
    );
  }
} 