import { Vehicle } from '@/models/vehicle';
import { MaintenanceRecord } from '@/types/maintenance';

interface HealthScore {
  overall: number;
  maintenance: number;
  mileage: number;
  age: number;
  repairs: number;
}

interface HealthReport {
  score: HealthScore;
  recommendations: string[];
  warnings: string[];
  lastUpdate: Date;
}

export class VehicleHealthService {
  private static instance: VehicleHealthService;

  private constructor() {}

  public static getInstance(): VehicleHealthService {
    if (!VehicleHealthService.instance) {
      VehicleHealthService.instance = new VehicleHealthService();
    }
    return VehicleHealthService.instance;
  }

  public async calculateHealthScore(vehicleId: string): Promise<HealthReport> {
    // TODO: 从数据库获取车辆信息并计算实际分数
    // 这里暂时返回模拟数据
    return {
      score: {
        overall: 85,
        maintenance: 90,
        mileage: 85,
        age: 88,
        repairs: 82,
      },
      recommendations: [
        '建议进行常规保养检查',
        '建议检查轮胎胎压',
        '建议更换空气滤芯',
      ],
      warnings: [
        '距离下次保养还有500公里',
        '后胎胎纹深度接近最低标准',
      ],
      lastUpdate: new Date(),
    };
  }

  private async getMaintenanceRecords(vehicleId: string): Promise<MaintenanceRecord[]> {
    // TODO: 实现获取维修记录的逻辑
    return [];
  }

  private calculateMaintenanceScore(vehicle: any, records: MaintenanceRecord[]): number {
    let score = 100;
    
    // 检查是否按时进行保养
    if (vehicle.nextMaintenance && vehicle.nextMaintenance < new Date()) {
      score -= 20;
    }

    // 检查保养间隔
    const maintenanceIntervals = this.calculateMaintenanceIntervals(records);
    if (maintenanceIntervals.some(interval => interval > 180)) { // 超过6个月
      score -= 15;
    }

    // 其他评分因素...

    return Math.max(0, Math.min(100, score));
  }

  private calculateMileageScore(vehicle: any): number {
    let score = 100;
    
    // 根据里程数评分
    const mileagePerYear = vehicle.mileage / this.calculateVehicleAge(vehicle);
    
    if (mileagePerYear > 30000) {
      score -= 20;
    } else if (mileagePerYear > 20000) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateAgeScore(vehicle: any): number {
    let score = 100;
    
    const age = this.calculateVehicleAge(vehicle);
    
    if (age > 10) {
      score -= 30;
    } else if (age > 5) {
      score -= 15;
    } else if (age > 3) {
      score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateRepairsScore(records: MaintenanceRecord[]): number {
    let score = 100;
    
    const repairs = records.filter(r => r.type === 'repair');
    const repairFrequency = repairs.length / 12; // 每年平均维修次数

    if (repairFrequency > 4) {
      score -= 30;
    } else if (repairFrequency > 2) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateOverallScore(scores: Omit<HealthScore, 'overall'>): number {
    const weights = {
      maintenance: 0.4,
      mileage: 0.2,
      age: 0.2,
      repairs: 0.2,
    };

    return Math.round(
      weights.maintenance * scores.maintenance +
      weights.mileage * scores.mileage +
      weights.age * scores.age +
      weights.repairs * scores.repairs
    );
  }

  private calculateMaintenanceIntervals(records: MaintenanceRecord[]): number[] {
    const sortedRecords = records
      .filter(r => r.type === 'regular')
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const intervals: number[] = [];
    for (let i = 1; i < sortedRecords.length; i++) {
      const days = Math.floor(
        (new Date(sortedRecords[i].startDate).getTime() - new Date(sortedRecords[i-1].startDate).getTime())
        / (1000 * 60 * 60 * 24)
      );
      intervals.push(days);
    }

    return intervals;
  }

  private calculateVehicleAge(vehicle: any): number {
    return new Date().getFullYear() - vehicle.year;
  }

  private generateRecommendations(vehicle: any, scores: HealthScore): string[] {
    const recommendations: string[] = [];

    if (scores.maintenance < 70) {
      recommendations.push('建议及时进行常规保养，保持车辆最佳状态。');
    }

    if (scores.mileage < 70) {
      recommendations.push('车辆行驶里程较高，建议进行全面检查。');
    }

    if (scores.age < 60) {
      recommendations.push('车辆年限较长，建议关注关键部件的使用状况。');
    }

    if (scores.repairs < 70) {
      recommendations.push('维修频率较高，建议进行预防性检查和保养。');
    }

    return recommendations;
  }

  private generateWarnings(vehicle: any, scores: HealthScore): string[] {
    const warnings: string[] = [];

    if (scores.overall < 60) {
      warnings.push('车辆整体状况需要注意，建议尽快进行全面检查。');
    }

    if (scores.maintenance < 50) {
      warnings.push('保养情况严重不足，可能影响车辆安全性能。');
    }

    if (vehicle.nextMaintenance && vehicle.nextMaintenance < new Date()) {
      warnings.push('已超过预定保养时间，请尽快安排保养。');
    }

    return warnings;
  }
} 