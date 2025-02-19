import {
  TimeSlot,
  Appointment,
  MaintenanceService,
  TechnicianSchedule,
  AppointmentSettings,
  AppointmentRecommendation,
} from '@/types/appointment';
import { User } from '@/types/user';
import { Vehicle } from '@/types/vehicle';

export class AppointmentService {
  private static instance: AppointmentService;
  private settings: AppointmentSettings = {
    workingHours: {
      startTime: '09:00',
      endTime: '18:00',
    },
    timeSlotDuration: 30,
    maxDaysInAdvance: 30,
    minHoursInAdvance: 24,
    autoConfirmation: false,
    reminderSettings: {
      enableEmail: true,
      enableSMS: false,
      enablePush: true,
      reminderHours: [24, 2], // 提前24小时和2小时提醒
    },
  };

  private constructor() {}

  public static getInstance(): AppointmentService {
    if (!AppointmentService.instance) {
      AppointmentService.instance = new AppointmentService();
    }
    return AppointmentService.instance;
  }

  // 预约相关方法
  public async createAppointment(data: {
    customer: User;
    vehicle: Vehicle;
    service: MaintenanceService;
    timeSlot: TimeSlot;
    notes?: string;
  }): Promise<Appointment> {
    try {
      // 验证时间段是否可用
      const isAvailable = await this.checkTimeSlotAvailability(data.timeSlot);
      if (!isAvailable) {
        throw new Error('所选时间段已被预约');
      }

      // 创建预约
      const appointment: Partial<Appointment> = {
        customer: data.customer,
        vehicle: data.vehicle,
        service: data.service,
        timeSlot: data.timeSlot,
        status: 'pending',
        notes: data.notes,
        estimatedDuration: data.service.duration,
        estimatedCost: data.service.basePrice,
        confirmationSent: false,
        reminderSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // TODO: 保存预约到数据库

      // 如果启用了自动确认，直接确认预约
      if (this.settings.autoConfirmation) {
        await this.confirmAppointment(appointment as Appointment);
      }

      return appointment as Appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  public async updateAppointmentStatus(
    appointmentId: string,
    status: Appointment['status']
  ): Promise<Appointment> {
    try {
      // TODO: 实现更新预约状态的逻辑
      return {} as Appointment;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  public async cancelAppointment(appointmentId: string): Promise<void> {
    try {
      // TODO: 实现取消预约的逻辑
    } catch (error) {
      console.error('Error canceling appointment:', error);
      throw error;
    }
  }

  // 时间段管理
  public async generateTimeSlots(date: Date): Promise<TimeSlot[]> {
    try {
      const slots: TimeSlot[] = [];
      const { startTime, endTime } = this.settings.workingHours;
      const duration = this.settings.timeSlotDuration;

      let currentTime = new Date(`${date.toDateString()} ${startTime}`);
      const endDateTime = new Date(`${date.toDateString()} ${endTime}`);

      while (currentTime < endDateTime) {
        const slot: Partial<TimeSlot> = {
          date: new Date(currentTime),
          startTime: currentTime.toTimeString().slice(0, 5),
          endTime: new Date(
            currentTime.getTime() + duration * 60000
          ).toTimeString().slice(0, 5),
          isAvailable: true,
        };

        slots.push(slot as TimeSlot);
        currentTime = new Date(currentTime.getTime() + duration * 60000);
      }

      return slots;
    } catch (error) {
      console.error('Error generating time slots:', error);
      throw error;
    }
  }

  // 智能推荐
  public async getRecommendations(params: {
    service: MaintenanceService;
    preferredDate?: Date;
    preferredTime?: string;
  }): Promise<AppointmentRecommendation[]> {
    try {
      const recommendations: AppointmentRecommendation[] = [];
      const startDate = params.preferredDate || new Date();
      const endDate = new Date(
        startDate.getTime() + this.settings.maxDaysInAdvance * 24 * 60 * 60 * 1000
      );

      // 获取可用时间段
      const availableSlots = await this.getAvailableSlots(startDate, endDate);

      // 获取技师排班信息
      const technicianSchedules = await this.getTechnicianSchedules(
        startDate,
        endDate,
        params.service.availableTechnicians
      );

      // 计算每个时间段的推荐分数
      for (const slot of availableSlots) {
        const score = await this.calculateRecommendationScore(slot, {
          service: params.service,
          preferredTime: params.preferredTime,
          technicianSchedules,
        });

        if (score > 0) {
          const technician = await this.findBestTechnician(
            slot,
            params.service,
            technicianSchedules
          );

          recommendations.push({
            timeSlot: slot,
            score,
            technician: technician as User,
            reasons: this.generateRecommendationReasons(score, slot, technician),
            alternativeSlots: await this.findAlternativeSlots(slot, params.service),
          });
        }
      }

      // 按分数排序并返回前5个推荐
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  // 技师排班管理
  public async updateTechnicianSchedule(
    technicianId: string,
    date: Date,
    shifts: TechnicianSchedule['shifts']
  ): Promise<TechnicianSchedule> {
    try {
      // TODO: 实现更新技师排班的逻辑
      return {} as TechnicianSchedule;
    } catch (error) {
      console.error('Error updating technician schedule:', error);
      throw error;
    }
  }

  // 私有辅助方法
  private async checkTimeSlotAvailability(timeSlot: TimeSlot): Promise<boolean> {
    // TODO: 实现检查时间段可用性的逻辑
    return true;
  }

  private async confirmAppointment(appointment: Appointment): Promise<void> {
    try {
      // 更新预约状态
      appointment.status = 'confirmed';
      appointment.confirmationSent = true;
      appointment.updatedAt = new Date();

      // TODO: 发送确认通知
      // TODO: 更新技师排班
      // TODO: 保存更新到数据库
    } catch (error) {
      console.error('Error confirming appointment:', error);
      throw error;
    }
  }

  private async getAvailableSlots(
    startDate: Date,
    endDate: Date
  ): Promise<TimeSlot[]> {
    // TODO: 实现获取可用时间段的逻辑
    return [];
  }

  private async getTechnicianSchedules(
    startDate: Date,
    endDate: Date,
    technicianIds: string[]
  ): Promise<TechnicianSchedule[]> {
    // TODO: 实现获取技师排班的逻辑
    return [];
  }

  private async calculateRecommendationScore(
    slot: TimeSlot,
    params: {
      service: MaintenanceService;
      preferredTime?: string;
      technicianSchedules: TechnicianSchedule[];
    }
  ): Promise<number> {
    let score = 100;

    // 根据与期望时间的接近程度评分
    if (params.preferredTime) {
      const timeDiff = this.calculateTimeDifference(slot.startTime, params.preferredTime);
      if (timeDiff <= 30) {
        score += 20;
      } else if (timeDiff <= 60) {
        score += 10;
      }
    }

    // 根据技师可用性评分
    const availableTechnicians = this.getAvailableTechnicians(
      slot,
      params.service,
      params.technicianSchedules
    );
    score += availableTechnicians.length * 5;

    // 其他评分因素...

    return Math.max(0, Math.min(100, score));
  }

  private async findBestTechnician(
    slot: TimeSlot,
    service: MaintenanceService,
    schedules: TechnicianSchedule[]
  ): Promise<User | null> {
    // TODO: 实现查找最佳技师的逻辑
    return null;
  }

  private generateRecommendationReasons(
    score: number,
    slot: TimeSlot,
    technician: User | null
  ): string[] {
    const reasons: string[] = [];

    if (score >= 90) {
      reasons.push('这是一个最佳的时间段选择');
    }

    if (technician) {
      reasons.push(`有经验丰富的技师${technician.name}可以为您服务`);
    }

    // 添加其他原因...

    return reasons;
  }

  private async findAlternativeSlots(
    slot: TimeSlot,
    service: MaintenanceService
  ): Promise<TimeSlot[]> {
    // TODO: 实现查找备选时间段的逻辑
    return [];
  }

  private calculateTimeDifference(time1: string, time2: string): number {
    const [hours1, minutes1] = time1.split(':').map(Number);
    const [hours2, minutes2] = time2.split(':').map(Number);
    return Math.abs(hours1 * 60 + minutes1 - (hours2 * 60 + minutes2));
  }

  private getAvailableTechnicians(
    slot: TimeSlot,
    service: MaintenanceService,
    schedules: TechnicianSchedule[]
  ): string[] {
    return schedules
      .filter(schedule => 
        service.availableTechnicians.includes(schedule.technician._id) &&
        this.isTechnicianAvailable(schedule, slot)
      )
      .map(schedule => schedule.technician._id);
  }

  private isTechnicianAvailable(
    schedule: TechnicianSchedule,
    slot: TimeSlot
  ): boolean {
    return schedule.shifts.some(shift =>
      shift.status === 'available' &&
      this.isTimeInRange(slot.startTime, shift.startTime, shift.endTime)
    );
  }

  private isTimeInRange(time: string, start: string, end: string): boolean {
    const [timeHours, timeMinutes] = time.split(':').map(Number);
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);

    const timeValue = timeHours * 60 + timeMinutes;
    const startValue = startHours * 60 + startMinutes;
    const endValue = endHours * 60 + endMinutes;

    return timeValue >= startValue && timeValue <= endValue;
  }

  // 设置管理
  public updateSettings(settings: Partial<AppointmentSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  public getSettings(): AppointmentSettings {
    return { ...this.settings };
  }
} 