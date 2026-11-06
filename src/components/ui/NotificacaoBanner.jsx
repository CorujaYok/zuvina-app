// ============================================================
// ZUVINA — BANNER DE NOTIFICAÇÃO
// ============================================================

export default function NotificacaoBanner({ notificacao, onClose }) {
  if (!notificacao) return null;

  return (
    <div
      className={`notificacao notificacao-${notificacao.tipo}`}
      role="status"
      aria-live="polite"
    >
      <span>{notificacao.mensagem}</span>

      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar notificação"
      >
        ×
      </button>
    </div>
  );
}