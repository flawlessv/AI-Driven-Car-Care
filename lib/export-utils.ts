import * as XLSX from 'xlsx';
import type { MaintenanceRecord } from '@/types/maintenance';

export async function exportMaintenanceRecords(records: MaintenanceRecord[]) {
  try {
    // 准备数据
    const data = records.map(record => ({
      '车牌号': record.vehicle.licensePlate,
      '保养类型': record.type === 'regular' ? '常规保养' : record.type === 'repair' ? '维修' : '年检',
      '状态': record.status,
      '开始日期': new Date(record.startDate).toLocaleDateString(),
      '完成日期': record.completionDate ? new Date(record.completionDate).toLocaleDateString() : '-',
      '里程数': `${record.mileage}km`,
      '费用': `¥${record.cost}`,
      '技师': record.technician,
      '备注': record.notes || '-',
    }));

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // 设置列宽
    const colWidths = [
      { wch: 12 }, // 车牌号
      { wch: 10 }, // 保养类型
      { wch: 10 }, // 状态
      { wch: 12 }, // 开始日期
      { wch: 12 }, // 完成日期
      { wch: 10 }, // 里程数
      { wch: 10 }, // 费用
      { wch: 10 }, // 技师
      { wch: 20 }, // 备注
    ];
    ws['!cols'] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '保养记录');

    // 生成文件并下载
    XLSX.writeFile(wb, `保养记录_${new Date().toISOString().split('T')[0]}.xlsx`);

    return true;
  } catch (error) {
    console.error('Error exporting maintenance records:', error);
    throw error;
  }
}

export async function exportMaintenanceReport(record: MaintenanceRecord) {
  try {
    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // 基本信息工作表
    const basicInfo = [{
      '车牌号': record.vehicle.licensePlate,
      '品牌型号': `${record.vehicle.brand} ${record.vehicle.model}`,
      '保养类型': record.type === 'regular' ? '常规保养' : record.type === 'repair' ? '维修' : '年检',
      '状态': record.status,
      '开始日期': new Date(record.startDate).toLocaleDateString(),
      '完成日期': record.completionDate ? new Date(record.completionDate).toLocaleDateString() : '-',
      '里程数': `${record.mileage}km`,
      '总费用': `¥${record.cost}`,
      '技师': record.technician,
    }];
    const wsBasic = XLSX.utils.json_to_sheet(basicInfo);
    XLSX.utils.book_append_sheet(wb, wsBasic, '基本信息');

    // 配件清单工作表
    if (record.parts && record.parts.length > 0) {
      const partsData = record.parts.map((part, index) => ({
        '序号': index + 1,
        '配件名称': part.part.name,
        '配件编号': part.part.code,
        '数量': part.quantity,
        '单价': `¥${part.unitPrice}`,
        '总价': `¥${part.quantity * part.unitPrice}`,
      }));
      const wsParts = XLSX.utils.json_to_sheet(partsData);
      XLSX.utils.book_append_sheet(wb, wsParts, '配件清单');
    }

    // 生成文件并下载
    XLSX.writeFile(wb, `保养报告_${record.vehicle.licensePlate}_${new Date().toISOString().split('T')[0]}.xlsx`);

    return true;
  } catch (error) {
    console.error('Error exporting maintenance report:', error);
    throw error;
  }
} 