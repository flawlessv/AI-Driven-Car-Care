import { NextResponse } from 'next/server';
import Appointment from '@/models/appointment';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    await connectDB();
    const appointments = await Appointment.find()
      .populate('customer', 'name phone email')
      .populate('vehicle', 'brand model licensePlate')
      .populate('timeSlot.technician', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: appointments
    });
  } catch (error: any) {
    console.error('获取预约列表失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '获取预约列表失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();

    const appointment = new Appointment(data);
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('customer', 'name phone email')
      .populate('vehicle', 'brand model licensePlate')
      .populate('timeSlot.technician', 'name');
    
    return NextResponse.json({
      success: true,
      message: '预约创建成功',
      data: populatedAppointment
    });
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '创建预约失败'
      },
      { status: 500 }
    );
  }
} 