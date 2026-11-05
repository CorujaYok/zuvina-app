// ============================================================
// ZUVINA — APP PRINCIPAL (VERSÃO BRAND BOOK NEON)
// ============================================================

import { useEffect, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "./lib/supabaseClient";
import "./App.css";
import zuvinaOwl from "./assets/zuvina-owl.png";

// [01] COMPONENTE SVG DA CORUJA NEON (BRAND BOOK)

function ZuvinaLogo({ width = 38, height = 38 }) {
  return (
    <img
      src={zuvinaOwl}
      alt="Zuvina"
      width={width}
      height={height}
      className="zuvina-logo-image"
      style={{
        objectFit: "contain",
        display: "block",
        filter: "drop-shadow(0 0 5px rgba(171, 85, 247, 0.65))",
      }}
    />
  );
}

// [02] CONFIGURAÇÕES & PALETA NEON
const CATEGORIAS = {
  receita: ["Trabalho", "Freelance", "Presente", "Outros"],
  despesa: ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Outros"],
};

// Cores alinhadas com a paleta oficial (Roxo Neon, Ciano, Lilás, Rosa/Magenta)
const CORES_GRAFICO = ["#AB55F7", "#06B6D4", "#C084FC", "#EC4899", "#38BDF8", "#F43F5E"];

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
  const resultadoMes = receitasMes - despesasMes;

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
      {/* [UI-01] Notificações */}
      {notificacao && (
        <div className={`notificacao notificacao-${notificacao.tipo}`} role="status" aria-live="polite">
          <span>{notificacao.mensagem}</span>
          <button type="button" onClick={() => setNotificacao(null)} aria-label="Fechar notificação">×</button>
        </div>
      )}

      {/* [UI-02] Cabeçalho com Logotipo Neon */}
      <header className="cabecalho">
        <div className="logotipo-wrapper">
          <ZuvinaLogo />
          <div>
            <h1>ZUVINA</h1>
            <span className="slogan-header">SEU FUTURO, MAIS INTELIGENTE.</span>
          </div>
        </div>
        <div className="usuario-saudacao">
          <span>Olá, bem-vindo! 👋</span>
        </div>
      </header>

      <main>
        {/* [UI-03] Avisos de carregamento e erro */}
        {carregandoDados && <p className="aviso-banco" role="status">Carregando suas transações...</p>}
        {erroBanco && <p className="erro" role="alert">{erroBanco}</p>}

        {/* [UI-04] Saldo geral */}
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
          <span className="saldo-subtitulo">Seu dinheiro, mais leve.</span>
        </section>

        {/* [UI-05] Resumo do mês */}
        <section className="resumo-mensal">
          <div className="resumo-cabecalho">
            <h3>Resumo do mês</h3>
            <span className="mes-referencia">
              {hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </span>
          </div>
          <div className="cards-resumo">
            <div className="card-resumo card-receita">
              <span>Receitas</span>
              <strong className="receita">{mostrarValores ? formatarDinheiro(receitasMes) : "R$ •••"}</strong>
            </div>
            <div className="card-resumo card-despesa">
              <span>Despesas</span>
              <strong className="despesa">{mostrarValores ? formatarDinheiro(despesasMes) : "R$ •••"}</strong>
            </div>
            <div className={`card-resumo ${resultadoMes >= 0 ? "card-resultado-positivo" : "card-resultado-negativo"}`}>
              <span>Resultado do mês</span>
              <strong className={resultadoMes >= 0 ? "receita" : "despesa"}>
                {mostrarValores ? formatarDinheiro(resultadoMes) : "R$ •••"}
              </strong>
            </div>
          </div>
        </section>

        {/* [UI-06] Área de duas colunas */}
        <div className="dashboard-duas-colunas">

          {/* [UI-06.1] Gráfico de despesas */}
          <section className="grafico-container">
            <h3>Despesas por categoria</h3>
            <p className="texto-secundario">Distribuição das despesas do mês atual</p>
            {dadosGrafico.length === 0 ? (
              <p className="texto-vazio">Adicione uma despesa para visualizar o gráfico.</p>
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
                        <Cell key={item.name} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(valorTooltip) => formatarDinheiro(valorTooltip)}
                      contentStyle={{
                        background: "#130F24",
                        border: "1px solid rgba(171, 85, 247, 0.4)",
                        borderRadius: "12px",
                        color: "#F4F0FA",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                      }}
                      itemStyle={{ color: "#F4F0FA" }}
                    />
                    <Legend wrapperStyle={{ color: "#9CA3AF", fontSize: "12px", paddingTop: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* [UI-07] Formulário para adicionar transações */}
          <section className="formulario">
            <h3>Nova transação</h3>
            <div className="seletor-tipo">
              <button
                type="button"
                className={tipo === "receita" ? "ativo tipo-receita" : ""}
                onClick={() => mudarTipo("receita")}
              >
                + Receita
              </button>
              <button
                type="button"
                className={tipo === "despesa" ? "ativo tipo-despesa" : ""}
                onClick={() => mudarTipo("despesa")}
              >
                - Despesa
              </button>
            </div>
            <form onSubmit={adicionarTransacao}>
              <div className="campo">
                <label htmlFor="descricao">Descrição</label>
                <input
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex.: Compras no mercado"
                />
              </div>
              <div className="campos-linha">
                <div className="campo">
                  <label htmlFor="valor">Valor (R$)</label>
                  <input
                    id="valor"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="Ex.: 35,50"
                    inputMode="decimal"
                  />
                </div>
                <div className="campo">
                  <label htmlFor="categoria">Categoria</label>
                  <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                    {CATEGORIAS[tipo].map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>
              {erro && <p className="erro" role="alert">{erro}</p>}
              <button type="submit" className="botao-adicionar" disabled={salvando || carregandoDados}>
                {salvando ? "Aguarde..." : "+ Adicionar transação"}
              </button>
            </form>
          </section>

        </div>

        {/* [UI-08] Histórico, pesquisa e filtros */}
        <section className="historico">
          <h3>Últimas transações</h3>
          <div className="filtros">
            <input
              aria-label="Pesquisar transações"
              placeholder="Pesquisar transações..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
            <select aria-label="Filtrar por tipo" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="todos">Todas</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
            </select>
            <select aria-label="Filtrar por categoria" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
              <option value="todas">Todas as categorias</option>
              {todasCategorias.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          {!carregandoDados && !erroBanco && transacoesFiltradas.length === 0 ? (
            <p className="texto-vazio">Nenhuma transação encontrada.</p>
          ) : (
            <ul className="lista-transacoes">
              {transacoesFiltradas.map((t) => (
                <li key={t.id} className="item-transacao">
                  <div className="detalhes-transacao">
                    <strong>{t.descricao}</strong>
                    <small>{t.categoria || "Sem categoria"} · {formatarData(t.data)}</small>
                  </div>
                  <div className="valor-transacao">
                    <strong className={`valor-tag ${t.tipo}`}>
                      {t.tipo === "receita" ? "+" : "-"}{mostrarValores ? formatarDinheiro(t.valor) : "R$ •••"}
                    </strong>
                    <button
                      type="button"
                      className="botao-icon botao-editar"
                      onClick={() => iniciarEdicao(t)}
                      disabled={salvando || carregandoDados}
                      aria-label={`Editar ${t.descricao}`}
                      title="Editar transação"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="botao-icon botao-excluir"
                      onClick={() => excluirTransacao(t.id)}
                      disabled={salvando || carregandoDados}
                      aria-label={`Excluir ${t.descricao}`}
                      title="Excluir transação"
                    >
                      ✕
                    </button>
                  </div>

                  {/* [UI-09] Formulário de edição */}
                  {transacaoEmEdicao?.id === t.id && (
                    <form className="formulario-edicao" onSubmit={salvarEdicao}>
                      <div className="campo">
                        <label htmlFor={`editar-descricao-${t.id}`}>Descrição</label>
                        <input
                          id={`editar-descricao-${t.id}`}
                          value={descricaoEdicao}
                          onChange={(e) => setDescricaoEdicao(e.target.value)}
                          placeholder="Descrição"
                        />
                      </div>
                      <div className="campos-linha">
                        <div className="campo">
                          <label htmlFor={`editar-valor-${t.id}`}>Valor (R$)</label>
                          <input
                            id={`editar-valor-${t.id}`}
                            value={valorEdicao}
                            onChange={(e) => setValorEdicao(e.target.value)}
                            inputMode="decimal"
                            placeholder="Ex.: 35,50"
                          />
                        </div>
                        <div className="campo">
                          <label htmlFor={`editar-categoria-${t.id}`}>Categoria</label>
                          <select
                            id={`editar-categoria-${t.id}`}
                            value={categoriaEdicao}
                            onChange={(e) => setCategoriaEdicao(e.target.value)}
                          >
                            {CATEGORIAS[t.tipo].map((item) => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="acoes-edicao">
                        <button type="submit" className="botao-salvar" disabled={salvando || carregandoDados}>
                          {salvando ? "Salvando..." : "Salvar alterações"}
                        </button>
                        <button type="button" className="botao-cancelar" disabled={salvando} onClick={() => setTransacaoEmEdicao(null)}>
                          Cancelar
                        </button>
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