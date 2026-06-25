"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export type FatiaForma = { nome: string; valor: number }; // valor em reais

const CORES = [
  "#3ecf8e",
  "#5bd6a3",
  "#2faf78",
  "#86b3a3",
  "#4f8d76",
  "#6f9c8a",
  "#9ab0a7",
  "#69837a",
];

const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function GraficoFormas({ dados }: { dados: FatiaForma[] }) {
  if (dados.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-muted text-sm">
        Sem entradas no período.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={dados}
          dataKey="valor"
          nameKey="nome"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={2}
        >
          {dados.map((_, i) => (
            <Cell key={i} fill={CORES[i % CORES.length]} stroke="var(--card)" />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, n) => [moeda(Number(v)), n as string]}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--foreground)",
            fontSize: 13,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
