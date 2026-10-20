import { api, messUrl } from "@/store/api";
import type { ApiResponse } from "@/types/api";
import type { Dashboard, ExportKind, MonthReport, TrendPoint } from "./reports-types";

const data = <T>(res: ApiResponse<T>) => res.data;

// The dashboard and reports are views over everything else, so they refresh when the records do.
const recordTags = (messId: string) =>
  (["MonthPreview", "Months", "Members", "MealRequests", "BazarDuties", "Settlements"] as const).map(
    (type) => ({ type, id: messId }),
  );

export const reportsApi = api.injectEndpoints({
  endpoints: (build) => ({
    dashboard: build.query<Dashboard, string>({
      query: (messId) => messUrl(messId, "/dashboard"),
      transformResponse: data<Dashboard>,
      providesTags: (_r, _e, messId) => recordTags(messId),
    }),
    trends: build.query<TrendPoint[], { messId: string; months?: number }>({
      query: ({ messId, months = 6 }) => ({ url: messUrl(messId, "/reports/trends"), params: { months } }),
      transformResponse: data<TrendPoint[]>,
      providesTags: (_r, _e, { messId }) => recordTags(messId),
    }),
    monthReport: build.query<MonthReport, { messId: string; monthId: string }>({
      query: ({ messId, monthId }) => messUrl(messId, `/months/${monthId}/report`),
      transformResponse: data<MonthReport>,
      providesTags: (_r, _e, { messId }) => recordTags(messId),
    }),
  }),
});

export const { useDashboardQuery, useTrendsQuery, useMonthReportQuery } = reportsApi;

/**
 * CSV download links. They go through the same-origin `/api` rewrite, so the session cookie comes
 * along and a plain `<a download>` works.
 */
export const exportUrl = (messId: string, monthId: string, kind: ExportKind) =>
  `/api/v1${messUrl(messId, `/months/${monthId}/export/${kind}`)}`;

export const statementExportUrl = (messId: string, monthId: string, memberId = "me") =>
  `/api/v1${messUrl(messId, `/months/${monthId}/export/statement/${memberId}`)}`;
