import ItemTransacao from "./ItemTransacao";

export default function HistoricoTransacoes({
  transacoesFiltradas,
  carregandoDados,
  erroBanco,
  pesquisa,
  setPesquisa,
  filtroTipo,
  setFiltroTipo,
  filtroCategoria,
  setFiltroCategoria,
  todasCategorias,

  mostrarValores,
  salvando,
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
  return (
    <section className="historico" id="transacoes">
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

      {!carregandoDados &&
      !erroBanco &&
      transacoesFiltradas.length === 0 ? (
        <p className="texto-vazio">Nenhuma transação encontrada.</p>
      ) : (
        <ul className="lista-transacoes">
          {transacoesFiltradas.map((t) => (
            <ItemTransacao
              key={t.id}
              t={t}
              categorias={{
                receita: ["Trabalho", "Freelance", "Presente", "Outros"],
                despesa: [
                  "Alimentação",
                  "Transporte",
                  "Moradia",
                  "Lazer",
                  "Saúde",
                  "Outros",
                ],
              }}
              mostrarValores={mostrarValores}
              salvando={salvando}
              carregandoDados={carregandoDados}
              transacaoEmEdicao={transacaoEmEdicao}
              onIniciarEdicao={onIniciarEdicao}
              onExcluir={onExcluir}
              onSalvarEdicao={onSalvarEdicao}
              onCancelarEdicao={onCancelarEdicao}
              descricaoEdicao={descricaoEdicao}
              setDescricaoEdicao={setDescricaoEdicao}
              valorEdicao={valorEdicao}
              setValorEdicao={setValorEdicao}
              categoriaEdicao={categoriaEdicao}
              setCategoriaEdicao={setCategoriaEdicao}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
