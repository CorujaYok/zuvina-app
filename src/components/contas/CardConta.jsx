import React from "react";

// ============================================================
// ZUVINA — CARD DE CONTA
// ============================================================

export default function CardConta({
  conta,
  mostrarValores,
  onCopiarNotificacao,
  formatarDinheiro,
}) {
  const codigoFormatado = conta.codigo
    ? `${conta.codigo.slice(0, 8)}...${conta.codigo.slice(-6)}`
    : "";

  function copiarCodigo() {
    if (!conta.codigo) return;

    navigator.clipboard.writeText(conta.codigo);
    onCopiarNotificacao("Código da conta copiado!");
  }

  return (
    <article className="card-conta">
      <div>
        <span className="texto-secundario">
          {conta.tipo === "principal"
            ? "🏦 Conta principal"
            : "💜 Conta de reserva"}
        </span>

        <h4>{conta.nome}</h4>

        <div className="codigo-conta-badge" title={conta.codigo}>
          <span>Código: {codigoFormatado}</span>

          <button
            type="button"
            className="btn-copiar"
            onClick={copiarCodigo}
            title="Copiar Código"
          >
            📋
          </button>
        </div>
      </div>

      <strong>
        {mostrarValores
          ? formatarDinheiro(conta.saldo_centavos)
          : "R$ ••••••"}
      </strong>
    </article>
  );
}
