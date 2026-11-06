// ============================================================
// ZUVINA — ITEM DE MOVIMENTAÇÃO
// ============================================================

export default function ItemMovimentacao({
  mov,
  contaNome,
  mostrarValores,
  formatarData,
  formatarDinheiro,
}) {
  const externa = Boolean(mov.transferencia_id);

  const titulo = externa
    ? mov.tipo === "saida"
      ? "Transferência enviada"
      : "Transferência recebida"
    : mov.tipo === "saida"
    ? "Saída de Caixinha"
    : "Entrada em Caixinha";

  return (
    <li className="item-transacao">
      <div className="detalhes-transacao">
        <strong>{mov.descricao || titulo}</strong>

        <small>
          {titulo} · {contaNome || "Conta"} · {formatarData(mov.criada_em)}
        </small>
      </div>

      <div className="valor-transacao">
        <strong
          className={`valor-tag ${
            mov.tipo === "entrada" ? "receita" : "despesa"
          }`}
        >
          {mov.tipo === "entrada" ? "+" : "-"}
          {mostrarValores
            ? formatarDinheiro(mov.valor_centavos)
            : "R$ •••"}
        </strong>
      </div>
    </li>
  );
}