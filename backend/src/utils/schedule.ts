import { TimeWindow } from "../models/monitor";

/**
 * 检查当前时间是否在监控的活跃时间窗口内
 * @param activeTimezone 监控的时区，默认 "Asia/Shanghai"
 * @param activeWindows 活跃时间窗口数组，null/undefined/empty 表示全天24小时
 * @param activeDays 活跃天数数组 (0-6, Sunday=0)，null/undefined/empty 表示每天
 * @returns true 表示当前时间在活跃窗口内
 * 
 * 注意：如果 activeWindows 和 activeDays 都为空，监控将24x7运行（始终活跃）
 */
export function isMonitorActive(
  activeTimezone?: string,
  activeWindows?: TimeWindow[] | null,
  activeDays?: number[] | null
): boolean {
  // 如果没有配置时间窗口和活跃天数，默认为24x7活跃
  // 这确保了向后兼容性：现有监控如果没有设置这些字段，将继续正常工作
  if ((!activeWindows || activeWindows.length === 0) && (!activeDays || activeDays.length === 0)) {
    return true;
  }

  const timezone = activeTimezone || "Asia/Shanghai";
  
  // 获取当前时间在指定时区的时间
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(now);
  const hourPart = parts.find((p) => p.type === "hour");
  const minutePart = parts.find((p) => p.type === "minute");
  const weekdayPart = parts.find((p) => p.type === "weekday");

  if (!hourPart || !minutePart || !weekdayPart) {
    console.error("Failed to parse time parts");
    return true; // 解析失败时默认为活跃
  }

  const currentHour = parseInt(hourPart.value, 10);
  const currentMinute = parseInt(minutePart.value, 10);
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  // 将weekday映射到0-6 (Sunday=0)
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const currentDay = weekdayMap[weekdayPart.value];

  // 检查活跃天数
  if (activeDays && activeDays.length > 0) {
    if (!activeDays.includes(currentDay)) {
      return false;
    }
  }

  // 检查时间窗口
  if (activeWindows && activeWindows.length > 0) {
    return activeWindows.some((window) => {
      return isTimeInWindow(currentTimeMinutes, window);
    });
  }

  return true;
}

/**
 * 检查时间是否在指定窗口内
 * @param currentTimeMinutes 当前时间（从0:00开始的分钟数）
 * @param window 时间窗口
 * @returns true 表示在窗口内
 */
function isTimeInWindow(currentTimeMinutes: number, window: TimeWindow): boolean {
  const startMinutes = parseTimeToMinutes(window.start);
  const endMinutes = parseTimeToMinutes(window.end);

  // 处理跨越午夜的情况 (例如 22:00 - 06:00)
  if (endMinutes < startMinutes) {
    // 跨越午夜：当前时间在开始之后或结束之前
    return currentTimeMinutes >= startMinutes || currentTimeMinutes < endMinutes;
  } else {
    // 正常情况：当前时间在开始和结束之间
    return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
  }
}

/**
 * 将 HH:mm 格式的时间转换为从0:00开始的分钟数
 * @param time HH:mm 格式的时间字符串
 * @returns 分钟数
 */
function parseTimeToMinutes(time: string): number {
  const [hour, minute] = time.split(":").map((s) => parseInt(s, 10));
  return hour * 60 + minute;
}
