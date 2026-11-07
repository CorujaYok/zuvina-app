export default function ResumoFinanceiro({
  receitas,
  despesas,
  resultado,
  mostrarValores,
  formatarDinheiro,
}) {
  return (
    <section className="resumo-financeiro">

      {/* RECEITAS */}
      <div className="card-resumo receita">
        <span className="resumo-icone">↗</span>

        <div>
          <p>Receitas do mês</p>
          <h3>
            {mostrarValores
              ? formatarDinheiro(receitas)
              : "R$ ••••••"}
          </h3>
        </div>
      </div>

      {/* DESPESAS */}
      <div className="card-resumo despesa">
        <span className="resumo-icone">↘</span>

        <div>
          <p>Despesas do mês</p>
          <h3>
            {mostrarValores
              ? formatarDinheiro(despesas)
              : "R$ ••••••"}
          </h3>
        </div>
      </div>

      {/* RESULTADO */}
      <div className={`card-resumo resultado ${resultado >= 0 ? "positivo" : "negativo"}`}>
        <span className="resumo-icone">
          {resultado >= 0 ? "✓" : "!"}
        </span>

        <div>
          <p>Resultado do mês</p>
          <h3>
            {mostrarValores
              ? formatarDinheiro(resultado)
              : "R$ ••••••"}
          </h3>
        </div>
      </div>

    </section>
  );
}
