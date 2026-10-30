import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [transacoes, setTransacoes] = useState(() => {
    try {
      const salvas = localStorage.getItem("zuvina-transacoes");
      const dados = salvas ? JSON.parse(salvas) : [];
      return Array.isArray(dados) ? dados : [];
    } catch {
      return [];
    }
  });

  const [tipo, setTipo] = useState("despesa");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("Alimentação");
  const [erro, setErro] = useState("");

  const categorias = {
    receita: ["Trabalho", "Freelance", "Presente", "Outros"],
    despesa: [
      "Alimentação", "Transporte", "Moradia",
      "Lazer", "Saúde", "Outros"
    ],
  };

  useEffect(() => {
    try {
      localStorage.setItem(
        "zuvina-transacoes",
        JSON.stringify(transacoes)
      );
    } catch (erro) {
      console.error("Erro ao salvar transações:", erro);
    }
  }, [transacoes]);

  const saldo = transacoes.reduce((total, t) => {
    return total + (t.tipo === "receita" ? t.valor : -t.valor);
  }, 0);

  function formatarDinheiro(centavos) {
    return (centavos / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function mudarTipo(novoTipo) {
    setTipo(novoTipo);
    setCategoria(
      novoTipo === "receita" ? "Trabalho" : "Alimentação"
    );
  }

  function adicionarTransacao(evento) {
    evento.preventDefault();

    const entrada = valor.trim().replace(",", ".");

    if (
      !descricao.trim() ||
      !/^\d+(\.\d{1,2})?$/.test(entrada)
    ) {
      setErro("Preencha a descrição e um valor válido.");
      return;
    }

    const centavos = Math.round(Number(entrada) * 100);

    if (
      !Number.isSafeInteger(centavos) ||
      centavos <= 0
    ) {
      setErro("O valor deve ser maior que zero.");
      return;
    }

    const novaTransacao = {
      id: crypto.randomUUID(),
      descricao: descricao.trim(),
      valor: centavos,
      tipo,
      categoria,
      data: new Date().toISOString(),
    };

    setTransacoes((anteriores) => [
      novaTransacao,
      ...anteriores,
    ]);

    setDescricao("");
    setValor("");
    setErro("");
  }

  function excluirTransacao(id) {
    if (!window.confirm("Excluir esta transação?")) {
      return;
    }

    setTransacoes((anteriores) =>
      anteriores.filter((t) => t.id !== id)
    );
  }

  function formatarData(data) {
    if (!data) return "Data não registrada";

    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) {
      return "Data não registrada";
    }

    return dataConvertida.toLocaleDateString("pt-BR");
  }

  return (
    <div className="zuvina">
      <header className="cabecalho">
        <h1>zuvina.</h1>
        <span>Olá, bem-vindo! 👋</span>
      </header>

      <main>
        <section className="saldo">
          <p>Seu saldo</p>
          <h2>{formatarDinheiro(saldo)}</h2>
          <span>Seu dinheiro, mais leve.</span>
        </section>

        <section className="formulario">
          <h3>Nova transação</h3>

          <div className="seletor-tipo">
            <button
              type="button"
              className={tipo === "receita" ? "ativo" : ""}
              onClick={() => mudarTipo("receita")}
            >
              + Receita
            </button>

            <button
              type="button"
              className={tipo === "despesa" ? "ativo" : ""}
              onClick={() => mudarTipo("despesa")}
            >
              - Despesa
            </button>
          </div>

          <form onSubmit={adicionarTransacao}>
            <label htmlFor="descricao">Descrição</label>
            <input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Compras no mercado"
            />

            <div className="campos-linha">
              <div>
                <label htmlFor="valor">Valor (R$)</label>
                <input
                  id="valor"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="Ex.: 35,50"
                  inputMode="decimal"
                />
              </div>

              <div>
                <label htmlFor="categoria">Categoria</label>
                <select
                  id="categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  {categorias[tipo].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {erro && <p className="erro">{erro}</p>}

            <button type="submit" className="botao-adicionar">
              + Adicionar transação
            </button>
          </form>
        </section>

        <section className="historico">
          <h3>Últimas transações</h3>

          {transacoes.length === 0 ? (
            <p>Nenhuma transação por enquanto.</p>
          ) : (
            <ul className="lista-transacoes">
              {transacoes.map((t) => (
                <li key={t.id}>
                  <div className="detalhes-transacao">
                    <strong>{t.descricao}</strong>
                    <small>
                      {t.categoria || "Sem categoria"} ·{" "}
                      {formatarData(t.data)}
                    </small>
                  </div>

                  <div className="valor-transacao">
                    <strong className={t.tipo}>
                      {t.tipo === "receita" ? "+" : "-"}
                      {formatarDinheiro(t.valor)}
                    </strong>

                    <button
                      type="button"
                      className="botao-excluir"
                      onClick={() => excluirTransacao(t.id)}
                      aria-label={`Excluir ${t.descricao}`}
                      title="Excluir transação"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
