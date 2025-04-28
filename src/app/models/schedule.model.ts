export interface Schedule {
  id: number | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}