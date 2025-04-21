import { NextResponse } from 'next/server';

/**
 * API响应的通用接口
 * @template T - 响应数据的类型
 * @property {boolean} success - 表示请求是否成功
 * @property {string} [message] - 可选的响应消息
 * @property {T} [data] - 可选的响应数据
 * @property {any} [errors] - 可选的错误信息
 */
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

/**
 * 创建成功响应
 * @template T - 响应数据的类型
 * @param {T} data - 要返回的数据
 * @param {string} [message] - 可选的成功消息
 * @returns {NextResponse} - 包含成功状态和数据的响应对象
 */
export function successResponse<T>(data: T, message?: string) {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  
  if (message) {
    response.message = message;
  }

  return NextResponse.json(response);
}

/**
 * 创建错误响应
 * @param {string} message - 错误消息
 * @param {number} [status=500] - HTTP状态码，默认为500(服务器错误)
 * @returns {NextResponse} - 包含错误信息的响应对象
 */
export function errorResponse(message: string, status: number = 500) {
  const response: ApiResponse = {
    success: false,
    message,
  };

  return NextResponse.json(response, { status });
}

/**
 * 创建验证错误响应
 * @param {any} errors - 验证错误的详细信息
 * @returns {NextResponse} - 包含验证错误信息的响应对象，状态码为400(错误请求)
 */
export function validationErrorResponse(errors: any) {
  const response: ApiResponse = {
    success: false,
    message: '验证失败',
    errors,
  };

  return NextResponse.json(response, { status: 400 });
}

/**
 * 创建禁止访问响应
 * @param {string} [message='无权访问'] - 禁止访问的消息
 * @returns {NextResponse} - 包含禁止访问信息的响应对象，状态码为403(禁止)
 */
export function forbiddenResponse(message: string = '无权访问') {
  const response: ApiResponse = {
    success: false,
    message,
  };

  return NextResponse.json(response, { status: 403 });
}

/**
 * 创建资源不存在响应
 * @param {string} [message='资源不存在'] - 资源不存在的消息
 * @returns {NextResponse} - 包含资源不存在信息的响应对象，状态码为404(未找到)
 */
export function notFoundResponse(message: string = '资源不存在') {
  const response: ApiResponse = {
    success: false,
    message,
  };

  return NextResponse.json(response, { status: 404 });
}

/**
 * 创建未授权访问响应
 * @param {string} [message='未授权访问'] - 未授权访问的消息
 * @returns {NextResponse} - 包含未授权访问信息的响应对象，状态码为401(未授权)
 */
export function unauthorizedResponse(message: string = '未授权访问') {
  const response: ApiResponse = {
    success: false,
    message,
  };

  return NextResponse.json(response, { status: 401 });
}

/**
 * 创建资源已创建的成功响应
 * @template T - 响应数据的类型
 * @param {T} data - 要返回的数据
 * @param {string} [message] - 可选的成功消息
 * @returns {NextResponse} - 包含成功状态和数据的响应对象，状态码为201(已创建)
 */
export function createdResponse<T>(data: T, message?: string) {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  
  if (message) {
    response.message = message;
  }

  return NextResponse.json(response, { status: 201 });
} 