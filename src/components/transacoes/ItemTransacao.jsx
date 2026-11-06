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

export default function ItemTransacao({
  t,
  categorias,
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
            <label htmlFor={`editar-descricao-${t.id}`}>
              Descrição
            </label>

            <input
              id={`editar-descricao-${t.id}`}
              value={descricaoEdicao}
              onChange={(e) => setDescricaoEdicao(e.target.value)}
              placeholder="Descrição"
            />
          </div>

          <div className="campos-linha">
            <div className="campo">
              <label htmlFor={`editar-valor-${t.id}`}>
                Valor (R$)
              </label>

              <input
                id={`editar-valor-${t.id}`}
                value={valorEdicao}
                onChange={(e) => setValorEdicao(e.target.value)}
                inputMode="decimal"
                placeholder="Ex.: 35,50"
              />
            </div>

            <div className="campo">
              <label htmlFor={`editar-categoria-${t.id}`}>
                Categoria
              </label>

              <select
                id={`editar-categoria-${t.id}`}
                value={categoriaEdicao}
                onChange={(e) => setCategoriaEdicao(e.target.value)}
              >
                {categorias[t.tipo].map((item) => (
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
