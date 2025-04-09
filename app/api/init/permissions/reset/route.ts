import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db-connect';
import User from '@/app/models/user';
import RolePermission from '@/app/models/rolePermission';

/**
 * 重置所有用户权限
 * 为所有用户重新应用角色对应的权限配置
 */
export async function GET(req: NextRequest) {
  try {
    // 不再检查环境变量，允许在任何环境下运行
    console.log('开始重置用户权限...');

    console.log('开始连接数据库...');
    await dbConnect();
    console.log('数据库连接成功');

    // 获取所有角色权限配置
    const rolePermissions = await RolePermission.find().lean();
    console.log(`已获取${rolePermissions.length}个角色的权限配置`);

    const results = [];
    
    // 遍历每个角色，更新对应用户的权限
    for (const roleConfig of rolePermissions) {
      const { role, permissions } = roleConfig;
      
      console.log(`正在处理${role}角色的权限...`);
      console.log(`权限设置:`, permissions);

      // 更新该角色的所有用户
      const updateResult = await User.updateMany(
        { role },
        { $set: { permissions } }
      );
      
      console.log(`${role}角色用户权限更新结果:`, {
        matched: updateResult.matchedCount,
        modified: updateResult.modifiedCount
      });
      
      results.push({
        role,
        matchedUsers: updateResult.matchedCount,
        updatedUsers: updateResult.modifiedCount
      });
    }

    return NextResponse.json({
      success: true,
      message: '用户权限重置成功',
      data: results
    });
  } catch (error: any) {
    console.error('重置用户权限失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: `重置用户权限失败: ${error.message}`
      },
      { status: 500 }
    );
  }
} 