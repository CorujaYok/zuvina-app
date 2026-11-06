import mostrarSaldoIcon from "../../assets/MostrarSaldo.png";
import ocultarSaldoIcon from "../../assets/OcultarSaldo.png";
export default function SaldoGeral({
  saldoExibido,
  mostrarValores,
  onToggleValores,
}) {
  return (
    <section className="saldo">
      <div className="saldo-topo">
        <p>Seu saldo geral</p>

     <button
          type="button"
          className="botao-olho"
          onClick={onToggleValores}
          aria-label={mostrarValores ? "Ocultar saldo" : "Mostrar saldo"}
       >
       <img
          src={mostrarValores ? mostrarSaldoIcon : ocultarSaldoIcon}
          alt=""
       />
    </button>
      </div>

      <h2>{saldoExibido}</h2>

      <span className="saldo-subtitulo">
        Seu dinheiro, mais leve.
      </span>
    </section>
  );
}
