"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type FatiaCategoria = { nome: string; valor: number }; // valor em reais

const CORES = ["#3ecf8e", "#2faf78", "#5bd6a3", "#4f8d76", "#86b3a3", "#6f9c8a", "#9ab0a7", "#69837a"];

const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function GraficoCategorias({ dados }: { dados: FatiaCategoria[] }) {
  if (dados.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-muted text-sm">
        Sem saídas no período.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(280, dados.length * 40)}>
      <BarChart
        data={dados}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="nome"
          tick={{ fontSize: 12, fill: "#c7d0cb" }}
          stroke="#242c27"
          width={140}
        />
        <Tooltip
          formatter={(v) => [moeda(Number(v)), "Total"]}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #242c27",
            background: "#161c19",
            color: "#e7ece9",
            fontSize: 13,
          }}
          cursor={{ fill: "#1c231f" }}
        />
        <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
          {dados.map((_, i) => (
            <Cell key={i} fill={CORES[i % CORES.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
