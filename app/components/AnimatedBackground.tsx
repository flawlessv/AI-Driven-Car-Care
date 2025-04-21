/**
 * 动态背景组件
 * 
 * 这个组件使用Canvas创建一个带有连接线的粒子动画背景
 * 'use client' 标记表示这个组件在浏览器端运行，而不是在服务器端
 */
'use client';

import { useEffect, useRef } from 'react';

/**
 * 动态背景组件
 * 创建粒子动画效果的背景
 * 
 * @returns {JSX.Element} Canvas元素作为背景
 */
export default function AnimatedBackground() {
  // 创建对Canvas元素的引用
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // 获取Canvas元素
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 获取2D绘图上下文
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /**
     * 设置Canvas尺寸以匹配窗口大小
     */
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    // 初始化Canvas尺寸
    setCanvasSize();
    // 监听窗口大小变化，调整Canvas尺寸
    window.addEventListener('resize', setCanvasSize);

    // 创建粒子数组
    const particles: any[] = [];
    // 生成50个随机位置和特性的粒子
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,        // 随机X坐标
        y: Math.random() * canvas.height,       // 随机Y坐标
        radius: Math.random() * 2 + 1,          // 随机半径(1-3)
        speedX: Math.random() * 2 - 1,          // 随机X方向速度(-1到1)
        speedY: Math.random() * 2 - 1,          // 随机Y方向速度(-1到1)
        opacity: Math.random() * 0.5 + 0.2      // 随机透明度(0.2-0.7)
      });
    }

    /**
     * 动画循环函数
     * 更新粒子位置并绘制粒子和连接线
     */
    function animate() {
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 更新并绘制每个粒子
      particles.forEach((particle, i) => {
        // 更新粒子位置
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // 边界检查 - 如果粒子碰到边界则反弹
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        // 绘制粒子
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${particle.opacity})`;  // 蓝色粒子
        ctx.fill();

        // 绘制粒子之间的连接线
        particles.forEach((particle2, j) => {
          // 跳过自己
          if (i === j) return;
          // 计算两粒子间距离
          const dx = particle.x - particle2.x;
          const dy = particle.y - particle2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // 只在粒子间距离小于100时绘制连线
          if (distance < 100) {
            ctx.beginPath();
            // 线的透明度随距离增加而减小
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 * (1 - distance / 100)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particle2.x, particle2.y);
            ctx.stroke();
          }
        });
      });

      // 请求下一帧动画
      requestAnimationFrame(animate);
    }

    // 启动动画
    animate();

    // 组件卸载时清理事件监听器
    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);  // 空依赖数组表示这个效果只在组件挂载时运行一次

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10"  // 固定定位，全屏，负z-index使其位于所有内容后面
    />
  );
} 