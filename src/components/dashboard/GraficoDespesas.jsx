import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function GraficoDespesas({
  dadosGrafico,
  coresGrafico,
  formatarDinheiro,
}) {
  return (
    <section className="grafico-container">
      <h3>Despesas por categoria</h3>

      <p className="texto-secundario">
        Distribuição das despesas do mês atual
      </p>

      {dadosGrafico.length === 0 ? (
        <p className="texto-vazio">
          Adicione uma despesa para visualizar o gráfico.
        </p>
      ) : (
        <div className="area-grafico">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={dadosGrafico}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                stroke="none"
              >
                {dadosGrafico.map((item, index) => (
                  <Cell
                    key={item.name}
                    fill={coresGrafico[index % coresGrafico.length]}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(valorTooltip) =>
                  formatarDinheiro(valorTooltip)
                }
                contentStyle={{
                  background: "#130F24",
                  border: "1px solid rgba(171, 85, 247, 0.4)",
                  borderRadius: "12px",
                  color: "#F4F0FA",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                }}
                itemStyle={{ color: "#F4F0FA" }}
              />

              <Legend
                wrapperStyle={{
                  color: "#9CA3AF",
                  fontSize: "12px",
                  paddingTop: "10px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
