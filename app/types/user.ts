export interface User {
  _id: string;
  username: string;
  name?: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
} 