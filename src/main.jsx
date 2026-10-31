
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Auth from "./components/Auth.jsx";
import { supabase } from "./lib/supabaseClient.js";
import "./index.css";

// ======================================================
// [MAIN-01] GERENCIAMENTO DE SESSÃO
// ======================================================

function Zuvina() {
  const [sessao, setSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [recuperandoSenha, setRecuperandoSenha] =
    useState(false);

  useEffect(() => {
    let ativo = true;

    // [MAIN-02] DETECTAR RETORNO DE RECUPERAÇÃO
    const parametros = new URLSearchParams(
      window.location.search
    );

    const hash = new URLSearchParams(
      window.location.hash.substring(1)
    );

    const retornoRecuperacao =
      parametros.get("type") === "recovery" ||
      hash.get("type") === "recovery";

    if (retornoRecuperacao) {
      setRecuperandoSenha(true);
    }

    // [MAIN-03] OUVIR ALTERAÇÕES DE AUTENTICAÇÃO
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (evento, novaSessao) => {
        if (!ativo) return;

        if (evento === "PASSWORD_RECOVERY") {
          setRecuperandoSenha(true);
        }

        if (evento === "SIGNED_OUT") {
          setRecuperandoSenha(false);
        }

        setSessao(novaSessao);
        setCarregando(false);
      }
    );

    // [MAIN-04] RECUPERAR SESSÃO EXISTENTE
    supabase.auth.getSession().then(({ data, error }) => {
      if (!ativo) return;

      if (error) {
        console.error("Erro ao recuperar sessão:", error);
      }

      setSessao(data.session);
      setCarregando(false);
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  // [MAIN-05] TELA DE CARREGAMENTO
  if (carregando) {
    return (
      <p className="carregamento">
        Carregando Zuvina...
      </p>
    );
  }

  // [MAIN-06] RECUPERAÇÃO TEM PRIORIDADE
  if (recuperandoSenha) {
    return (
      <Auth
        recuperandoSenha
        aoConcluirRecuperacao={() => {
          setRecuperandoSenha(false);
        }}
      />
    );
  }

  // [MAIN-07] LOGIN E CADASTRO
  if (!sessao) {
    return <Auth />;
  }

  // [MAIN-08] ÁREA FINANCEIRA
  return (
    <>
      <div className="barra-sessao">
        <span>{sessao.user.email}</span>

        <button
          type="button"
          onClick={async () => {
            const { error } =
              await supabase.auth.signOut();

            if (error) {
              alert("Não foi possível sair da conta.");
            }
          }}
        >
          Sair
        </button>
      </div>

      <App
        key={sessao.user.id}
        userId={sessao.user.id}
      />
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
