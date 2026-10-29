
import { useState } from "react";
import "./App.css";

function App() {
  const [transacoes, setTransacoes] = useState([]);

  function adicionarTransacao(tipo) {
    const descricao = prompt("Descrição da transação:");
    if (descricao === null) return;

    if (!descricao.trim()) {
      alert("Digite uma descrição.");
      return;
    }

    const entrada = prompt("Valor em reais (ex.: 150,50):");
    if (entrada === null) return;

    const valorNormalizado = entrada.trim().replace(",", ".");

    if (!/^\d+(\.\d{1,2})?$/.test(valorNormalizado)) {
      alert("Digite um valor válido, como 150 ou 150,50.");
      return;
    }

    const centavos = Math.round(Number(valorNormalizado) * 100);

    if (!Number.isSafeInteger(centavos) || centavos <= 0) {
      alert("O valor deve ser maior que zero.");
      return;
    }

    const novaTransacao = {
      id: crypto.randomUUID(),
      descricao: descricao.trim(),
      valor: centavos,
      tipo: tipo,
    };

    setTransacoes((anteriores) => [
      novaTransacao,
      ...anteriores,
    ]);
  }

  const saldo = transacoes.reduce((total, transacao) => {
    if (transacao.tipo === "receita") {
      return total + transacao.valor;
    }

    return total - transacao.valor;
  }, 0);

  function formatarDinheiro(centavos) {
    return (centavos / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
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

        <section className="acoes">
          <button onClick={() => adicionarTransacao("receita")}>
            Adicionar receita
          </button>

          <button onClick={() => adicionarTransacao("despesa")}>
            Adicionar despesa
          </button>
        </section>

        <section className="historico">
          <h3>Últimas transações</h3>

          {transacoes.length === 0 ? (
            <p>Nenhuma transação por enquanto.</p>
          ) : (
            <ul className="lista-transacoes">
              {transacoes.map((transacao) => (
                <li key={transacao.id}>
                  <span>{transacao.descricao}</span>

                  <strong className={transacao.tipo}>
                    {transacao.tipo === "receita" ? "+" : "-"}
                    {formatarDinheiro(transacao.valor)}
                  </strong>
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
