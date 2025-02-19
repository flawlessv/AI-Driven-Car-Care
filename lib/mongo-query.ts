import { FilterQuery, SortOrder } from 'mongoose';
import { QueryParams, FilterParams, SortParams } from './api-types';

// MongoDB查询选项接口
export interface MongoQueryOptions {
  sort?: Record<string, SortOrder>;
  skip?: number;
  limit?: number;
  populate?: string | string[];
  select?: string | string[];
}

// 构建基础查询条件
export function buildBaseQuery<T>(
  baseQuery: FilterQuery<T> = {},
  params?: QueryParams
): FilterQuery<T> {
  const query = { ...baseQuery };

  // 处理搜索
  if (params?.search) {
    const searchRegex = new RegExp(params.search, 'i');
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { code: searchRegex },
    ];
  }

  // 处理过滤
  if (params?.filter) {
    Object.entries(params.filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query[key] = value;
      }
    });
  }

  return query;
}

// 构建排序选项
export function buildSortOptions(params?: QueryParams): Record<string, SortOrder> {
  if (!params?.sort) {
    return { createdAt: -1 };
  }

  return {
    [params.sort]: params.order === 'asc' ? 1 : -1,
  };
}

// 构建分页选项
export function buildPaginationOptions(params?: QueryParams): {
  skip: number;
  limit: number;
} {
  const page = Math.max(1, params?.page || 1);
  const limit = Math.min(100, Math.max(1, params?.limit || 10));
  const skip = (page - 1) * limit;

  return { skip, limit };
}

// 构建完整的查询选项
export function buildQueryOptions<T>(
  baseQuery: FilterQuery<T> = {},
  params?: QueryParams,
  options: Partial<MongoQueryOptions> = {}
): {
  query: FilterQuery<T>;
  options: MongoQueryOptions;
} {
  return {
    query: buildBaseQuery(baseQuery, params),
    options: {
      sort: buildSortOptions(params),
      ...buildPaginationOptions(params),
      ...options,
    },
  };
}

// 构建高级过滤查询
export function buildFilterQuery(filters: FilterParams[]): FilterQuery<any> {
  const query: FilterQuery<any> = {};

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
        query[field] = { $in: Array.isArray(value) ? value : [value] };
        break;
      case 'nin':
        query[field] = { $nin: Array.isArray(value) ? value : [value] };
        break;
      case 'regex':
        query[field] = { $regex: value, $options: 'i' };
        break;
    }
  });

  return query;
}

// 构建日期范围查询
export function buildDateRangeQuery(
  field: string,
  startDate?: Date | string,
  endDate?: Date | string
): FilterQuery<any> {
  const query: FilterQuery<any> = {};

  if (startDate || endDate) {
    query[field] = {};
    
    if (startDate) {
      query[field].$gte = new Date(startDate);
    }
    
    if (endDate) {
      query[field].$lte = new Date(endDate);
    }
  }

  return query;
}

// 构建文本搜索查询
export function buildTextSearchQuery(
  searchText: string,
  fields: string[]
): FilterQuery<any> {
  if (!searchText || !fields.length) {
    return {};
  }

  const searchRegex = new RegExp(searchText, 'i');
  return {
    $or: fields.map((field) => ({ [field]: searchRegex })),
  };
}

// 构建关联查询选项
export function buildPopulateOptions(
  relations: Array<{
    path: string;
    select?: string[];
    populate?: string[];
  }>
): string[] {
  return relations.map((relation) => {
    let populateStr = relation.path;
    
    if (relation.select?.length) {
      populateStr += ' ' + relation.select.join(' ');
    }
    
    if (relation.populate?.length) {
      populateStr += ' ' + relation.populate.join(' ');
    }
    
    return populateStr;
  });
} 