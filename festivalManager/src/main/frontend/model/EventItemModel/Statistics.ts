export interface Statistics {
  eventId: string;
  operation: "statistics";
  data: {
    statisticsData: StatisticsData;
  };
}

export interface StatisticsData {
  openRate: number;
  totalScans: number;
  attendanceRate: number;
}
