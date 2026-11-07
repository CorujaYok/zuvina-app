// ============================================================
// ZUVINA — APP PRINCIPAL (LAYOUT REFINADO NEON)
//          By: Katar and Coruja
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "./lib/supabaseClient";
import zuvinaOwl from "./assets/zuvina-owl.png";
import "./App.css";

// ============================================================
// [01] CONSTANTES & CONFIGURAÇÕES DE DESIGN
// ============================================================

const CATEGORIAS = {
  receita: ["Trabalho", "Freelance", "Presente", "Outros"],
  despesa: ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Outros"],
};

const CORES_GRAFICO = ["#AB55F7", "#06B6D4", "#C084FC", "#EC4899", "#38BDF8", "#F43F5E"];

// ============================================================
// [02] FUNÇÕES UTILITÁRIAS
// ============================================================

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

// ============================================================
// [03] COMPONENTES SECUNDÁRIOS DE INTERFACE
// ============================================================

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

function NotificacaoBanner({ notificacao, onClose }) {
  if (!notificacao) return null;
  return (
    <div
      className={`notificacao notificacao-${notificacao.tipo}`}
      role="status"
      aria-live="polite"
    >
      <span>{notificacao.mensagem}</span>
      <button type="button" onClick={onClose} aria-label="Fechar notificação">
        ×
      </button>
    </div>
  );
}

function CardConta({ conta, mostrarValores, onCopiarNotificacao }) {
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
          {conta.tipo === "principal" ? "🏦 Conta principal" : "💜 Conta de reserva"}
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
        {mostrarValores ? formatarDinheiro(conta.saldo_centavos) : "R$ ••••••"}
      </strong>
    </article>
  );
}

function ItemMovimentacao({ mov, contaNome, mostrarValores }) {
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
        <strong className={`valor-tag ${mov.tipo === "entrada" ? "receita" : "despesa"}`}>
          {mov.tipo === "entrada" ? "+" : "-"}
          {mostrarValores ? formatarDinheiro(mov.valor_centavos) : "R$ •••"}
        </strong>
      </div>
    </li>
  );
}

