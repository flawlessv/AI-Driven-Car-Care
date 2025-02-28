import type { MaintenanceRecord } from '@/types/maintenance';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

// 导出维修记录为 Excel
export async function exportMaintenanceRecords(records: MaintenanceRecord[]) {
  try {
    const data = records.map(record => ({
      '车辆信息': `${record.vehicle?.brand} ${record.vehicle?.model} (${record.vehicle?.licensePlate})`,
      '维修类型': record.type === 'regular' ? '常规保养' : 
                 record.type === 'repair' ? '维修' : 
                 record.type === 'inspection' ? '检查' : record.type,
      '状态': record.status === 'pending' ? '待处理' :
             record.status === 'in_progress' ? '进行中' :
             record.status === 'completed' ? '已完成' :
             record.status === 'cancelled' ? '已取消' : record.status,
      '技师': record.technician?.name || '-',
      '开始日期': dayjs(record.startDate).format('YYYY-MM-DD'),
      '完成日期': record.completionDate ? dayjs(record.completionDate).format('YYYY-MM-DD') : '-',
      '费用': record.cost || 0,
      '备注': record.notes || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '维修记录');

    // 生成文件名
    const fileName = `维修记录_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
    
    // 导出文件
    XLSX.writeFile(wb, fileName);

    return true;
  } catch (error) {
    console.error('导出维修记录失败:', error);
    throw new Error('导出维修记录失败');
  }
}

// 导出维修报告
export async function exportMaintenanceReport(record: MaintenanceRecord) {
  try {
    const data = {
      '维修报告': '',
      '基本信息': {
        '车辆信息': `${record.vehicle?.brand} ${record.vehicle?.model} (${record.vehicle?.licensePlate})`,
        '维修类型': record.type === 'regular' ? '常规保养' : 
                   record.type === 'repair' ? '维修' : 
                   record.type === 'inspection' ? '检查' : record.type,
        '状态': record.status === 'pending' ? '待处理' :
               record.status === 'in_progress' ? '进行中' :
               record.status === 'completed' ? '已完成' :
               record.status === 'cancelled' ? '已取消' : record.status,
        '技师': record.technician?.name || '-',
        '开始日期': dayjs(record.startDate).format('YYYY-MM-DD'),
        '完成日期': record.completionDate ? dayjs(record.completionDate).format('YYYY-MM-DD') : '-',
        '费用': record.cost || 0,
      },
      '维修项目': record.items || [],
      '使用配件': record.parts || [],
      '维修说明': record.notes || '-',
      '客户建议': record.recommendations || '-'
    };

    const ws = XLSX.utils.json_to_sheet([data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '维修报告');

    // 生成文件名
    const fileName = `维修报告_${record.vehicle?.licensePlate}_${dayjs().format('YYYY-MM-DD')}.xlsx`;
    
    // 导出文件
    XLSX.writeFile(wb, fileName);

    return true;
  } catch (error) {
    console.error('导出维修报告失败:', error);
    throw new Error('导出维修报告失败');
  }
} 