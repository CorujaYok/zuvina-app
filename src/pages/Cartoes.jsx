import "./Cartoes.css";

const cartoesExemplo = [
  {
    id: 1,
    nome: "Zuvina Black",
    modalidade: "Crédito",
    bandeira: "VISA",
    numero: "4829",
    limite: "R$ 5.000,00",
    disponivel: "R$ 3.750,00",
    utilizado: 25,
    cor: "credito",
  },
  {
    id: 2,
    nome: "Zuvina Black",
    modalidade: "Débito",
    bandeira: "VISA",
    numero: "7316",
    limite: "Conta principal",
    disponivel: "R$ 2.450,00",
    utilizado: 0,
    cor: "debito",
  },
];

export default function Cartoes() {
  return (
    <section className="pagina-cartoes">
      <div className="cartoes-cabecalho">
        <div>
          <span className="cartoes-subtitulo">SEU ECOSSISTEMA FINANCEIRO</span>
          <h2>Meus cartões</h2>
          <p>Gerencie seus cartões e acompanhe seus limites.</p>
        </div>

        <button className="botao-novo-cartao" type="button">
          + Novo cartão
        </button>
      </div>

      <div className="cartoes-resumo">
        <article className="cartao-resumo">
          <span>Cartões cadastrados</span>
          <strong>02</strong>
        </article>

        <article className="cartao-resumo">
          <span>Limite de crédito</span>
          <strong>R$ 5.000,00</strong>
        </article>

        <article className="cartao-resumo">
          <span>Crédito disponível</span>
          <strong>R$ 3.750,00</strong>
        </article>
      </div>

      <div className="cartoes-lista-cabecalho">
        <h3>Seus cartões</h3>
        <span>Gerenciamento de cartões</span>
      </div>

      <div className="cartoes-lista">
        {cartoesExemplo.map((cartao) => (
          <article className="cartao-item" key={cartao.id}>
            <div className={`cartao-visual ${cartao.cor}`}>
              <div className="cartao-visual-topo">
                <span>zuvina</span>
                <span className="cartao-chip">▦</span>
              </div>

              <div className="cartao-numero">
                •••• •••• •••• {cartao.numero}
              </div>

              <div className="cartao-visual-rodape">
                <div>
                  <small>MODALIDADE</small>
                  <strong>{cartao.modalidade}</strong>
                </div>
                <strong className="cartao-bandeira">
                  {cartao.bandeira}
                </strong>
              </div>
            </div>

            <div className="cartao-informacoes">
              <div className="cartao-titulo">
                <div>
                  <h4>{cartao.nome}</h4>
                  <span>{cartao.modalidade}</span>
                </div>

                <span className="cartao-status">Ativo</span>
              </div>

              <div className="cartao-dados">
                <div>
                  <small>
                    {cartao.modalidade === "Crédito"
                      ? "Limite total"
                      : "Vinculado a"}
                  </small>
                  <strong>{cartao.limite}</strong>
                </div>

                <div>
                  <small>
                    {cartao.modalidade === "Crédito"
                      ? "Disponível"
                      : "Saldo disponível"}
                  </small>
                  <strong>{cartao.disponivel}</strong>
                </div>
              </div>

              {cartao.modalidade === "Crédito" && (
                <div className="cartao-limite">
                  <div className="cartao-limite-texto">
                    <small>Limite utilizado</small>
                    <small>{cartao.utilizado}%</small>
                  </div>

                  <div className="cartao-barra">
                    <div
                      className="cartao-barra-progresso"
                      style={{ width: `${cartao.utilizado}%` }}
                    />
                  </div>
                </div>
              )}

              <button className="cartao-gerenciar" type="button">
                Gerenciar cartão →
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
