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

export interface AnalyticsMembersOverview {
  total: number;
  active: number;
  inactive: number;
  expired: number;
  invited: number;
  new_today: number;
  new_this_month: number;
}

export interface AnalyticsRevenue {
  today: number;
  this_month: number;
  total: number;
  by_plan: { "1m": number; "3m": number; "6m": number; "1y": number };
  payments_pending: number;
  non_renewals: number;
}

export interface AnalyticsOverview {
  members: AnalyticsMembersOverview;
  revenue: AnalyticsRevenue;
}

export interface AnalyticsLocation {
  city: string;
  total: number;
  percentage: number;
}

export interface AnalyticsAgeRange {
  age_range: string;
  total: number;
  percentage: number;
}

export interface AnalyticsMembersDetail extends AnalyticsMembersOverview {
  admin: number;
  gender: { male: number; female: number; other: number };
  locations: AnalyticsLocation[];
  ages: AnalyticsAgeRange[];
}

export interface AnalyticsSnapshot {
  snapshot_date: string;
  total_members: number;
  active_members: number;
  inactive_members: number;
  expired_members: number;
  invited_members: number;
  new_members: number;
  revenue_day: number;
  revenue_month: number;
  payments_success: number;
  payments_pending: number;
  payments_failed: number;
  non_renewals: number;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  xp_required?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
}
