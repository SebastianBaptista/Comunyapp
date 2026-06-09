export interface Post {
  id: string;
  user_id: string;
  author: string;
  role: string;
  content: string;
  likes: number;
  comments: number;
  created_at: string;
  userReaction: string | null;
  reactions: Record<string, number>;
  pinned: boolean;
  image_url: string | null;
  avatar: string;
  tags?: string[];
  tip?: {
    title: string;
    content: string;
  };
}

export interface Course {
  id: string;
  title: string;
  category: string;
  module: string;
  progress: number;
  description: string;
  thumbnail: string;
}

export interface CourseChapter {
  id: string;
  courseId: string;
  title: string;
  videoUrl: string | null;
  duration: string | null;
  sortOrder: number;
}

export type View = "muro" | "classroom" | "profile" | "admin";

export type PlanType = "1m" | "3m" | "6m" | "1y" | "indefinido";

export type PaymentStatus = "pending" | "success" | "failed";

export interface Payment {
  id: string;
  user_id: string;
  plan: PlanType;
  amount: number;
  status: PaymentStatus;
  payment_method: string;
  reference_number: string;
  receipt_url: string | null;
  phone: string;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
  user_name?: string | null;
  user_email?: string | null;
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  user_id: string;
  author: string;
  role: string;
  avatar: string | null;
  content: string;
  created_at: string;
  reactions: Record<string, number>;
  userReaction: string | null;
  replies?: Comment[];
}
