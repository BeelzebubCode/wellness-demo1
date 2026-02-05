"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { RiskDistributionItem } from "../hooks/useMinistryStats";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  data: RiskDistributionItem[];
}

export function RiskDistributionChart({ data }: Props) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: "จำนวนเคส (Cases)",
        data: data.map((d) => d.count),
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)", // Normal
          "rgba(255, 206, 86, 0.6)", // Mild
          "rgba(255, 159, 64, 0.6)", // Moderate
          "rgba(255, 99, 132, 0.6)", // High
          "rgba(153, 102, 255, 0.6)", // Severe
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "การกระจายตัวของระดับความเสี่ยง (Risk Levels)",
      },
    },
  };

  return (
    <Card className="col-span-1 border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle>ภาพรวมความเสี่ยงสุขภาพจิต</CardTitle>
        <CardDescription>จำแนกตามผลประเมินล่าสุด</CardDescription>
      </CardHeader>
      <CardContent>
         <Bar options={options} data={chartData} />
      </CardContent>
    </Card>
  );
}
