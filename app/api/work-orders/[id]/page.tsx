import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, Space, Tag, Descriptions, Button, Modal, Form, Input, Select, DatePicker, Upload, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import WorkOrderForm from '../components/WorkOrderForm';
// Add missing code block here if needed.

// In the fetchWorkOrder function:
const fetchWorkOrder = async () => {
  setLoading(true);
  try {
    const response = await fetch(`/api/work-orders/${params.id}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || '获取工单详情失败');
    }
    
    // 获取工单数据
    if (result.data) {
      console.log('获取到的工单数据:', result.data);
      setWorkOrder(result.data);
    } else {
      console.error('工单数据格式错误:', result);
      throw new Error('工单数据格式错误');
    }
    
    // 获取进度数据
    if (result.progress && Array.isArray(result.progress)) {
      console.log('获取到的进度数据:', result.progress);
      
      // 对进度记录按创建时间排序，确保时间戳正确显示
      const sortedProgress = [...result.progress].sort((a, b) => {
        // 使用ISO时间字符串直接比较
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      
      setProgress(sortedProgress);
    } else {
      // 如果没有获取到进度数据，使用空数组
      setProgress([]);
      console.warn('未获取到进度记录');
      
      // 尝试单独获取进度记录
      fetchProgress();
    }
  } catch (error: any) {
    console.error('获取工单详情失败:', error);
    message.error(error.message || '获取工单详情失败');
  } finally {
    setLoading(false);
  }
}; 