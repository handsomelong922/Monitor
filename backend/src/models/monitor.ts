// 时间窗口类型定义
export interface TimeWindow {
  start: string; // HH:mm format, e.g., "09:00"
  end: string;   // HH:mm format, e.g., "18:00"
}

// 监控类型定义
export interface Monitor {
  id: number;
  name: string;
  url: string;
  method: string;
  interval: number;
  timeout: number;
  expected_status: number;
  headers: Record<string, string>;
  body: string;
  created_by: number;
  active: boolean;
  status: string;
  response_time: number;
  last_checked: string;
  // 新增：监控时间窗口配置
  active_timezone?: string; // 默认 "Asia/Shanghai"
  active_windows?: TimeWindow[]; // 时间窗口数组
  active_days?: number[]; // 0-6, Sunday=0, null/empty=all days
  created_at: string;
  updated_at: string;
}

// 监控历史记录类型
export interface MonitorStatusHistory {
  id: number;
  monitor_id: number;
  status: string;
  timestamp: string;
  response_time: number;
  status_code: number;
  error: string | null;
}

// 监控每日统计类型
export interface MonitorDailyStats {
  date: string;
  total_checks: number;
  up_checks: number;
  down_checks: number;
  avg_response_time: number;
  min_response_time: number;
  max_response_time: number;
  availability: number;
  monitor_id: number;
  created_at: string;
}
