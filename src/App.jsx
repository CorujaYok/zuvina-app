import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./App.css";

const categorias = {
  receita: ["Trabalho", "Freelance", "Presente", "Outros"],
  despesa: [
    "Alimentação",
    "Transporte",
    "Moradia",
    "Lazer",
    "Saúde",
    "Outros",
  ],
};

const cores = [
  "#9567f5",
  "#d1a5ff",
  "#ff9ba6",
  "#76dbc0",
  "#f4c36d",
  "#74a7f7",
];

function formatarDinheiro(centavos) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "Data não registrada";

  const convertida = new Date(data);

  if (Number.isNaN(convertida.getTime())) {
    return "Data não registrada";
  }

  return convertida.toLocaleDateString("pt-BR");
}

function App({ userId }) {

const [transacaoEmEdicao, setTransacaoEmEdicao] = useState(null);
const [descricaoEdicao, setDescricaoEdicao] = useState("");
const [valorEdicao, setValorEdicao] = useState("");
const [categoriaEdicao, setCategoriaEdicao] = useState("");
const [transacoes, setTransacoes] = useState([]);
const [carregandoDados, setCarregandoDados] = useState(true);
const [salvando, setSalvando] = useState(false);
const [erroBanco, setErroBanco] = useState("");
const [mostrarValores, setMostrarValores] = useState(true);
useEffect(() => {
  let ativo = true;

  async function carregarTransacoes() {
    setCarregandoDados(true);
    setErroBanco("");

    const { data, error } = await supabase
      .from("transacoes")
      .select("*")
      .eq("usuario_id", userId)
      .order("data", { ascending: false });

    if (!ativo) return;

    if (error) {
      console.error("Erro ao carregar transações:", error);
      setErroBanco("Não foi possível carregar suas transações.");
    } else {
      setTransacoes(data ?? []);
    }

    setCarregandoDados(false);
  }

  carregarTransacoes();

  return () => {
    ativo = false;
  };
}, [userId]);
  const [tipo, setTipo] = useState("despesa");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("Alimentação");
  const [erro, setErro] = useState("");

  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [pesquisa, setPesquisa] = useState("");


async function adicionarTransacao(evento) {
  evento.preventDefault();

  if (salvando || carregandoDados) return;

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

  setSalvando(true);
  setErro("");
  setErroBanco("");

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

  if (error) {
    console.error("Erro ao salvar:", error);
    setErroBanco("Não foi possível salvar a transação.");
  } else {
    setTransacoes((anteriores) => [
      data,
      ...anteriores,
    ]);

    setDescricao("");
    setValor("");
  }

  setSalvando(false);
}


  // Saldo de todas as transações
  const saldo = transacoes.reduce((total, t) => {
    return total + (t.tipo === "receita" ? t.valor : -t.valor);
  }, 0);

  // Identifica o mês atual no horário local
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

  // Agrupa despesas do mês por categoria
  const totaisPorCategoria = {};

  transacoesDoMes
    .filter((t) => t.tipo === "despesa")
    .forEach((t) => {
      const nome = t.categoria || "Sem categoria";

      totaisPorCategoria[nome] =
        (totaisPorCategoria[nome] || 0) + t.valor;
    });

  const dadosGrafico = Object.entries(totaisPorCategoria)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Filtra apenas o histórico exibido
  const transacoesFiltradas = transacoes.filter((t) => {
    const correspondeTipo =
      filtroTipo === "todos" || t.tipo === filtroTipo;

    const correspondeCategoria =
      filtroCategoria === "todas" ||
      (t.categoria || "Sem categoria") === filtroCategoria;

    const correspondePesquisa = (t.descricao || "")
      .toLowerCase()
      .includes(pesquisa.toLowerCase().trim());

    return (
      correspondeTipo &&
      correspondeCategoria &&
      correspondePesquisa
    );
  });

  const todasCategorias = [
    ...new Set(
      transacoes.map((t) => t.categoria || "Sem categoria")
    ),
  ];

  function mudarTipo(novoTipo) {
    setTipo(novoTipo);
    setCategoria(
      novoTipo === "receita" ? "Trabalho" : "Alimentação"
    );
  }

function iniciarEdicao(transacao) {
  if (salvando || carregandoDados) return;

  setTransacaoEmEdicao(transacao);
  setDescricaoEdicao(transacao.descricao);
  setValorEdicao((transacao.valor / 100).toFixed(2).replace(".", ","));
  setCategoriaEdicao(transacao.categoria);
  setErroBanco("");
}

async function salvarEdicao(e) {
  e.preventDefault();

  if (!transacaoEmEdicao || salvando || carregandoDados) return;

  const novaDescricao = descricaoEdicao.trim();
  const textoValor = valorEdicao.trim().replace(",", ".");
  const novoValor = Number(textoValor);
  const novoValorCentavos = Math.round(novoValor * 100);

  if (
    !novaDescricao ||
    !textoValor ||
    !Number.isFinite(novoValor) ||
    novoValor <= 0 ||
    !Number.isSafeInteger(novoValorCentavos) ||
    !categorias[transacaoEmEdicao.tipo]?.includes(categoriaEdicao)
  ) {
    alert("Preencha os campos corretamente.");
    return;
  }

  const usuarioId = transacaoEmEdicao.usuario_id;

  if (!usuarioId) {
    setErroBanco("Não foi possível identificar o usuário da transação.");
    return;
  }

  setSalvando(true);
  setErroBanco("");

  try {
    const { data, error } = await supabase
      .from("transacoes")
      .update({
        descricao: novaDescricao,
        valor: novoValorCentavos,
        categoria: categoriaEdicao,
      })
      .eq("id", transacaoEmEdicao.id)
      .eq("usuario_id", usuarioId)
      .select()
      .single();

    if (error) throw error;

    setTransacoes((anteriores) =>
      anteriores.map((t) => (t.id === data.id ? data : t))
    );

    setTransacaoEmEdicao(null);
  } catch (error) {
    console.error("Erro ao editar transação:", error);
    setErroBanco("Não foi possível salvar a edição.");
  } finally {
    setSalvando(false);
  }
}
 
async function excluirTransacao(id) {
  if (salvando || carregandoDados) return;

  if (!window.confirm("Excluir esta transação?")) {
    return;
  }

  setSalvando(true);
  setErroBanco("");

  const { data, error } = await supabase
    .from("transacoes")
    .delete()
    .eq("id", id)
    .eq("usuario_id", userId)
    .select("id");

  if (error) {
    console.error("Erro ao excluir:", error);
    setErroBanco("Não foi possível excluir a transação.");
  } else if (!data || data.length === 0) {
    setErroBanco("A transação não foi encontrada ou não pôde ser excluída.");
  } else {
    setTransacoes((anteriores) =>
      anteriores.filter((t) => t.id !== id)
    );
  }

  setSalvando(false);
}


  return (
    <div className="zuvina">
      <header className="cabecalho">
        <h1>zuvina.</h1>
        <span>Olá, bem-vindo! 👋</span>
      </header>

      <main>
      {carregandoDados && (
         <p className="aviso-banco">
      Carregando suas transações...
         </p>
)}

      {erroBanco && (
          <p className="erro" role="alert">
      {erroBanco}
         </p>
)}
        <section className="saldo">
         <div className="saldo-topo">
          <p>Seu saldo geral</p>
 
         <button
            type="button"
            className="botao-olho"
            onClick={() => setMostrarValores(!mostrarValores)}
            aria-label={mostrarValores ? "Ocultar saldo" : "Mostrar saldo"}
           >
            {mostrarValores ? "👁️" : "🙈"}
           </button>
          </div>

          <h2>
            {mostrarValores ? formatarDinheiro(saldo) : "R$ ••••••"}
          </h2>

         <span>Seu dinheiro, mais leve.</span>
        </section>

        <section className="resumo-mensal">
          <h3>Resumo do mês</h3>

          <p className="mes-referencia">
            {hoje.toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </p>

          <div className="cards-resumo">
            <div className="card-resumo">
              <span>Receitas</span>
              <strong className="receita">
                {formatarDinheiro(receitasMes)}
              </strong>
            </div>

            <div className="card-resumo">
              <span>Despesas</span>
              <strong className="despesa">
                {formatarDinheiro(despesasMes)}
              </strong>
            </div>

            <div className="card-resumo">
              <span>Resultado do mês</span>
              <strong>
                {formatarDinheiro(receitasMes - despesasMes)}
              </strong>
            </div>
          </div>
        </section>

        <section className="grafico-container">
          <h3>Despesas por categoria</h3>
          <p className="texto-secundario">
            Distribuição das despesas do mês atual
          </p>

          {dadosGrafico.length === 0 ? (
            <p className="texto-secundario">
              Adicione uma despesa para visualizar o gráfico.
            </p>
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
                      <Cell
                        key={item.name}
                        fill={cores[index % cores.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatarDinheiro(value)
                    }
                    contentStyle={{
                      background: "#251b33",
                      border: "1px solid #514066",
                      borderRadius: "10px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />

                  <Legend
                    wrapperStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
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
              onClick={() => setMostrarValores(!mostrarValores)}
              aria-label={mostrarValores ? "Ocultar valores" : "Mostrar valores"}
              title={mostrarValores ? "Ocultar valores" : "Mostrar valores"}
            >
              {mostrarValores ? "👁️" : "🙈"}
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

            <button
           type="submit"
           className="botao-adicionar"
           disabled={salvando || carregandoDados || Boolean(erroBanco)}
           >
           {salvando ? "Aguarde..." : "+ Adicionar transação"}
           </button>
          </form>
        </section>

        <section className="historico">
          <h3>Últimas transações</h3>

          <div className="filtros">
            <input
              aria-label="Pesquisar transações"
              placeholder="Pesquisar transações..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />

            <select
              aria-label="Filtrar por tipo"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="todos">Todas</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
            </select>

            <select
              aria-label="Filtrar por categoria"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="todas">Todas as categorias</option>

              {todasCategorias.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
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
                      className="botao-editar"
                      onClick={() => iniciarEdicao(t)}
                      aria-label={`Editar ${t.descricao}`}
                      title="Editar transação"
                    >
                     ✏️
                   </button>

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

              {transacaoEmEdicao?.id === t.id && (
                   <form 
                     className="formulario-edicao"
                     onSubmit={salvarEdicao}
                   >
                 <label>Descrição</label>
                 <input
                    value={descricaoEdicao}
                    onChange={(e) => setDescricaoEdicao(e.target.value)}
                    placeholder="Descrição"
                  />

                <label>Valor (R$)</label>
                <input
                   value={valorEdicao}
                   onChange={(e) => setValorEdicao(e.target.value)}
                   inputMode="decimal"
                   placeholder="Ex.: 35,50"
                 />

                <label>Categoria</label>
                <select
                  value={categoriaEdicao}
                  onChange={(e) => setCategoriaEdicao(e.target.value)}
                >
                  {categorias[t.tipo].map((item) => (
               <option key={item} value={item}>
                  {item}
              </option>
             ))}
    </select>

             <div className="acoes-edicao">
             <button
                type="submit"
                disabled={salvando || carregandoDados}
             >
                {salvando ? "Salvando..." : "Salvar alterações"}
             </button>
             <button
               type="button"
               onClick={() => setTransacaoEmEdicao(null)}
          >
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
export default App;