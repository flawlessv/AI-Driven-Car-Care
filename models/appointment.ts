import mongoose from 'mongoose';

// 定义更简单的schema，移除复杂嵌套结构
const appointmentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  // 改为引用Vehicle模型
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  // 改为引用Service模型
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  date: { 
    type: Date, 
    required: true 
  },
  startTime: { 
    type: String, 
    required: true 
  },
  endTime: String,
  technician: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: String,
  estimatedDuration: { type: Number, required: true },
  estimatedCost: { type: Number, required: true },
  confirmationSent: { type: Boolean, default: false },
  reminderSent: { type: Boolean, default: false }
}, {
  timestamps: true
});

// 创建预约前检查时间段是否可用
appointmentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Appointment = mongoose.model('Appointment');
    const overlappingAppointment = await Appointment.findOne({
      technician: this.technician,
      date: this.date,
      status: { $nin: ['cancelled'] },  
      $or: [
        {
          startTime: { $lt: this.endTime },
          endTime: { $gt: this.startTime },
        },
      ],
    });

    if (overlappingAppointment) {
      next(new Error('所选时间段已被预约'));
    }
  }
  next();
});

// 确保模型只被创建一次
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

export function getAppointmentModel() {
  return mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
}

export default Appointment; 
