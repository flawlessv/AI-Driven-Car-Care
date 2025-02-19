import { NextResponse } from 'next/server';
import { ApiResponse, ApiError, ValidationError } from './api-types';

interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

interface SuccessResponse<T> {
  data: T;
  message?: string;
}

// 成功响应
export function successResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    data,
  };
  
  if (message) {
    response.message = message;
  }

  return NextResponse.json(response, {
    status: 200,
  });
}

// 创建成功响应
export function createdResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    data,
  };
  
  if (message) {
    response.message = message;
  }

  return NextResponse.json(response, {
    status: 201,
  });
}

// 错误响应
export function errorResponse(
  message: string,
  status: number = 400,
  errors?: Record<string, string[]>
): NextResponse<ApiError> {
  const response: ApiError = {
    message,
    code: status,
  };

  if (errors) {
    response.errors = errors;
  }

  return NextResponse.json(response, {
    status,
  });
}

// 验证错误响应
export function validationErrorResponse(
  errors: string | Record<string, string[]>
): NextResponse<ApiError> {
  if (typeof errors === 'string') {
    return errorResponse('验证失败', 422, { general: [errors] });
  }
  return errorResponse('验证失败', 422, errors);
}

// 未授权响应
export function unauthorizedResponse(
  message: string = '未授权访问'
): NextResponse<ApiError> {
  return errorResponse(message, 401);
}

// 禁止访问响应
export function forbiddenResponse(
  message: string = '没有权限访问'
): NextResponse<ApiError> {
  return errorResponse(message, 403);
}

// 未找到响应
export function notFoundResponse(
  message: string = '资源未找到'
): NextResponse<ApiError> {
  return errorResponse(message, 404);
}

// 服务器错误响应
export function serverErrorResponse(
  message: string = '服务器内部错误'
): NextResponse<ApiError> {
  return errorResponse(message, 500);
}

// 构建验证错误
export function buildValidationErrors(errors: ValidationError[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  
  errors.forEach(({ field, message }) => {
    if (!result[field]) {
      result[field] = [];
    }
    result[field] = Array.isArray(message) ? message : [message];
  });

  return result;
} 