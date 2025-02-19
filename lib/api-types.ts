import { NextRequest } from 'next/server';

// API请求参数接口
export interface ApiRequestParams {
  id?: string;
  [key: string]: any;
}

// API请求上下文接口
export interface ApiRequestContext {
  params: ApiRequestParams;
}

// API处理函数类型
export type ApiHandler = (
  req: NextRequest,
  context: ApiRequestContext
) => Promise<Response>;

// API响应数据接口
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// API错误接口
export interface ApiError {
  message: string;
  code: number;
  errors?: Record<string, string[]>;
}

// API验证错误接口
export interface ValidationError {
  field: string;
  message: string | string[];
}

// API分页参数接口
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// API分页响应接口
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API查询参数接口
export interface QueryParams extends PaginationParams {
  search?: string;
  filter?: Record<string, any>;
}

// API排序参数接口
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

// API过滤参数接口
export interface FilterParams {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex';
  value: any;
}

// 工具函数：解析查询参数
export function parseQueryParams(req: NextRequest): QueryParams {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    sort: searchParams.get('sort') || undefined,
    order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    search: searchParams.get('search') || undefined,
    filter: searchParams.get('filter')
      ? JSON.parse(searchParams.get('filter') || '{}')
      : undefined,
  };
}

// 工具函数：构建分页响应
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// 工具函数：构建MongoDB查询条件
export function buildMongoQuery(filters?: FilterParams[]): Record<string, any> {
  if (!filters) {
    return {};
  }

  const query: Record<string, any> = {};

  filters.forEach((filter) => {
    const { field, operator, value } = filter;

    switch (operator) {
      case 'eq':
        query[field] = value;
        break;
      case 'ne':
        query[field] = { $ne: value };
        break;
      case 'gt':
        query[field] = { $gt: value };
        break;
      case 'gte':
        query[field] = { $gte: value };
        break;
      case 'lt':
        query[field] = { $lt: value };
        break;
      case 'lte':
        query[field] = { $lte: value };
        break;
      case 'in':
        query[field] = { $in: value };
        break;
      case 'nin':
        query[field] = { $nin: value };
        break;
      case 'regex':
        query[field] = { $regex: value, $options: 'i' };
        break;
    }
  });

  return query;
} 