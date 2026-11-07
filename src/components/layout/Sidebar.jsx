import zuvinaOwl from "../../assets/zuvina-owl.png";

export default function Sidebar({ secaoAtiva, setSecaoAtiva }) {
const itens = [
  { id: "inicio", icone: "⌂", nome: "Visão geral" },
  { id: "contas", icone: "▣", nome: "Minhas contas" },
  { id: "operacoes", icone: "⇄", nome: "Transferências" },
  { id: "cartoes", icone: "▣", nome: "Cartões" },
  { id: "lancamentos", icone: "＋", nome: "Lançamentos" },
  { id: "analises", icone: "◷", nome: "Análises" },
  { id: "movimentacoes", icone: "↕", nome: "Movimentações" },
  { id: "transacoes", icone: "≡", nome: "Histórico" },
];

  return (
    <aside className="zuvina-sidebar" aria-label="Navegação principal">
      <a
        className="sidebar-brand"
        href="#inicio"
        aria-label="Zuvina - início"
        onClick={() => setSecaoAtiva("inicio")}
      >
        <img
          src={zuvinaOwl}
          alt="Zuvina"
          width={42}
          height={42}
          className="zuvina-logo-image"
        />

        <span>
          <strong>ZUVINA</strong>
          <small>SEU FUTURO, MAIS INTELIGENTE.</small>
        </span>
      </a>

      <span className="sidebar-label">MENU PRINCIPAL</span>

      <nav className="sidebar-nav">
        {itens.map((item) => (
          <a
            key={item.id}
            className={`sidebar-link ${
              secaoAtiva === item.id ? "ativo" : ""
            }`}
            href={`#${item.id}`}
            onClick={() => setSecaoAtiva(item.id)}
          >
            <span>{item.icone}</span>
            {item.nome}
          </a>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-help">
          <span className="sidebar-help-icon">✦</span>
          <strong>Seu dinheiro, mais leve.</strong>
          <small>
            Organize sua vida financeira com clareza.
          </small>
        </div>

        <span className="sidebar-version">
          Zuvina · Ambiente seguro
        </span>
      </div>
    </aside>
  );
}
