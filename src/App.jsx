// ============================================================
// ZUVINA — APP PRINCIPAL (LAYOUT REFINADO NEON)
//          By: Katar and Coruja
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import CardConta from "./components/contas/CardConta";
import ItemMovimentacao from "./components/contas/ItemMovimentacao";
import ItemTransacao from "./components/transacoes/ItemTransacao";
import HistoricoTransacoes from "./components/transacoes/HistoricoTransacoes";
import FormularioTransacao from "./components/transacoes/FormularioTransacao";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import SaldoGeral from "./components/dashboard/SaldoGeral";
import GraficoDespesas from "./components/dashboard/GraficoDespesas";
import NotificacaoBanner from "./components/ui/NotificacaoBanner";
import ZuvinaLogo from "./components/ui/ZuvinaLogo";
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
// Movimentação entre Caixinhas
  const [valorCaixinha, setValorCaixinha] = useState("");
  const [descricaoCaixinha, setDescricaoCaixinha] = useState("");
// Transferência Externa
  const [valorTransferenciaExterna, setValorTransferenciaExterna] = useState("");
  const [descricaoTransferenciaExterna, setDescricaoTransferenciaExterna] = useState("");
  const [processandoConta, setProcessandoConta] = useState(false);
  const [codigoDestinoExterno, setCodigoDestinoExterno] = useState("");

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

  const centavos = converterValorEmCentavos(valorCaixinha);

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
        descricaoCaixinha.trim() || "Movimentação entre caixinhas",
    });

    if (error) throw error;

    setValorCaixinha("");
    setDescricaoCaixinha("");

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
  // [08] RENDERIZAÇÃO DA INTERFACE
  // ============================================================

  return (
    <div className="zuvina-shell">
      <NotificacaoBanner
        notificacao={notificacao}
        onClose={() => setNotificacao(null)}
      />

      <Sidebar
        secaoAtiva={secaoAtiva}
        setSecaoAtiva={setSecaoAtiva}
      />

      <div className="zuvina-main">
      {/* Cabeçalho */}
      <Header />
      <main>
        {carregandoDados && (
          <p className="aviso-banco" role="status">
            Carregando dados...
          </p>
        )}
        {erroBanco && (
          <p className="erro" role="alert">
            {erroBanco}
          </p>
        )}

        {/* Saldo Geral */}
       <SaldoGeral
          saldoExibido={
          mostrarValores ? formatarDinheiro(saldo) : "R$ ••••••"
       }
          mostrarValores={mostrarValores}
          onToggleValores={() =>
          setMostrarValores((atual) => !atual)
       }
       />
        {/* Minhas Contas e Caixinhas */}
        <section className="minhas-contas" id="contas">
          <div className="resumo-cabecalho">
            <div>
              <h3>Minhas contas</h3>
              <p className="texto-secundario">
                Organize seu dinheiro em diferentes espaços.
              </p>
            </div>
            <span>🦉</span>
          </div>

          {carregandoContas ? (
            <p className="aviso-banco">Carregando contas...</p>
          ) : (
            <div className="lista-contas">
              {contas.map((conta) => (
                <CardConta
                  key={conta.id}
                  conta={conta}
                  mostrarValores={mostrarValores}
                  onCopiarNotificacao={mostrarNotificacao}
                  formatarDinheiro={formatarDinheiro}
                />
              ))}
            </div>
          )}

          <form className="formulario-conta" onSubmit={criarContaReserva}>
            <h4>Criar conta de reserva</h4>
            <div className="campo">
              <label htmlFor="nome-conta-reserva">Nome da conta</label>
              <input
                id="nome-conta-reserva"
                value={nomeNovaConta}
                onChange={(e) => setNomeNovaConta(e.target.value)}
                placeholder="Ex.: Viagens, Emergência..."
                maxLength={40}
                minLength={2}
                required
              />
            </div>
            <button
              type="submit"
              className="botao-adicionar"
              disabled={processandoConta || carregandoContas}
            >
              {processandoConta ? "Criando..." : "+ Criar conta"}
            </button>
          </form>
        </section>

        {/* Operações Lado a Lado (Grid) */}
        <div className="operacoes-grid">
          {/* Movimentar Caixinhas */}
          <section className="card-operacao" id="operacoes">
            <h3>💜 Movimentar Caixinhas</h3>
            <p className="texto-secundario">Organize o saldo entre as suas contas.</p>
            <form onSubmit={realizarTransferencia}>
              <div className="campos-linha">
                <div className="campo">
                  <label htmlFor="conta-origem">Origem</label>
                  <select
                    id="conta-origem"
                    value={contaOrigem}
                    onChange={(e) => setContaOrigem(e.target.value)}
                    required
                  >
                    <option value="">Selecione a origem</option>
                    {contas.map((conta) => (
                      <option key={conta.id} value={conta.id}>
                        {conta.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="campo">
                  <label htmlFor="conta-destino">Destino</label>
                  <select
                    id="conta-destino"
                    value={contaDestino}
                    onChange={(e) => setContaDestino(e.target.value)}
                    required
                  >
                    <option value="">Selecione o destino</option>
                    {contas
                      .filter((conta) => conta.id !== contaOrigem)
                      .map((conta) => (
                        <option key={conta.id} value={conta.id}>
                          {conta.nome}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="campos-linha">
                <div className="campo">
                  <label htmlFor="valor-transferencia-caixinha">Valor (R$)</label>
                  <input
                    id="valor-transferencia-caixinha"
                    value={valorCaixinha}
                    onChange={(e) => setValorCaixinha(e.target.value)}
                    placeholder="Ex.: 100,00"
                    inputMode="decimal"
                    required
                  />
                </div>

                <div className="campo">
                  <label htmlFor="descricao-transferencia-caixinha">Descrição</label>
                  <input
                    id="descricao-transferencia-caixinha"
                    value={descricaoCaixinha}
                    onChange={(e) => setDescricaoCaixinha(e.target.value)}
                    placeholder="Opcional"
                    maxLength={120}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="botao-adicionar"
                disabled={processandoConta || carregandoContas || contas.length < 2}
              >
                {processandoConta ? "Movimentando..." : "Movimentar dinheiro"}
              </button>
            </form>
          </section>

          {/* Transferência Externa */}
          <section className="card-operacao">
            <h3>🚀 Transferir para Outra Pessoa</h3>
            <p className="texto-secundario">Envie para outro usuário Zuvina.</p>
            <form onSubmit={realizarTransferenciaExterna}>
              <div className="campo">
                <label htmlFor="codigo-destino">Código do destinatário</label>
                <input
                  id="codigo-destino"
                  value={codigoDestinoExterno}
                  onChange={(e) => setCodigoDestinoExterno(e.target.value)}
                  placeholder="Cole o código da conta destino"
                  required
                />
              </div>

              <div className="campos-linha">
                <div className="campo">
                  <label htmlFor="valor-transferencia-externa">Valor (R$)</label>
                  <input
                    id="valor-transferencia-externa"
                    value={valorTransferenciaExterna}
                    onChange={(e) => setValorTransferenciaExterna(e.target.value)}
                    placeholder="Ex.: 50,00"
                    inputMode="decimal"
                    required
                  />
                </div>

                <div className="campo">
                  <label htmlFor="descricao-transferencia-externa">Descrição</label>
                  <input
                    id="descricao-transferencia-externa"
                    value={descricaoTransferenciaExterna}
                    onChange={(e) => setDescricaoTransferenciaExterna(e.target.value)}
                    placeholder="Opcional"
                    maxLength={120}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="botao-adicionar"
                disabled={
                  processandoConta ||
                  carregandoContas ||
                  !contas.some((c) => c.tipo === "principal")
                }
              >
                {processandoConta ? "Enviando..." : "Enviar transferência"}
              </button>
            </form>
          </section>
        </div>

        {/* Dashboard: Gráfico e Nova Transação */}
        <div className="dashboard-duas-colunas" id="analises">

          <GraficoDespesas
            dadosGrafico={dadosGrafico}
            coresGrafico={CORES_GRAFICO}
            formatarDinheiro={formatarDinheiro}
          />


          <FormularioTransacao
            tipo={tipo}
            mudarTipo={mudarTipo}
            descricao={descricao}
            setDescricao={setDescricao}
            valor={valor}
            setValor={setValor}
            categoria={categoria}
            setCategoria={setCategoria}
            categorias={CATEGORIAS}
            erro={erro}
            salvando={salvando}
            carregandoDados={carregandoDados}
            onAdicionar={adicionarTransacao}
         />

        </div>

        {/* Histórico de Movimentações entre Contas */}
        <section className="historico-movimentacoes" id="movimentacoes">
          <h3>Movimentações de contas</h3>
          <p className="texto-secundario">
            Acompanhe entradas e saídas das suas Caixinhas e transferências.
          </p>

          {carregandoMovimentacoes ? (
            <p className="aviso-banco">Carregando movimentações...</p>
          ) : movimentacoes.length === 0 ? (
            <p className="texto-vazio">
              Nenhuma movimentação de conta encontrada.
            </p>
          ) : (
         <ul className="lista-transacoes">
            {movimentacoes.map((mov) => {
           const conta = contas.find((c) => c.id === mov.conta_id);

        return (
         <ItemMovimentacao
            key={mov.id}
            mov={mov}
            contaNome={conta?.nome}
            mostrarValores={mostrarValores}
            formatarData={formatarData}
            formatarDinheiro={formatarDinheiro}
        />
          );
         })}
        </ul>
          )}
        </section>

       <HistoricoTransacoes
           transacoesFiltradas={transacoesFiltradas}
           carregandoDados={carregandoDados}
           erroBanco={erroBanco}
           pesquisa={pesquisa}
           setPesquisa={setPesquisa}
           filtroTipo={filtroTipo}
           setFiltroTipo={setFiltroTipo}
           filtroCategoria={filtroCategoria}
           setFiltroCategoria={setFiltroCategoria}
           todasCategorias={todasCategorias}
           mostrarValores={mostrarValores}
           salvando={salvando}
           transacaoEmEdicao={transacaoEmEdicao}
           onIniciarEdicao={iniciarEdicao}
           onExcluir={excluirTransacao}
           onSalvarEdicao={salvarEdicao}
           onCancelarEdicao={() => setTransacaoEmEdicao(null)}
           descricaoEdicao={descricaoEdicao}
           setDescricaoEdicao={setDescricaoEdicao}
           valorEdicao={valorEdicao}
           setValorEdicao={setValorEdicao}
           categoriaEdicao={categoriaEdicao}
           setCategoriaEdicao={setCategoriaEdicao}
        />
      </main>
      </div>
    </div>
  );
}