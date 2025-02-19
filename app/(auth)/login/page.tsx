'use client';

import LoginForm from '../../components/LoginForm';
import { motion } from 'framer-motion';
import Image from 'next/image';
import AnimatedBackground from '../../components/AnimatedBackground';

export default function LoginPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-custom">
      {/* 动态背景 */}
      <AnimatedBackground />
      
      {/* 装饰性光效 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full 
          mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-300 rounded-full 
          mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-400 rounded-full 
          mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* 主要内容 */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 relative overflow-hidden"
          >
            {/* 顶部装饰条 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" />
            
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
                className="relative group"
              >
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                  <Image
                    src="/images/logo.svg"
                    alt="伟佳汽修"
                    width={72}
                    height={72}
                    className="transform -rotate-12 group-hover:rotate-0 transition-all duration-300"
                  />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
              </motion.div>
            </div>

            {/* 标题 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
                伟佳汽修
              </h1>
              <p className="text-gray-600 mt-2">专业维修保养服务商</p>
              <p className="text-gray-500 text-sm mt-1">让每一辆车都得到最好的照顾</p>
            </motion.div>

            {/* 登录表单 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <LoginForm />
            </motion.div>
          </motion.div>

          {/* 版权信息 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-sm text-gray-600 mt-8"
          >
            © 2024 伟佳汽修. All rights reserved.
          </motion.p>
        </div>
      </div>
    </div>
  );
} 