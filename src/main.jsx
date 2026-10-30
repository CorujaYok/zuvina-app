import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Auth from "./components/Auth.jsx";
import { supabase } from "./lib/supabaseClient.js";
import "./index.css";

function Zuvina() {
  const [sessao, setSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!ativo) return;

      if (error) {
        console.error("Erro ao recuperar sessão:", error);
      }

      setSessao(data.session);
      setCarregando(false);
    });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(
        (_evento, novaSessao) => {
          if (ativo) {
            setSessao(novaSessao);
            setCarregando(false);
          }
        }
      );

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  if (carregando) {
    return <p className="carregamento">Carregando Zuvina...</p>;
  }

  if (!sessao) {
    return <Auth />;
  }

  return (
    <>
      <div className="barra-sessao">
        <span>{sessao.user.email}</span>

        <button
          type="button"
          onClick={async () => {
            const { error } = await supabase.auth.signOut();

            if (error) {
              alert("Não foi possível sair da conta.");
            }
          }}
        >
          Sair
        </button>
      </div>

      <App />
    </>
  );
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <Zuvina />
  </React.StrictMode>
);
