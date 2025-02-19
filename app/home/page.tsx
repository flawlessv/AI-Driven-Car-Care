'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const router = useRouter();

  // 鼠标跟随效果
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const services = [
    {
      title: '新能源专享',
      description: '专业新能源汽车保养服务，包括电池检测、电机维护等',
      icon: '⚡',
      price: '￥399起'
    },
    {
      title: '智能系统',
      description: '智能系统检测、软件升级、功能设置等专业服务',
      icon: '🔌',
      price: '￥199起'
    },
    {
      title: '传统保养',
      description: '轮胎、制动、底盘等传统汽车保养服务',
      icon: '🔧',
      price: '￥299起'
    },
    {
      title: '深度养护',
      description: '空调、内饰、外观等深度养护服务',
      icon: '✨',
      price: '￥599起'
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

  const serviceProcess = [
    { title: '在线预约', icon: '📱', description: '选择服务项目和预约时间' },
    { title: '到店检查', icon: '🔍', description: '专业技师检查车辆状况' },
    { title: '制定方案', icon: '📋', description: '根据检查结果制定保养方案' },
    { title: '开始保养', icon: '🔧', description: '使用专业设备进行保养维护' },
    { title: '品质检验', icon: '✅', description: '完成后进行质量检验' },
    { title: '完成交付', icon: '🚗', description: '交付车辆并提供保养建议' }
  ];

  const testimonials = [
    {
      name: '李先生',
      car: '奔驰C200',
      content: '服务很专业，技师很耐心，价格也很透明，非常满意！',
      rating: 5
    },
    {
      name: '张女士',
      car: '宝马320Li',
      content: '预约很方便，服务很贴心，会继续光顾的！',
      rating: 5
    },
    {
      name: '王先生',
      car: '奥迪A4L',
      content: '技术过硬，服务周到，值得推荐！',
      rating: 5
    }
  ];

  const stats = [
    { 
      number: '2,891', 
      label: '本月服务', 
      icon: '🚗',
      trend: '+12.5%',
      description: '较上月增长'
    },
    { 
      number: '68%', 
      label: '新能源占比', 
      icon: '⚡',
      trend: '+5.8%',
      description: '新能源车服务占比'
    },
    { 
      number: '486', 
      label: 'SU7服务', 
      icon: '🔋',
      trend: '+25.3%',
      description: '小米SU7服务量'
    },
    { 
      number: '4.92', 
      label: '服务评分', 
      icon: '⭐',
      trend: '+0.2',
      description: '本月平均评分'
    },
    { 
      number: '156', 
      label: '认证技师', 
      icon: '👨‍🔧',
      trend: '+8',
      description: '持证技师数量'
    },
    { 
      number: '12,580', 
      label: '服务时长', 
      icon: '⏱️',
      trend: '小时',
      description: '累计服务时长'
    },
    { 
      number: '3,267', 
      label: '本月预约', 
      icon: '📅',
      trend: '+16.7%',
      description: '较上月增长'
    },
    { 
      number: '98.6%', 
      label: '好评率', 
      icon: '👍',
      trend: '+0.8%',
      description: '本月好评率'
    }
  ];

  const news = [
    {
      title: '小米SU7养护指南',
      date: '2024-03-20',
      description: '小米SU7作为新一代智能电动车，如何正确保养？专业技师为您详细解答...'
    },
    {
      title: '新能源汽车电池保养',
      date: '2024-03-15',
      description: '电池是新能源汽车的心脏，如何延长电池寿命？一文带你了解电池保养秘诀...'
    },
    {
      title: '智能汽车系统维护',
      date: '2024-03-10',
      description: '智能系统日常维护、系统升级、功能设置等专业指导，让您的爱车始终保持最佳状态...'
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* 进度条 */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-500 z-50"
        style={{ scaleX }}
      />

      {/* 鼠标跟随效果 */}
      <motion.div
        className="fixed w-10 h-10 rounded-full bg-blue-500 opacity-20 pointer-events-none z-50"
        animate={{
          x: mousePosition.x - 20,
          y: mousePosition.y - 20,
          scale: 1.5
        }}
        transition={{ type: "spring", stiffness: 150, damping: 15 }}
      />

      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-black bg-opacity-50 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="text-xl font-bold">汽车保养管理系统</div>
            <div className="flex space-x-8">
              <a href="#services" className="text-gray-300 hover:text-white transition-colors">服务项目</a>
              <a href="#process" className="text-gray-300 hover:text-white transition-colors">服务流程</a>
              <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">用户评价</a>
              <a href="#news" className="text-gray-300 hover:text-white transition-colors">新闻动态</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">关于我们</a>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg transition-all"
              >
                后台管理
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* 背景图片 */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url("https://cdn.cnbj1.fds.api.mi-img.com/product-images/xiaomi-su7max/su7max-silver.png")',
              filter: 'brightness(0.7)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 20% 20%, rgba(255,0,0,0.15) 0%, rgba(0,0,0,0) 70%)',
                'radial-gradient(circle at 80% 80%, rgba(0,255,0,0.15) 0%, rgba(0,0,0,0) 70%)',
                'radial-gradient(circle at 50% 50%, rgba(0,0,255,0.15) 0%, rgba(0,0,0,0) 70%)',
                'radial-gradient(circle at 80% 20%, rgba(255,255,0,0.15) 0%, rgba(0,0,0,0) 70%)',
              ],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </div>

        {/* 主要内容 */}
        <div className="container mx-auto px-4 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center"
          >
            <motion.h1 
              className="text-7xl font-bold mb-6 neon-text"
              animate={{ 
                textShadow: [
                  "0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #0fa",
                  "0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #f0a",
                  "0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #0af",
                ]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              伟佳汽车保养服务平台
            </motion.h1>
            <p className="text-2xl mb-8 text-gray-300">
              科技驱动 · 智慧保养 · 专业服务
            </p>
            <div className="flex justify-center space-x-6">
              <motion.a
                href="#services"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-lg font-semibold hover:shadow-lg transition-all"
              >
                了解服务
              </motion.a>
              <motion.a
                href="#booking"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-white text-blue-900 rounded-full text-lg font-semibold hover:shadow-lg transition-all"
              >
                立即预约
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 数据统计 */}
      <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
          >
            服务数据
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect rounded-xl p-6 hover-glow relative overflow-hidden"
              >
                <motion.div
                  className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full opacity-10 -mr-16 -mt-16"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
                <div className="flex justify-between items-start mb-4">
                  <div className="text-3xl">{stat.icon}</div>
                  <motion.div 
                    className={`text-sm font-medium px-2 py-1 rounded-full ${
                      stat.trend.includes('-') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    {stat.trend}
                  </motion.div>
                </div>
                <motion.div
                  className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.1 }}
                >
                  {stat.number}
                </motion.div>
                <div className="text-lg font-medium text-white mt-2">{stat.label}</div>
                <div className="text-sm text-gray-400 mt-1">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 服务项目 */}
      <section id="services" className="py-20 bg-black bg-opacity-50">
        <div className="container mx-auto px-4">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
          >
            服务项目
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="glass-effect rounded-xl p-6 hover-glow cursor-pointer"
              >
                <motion.div 
                  className="text-4xl mb-4"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  {service.icon}
                </motion.div>
                <h3 className="text-xl font-bold mb-2 text-white">{service.title}</h3>
                <p className="text-gray-300 mb-4">{service.description}</p>
                <div className="text-2xl font-bold text-blue-400">{service.price}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 服务流程 */}
      <section id="process" className="py-20">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
          >
            服务流程
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviceProcess.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect rounded-xl p-6 hover-glow relative"
              >
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-lg font-bold">
                  {index + 1}
                </div>
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-300">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 用户评价 */}
      <section id="testimonials" className="py-20 bg-black bg-opacity-50">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
          >
            用户评价
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect rounded-xl p-6 hover-glow"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-xl font-bold">
                    {testimonial.name[0]}
                  </div>
                  <div className="ml-4">
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-gray-400 text-sm">{testimonial.car}</div>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">{testimonial.content}</p>
                <div className="flex text-yellow-400">
                  {'★'.repeat(testimonial.rating)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 新闻动态 */}
      <section id="news" className="py-20">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
          >
            新闻动态
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect rounded-xl p-6 hover-glow cursor-pointer"
              >
                <div className="text-sm text-blue-400 mb-2">{item.date}</div>
                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                <p className="text-gray-300">{item.description}</p>
                <motion.div
                  className="mt-4 text-blue-400"
                  whileHover={{ x: 10 }}
                >
                  阅读更多 →
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 预约服务 */}
      <section id="booking" className="py-20 bg-black bg-opacity-50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto glass-effect rounded-xl p-8"
          >
            <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              预约服务
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <motion.div 
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-xl font-bold mb-2">电话预约</h3>
                <p className="text-gray-300">400-888-8888</p>
              </motion.div>
              <motion.div 
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-bold mb-2">在线咨询</h3>
                <p className="text-gray-300">点击右下角客服</p>
              </motion.div>
              <motion.div 
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-4xl mb-4">🏪</div>
                <h3 className="text-xl font-bold mb-2">到店预约</h3>
                <p className="text-gray-300">查看门店地址</p>
              </motion.div>
            </div>
            <div className="text-center text-gray-300">
              <h3 className="text-xl font-bold mb-4">营业时间</h3>
              <p>周一至周五：08:00 - 18:00</p>
              <p>周六至周日：09:00 - 17:00</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 关于我们 */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">关于我们</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              我们是一家专注于汽车保养维修的专业服务商，拥有先进的设备和专业的技术团队，
              致力于为每一位车主提供优质、便捷、透明的汽车保养服务。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ scale: 1.05 }}
                className="glass-effect rounded-xl p-6 text-center hover-glow"
              >
                <motion.div 
                  className="text-6xl mb-4"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {member.avatar}
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                <div className="text-blue-400 mb-4">{member.role}</div>
                <p className="text-gray-300">{member.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="glass-effect rounded-xl p-8 max-w-4xl mx-auto"
          >
            <h3 className="text-2xl font-bold text-white mb-6">我们的优势</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                className="flex items-start space-x-4"
                whileHover={{ x: 10 }}
              >
                <div className="text-2xl">🛠️</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">专业设备</h4>
                  <p className="text-gray-300">配备进口专业检测设备，确保维修质量</p>
                </div>
              </motion.div>
              <motion.div 
                className="flex items-start space-x-4"
                whileHover={{ x: 10 }}
              >
                <div className="text-2xl">👨‍🔧</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">技术团队</h4>
                  <p className="text-gray-300">经验丰富的维修团队，持证上岗</p>
                </div>
              </motion.div>
              <motion.div 
                className="flex items-start space-x-4"
                whileHover={{ x: 10 }}
              >
                <div className="text-2xl">⚡</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">快速服务</h4>
                  <p className="text-gray-300">标准化流程，高效完成保养维修</p>
                </div>
              </motion.div>
              <motion.div 
                className="flex items-start space-x-4"
                whileHover={{ x: 10 }}
              >
                <div className="text-2xl">💰</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">透明定价</h4>
                  <p className="text-gray-300">明码标价，无隐藏费用</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 回到顶部按钮 */}
      <motion.button
        className="fixed bottom-8 right-8 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </motion.button>
    </main>
  );
} 
