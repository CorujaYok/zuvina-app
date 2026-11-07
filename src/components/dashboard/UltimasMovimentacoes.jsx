export default function UltimasMovimentacoes({
  transacoes,
  mostrarValores,
  formatarDinheiro,
}) {
  const ultimasTransacoes = [...transacoes]
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, 5);

  return (
    <section className="ultimas-movimentacoes">
      <div className="titulo-movimentacoes">
        <div>
          <h3>Últimas movimentações</h3>
          <p>Acompanhe suas atividades recentes</p>
        </div>
      </div>

      {ultimasTransacoes.length === 0 ? (
        <p className="movimentacoes-vazias">
          Nenhuma movimentação por enquanto.
        </p>
      ) : (
        <div className="lista-ultimas-movimentacoes">
          {ultimasTransacoes.map((transacao) => {
            const receita = transacao.tipo === "receita";

            return (
              <div className="item-ultima-movimentacao" key={transacao.id}>
                <div className={`icone-movimentacao ${receita ? "entrada" : "saida"}`}>
                  {receita ? "↗" : "↙"}
                </div>

                <div className="dados-movimentacao">
                  <strong>{transacao.descricao}</strong>
                  <span>
                    {transacao.categoria || "Outros"} ·{" "}
                    {transacao.data
                      ? new Date(`${transacao.data}T12:00:00`).toLocaleDateString("pt-BR")
                      : "Data não informada"}
                  </span>
                </div>

                <strong className={`valor-movimentacao ${receita ? "entrada" : "saida"}`}>
                  {mostrarValores
                    ? `${receita ? "+" : "-"}${formatarDinheiro(transacao.valor)}`
                    : "R$ ••••••"}
                </strong>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