function ItemTransacao({
  t,
  mostrarValores,
  salvando,
  carregandoDados,
  transacaoEmEdicao,
  onIniciarEdicao,
  onExcluir,
  onSalvarEdicao,
  onCancelarEdicao,
  descricaoEdicao,
  setDescricaoEdicao,
  valorEdicao,
  setValorEdicao,
  categoriaEdicao,
  setCategoriaEdicao,
}) {
  const estaEmEdicao = transacaoEmEdicao?.id === t.id;

  return (
    <li className="item-transacao">
      <div className="detalhes-transacao">
        <strong>{t.descricao}</strong>
        <small>
          {t.categoria || "Sem categoria"} · {formatarData(t.data)}
        </small>
      </div>

      <div className="valor-transacao">
        <strong className={`valor-tag ${t.tipo}`}>
          {t.tipo === "receita" ? "+" : "-"}
          {mostrarValores ? formatarDinheiro(t.valor) : "R$ •••"}
        </strong>
        <button
          type="button"
          className="botao-icon botao-editar"
          onClick={() => onIniciarEdicao(t)}
          disabled={salvando || carregandoDados}
          aria-label={`Editar ${t.descricao}`}
          title="Editar transação"
        >
          ✏️
        </button>
        <button
          type="button"
          className="botao-icon botao-excluir"
          onClick={() => onExcluir(t.id)}
          disabled={salvando || carregandoDados}
          aria-label={`Excluir ${t.descricao}`}
          title="Excluir transação"
        >
          ✕
        </button>
      </div>

      {estaEmEdicao && (
        <form className="formulario-edicao" onSubmit={onSalvarEdicao}>
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
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="acoes-edicao">
            <button
              type="submit"
              className="botao-salvar"
              disabled={salvando || carregandoDados}
            >
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>
            <button
              type="button"
              className="botao-cancelar"
              disabled={salvando}
              onClick={onCancelarEdicao}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </li>
  );
}

// ============================================================
// [04] HOOK DE CONEXÃO COM O SUPABASE
// ============================================================

function useFinanceiro(userId) {
  const [transacoes, setTransacoes] = useState([]);
  const [contas, setContas] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);

  const [carregandoDados, setCarregandoDados] = useState(true);
  const [carregandoContas, setCarregandoContas] = useState(true);
  const [carregandoMovimentacoes, setCarregandoMovimentacoes] = useState(true);

  const [erroBanco, setErroBanco] = useState("");
  const [notificacao, setNotificacao] = useState(null);

  const mostrarNotificacao = useCallback((mensagem, tipoAviso = "sucesso") => {
    setNotificacao({ mensagem, tipo: tipoAviso, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!notificacao) return undefined;
    const temporizador = setTimeout(() => setNotificacao(null), 4000);
    return () => clearTimeout(temporizador);
  }, [notificacao]);

  const carregarContas = useCallback(async () => {
    if (!userId) {
      setContas([]);
      setCarregandoContas(false);
      return;
    }
    setCarregandoContas(true);
    try {
      const { data, error } = await supabase
        .from("contas")
        .select("id, nome, tipo, codigo, saldo_centavos, criada_em")
        .eq("usuario_id", userId)
        .order("criada_em", { ascending: true });

      if (error) throw error;
      setContas(data ?? []);
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
      mostrarNotificacao("Não foi possível carregar suas contas.", "erro");
    } finally {
      setCarregandoContas(false);
    }
  }, [userId, mostrarNotificacao]);

  const carregarMovimentacoes = useCallback(async () => {
    if (!userId) {
      setMovimentacoes([]);
      setCarregandoMovimentacoes(false);
      return;
    }
    setCarregandoMovimentacoes(true);
    try {
      const { data, error } = await supabase
        .from("movimentacoes")
        .select("id, conta_id, transferencia_id, tipo, valor_centavos, descricao, criada_em")
        .eq("usuario_id", userId)
        .order("criada_em", { ascending: false });

      if (error) throw error;
      setMovimentacoes(data ?? []);
    } catch (error) {
      console.error("Erro ao carregar movimentações:", error);
      mostrarNotificacao("Não foi possível carregar o histórico de contas.", "erro");
    } finally {
      setCarregandoMovimentacoes(false);
    }
  }, [userId, mostrarNotificacao]);

  useEffect(() => {
    let ativo = true;
    async function carregarTransacoes() {
      setCarregandoDados(true);
      setErroBanco("");
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

    if (userId) {
      carregarTransacoes();
      carregarContas();
      carregarMovimentacoes();
    } else {
      setTransacoes([]);
      setCarregandoDados(false);
    }

    return () => {
      ativo = false;
    };
  }, [userId, carregarContas, carregarMovimentacoes]);

  return {
    transacoes,
    setTransacoes,
    contas,
    movimentacoes,
    carregandoDados,
    carregandoContas,
    carregandoMovimentacoes,
    erroBanco,
    setErroBanco,
    notificacao,
    setNotificacao,
    mostrarNotificacao,
    carregarContas,
    carregarMovimentacoes,
  };
}

// ============================================================
// [05] COMPONENTE PRINCIPAL (APP)
// ============================================================

export default function App({ userId }) {
  const {
    transacoes,
    setTransacoes,
    contas,
    movimentacoes,
    carregandoDados,
    carregandoContas,
    carregandoMovimentacoes,
    erroBanco,
    setErroBanco,
    notificacao,
    setNotificacao,
    mostrarNotificacao,
    carregarContas,
    carregarMovimentacoes,
  } = useFinanceiro(userId);

  // Estados de Interface e Formulários
  const [salvando, setSalvando] = useState(false);
  const [mostrarValores, setMostrarValores] = useState(true);
  const [secaoAtiva, setSecaoAtiva] = useState("inicio");

  // Nova Transação
  const [tipo, setTipo] = useState("despesa");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("Alimentação");
  const [erro, setErro] = useState("");

  // Edição
  const [transacaoEmEdicao, setTransacaoEmEdicao] = useState(null);
  const [descricaoEdicao, setDescricaoEdicao] = useState("");
  const [valorEdicao, setValorEdicao] = useState("");
  const [categoriaEdicao, setCategoriaEdicao] = useState("");

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [pesquisa, setPesquisa] = useState("");

  // Gestão de Contas e Transferências
  const [nomeNovaConta, setNomeNovaConta] = useState("");
  const [contaOrigem, setContaOrigem] = useState("");
  const [contaDestino, setContaDestino] = useState("");
  const [valorTransferencia, setValorTransferencia] = useState("");
  const [descricaoTransferencia, setDescricaoTransferencia] = useState("");
  const [processandoConta, setProcessandoConta] = useState(false);
  const [codigoDestinoExterno, setCodigoDestinoExterno] = useState("");
  const [valorTransferenciaExterna, setValorTransferenciaExterna] = useState("");
  const [descricaoTransferenciaExterna, setDescricaoTransferenciaExterna] = useState("");

  useEffect(() => {
    if (contas.length) {
      const principal = contas.find((conta) => conta.tipo === "principal");
      setContaOrigem((atual) => atual || principal?.id || contas[0].id);
    }
  }, [contas]);

  // ============================================================
  // [06] AÇÕES DO USUÁRIO
  // ============================================================

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
        .insert({
          usuario_id: userId,
          descricao: descricao.trim(),
          valor: centavos,
          tipo,
          categoria,
        })
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

  async function criarContaReserva(evento) {
    evento.preventDefault();
    if (processandoConta || !nomeNovaConta.trim()) return;

    setProcessandoConta(true);
    try {
      const { error } = await supabase.rpc("criar_conta_reserva", {
        p_nome: nomeNovaConta.trim(),
      });

      if (error) throw error;

      setNomeNovaConta("");
      await carregarContas();
      mostrarNotificacao("Conta de reserva criada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      mostrarNotificacao(error.message || "Não foi possível criar a conta.", "erro");
    } finally {
      setProcessandoConta(false);
    }
  }

  async function realizarTransferencia(evento) {
    evento.preventDefault();
    if (processandoConta) return;

    const centavos = converterValorEmCentavos(valorTransferencia);

    if (!contaOrigem || !contaDestino) {
      mostrarNotificacao("Selecione as duas contas.", "erro");
      return;
    }
    if (contaOrigem === contaDestino) {
      mostrarNotificacao("Escolha contas diferentes.", "erro");
      return;
    }
    if (centavos === null) {
      mostrarNotificacao("Informe um valor válido.", "erro");
      return;
    }

    setProcessandoConta(true);
    try {
      const { error } = await supabase.rpc("mover_entre_contas_proprias", {
        p_conta_origem: contaOrigem,
        p_conta_destino: contaDestino,
        p_valor_centavos: centavos,
        p_descricao:
          descricaoTransferencia.trim() || "Movimentação entre caixinhas",
      });

      if (error) throw error;

      setValorTransferencia("");
      setDescricaoTransferencia("");
      await carregarContas();
      await carregarMovimentacoes();
      mostrarNotificacao("Movimentação realizada!");
    } catch (error) {
      console.error("Erro ao movimentar caixinhas:", error);
      mostrarNotificacao(
        error.message || "Não foi possível movimentar o dinheiro.",
        "erro"
      );
    } finally {
      setProcessandoConta(false);
    }
  }

  async function realizarTransferenciaExterna(evento) {
    evento.preventDefault();
    if (processandoConta) return;

    const centavos = converterValorEmCentavos(valorTransferenciaExterna);
    const principal = contas.find((conta) => conta.tipo === "principal");

    if (!principal) {
      mostrarNotificacao("Conta Principal não encontrada.", "erro");
      return;
    }
    if (!codigoDestinoExterno.trim()) {
      mostrarNotificacao("Informe o código do destinatário.", "erro");
      return;
    }
    if (centavos === null) {
      mostrarNotificacao("Informe um valor válido.", "erro");
      return;
    }

    setProcessandoConta(true);
    try {
      const { error } = await supabase.rpc("realizar_transferencia_externa", {
        p_conta_origem: principal.id,
        p_codigo_destino: codigoDestinoExterno.trim(),
        p_valor_centavos: centavos,
        p_descricao:
          descricaoTransferenciaExterna.trim() || "Transferência entre usuários",
      });

      if (error) throw error;

      setCodigoDestinoExterno("");
      setValorTransferenciaExterna("");
      setDescricaoTransferenciaExterna("");

      await carregarContas();
      await carregarMovimentacoes();
      mostrarNotificacao("Transferência enviada!");
    } catch (error) {
      console.error("Erro na transferência externa:", error);
      mostrarNotificacao(
        error.message || "Não foi possível realizar a transferência.",
        "erro"
      );
    } finally {
      setProcessandoConta(false);
    }
  }

  function iniciarEdicao(transacao) {
    if (salvando || carregandoDados) return;
    setTransacaoEmEdicao(transacao);
    setDescricaoEdicao(transacao.descricao ?? "");
    setValorEdicao((transacao.valor / 100).toFixed(2).replace(".", ","));
    setCategoriaEdicao(transacao.categoria ?? "Outros");
    setErroBanco("");
  }

  async function salvarEdicao(evento) {
    evento.preventDefault();
    if (!transacaoEmEdicao || salvando || carregandoDados || !userId) return;

    const centavos = converterValorEmCentavos(valorEdicao);
    if (
      !descricaoEdicao.trim() ||
      centavos === null ||
      !CATEGORIAS[transacaoEmEdicao.tipo]?.includes(categoriaEdicao)
    ) {
      mostrarNotificacao("Preencha os campos da edição corretamente.", "erro");
      return;
    }

    setSalvando(true);
    setErroBanco("");

    try {
      const { data, error } = await supabase
        .from("transacoes")
        .update({
          descricao: descricaoEdicao.trim(),
          valor: centavos,
          categoria: categoriaEdicao,
        })
        .eq("id", transacaoEmEdicao.id)
        .eq("usuario_id", userId)
        .select()
        .single();

      if (error) throw error;

      setTransacoes((anteriores) =>
        anteriores.map((t) => (t.id === data.id ? data : t))
      );
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
      if (!data?.length)
        throw new Error("Transação não encontrada ou não excluída.");

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

  function mudarTipo(novoTipo) {
    setTipo(novoTipo);
    setCategoria(novoTipo === "receita" ? "Trabalho" : "Alimentação");
    setErro("");
  }

  // ============================================================
  // [07] CÁLCULOS E FILTROS
  // ============================================================

  const saldo = contas.reduce(
    (total, conta) => total + Number(conta.saldo_centavos || 0),
    0
  );

  // Caixinhas são as contas de reserva; a conta principal permanece em Minhas contas.
  const caixinhas = contas.filter((conta) => conta.tipo !== "principal");
  const saldoTotalCaixinhas = caixinhas.reduce(
    (total, conta) => total + Number(conta.saldo_centavos || 0),
    0
  );

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const transacoesDoMes = transacoes.filter((t) => {
    if (!t.data) return false;
    const data = new Date(t.data);
    return (
      !Number.isNaN(data.getTime()) &&
      data.getMonth() === mesAtual &&
      data.getFullYear() === anoAtual
    );
  });

  const receitasMes = transacoesDoMes
    .filter((t) => t.tipo === "receita")
    .reduce((total, t) => total + t.valor, 0);

  const despesasMes = transacoesDoMes
    .filter((t) => t.tipo === "despesa")
    .reduce((total, t) => total + t.valor, 0);

  const resultadoMes = receitasMes - despesasMes;

  const totaisPorCategoria = {};
  transacoesDoMes
    .filter((t) => t.tipo === "despesa")
    .forEach((t) => {
      const nome = t.categoria || "Sem categoria";
      totaisPorCategoria[nome] = (totaisPorCategoria[nome] || 0) + t.valor;
    });

  const dadosGrafico = Object.entries(totaisPorCategoria)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const transacoesFiltradas = transacoes.filter(
    (t) =>
      (filtroTipo === "todos" || t.tipo === filtroTipo) &&
      (filtroCategoria === "todas" ||
        (t.categoria || "Sem categoria") === filtroCategoria) &&
      (t.descricao || "").toLowerCase().includes(pesquisa.toLowerCase().trim())
  );

  const todasCategorias = [
    ...new Set(transacoes.map((t) => t.categoria || "Sem categoria")),
  ];

  // ============================================================
  // [08] NAVEGAÇÃO E APRESENTAÇÃO
  // Cada item do menu abre uma área própria. As operações continuam
  // usando os mesmos dados, tabelas e RPCs existentes no Supabase.
  // ============================================================

  const nomeMesAtual = hoje.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const transacoesRecentes = transacoes.slice(0, 5);
  const contaPrincipal = contas.find((conta) => conta.tipo === "principal");

  const paginas = {
    inicio: {
      titulo: "Visão geral",
      descricao: "Acompanhe sua vida financeira em um só lugar.",
    },
    contas: {
      titulo: "Minhas contas",
      descricao: "Veja seus espaços financeiros e seus saldos.",
    },
    caixinhas: {
      titulo: "Minhas caixinhas",
      descricao: "Separe dinheiro para seus planos e objetivos.",
    },
    operacoes: {
      titulo: "Transferências",
      descricao: "Movimente seus valores entre contas ou envie para outro usuário Zuvina.",
    },
    analises: {
      titulo: "Análises",
      descricao: "Entenda como suas receitas e despesas estão distribuídas.",
    },
    movimentacoes: {
      titulo: "Movimentações",
      descricao: "Acompanhe as entradas e saídas das suas contas e caixinhas.",
    },
    transacoes: {
      titulo: "Histórico",
      descricao: "Consulte, pesquise, edite ou exclua seus lançamentos.",
    },
  };

  const menu = [
    { id: "inicio", icone: "⌂", nome: "Visão geral" },
    { id: "contas", icone: "▣", nome: "Minhas contas" },
    { id: "caixinhas", icone: "✧", nome: "Caixinhas" },
    { id: "operacoes", icone: "⇄", nome: "Transferências" },
    { id: "analises", icone: "◷", nome: "Análises" },
    { id: "movimentacoes", icone: "↕", nome: "Movimentações" },
    { id: "transacoes", icone: "≡", nome: "Histórico" },
  ];

  function navegarPara(pagina) {
    setSecaoAtiva(pagina);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function atualizarDados() {
    await Promise.all([carregarContas(), carregarMovimentacoes()]);
    mostrarNotificacao("Informações atualizadas.");
  }

  function renderizarGrafico(altura = 250) {
    if (dadosGrafico.length === 0) {
      return (
        <div className="estado-vazio">
          <span className="estado-vazio-icone">◌</span>
          <strong>Sem despesas neste mês</strong>
          <p>Quando você registrar despesas, a distribuição aparecerá aqui.</p>
        </div>
      );
    }

    return (
      <div className="grafico-area" style={{ height: altura }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dadosGrafico}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={4}
              stroke="none"
            >
              {dadosGrafico.map((item, index) => (
                <Cell
                  key={item.name}
                  fill={CORES_GRAFICO[index % CORES_GRAFICO.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(valorTooltip) => formatarDinheiro(valorTooltip)}
              contentStyle={{
                background: "#171326",
                border: "1px solid rgba(171,85,247,.35)",
                borderRadius: "12px",
                color: "#F7F2FF",
              }}
              itemStyle={{ color: "#F7F2FF" }}
            />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ color: "#A69BB8", fontSize: "12px", paddingTop: "10px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="zuvina-shell">
      <NotificacaoBanner
        notificacao={notificacao}
        onClose={() => setNotificacao(null)}
      />

      <aside className="zuvina-sidebar" aria-label="Navegação principal">
        <button
          className="sidebar-brand"
          type="button"
          onClick={() => navegarPara("inicio")}
          aria-label="Ir para a visão geral do Zuvina"
        >
          <ZuvinaLogo width={46} height={46} />
          <span className="sidebar-brand-text">
            <strong>ZUVINA</strong>
            <small>SEU FUTURO, MAIS INTELIGENTE.</small>
          </span>
        </button>

        <div className="sidebar-section-label">MENU PRINCIPAL</div>
        <nav className="sidebar-nav">
          {menu.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${secaoAtiva === item.id ? "ativo" : ""}`}
              onClick={() => navegarPara(item.id)}
              aria-current={secaoAtiva === item.id ? "page" : undefined}
            >
              <span className="sidebar-link-icon" aria-hidden="true">{item.icone}</span>
              <span className="sidebar-link-label">{item.nome}</span>
              {secaoAtiva === item.id && <span className="sidebar-active-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help-card">
            <span className="sidebar-help-symbol">✦</span>
            <strong>Seu dinheiro, mais leve.</strong>
            <p>Organize sua vida financeira com clareza e acompanhe cada passo.</p>
          </div>
          <div className="sidebar-footer">
            <span className="sidebar-security-dot" />
            <span>Zuvina · Ambiente seguro</span>
          </div>
        </div>
      </aside>

      <div className="zuvina-main">
        <header className="page-header">
          <div className="page-header-copy">
            <span className="eyebrow">ZUVINA / FINANCEIRO</span>
            <h1>{paginas[secaoAtiva]?.titulo || "Visão geral"}</h1>
            <p>{paginas[secaoAtiva]?.descricao || paginas.inicio.descricao}</p>
          </div>
          <div className="page-header-actions">
            <button
              type="button"
              className="header-icon-button"
              onClick={() => setMostrarValores((atual) => !atual)}
              aria-label={mostrarValores ? "Ocultar valores" : "Mostrar valores"}
              title={mostrarValores ? "Ocultar valores" : "Mostrar valores"}
            >
              {mostrarValores ? "◉" : "◎"}
            </button>
            <button
              type="button"
              className="header-refresh-button"
              onClick={atualizarDados}
              disabled={carregandoContas || carregandoMovimentacoes}
              title="Atualizar contas e movimentações"
            >
              ↻ <span>Atualizar</span>
            </button>
          </div>
        </header>

        {carregandoDados && (
          <div className="inline-status" role="status">
            <span className="loading-dot" /> Carregando seus dados financeiros...
          </div>
        )}
        {erroBanco && (
          <div className="inline-error" role="alert">{erroBanco}</div>
        )}

        <main className="page-content">
          {secaoAtiva === "inicio" && (
            <>
              <section className="overview-welcome-row">
                <div>
                  <span className="welcome-kicker">PAINEL FINANCEIRO</span>
                  <h2>Olá! Que bom ter você aqui. <span>✦</span></h2>
                  <p>Veja o resumo da sua organização financeira.</p>
                </div>
                <div className="date-chip">{hoje.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
              </section>

              <div className="overview-top-grid">
                <section className="balance-card panel-card">
                  <div className="balance-card-orbit" aria-hidden="true" />
                  <div className="balance-card-top">
                    <span>Saldo total disponível</span>
                    <span className="balance-card-icon">◈</span>
                  </div>
                  <div className="balance-amount">
                    {mostrarValores ? formatarDinheiro(saldo) : "R$ ••••••"}
                  </div>
                  <div className="balance-card-bottom">
                    <span><i className="status-dot" /> Visão consolidada das suas contas</span>
                    <button type="button" onClick={() => navegarPara("contas")}>Ver contas <b>→</b></button>
                  </div>
                </section>

                <section className="monthly-overview panel-card">
                  <div className="panel-heading compact-heading">
                    <div>
                      <span className="eyebrow">DESEMPENHO</span>
                      <h3>Resumo do mês</h3>
                    </div>
                    <span className="month-chip">{nomeMesAtual}</span>
                  </div>
                  <div className="monthly-stat-list">
                    <div className="monthly-stat income-stat">
                      <span><i /> Receitas</span>
                      <strong>{mostrarValores ? formatarDinheiro(receitasMes) : "R$ •••"}</strong>
                    </div>
                    <div className="monthly-stat expense-stat">
                      <span><i /> Despesas</span>
                      <strong>{mostrarValores ? formatarDinheiro(despesasMes) : "R$ •••"}</strong>
                    </div>
                    <div className={`monthly-stat ${resultadoMes >= 0 ? "result-positive" : "result-negative"}`}>
                      <span><i /> Resultado do mês</span>
                      <strong>{mostrarValores ? formatarDinheiro(resultadoMes) : "R$ •••"}</strong>
                    </div>
                  </div>
                </section>
              </div>

              <div className="quick-actions-grid">
                <button type="button" className="quick-action" onClick={() => navegarPara("operacoes")}>
                  <span className="quick-action-icon">⇄</span>
                  <span><strong>Transferir</strong><small>Movimente seu dinheiro</small></span>
                  <b>→</b>
                </button>
                <button type="button" className="quick-action" onClick={() => navegarPara("analises")}>
                  <span className="quick-action-icon">◷</span>
                  <span><strong>Ver análises</strong><small>Acompanhe seus gastos</small></span>
                  <b>→</b>
                </button>
                <button type="button" className="quick-action" onClick={() => navegarPara("caixinhas")}>
                  <span className="quick-action-icon">✧</span>
                  <span><strong>Minhas caixinhas</strong><small>Cuide dos seus objetivos</small></span>
                  <b>→</b>
                </button>
              </div>

              <div className="dashboard-bottom-grid">
                <section className="content-panel panel-card">
                  <div className="panel-heading">
                    <div><span className="eyebrow">ACOMPANHAMENTO</span><h3>Últimas transações</h3></div>
                    <button type="button" className="text-link" onClick={() => navegarPara("transacoes")}>Ver histórico →</button>
                  </div>
                  {carregandoDados ? (
                    <p className="muted-message">Carregando transações...</p>
                  ) : transacoesRecentes.length === 0 ? (
                    <div className="empty-inline"><span>✧</span><strong>Nenhum lançamento ainda</strong><p>Suas receitas e despesas aparecerão aqui.</p></div>
                  ) : (
                    <ul className="transaction-list dashboard-transaction-list">
                      {transacoesRecentes.map((t) => (
                        <li className="transaction-row" key={t.id}>
                          <span className={`transaction-symbol ${t.tipo === "receita" ? "symbol-income" : "symbol-expense"}`}>{t.tipo === "receita" ? "↙" : "↗"}</span>
                          <span className="transaction-description"><strong>{t.descricao}</strong><small>{t.categoria || "Sem categoria"} · {formatarData(t.data)}</small></span>
                          <strong className={`transaction-amount ${t.tipo}`}>{t.tipo === "receita" ? "+" : "−"}{mostrarValores ? formatarDinheiro(t.valor) : "R$ •••"}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="content-panel panel-card">
                  <div className="panel-heading">
                    <div><span className="eyebrow">SEU MÊS</span><h3>Despesas por categoria</h3></div>
                    <button type="button" className="text-link" onClick={() => navegarPara("analises")}>Detalhes →</button>
                  </div>
                  {renderizarGrafico(250)}
                </section>
              </div>
            </>
          )}

          {secaoAtiva === "contas" && (
            <>
              <section className="page-summary-strip">
                <div><span>Saldo da conta principal</span><strong>{mostrarValores ? formatarDinheiro(contaPrincipal?.saldo_centavos || 0) : "R$ ••••••"}</strong></div>
                <div><span>Total de contas</span><strong>{contas.length}</strong></div>
                <div><span>Contas de reserva</span><strong>{caixinhas.length}</strong></div>
              </section>
              <section className="content-panel panel-card full-panel">
                <div className="panel-heading">
                  <div><span className="eyebrow">ESPAÇOS FINANCEIROS</span><h3>Suas contas</h3><p>Todos os seus saldos em um só lugar.</p></div>
                  <span className="panel-heading-icon">▣</span>
                </div>
                {carregandoContas ? <p className="muted-message">Carregando contas...</p> : contas.length === 0 ? (
                  <div className="empty-inline"><span>▣</span><strong>Nenhuma conta encontrada</strong><p>As contas vinculadas ao seu usuário aparecerão aqui.</p></div>
                ) : (
                  <div className="accounts-grid">
                    {contas.map((conta) => (
                      <CardConta key={conta.id} conta={conta} mostrarValores={mostrarValores} onCopiarNotificacao={mostrarNotificacao} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {secaoAtiva === "caixinhas" && (
            <>
              <section className="savings-hero panel-card">
                <div><span className="eyebrow">OBJETIVOS E RESERVAS</span><h2>Um passo de cada vez.</h2><p>Guarde para o que realmente importa, no seu ritmo.</p></div>
                <div className="savings-total"><span>Total guardado</span><strong>{mostrarValores ? formatarDinheiro(saldoTotalCaixinhas) : "R$ ••••••"}</strong><small>{caixinhas.length} {caixinhas.length === 1 ? "caixinha criada" : "caixinhas criadas"}</small></div>
              </section>
              <section className="content-panel panel-card full-panel">
                <div className="panel-heading"><div><span className="eyebrow">SUAS RESERVAS</span><h3>Minhas caixinhas</h3><p>Os valores abaixo vêm das suas contas de reserva existentes.</p></div><span className="panel-heading-icon">✧</span></div>
                {carregandoContas ? <p className="muted-message">Carregando caixinhas...</p> : caixinhas.length === 0 ? (
                  <div className="empty-inline"><span>✧</span><strong>Seu primeiro objetivo começa aqui</strong><p>Crie uma caixinha para uma viagem, emergência ou outro plano.</p></div>
                ) : (
                  <div className="accounts-grid savings-grid">
                    {caixinhas.map((conta) => <CardConta key={conta.id} conta={conta} mostrarValores={mostrarValores} onCopiarNotificacao={mostrarNotificacao} />)}
                  </div>
                )}
                <form className="form-card" onSubmit={criarContaReserva}>
                  <div><span className="eyebrow">NOVO OBJETIVO</span><h4>Criar uma caixinha</h4><p>Escolha um nome que represente o seu plano.</p></div>
                  <div className="form-card-controls">
                    <div className="field-group"><label htmlFor="nome-conta-reserva">Nome da caixinha</label><input id="nome-conta-reserva" value={nomeNovaConta} onChange={(e) => setNomeNovaConta(e.target.value)} placeholder="Ex.: Viagem, Emergência..." maxLength={40} minLength={2} required /></div>
                    <button type="submit" className="primary-button" disabled={processandoConta || carregandoContas}>{processandoConta ? "Criando..." : "+ Criar caixinha"}</button>
                  </div>
                </form>
              </section>
            </>
          )}

          {secaoAtiva === "operacoes" && (
            <div className="operations-grid">
              <section className="content-panel panel-card operation-panel">
                <div className="panel-heading"><div><span className="eyebrow">ENTRE SUAS CONTAS</span><h3>Movimentar dinheiro</h3><p>Transfira valores entre sua conta principal e suas caixinhas.</p></div><span className="panel-heading-icon">⇄</span></div>
                <form onSubmit={realizarTransferencia} className="modern-form">
                  <div className="field-group"><label htmlFor="conta-origem">Conta de origem</label><select id="conta-origem" value={contaOrigem} onChange={(e) => setContaOrigem(e.target.value)} required><option value="">Selecione a origem</option>{contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}</select></div>
                  <div className="field-group"><label htmlFor="conta-destino">Conta de destino</label><select id="conta-destino" value={contaDestino} onChange={(e) => setContaDestino(e.target.value)} required><option value="">Selecione o destino</option>{contas.filter((conta) => conta.id !== contaOrigem).map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}</select></div>
                  <div className="field-group"><label htmlFor="valor-transferencia-caixinha">Valor (R$)</label><input id="valor-transferencia-caixinha" value={valorTransferencia} onChange={(e) => setValorTransferencia(e.target.value)} placeholder="0,00" inputMode="decimal" required /></div>
                  <div className="field-group"><label htmlFor="descricao-transferencia-caixinha">Descrição <span>(opcional)</span></label><input id="descricao-transferencia-caixinha" value={descricaoTransferencia} onChange={(e) => setDescricaoTransferencia(e.target.value)} placeholder="Ex.: Reserva mensal" maxLength={120} /></div>
                  <button type="submit" className="primary-button full-width-button" disabled={processandoConta || carregandoContas || contas.length < 2}>{processandoConta ? "Movimentando..." : "Confirmar movimentação"} <span>→</span></button>
                </form>
              </section>

              <section className="content-panel panel-card operation-panel">
                <div className="panel-heading"><div><span className="eyebrow">PARA OUTRO USUÁRIO</span><h3>Enviar transferência</h3><p>Envie valores para outro usuário Zuvina usando o código da conta.</p></div><span className="panel-heading-icon">↗</span></div>
                <form onSubmit={realizarTransferenciaExterna} className="modern-form">
                  <div className="field-group field-span-two"><label htmlFor="codigo-destino">Código do destinatário</label><input id="codigo-destino" value={codigoDestinoExterno} onChange={(e) => setCodigoDestinoExterno(e.target.value)} placeholder="Cole o código da conta de destino" required /></div>
                  <div className="field-group"><label htmlFor="valor-transferencia-externa">Valor (R$)</label><input id="valor-transferencia-externa" value={valorTransferenciaExterna} onChange={(e) => setValorTransferenciaExterna(e.target.value)} placeholder="0,00" inputMode="decimal" required /></div>
                  <div className="field-group"><label htmlFor="descricao-transferencia-externa">Descrição <span>(opcional)</span></label><input id="descricao-transferencia-externa" value={descricaoTransferenciaExterna} onChange={(e) => setDescricaoTransferenciaExterna(e.target.value)} placeholder="Ex.: Pagamento" maxLength={120} /></div>
                  <div className="transfer-info field-span-two"><span>ⓘ</span><p>A transferência utiliza a conta principal e o procedimento de segurança já configurado no Zuvina.</p></div>
                  <button type="submit" className="primary-button full-width-button" disabled={processandoConta || carregandoContas || !contaPrincipal}>{processandoConta ? "Enviando..." : "Enviar transferência"} <span>→</span></button>
                </form>
              </section>
            </div>
          )}

          {secaoAtiva === "analises" && (
            <>
              <section className="page-summary-strip analysis-summary">
                <div><span>Receitas do mês</span><strong className="income-text">{mostrarValores ? formatarDinheiro(receitasMes) : "R$ ••••••"}</strong></div>
                <div><span>Despesas do mês</span><strong className="expense-text">{mostrarValores ? formatarDinheiro(despesasMes) : "R$ ••••••"}</strong></div>
                <div><span>Resultado</span><strong className={resultadoMes >= 0 ? "income-text" : "expense-text"}>{mostrarValores ? formatarDinheiro(resultadoMes) : "R$ ••••••"}</strong></div>
              </section>
              <div className="analysis-grid">
                <section className="content-panel panel-card"><div className="panel-heading"><div><span className="eyebrow">DISTRIBUIÇÃO</span><h3>Despesas por categoria</h3><p>{nomeMesAtual}</p></div></div>{renderizarGrafico(330)}</section>
                <section className="content-panel panel-card"><div className="panel-heading"><div><span className="eyebrow">DETALHAMENTO</span><h3>Resumo das categorias</h3><p>Valores registrados como despesa neste mês.</p></div></div>
                  {dadosGrafico.length === 0 ? <p className="muted-message">Ainda não há despesas para detalhar.</p> : <ul className="category-breakdown">{dadosGrafico.map((item, index) => (<li key={item.name}><span className="category-color" style={{ background: CORES_GRAFICO[index % CORES_GRAFICO.length] }} /><span>{item.name}</span><strong>{mostrarValores ? formatarDinheiro(item.value) : "R$ •••"}</strong></li>))}</ul>}
                </section>
              </div>
              <section className="content-panel panel-card full-panel"><div className="panel-heading"><div><span className="eyebrow">PERÍODO ATUAL</span><h3>Movimento financeiro</h3></div><span className="month-chip">{nomeMesAtual}</span></div><div className="analysis-bars"><div><span>Receitas</span><div className="analysis-track"><i className="bar-income" style={{ width: `${receitasMes + despesasMes > 0 ? Math.max(3, receitasMes / (receitasMes + despesasMes) * 100) : 0}%` }} /></div><strong>{mostrarValores ? formatarDinheiro(receitasMes) : "R$ •••"}</strong></div><div><span>Despesas</span><div className="analysis-track"><i className="bar-expense" style={{ width: `${receitasMes + despesasMes > 0 ? Math.max(3, despesasMes / (receitasMes + despesasMes) * 100) : 0}%` }} /></div><strong>{mostrarValores ? formatarDinheiro(despesasMes) : "R$ •••"}</strong></div></div></section>
            </>
          )}

          {secaoAtiva === "movimentacoes" && (
            <section className="content-panel panel-card full-panel"><div className="panel-heading"><div><span className="eyebrow">CONTAS E CAIXINHAS</span><h3>Movimentações</h3><p>Entradas e saídas registradas entre seus espaços financeiros.</p></div><span className="panel-heading-icon">↕</span></div>
              {carregandoMovimentacoes ? <p className="muted-message">Carregando movimentações...</p> : movimentacoes.length === 0 ? <div className="empty-inline"><span>↕</span><strong>Nenhuma movimentação encontrada</strong><p>Quando você movimentar dinheiro entre suas contas, os registros aparecerão aqui.</p></div> : <ul className="transaction-list">{movimentacoes.map((mov) => { const conta = contas.find((c) => c.id === mov.conta_id); return <ItemMovimentacao key={mov.id} mov={mov} contaNome={conta?.nome} mostrarValores={mostrarValores} />; })}</ul>}
            </section>
          )}

          {secaoAtiva === "transacoes" && (
            <section className="content-panel panel-card full-panel"><div className="panel-heading"><div><span className="eyebrow">TODOS OS LANÇAMENTOS</span><h3>Histórico de transações</h3><p>Pesquise e filtre seus registros. Você também pode editar ou excluir um lançamento.</p></div><span className="panel-heading-icon">≡</span></div>
              <div className="history-filters"><div className="field-group history-search"><label htmlFor="pesquisa-transacoes">Pesquisar</label><input id="pesquisa-transacoes" placeholder="Buscar por descrição..." value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} /></div><div className="field-group"><label htmlFor="filtro-tipo">Tipo</label><select id="filtro-tipo" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}><option value="todos">Todas</option><option value="receita">Receitas</option><option value="despesa">Despesas</option></select></div><div className="field-group"><label htmlFor="filtro-categoria">Categoria</label><select id="filtro-categoria" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}><option value="todas">Todas as categorias</option>{todasCategorias.map((item) => <option key={item} value={item}>{item}</option>)}</select></div></div>
              {!carregandoDados && !erroBanco && transacoesFiltradas.length === 0 ? <div className="empty-inline"><span>⌕</span><strong>Nenhuma transação encontrada</strong><p>Tente ajustar os filtros ou registre um novo lançamento.</p></div> : <ul className="transaction-list history-list">{transacoesFiltradas.map((t) => <ItemTransacao key={t.id} t={t} mostrarValores={mostrarValores} salvando={salvando} carregandoDados={carregandoDados} transacaoEmEdicao={transacaoEmEdicao} onIniciarEdicao={iniciarEdicao} onExcluir={excluirTransacao} onSalvarEdicao={salvarEdicao} onCancelarEdicao={() => setTransacaoEmEdicao(null)} descricaoEdicao={descricaoEdicao} setDescricaoEdicao={setDescricaoEdicao} valorEdicao={valorEdicao} setValorEdicao={setValorEdicao} categoriaEdicao={categoriaEdicao} setCategoriaEdicao={setCategoriaEdicao} />)}</ul>}
            </section>
          )}
        </main>

        <footer className="app-footer"><span><ZuvinaLogo width={22} height={22} /> Zuvina</span><small>Seu futuro, mais inteligente.</small></footer>
      </div>
    </div>
  );
}
