import { NextResponse } from 'next/server';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

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

export function errorResponse(message: string, status: number = 500) {
  const response: ApiResponse = {
    success: false,
    message,
  };

  return NextResponse.json(response, { status });
}

export function validationErrorResponse(errors: any) {
  const response: ApiResponse = {
    success: false,
    message: '验证失败',
    errors,
  };

  return NextResponse.json(response, { status: 400 });
}

export function forbiddenResponse(message: string = '无权访问') {
  const response: ApiResponse = {
    success: false,
    message,
  };

  return NextResponse.json(response, { status: 403 });
}

export function notFoundResponse(message: string = '资源不存在') {
  const response: ApiResponse = {
    success: false,
    message,
  };

  return NextResponse.json(response, { status: 404 });
}

export function unauthorizedResponse(message: string = '未授权访问') {
  const response: ApiResponse = {
    success: false,
    message,
  };

  return NextResponse.json(response, { status: 401 });
}

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