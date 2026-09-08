import { IsIn, IsOptional } from 'class-validator';

// Mismos tres períodos que ya usa apps/web/app/dashboard/page.tsx (PERIOD_DAYS).
export const DASHBOARD_PERIODS = ['mes', 'trimestre', 'año'] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

const PERIOD_DAYS: Record<DashboardPeriod, number> = {
  mes: 30,
  trimestre: 90,
  año: 365,
};

export class DashboardQueryDto {
  @IsOptional()
  @IsIn(DASHBOARD_PERIODS)
  period: DashboardPeriod = 'mes';

  get periodDays(): number {
    return PERIOD_DAYS[this.period];
  }
}
