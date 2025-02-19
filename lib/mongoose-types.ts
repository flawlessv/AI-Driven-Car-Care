import { Document, Model } from 'mongoose';

// 声明全局mongoose变量
declare global {
  var mongoose: {
    conn: any | null;
    promise: Promise<any> | null;
  };
}

// 扩展Document类型
export interface BaseDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
}

// 创建一个工具类型，用于Model的静态方法
export type ModelWithStaticMethods<T, TMethods> = Model<T> & TMethods;

// 创建一个工具类型，用于Document的实例方法
export type DocumentWithMethods<T, TMethods> = T & TMethods & BaseDocument;

// 创建一个工具类型，用于处理populate后的字段
export type Populated<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] extends Array<any>
    ? T[P][number] extends Document
      ? T[P][number]
      : T[P]
    : T[P] extends Document
    ? T[P]
    : T[P];
}; 