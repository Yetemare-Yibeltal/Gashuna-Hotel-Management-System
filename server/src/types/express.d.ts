import { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        name: string;
        email: string;
        role: 'admin' | 'manager' | 'receptionist';
        isActive: boolean;
      };
    }
  }
}

export {};
