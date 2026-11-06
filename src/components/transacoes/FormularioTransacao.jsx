export default function FormularioTransacao({
  tipo,
  mudarTipo,
  descricao,
  setDescricao,
  valor,
  setValor,
  categoria,
  setCategoria,
  categorias,
  erro,
  salvando,
  carregandoDados,
  onAdicionar,
}) {
  return (
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

      <form onSubmit={onAdicionar}>
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

        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}

        <button
          type="submit"
          className="botao-adicionar"
          disabled={salvando || carregandoDados}
        >
          {salvando ? "Aguarde..." : "+ Adicionar transação"}
        </button>
      </form>
    </section>
  );
}
