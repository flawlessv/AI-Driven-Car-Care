'use client';

import Link from 'next/link';
import { Button, Result, Card, Steps, Typography } from 'antd';
import { motion } from 'framer-motion';
import { CheckCircleOutlined, PhoneOutlined, TeamOutlined, CarOutlined, ToolOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function AppointmentSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto"
      >
        <Result
          status="success"
          title={<Title level={2} className="text-white">预约提交成功！</Title>}
          subTitle={<Text className="text-gray-300">我们已收到您的预约申请，技师将尽快与您联系确认详细信息。</Text>}
          extra={[
            <Link href="/" key="home">
              <Button type="primary" size="large">
                返回首页
              </Button>
            </Link>
          ]}
        />

        <Card className="mt-8 bg-white/10 backdrop-blur-sm border-none shadow-xl">
          <Typography.Title level={3} className="text-white">
            下一步流程
          </Typography.Title>
          
          <Steps 
            direction="vertical" 
            className="mt-6 text-white"
            items={[
              {
                title: '预约已提交',
                description: '您的预约信息已成功提交到我们的系统',
                icon: <CheckCircleOutlined />,
                status: 'finish'
              },
              {
                title: '技师确认',
                description: '技师将与您电话联系，确认车辆问题和服务详情',
                icon: <PhoneOutlined />,
                status: 'process'
              },
              {
                title: '技师分配',
                description: '根据您的需求分配专业技师并安排具体服务时间',
                icon: <TeamOutlined />,
                status: 'wait'
              },
              {
                title: '到店服务',
                description: '按约定时间到店，技师将为您的爱车提供专业服务',
                icon: <CarOutlined />,
                status: 'wait'
              },
              {
                title: '完成服务',
                description: '服务完成后，您可以对我们的服务进行评价',
                icon: <ToolOutlined />,
                status: 'wait'
              }
            ]}
          />
        </Card>

        <Card className="mt-8 bg-white/10 backdrop-blur-sm border-none shadow-xl">
          <Typography.Title level={3} className="text-white">
            重要提示
          </Typography.Title>
          
          <Paragraph className="text-gray-200 mt-4">
            • 技师将在<Text strong className="text-white">24小时内</Text>与您电话联系，请保持手机畅通。
          </Paragraph>
          <Paragraph className="text-gray-200">
            • 您预约的时间仅作为参考，具体服务时间将在电话确认时安排。
          </Paragraph>
          <Paragraph className="text-gray-200">
            • 如需变更或取消预约，请提前致电客服热线：<Text strong className="text-white">400-1234-5678</Text>
          </Paragraph>
        </Card>
      </motion.div>
    </div>
  );
} 