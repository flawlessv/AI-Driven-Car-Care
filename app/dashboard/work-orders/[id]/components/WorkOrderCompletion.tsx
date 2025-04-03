'use client';

import React, { useState } from 'react';
import { Card, Upload, Button, message, Space, Image, Alert } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { RcFile } from 'antd/es/upload';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

interface WorkOrderCompletionProps {
  workOrderId: string;
  status: string;
  completionProof?: {
    proofImages?: string[];
    notes?: string;
    approved?: boolean;
  };
  onSubmitSuccess: () => void;
}

const WorkOrderCompletion: React.FC<WorkOrderCompletionProps> = ({
  workOrderId,
  status,
  completionProof,
  onSubmitSuccess
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState('');
  
  const user = useSelector((state: RootState) => state.auth.user);
  const isTechnician = user?.role === 'technician';
  const isAdmin = user?.role === 'admin';
  
  // 检查工单是否处于可以上传证明的状态
  const canSubmitProof = isTechnician && (status === 'in_progress' || status === 'pending_check');
  
  // 检查是否已有完成证明图片
  const hasProofImages = completionProof?.proofImages && completionProof.proofImages.length > 0;
  
  // 检查是否可以审批
  const canApprove = isAdmin && status === 'pending_check' && hasProofImages && 
                     typeof completionProof?.approved === 'boolean' && !completionProof.approved;

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
      return false;
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过5MB!');
      return false;
    }
    
    return false;
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择要上传的图片');
      return;
    }
    
    setUploading(true);
    
    try {
      // 模拟文件上传，获取图片URL
      const imageUrls = await Promise.all(
        fileList.map(file => getBase64(file))
      );
      
      // 根据工单状态决定使用哪个API端点
      const endpoint = status === 'pending_check'
        ? `/api/work-orders/${workOrderId}/additional-proof`
        : `/api/work-orders/${workOrderId}/completion-proof`;
      
      // 提交到API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proofImages: imageUrls,
          notes,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '提交失败');
      }
      
      // 成功处理
      message.success(status === 'pending_check' 
        ? '补充证明提交成功' 
        : '完成证明提交成功，工单状态已更新为待审核');
      setFileList([]);
      setNotes('');
      onSubmitSuccess();
    } catch (error: any) {
      message.error(`上传失败: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // 转换文件为base64
  const getBase64 = (file: UploadFile): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      if (file.originFileObj) {
        reader.readAsDataURL(file.originFileObj as Blob);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      } else {
        reject(new Error('无效的文件对象'));
      }
    });
  };

  // 如果没有相关权限，不渲染任何内容
  if (!canSubmitProof && !hasProofImages && !canApprove) {
    return null;
  }

  return (
    <Card className="mt-4" title="工作完成证明">
      {/* 显示已上传的证明图片 */}
      {hasProofImages && (
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-2">已提交的证明图片</h4>
          {completionProof?.notes && (
            <p className="mb-2 text-gray-600">
              <strong>备注:</strong> {completionProof.notes}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {completionProof?.proofImages?.map((img, index) => (
              <div key={index} className="w-32 h-32 relative">
                <Image 
                  src={img} 
                  alt={`证明图片 ${index + 1}`}
                  style={{ objectFit: 'cover', height: '100%', width: '100%' }}
                />
              </div>
            ))}
          </div>
          
          {typeof completionProof?.approved === 'boolean' && (
            <Alert 
              message={completionProof.approved ? "已审核通过" : "待审核"} 
              type={completionProof.approved ? "success" : "info"} 
              className="mt-3"
            />
          )}
        </div>
      )}
      
      {/* 上传新的证明图片 */}
      {canSubmitProof && (
        <div>
          <h4 className="text-lg font-medium mb-2">
            {status === 'pending_check' ? '上传补充证明' : '上传完成证明'}
          </h4>
          
          {status === 'pending_check' && (
            <Alert
              message="您的工作正在等待审核，您可以上传补充的证明图片"
              type="info"
              className="mb-3"
            />
          )}
          
          <Upload
            listType="picture-card"
            fileList={fileList}
            beforeUpload={beforeUpload}
            onChange={handleChange}
          >
            {fileList.length >= 8 ? null : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传图片</div>
              </div>
            )}
          </Upload>
          
          <textarea
            className="w-full p-2 border rounded mb-3"
            placeholder="添加说明(可选)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
          
          <Button
            type="primary"
            onClick={handleUpload}
            disabled={fileList.length === 0}
            loading={uploading}
            icon={<UploadOutlined />}
          >
            {status === 'pending_check' ? '提交补充证明' : '提交完成证明'}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default WorkOrderCompletion; 