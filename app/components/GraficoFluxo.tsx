"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type PontoFluxo = {
  rotulo: string;
  entradas: number; // em reais
  saidas: number; // em reais
};

const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function GraficoFluxo({ dados }: { dados: PontoFluxo[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={dados} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gEntradas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3ecf8e" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gSaidas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef7878" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef7878" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#242c27" />
        <XAxis dataKey="rotulo" tick={{ fontSize: 12, fill: "#8b968f" }} stroke="#242c27" />
        <YAxis
          tick={{ fontSize: 12, fill: "#8b968f" }}
          stroke="#242c27"
          tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          width={55}
        />
        <Tooltip
          formatter={(v, nome) => [moeda(Number(v)), nome === "entradas" ? "Entradas" : "Saídas"]}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #242c27",
            background: "#161c19",
            color: "#e7ece9",
            fontSize: 13,
          }}
          labelStyle={{ color: "#8b968f" }}
        />
        <Area
          type="monotone"
          dataKey="entradas"
          stroke="#3ecf8e"
          strokeWidth={2}
          fill="url(#gEntradas)"
        />
        <Area
          type="monotone"
          dataKey="saidas"
          stroke="#ef7878"
          strokeWidth={2}
          fill="url(#gSaidas)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
