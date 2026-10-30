// ============================================================
// ZUVINA — APP PRINCIPAL
// Use Ctrl + F e procure [01], [02]... ou [UI-01]...
// ============================================================

// [01] IMPORTAÇÕES
import { useEffect, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "./lib/supabaseClient";
import "./App.css";

// [02] CONFIGURAÇÕES
const CATEGORIAS = {
  receita: ["Trabalho", "Freelance", "Presente", "Outros"],
  despesa: ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Outros"],
};
const CORES_GRAFICO = ["#9567f5", "#d1a5ff", "#ff9ba6", "#76dbc0", "#f4c36d", "#74a7f7"];

// [03] UTILITÁRIOS — Valores, datas e validação
function formatarDinheiro(centavos) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "Data não registrada";
  const convertida = new Date(data);
  return Number.isNaN(convertida.getTime())
    ? "Data não registrada"
    : convertida.toLocaleDateString("pt-BR");
}

function converterValorEmCentavos(texto) {
  const entrada = texto.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(entrada)) return null;
  const centavos = Math.round(Number(entrada) * 100);
  return Number.isSafeInteger(centavos) && centavos > 0 ? centavos : null;
}

// [04] COMPONENTE PRINCIPAL
export default function App({ userId }) {
  // [05] ESTADOS — Banco de dados e interface
  const [transacoes, setTransacoes] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erroBanco, setErroBanco] = useState("");
  const [notificacao, setNotificacao] = useState(null);
  const [mostrarValores, setMostrarValores] = useState(true);

  // [06] ESTADOS — Nova transação
  const [tipo, setTipo] = useState("despesa");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("Alimentação");
  const [erro, setErro] = useState("");

  // [07] ESTADOS — Edição
  const [transacaoEmEdicao, setTransacaoEmEdicao] = useState(null);
  const [descricaoEdicao, setDescricaoEdicao] = useState("");
  const [valorEdicao, setValorEdicao] = useState("");
  const [categoriaEdicao, setCategoriaEdicao] = useState("");

  // [08] ESTADOS — Filtros do histórico
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [pesquisa, setPesquisa] = useState("");

  // [09] NOTIFICAÇÕES — Mostrar e ocultar automaticamente
  function mostrarNotificacao(mensagem, tipoAviso = "sucesso") {
    setNotificacao({ mensagem, tipo: tipoAviso, id: Date.now() });
  }

  useEffect(() => {
    if (!notificacao) return undefined;
    const temporizador = setTimeout(() => setNotificacao(null), 4000);
    return () => clearTimeout(temporizador);
  }, [notificacao]);

  // [10] SUPABASE — Carregar transações ao entrar ou trocar usuário
  useEffect(() => {
    let ativo = true;
    async function carregarTransacoes() {
      setCarregandoDados(true);
      setErroBanco("");
      setTransacoes([]);
      try {
        const { data, error } = await supabase
          .from("transacoes")
          .select("*")
          .eq("usuario_id", userId)
          .order("data", { ascending: false });
        if (error) throw error;
        if (ativo) setTransacoes(data ?? []);
      } catch (error) {
        console.error("Erro ao carregar transações:", error);
        if (ativo) setErroBanco("Não foi possível carregar suas transações.");
      } finally {
        if (ativo) setCarregandoDados(false);
      }
    }
    if (userId) carregarTransacoes();
    else {
      setTransacoes([]);
      setCarregandoDados(false);
    }
    return () => { ativo = false; };
  }, [userId]);

  // [11] SUPABASE — Adicionar transação
  async function adicionarTransacao(evento) {
    evento.preventDefault();
    if (salvando || carregandoDados || !userId) return;
    const centavos = converterValorEmCentavos(valor);
    if (!descricao.trim() || centavos === null) {
      setErro("Preencha a descrição e um valor válido maior que zero.");
      return;
    }
    setSalvando(true);
    setErro("");
    setErroBanco("");
    try {
      const { data, error } = await supabase
        .from("transacoes")
        .insert({ usuario_id: userId, descricao: descricao.trim(), valor: centavos, tipo, categoria })
        .select()
        .single();
      if (error) throw error;
      setTransacoes((anteriores) => [data, ...anteriores]);
      setDescricao("");
      setValor("");
      mostrarNotificacao("Transação adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar transação:", error);
      setErroBanco("Não foi possível salvar a transação.");
      mostrarNotificacao("Não foi possível salvar a transação.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  // [12] FORMULÁRIO — Alternar receita/despesa
  function mudarTipo(novoTipo) {
    setTipo(novoTipo);
    setCategoria(novoTipo === "receita" ? "Trabalho" : "Alimentação");
    setErro("");
  }

  // [13] EDIÇÃO — Abrir formulário
  function iniciarEdicao(transacao) {
    if (salvando || carregandoDados) return;
    setTransacaoEmEdicao(transacao);
    setDescricaoEdicao(transacao.descricao ?? "");
    setValorEdicao((transacao.valor / 100).toFixed(2).replace(".", ","));
    setCategoriaEdicao(transacao.categoria ?? "Outros");
    setErroBanco("");
  }

  // [14] SUPABASE — Salvar edição
  async function salvarEdicao(evento) {
    evento.preventDefault();
    if (!transacaoEmEdicao || salvando || carregandoDados || !userId) return;
    const centavos = converterValorEmCentavos(valorEdicao);
    if (!descricaoEdicao.trim() || centavos === null ||
        !CATEGORIAS[transacaoEmEdicao.tipo]?.includes(categoriaEdicao)) {
      mostrarNotificacao("Preencha os campos da edição corretamente.", "erro");
      return;
    }
    setSalvando(true);
    setErroBanco("");
    try {
      const { data, error } = await supabase
        .from("transacoes")
        .update({ descricao: descricaoEdicao.trim(), valor: centavos, categoria: categoriaEdicao })
        .eq("id", transacaoEmEdicao.id)
        .eq("usuario_id", userId)
        .select()
        .single();
      if (error) throw error;
      setTransacoes((anteriores) => anteriores.map((t) => t.id === data.id ? data : t));
      setTransacaoEmEdicao(null);
      mostrarNotificacao("Transação atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao editar transação:", error);
      setErroBanco("Não foi possível salvar a edição.");
      mostrarNotificacao("Não foi possível salvar a edição.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  // [15] SUPABASE — Excluir transação
  async function excluirTransacao(id) {
    if (salvando || carregandoDados || !userId) return;
    if (!window.confirm("Excluir esta transação?")) return;
    setSalvando(true);
    setErroBanco("");
    try {
      const { data, error } = await supabase
        .from("transacoes")
        .delete()
        .eq("id", id)
        .eq("usuario_id", userId)
        .select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Transação não encontrada ou não excluída.");
      setTransacoes((anteriores) => anteriores.filter((t) => t.id !== id));
      if (transacaoEmEdicao?.id === id) setTransacaoEmEdicao(null);
      mostrarNotificacao("Transação excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      setErroBanco("Não foi possível excluir a transação.");
      mostrarNotificacao("Não foi possível excluir a transação.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  // [16] FINANÇAS — Saldo geral e resumo mensal
  const saldo = transacoes.reduce((total, t) => total + (t.tipo === "receita" ? t.valor : -t.valor), 0);
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  const transacoesDoMes = transacoes.filter((t) => {
    if (!t.data) return false;
    const data = new Date(t.data);
    return !Number.isNaN(data.getTime()) && data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
  });
  const receitasMes = transacoesDoMes.filter((t) => t.tipo === "receita").reduce((total, t) => total + t.valor, 0);
  const despesasMes = transacoesDoMes.filter((t) => t.tipo === "despesa").reduce((total, t) => total + t.valor, 0);

  // [17] GRÁFICO — Despesas agrupadas por categoria
  const totaisPorCategoria = {};
  transacoesDoMes.filter((t) => t.tipo === "despesa").forEach((t) => {
    const nome = t.categoria || "Sem categoria";
    totaisPorCategoria[nome] = (totaisPorCategoria[nome] || 0) + t.valor;
  });
  const dadosGrafico = Object.entries(totaisPorCategoria)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // [18] HISTÓRICO — Pesquisa e filtros
  const transacoesFiltradas = transacoes.filter((t) =>
    (filtroTipo === "todos" || t.tipo === filtroTipo) &&
    (filtroCategoria === "todas" || (t.categoria || "Sem categoria") === filtroCategoria) &&
    (t.descricao || "").toLowerCase().includes(pesquisa.toLowerCase().trim())
  );
  const todasCategorias = [...new Set(transacoes.map((t) => t.categoria || "Sem categoria"))];

  // [19] INTERFACE — JSX
  return (
    <div className="zuvina">
      {/* [UI-01] Notificações de sucesso e erro */}
      {notificacao && (
        <div className={`notificacao notificacao-${notificacao.tipo}`} role="status" aria-live="polite">
          <span>{notificacao.mensagem}</span>
          <button type="button" onClick={() => setNotificacao(null)} aria-label="Fechar notificação">×</button>
        </div>
      )}

      {/* [UI-02] Cabeçalho */}
      <header className="cabecalho">
        <h1>zuvina.</h1>
        <span>Olá, bem-vindo! 👋</span>
      </header>

      <main>
        {/* [UI-03] Avisos de carregamento e falha do banco */}
        {carregandoDados && <p className="aviso-banco" role="status">Carregando suas transações...</p>}
        {erroBanco && <p className="erro" role="alert">{erroBanco}</p>}

        {/* [UI-04] Saldo geral e botão de privacidade */}
        <section className="saldo">
          <div className="saldo-topo">
            <p>Seu saldo geral</p>
            <button
              type="button"
              className="botao-olho"
              onClick={() => setMostrarValores((atual) => !atual)}
              aria-label={mostrarValores ? "Ocultar saldo" : "Mostrar saldo"}
            >
              {mostrarValores ? "👁️" : "🙈"}
            </button>
          </div>
          <h2>{mostrarValores ? formatarDinheiro(saldo) : "R$ ••••••"}</h2>
          <span>Seu dinheiro, mais leve.</span>
        </section>

        {/* [UI-05] Resumo do mês */}
        <section className="resumo-mensal">
          <h3>Resumo do mês</h3>
          <p className="mes-referencia">
            {hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </p>
          <div className="cards-resumo">
            <div className="card-resumo">
              <span>Receitas</span>
              <strong className="receita">{formatarDinheiro(receitasMes)}</strong>
            </div>
            <div className="card-resumo">
              <span>Despesas</span>
              <strong className="despesa">{formatarDinheiro(despesasMes)}</strong>
            </div>
            <div className="card-resumo">
              <span>Resultado do mês</span>
              <strong>{formatarDinheiro(receitasMes - despesasMes)}</strong>
            </div>
          </div>
        </section>

        {/* [UI-06] Gráfico de despesas */}
        <section className="grafico-container">
          <h3>Despesas por categoria</h3>
          <p className="texto-secundario">Distribuição das despesas do mês atual</p>
          {dadosGrafico.length === 0 ? (
            <p className="texto-secundario">Adicione uma despesa para visualizar o gráfico.</p>
          ) : (
            <div className="area-grafico">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosGrafico}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {dadosGrafico.map((item, index) => (
                      <Cell key={item.name} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(valorTooltip) => formatarDinheiro(valorTooltip)}
                    contentStyle={{
                      background: "#251b33",
                      border: "1px solid #514066",
                      borderRadius: "10px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend wrapperStyle={{ color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* [UI-07] Formulário para adicionar transações */}
        <section className="formulario">
          <h3>Nova transação</h3>
          <div className="seletor-tipo">
            <button type="button" className={tipo === "receita" ? "ativo" : ""} onClick={() => mudarTipo("receita")}>+ Receita</button>
            <button type="button" className={tipo === "despesa" ? "ativo" : ""} onClick={() => mudarTipo("despesa")}>- Despesa</button>
          </div>
          <form onSubmit={adicionarTransacao}>
            <label htmlFor="descricao">Descrição</label>
            <input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Compras no mercado" />
            <div className="campos-linha">
              <div>
                <label htmlFor="valor">Valor (R$)</label>
                <input id="valor" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Ex.: 35,50" inputMode="decimal" />
              </div>
              <div>
                <label htmlFor="categoria">Categoria</label>
                <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  {CATEGORIAS[tipo].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>
            {erro && <p className="erro" role="alert">{erro}</p>}
            <button type="submit" className="botao-adicionar" disabled={salvando || carregandoDados}>
              {salvando ? "Aguarde..." : "+ Adicionar transação"}
            </button>
          </form>
        </section>

        {/* [UI-08] Histórico, pesquisa e filtros */}
        <section className="historico">
          <h3>Últimas transações</h3>
          <div className="filtros">
            <input aria-label="Pesquisar transações" placeholder="Pesquisar transações..." value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
            <select aria-label="Filtrar por tipo" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="todos">Todas</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
            </select>
            <select aria-label="Filtrar por categoria" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
              <option value="todas">Todas as categorias</option>
              {todasCategorias.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          {!carregandoDados && !erroBanco && transacoesFiltradas.length === 0 ? (
            <p>Nenhuma transação encontrada.</p>
          ) : (
            <ul className="lista-transacoes">
              {transacoesFiltradas.map((t) => (
                <li key={t.id}>
                  <div className="detalhes-transacao">
                    <strong>{t.descricao}</strong>
                    <small>{t.categoria || "Sem categoria"} · {formatarData(t.data)}</small>
                  </div>
                  <div className="valor-transacao">
                    <strong className={t.tipo}>
                      {t.tipo === "receita" ? "+" : "-"}{formatarDinheiro(t.valor)}
                    </strong>
                    <button type="button" className="botao-editar" onClick={() => iniciarEdicao(t)} disabled={salvando || carregandoDados} aria-label={`Editar ${t.descricao}`} title="Editar transação">✏️</button>
                    <button type="button" className="botao-excluir" onClick={() => excluirTransacao(t.id)} disabled={salvando || carregandoDados} aria-label={`Excluir ${t.descricao}`} title="Excluir transação">×</button>
                  </div>

                  {/* [UI-09] Formulário de edição dentro do histórico */}
                  {transacaoEmEdicao?.id === t.id && (
                    <form className="formulario-edicao" onSubmit={salvarEdicao}>
                      <label htmlFor={`editar-descricao-${t.id}`}>Descrição</label>
                      <input id={`editar-descricao-${t.id}`} value={descricaoEdicao} onChange={(e) => setDescricaoEdicao(e.target.value)} placeholder="Descrição" />
                      <label htmlFor={`editar-valor-${t.id}`}>Valor (R$)</label>
                      <input id={`editar-valor-${t.id}`} value={valorEdicao} onChange={(e) => setValorEdicao(e.target.value)} inputMode="decimal" placeholder="Ex.: 35,50" />
                      <label htmlFor={`editar-categoria-${t.id}`}>Categoria</label>
                      <select id={`editar-categoria-${t.id}`} value={categoriaEdicao} onChange={(e) => setCategoriaEdicao(e.target.value)}>
                        {CATEGORIAS[t.tipo].map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                      <div className="acoes-edicao">
                        <button type="submit" disabled={salvando || carregandoDados}>{salvando ? "Salvando..." : "Salvar alterações"}</button>
                        <button type="button" disabled={salvando} onClick={() => setTransacaoEmEdicao(null)}>Cancelar</button>
                      </div>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
