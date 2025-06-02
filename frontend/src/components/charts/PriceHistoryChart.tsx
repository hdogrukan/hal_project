import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

type Point = { date:string; min_price:number; max_price:number };

export default function PriceHistoryChart({ data }:{data:Point[]}) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis tickFormatter={v => `${v} ₺`} />
          <Tooltip formatter={(v:number) => `${v.toFixed(2)} ₺`} />
          <Line type="monotone" dataKey="min_price" strokeWidth={2} />
          <Line type="monotone" dataKey="max_price" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}