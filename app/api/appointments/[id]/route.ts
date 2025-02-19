import { NextResponse } from 'next/server';
import Appointment from '@/models/appointment';
import { connectDB } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const appointment = await Appointment.findById(params.id)
      .populate('customer', 'name phone email')
      .populate('vehicle', 'brand model licensePlate')
      .populate('timeSlot.technician', 'name');

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          message: '预约不存在'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: appointment
    });
  } catch (error: any) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '获取预约详情失败'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const data = await request.json();

    const appointment = await Appointment.findByIdAndUpdate(
      params.id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('customer', 'name phone email')
      .populate('vehicle', 'brand model licensePlate')
      .populate('timeSlot.technician', 'name');

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          message: '预约不存在'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '预约更新成功',
      data: appointment
    });
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '更新预约失败'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const appointment = await Appointment.findByIdAndDelete(params.id);

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          message: '预约不存在'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '预约删除成功'
    });
  } catch (error: any) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '删除预约失败'
      },
      { status: 500 }
    );
  }
} 