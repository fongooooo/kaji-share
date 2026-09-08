import type { TaskFrequency } from '@/types/models';

// ISO週番号(月曜始まり)を計算する。年末年始をまたぐ場合の「週がどちらの年に属するか」もISO 8601の規格に準拠する
function getIsoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // 月曜=0 ... 日曜=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // その週の木曜日に合わせる

  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);

  const weekNum = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentPeriodKey(frequency: TaskFrequency, now: Date = new Date()): string {
  return frequency === 'weekly' ? getIsoWeekKey(now) : getMonthKey(now);
}

// 週の月曜日を求める(表示ラベル用)
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const dayNum = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayNum);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getCurrentPeriodLabel(frequency: TaskFrequency, now: Date = new Date()): string {
  if (frequency === 'monthly') {
    return `${now.getFullYear()}年${now.getMonth() + 1}月`;
  }
  const monday = getMondayOfWeek(now);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const format = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${format(monday)}〜${format(sunday)}`;
}
