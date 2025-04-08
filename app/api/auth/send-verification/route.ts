import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getUserModel } from '@/lib/db/models';
import { successResponse, errorResponse } from '@/lib/api-response';

// 模拟存储验证码（实际应用中应该使用Redis或数据库存储）
const verificationCodes: Record<string, { code: string, expiry: number }> = {};

export async function POST(request: NextRequest) {
  try {
    // 连接数据库
    await connectDB();

    // 解析请求数据
    const { email } = await request.json();

    // 验证邮箱是否为空
    if (!email) {
      return errorResponse('邮箱不能为空', 400);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('邮箱格式不正确', 400);
    }

    // 验证邮箱是否存在
    const User = getUserModel();
    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse('该邮箱未注册', 404);
    }

    // 生成6位数验证码
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 设置验证码有效期为10分钟
    const expiryTime = Date.now() + 10 * 60 * 1000;
    
    // 存储验证码（实际应用中应该存入Redis或数据库）
    verificationCodes[email] = { 
      code: verificationCode,
      expiry: expiryTime
    };

    // 打印验证码（实际应用中应该发送邮件）
    console.log(`发送验证码到 ${email}：${verificationCode}`);

    // TODO: 实际应用中，这里应该调用邮件发送服务发送验证码
    // 例如：await sendEmail(email, '重置密码验证码', `您的验证码是：${verificationCode}，有效期10分钟`);

    // 返回成功响应
    return successResponse({ 
      message: '验证码已发送至邮箱',
      // 开发环境直接返回验证码，生产环境不应该这样做
      code: process.env.NODE_ENV === 'development' ? verificationCode : undefined
    });

  } catch (error) {
    console.error('发送验证码失败:', error);
    return errorResponse('发送验证码失败', 500);
  }
}

// 导出验证码存储供其他路由使用
export { verificationCodes }; 