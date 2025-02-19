import { User } from './user';
import { Vehicle } from './vehicle';
import { MaintenanceRecord } from './maintenance';

// 社区帖子类型
export interface Post {
  _id: string;
  author: User;
  title: string;
  content: string;
  type: 'experience' | 'question' | 'knowledge';
  tags: string[];
  vehicle?: Vehicle;
  maintenanceRecord?: MaintenanceRecord;
  images?: string[];
  likes: number;
  views: number;
  comments: Comment[];
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

// 评论类型
export interface Comment {
  _id: string;
  author: User;
  content: string;
  post: string;
  parentComment?: string;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

// 评价类型
export interface Review {
  _id: string;
  author: User;
  targetType: 'technician' | 'shop';
  targetId: string;
  maintenanceRecord: string;
  rating: number;
  content: string;
  images?: string[];
  tags: string[];
  likes: number;
  reply?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 知识库文章类型
export interface KnowledgeArticle {
  _id: string;
  author: User;
  title: string;
  content: string;
  category: string;
  tags: string[];
  images?: string[];
  views: number;
  likes: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

// 用户互动类型
export interface Interaction {
  _id: string;
  user: User;
  type: 'like' | 'favorite' | 'share';
  targetType: 'post' | 'comment' | 'review' | 'article';
  targetId: string;
  createdAt: Date;
} 