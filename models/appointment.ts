import mongoose, { Document } from 'mongoose';

interface IAppointment extends Document {
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  vehicle: mongoose.Types.ObjectId;
  service: {
    name: string;
    description?: string;
    category: 'regular' | 'repair' | 'inspection';
    duration: number;
    basePrice: number;
  };
  timeSlot: {
    date: Date;
    startTime: string;
    endTime: string;
    technician: mongoose.Types.ObjectId;
  };
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  estimatedDuration: number;
  estimatedCost: number;
  confirmationSent: boolean;
  reminderSent: boolean;
}

const appointmentSchema = new mongoose.Schema<IAppointment>(
  {
    customer: {
      name: {
        type: String,
        required: [true, '客户姓名是必需的'],
      },
      phone: {
        type: String,
        required: [true, '联系电话是必需的'],
      },
      email: String,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    service: {
      name: {
        type: String,
        required: true,
      },
      description: String,
      category: {
        type: String,
        enum: ['regular', 'repair', 'inspection'],
        required: true,
      },
      duration: {
        type: Number,
        required: true,
      },
      basePrice: {
        type: Number,
        required: true,
      },
    },
    timeSlot: {
      date: {
        type: Date,
        required: true,
      },
      startTime: {
        type: String,
        required: true,
      },
      endTime: {
        type: String,
        required: true,
      },
      technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: String,
    estimatedDuration: {
      type: Number,
      required: true,
    },
    estimatedCost: {
      type: Number,
      required: true,
    },
    confirmationSent: {
      type: Boolean,
      default: false,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// 创建预约前检查时间段是否可用
appointmentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Appointment = mongoose.model<IAppointment>('Appointment');
    const overlappingAppointment = await Appointment.findOne({
      'timeSlot.technician': this.timeSlot.technician,
      'timeSlot.date': this.timeSlot.date,
      status: { $nin: ['cancelled'] },
      $or: [
        {
          'timeSlot.startTime': { $lt: this.timeSlot.endTime },
          'timeSlot.endTime': { $gt: this.timeSlot.startTime },
        },
      ],
    });

    if (overlappingAppointment) {
      next(new Error('所选时间段已被预约'));
    }
  }
  next();
});

const Appointment = mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', appointmentSchema);

export default Appointment; 
