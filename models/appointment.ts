import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String
  },
  vehicle: {
    brand: { type: String, required: true },
    model: { type: String, required: true },
    licensePlate: { type: String, required: true }
  },
  service: {
    type: {
      type: String,
      enum: ['maintenance', 'repair', 'inspection'],
      required: true
    },
    name: { type: String, required: true },
    description: String,
    duration: { type: Number, required: true },
    basePrice: { type: Number, required: true }
  },
  timeSlot: {
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: String,
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
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
      'timeSlot.technician': this?.timeSlot?.technician,
      'timeSlot.date': this?.timeSlot?.date,
      status: { $nin: ['cancelled'] },  
      $or: [
        {
          'timeSlot.startTime': { $lt: this?.timeSlot?.endTime },
          'timeSlot.endTime': { $gt: this?.timeSlot?.startTime },
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

const Appointment = mongoose.model('Appointment', appointmentSchema);

export function getAppointmentModel() {
  return mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
}

export default Appointment; 
