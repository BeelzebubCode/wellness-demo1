export type ChartType = "bar" | "line" | "pie";

export interface AnalystResponse {
    type: "chart" | "suggestions" | "text";
    title: string;
    description?: string;
    chart?: {
        type: ChartType;
        xKey?: string;
        yKey?: string;
        dataKey?: string;
        nameKey?: string;
        seriesKey?: string;
    };
    data: Record<string, any>[];
    summary?: {
        bullets: string[];
    };
    suggestions?: string[];
    reply?: string;
}
