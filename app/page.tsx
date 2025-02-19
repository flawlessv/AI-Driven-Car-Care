'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/home');
  }, [router]);

  const services = [
    {
      title: '常规保养',
      description: '包括机油更换、滤芯更换、制动系统检查等基础保养项目',
      icon: '🔧',
      price: '￥299起'
    },
    {
      title: '深度保养',
      description: '发动机清洗、变速箱油更换、火花塞更换等深度保养服务',
      icon: '⚙️',
      price: '￥599起'
    },
    {
      title: '故障诊断',
      description: '专业的故障诊断系统，准确定位车辆问题',
      icon: '🔍',
      price: '￥99起'
    },
    {
      title: '轮胎服务',
      description: '轮胎更换、动平衡调整、四轮定位等专业服务',
      icon: '🛞',
      price: '￥199起'
    }
  ];

  const teamMembers = [
    {
      name: '张经理',
      role: '技术总监',
      avatar: '👨‍💼',
      description: '拥有15年汽车维修经验，专注于提供最专业的保养服务'
    },
    {
      name: '李工程师',
      role: '首席技师',
      avatar: '👨‍🔧',
      description: '德国汽车维修技师认证，擅长各类故障诊断与修复'
    },
    {
      name: '王经理',
      role: '客户服务主管',
      avatar: '👩‍💼',
      description: '致力于为客户提供最优质的服务体验'
    }
  ];

  return null;
}

