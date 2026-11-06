
import zuvinaOwl from "../../assets/zuvina-owl.png";

export default function Header() {
  return (
    <header className="cabecalho" id="inicio">
      <div className="logotipo-wrapper">
        <img
          src={zuvinaOwl}
          alt="Zuvina"
          width={38}
          height={38}
          className="zuvina-logo-image"
          style={{
            objectFit: "contain",
            display: "block",
            filter: "drop-shadow(0 0 5px rgba(171, 85, 247, 0.65))",
          }}
        />

        <div>
          <h1>ZUVINA</h1>
          <span className="slogan-header">
            SEU FUTURO, MAIS INTELIGENTE.
          </span>
        </div>
      </div>

      <div className="usuario-saudacao">
        <span>Olá, bem-vindo! 👋</span>
      </div>
    </header>
  );
}
