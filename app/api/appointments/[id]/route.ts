import { connectDB } from '../../../../lib/mongodb';
import Appointment from '../../../../models/appointment';
import { successResponse, errorResponse } from '../../../../lib/api-response';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const appointment = await Appointment.findById(params.id)
      .populate('customer')
      .populate('vehicle')
      .populate('timeSlot.technician');

    if (!appointment) {
      return errorResponse('预约不存在', 404);
    }

    return successResponse({
      data: appointment
    });
  } catch (error: any) {
    return errorResponse(error.message);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const data = await request.json();
    console.log('Received update data:', data);

    const updateData = {
      timeSlot: {
        date: data.timeSlot?.date ? new Date(data.timeSlot.date) : undefined,
        startTime: data.timeSlot?.startTime,
        endTime: data.timeSlot?.endTime,
        technician: data.timeSlot?.technician
      },
      service: {
        type: data.service?.type,
        name: data.service?.name,
        description: data.service?.description,
        duration: data.service?.duration,
        basePrice: data.service?.basePrice
      },
      status: data.status,
      notes: data.notes
    };

    // 移除所有 undefined 值
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      } else if (typeof updateData[key] === 'object') {
        Object.keys(updateData[key]).forEach(subKey => {
          if (updateData[key][subKey] === undefined) {
            delete updateData[key][subKey];
          }
        });
      }
    });

    console.log('Processed update data:', updateData);

    const appointment = await Appointment.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { 
        new: true,
        runValidators: true
      }
    )
    .populate('customer')
    .populate('vehicle')
    .populate('timeSlot.technician');

    if (!appointment) {
      return errorResponse('预约不存在', 404);
    }

    return successResponse({
      message: '更新成功',
      data: appointment
    });
  } catch (error: any) {
    console.error('Update error:', error);
    return errorResponse(error.message);
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
      return errorResponse('预约不存在', 404);
    }

    return successResponse({
      message: '删除成功'
    });
  } catch (error: any) {
    return errorResponse(error.message);
  }
} 