
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./Auth.css";

function Auth() {
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setMensagem("");
    setCarregando(true);

    try {
      if (modo === "cadastro") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: window.location.origin +
              import.meta.env.BASE_URL,
          },
        });

        if (error) throw error;

        if (!data.session) {
          setMensagem(
            "Cadastro solicitado! Confira seu e-mail para confirmar a conta."
          );
        } else {
          setMensagem("Conta criada com sucesso!");
        }
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email,
            password: senha,
          });

        if (error) throw error;
      }
    } catch (erro) {
      console.error("Erro na autenticação:", erro);
      setMensagem(
        "Não foi possível concluir a operação. Confira seus dados e tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  function alternarModo() {
    setModo(modo === "login" ? "cadastro" : "login");
    setMensagem("");
  }

  return (
    <div className="pagina-auth">
      <div className="cartao-auth">
        <h1 className="logo-auth">zuvina.</h1>
        <p className="slogan-auth">
          Seu dinheiro, mais leve.
        </p>

        <h2>
          {modo === "login"
            ? "Bem-vindo de volta!"
            : "Crie sua conta"}
        </h2>

        <form onSubmit={enviarFormulario}>
          <label htmlFor="email-auth">E-mail</label>
          <input
            id="email-auth"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            required
          />

          <label htmlFor="senha-auth">Senha</label>
          <input
            id="senha-auth"
            type="password"
            autoComplete={
              modo === "login"
                ? "current-password"
                : "new-password"
            }
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            minLength={6}
            placeholder="Mínimo de 6 caracteres"
            required
          />

          {mensagem && (
            <p className="mensagem-auth" role="status">
              {mensagem}
            </p>
          )}

          <button type="submit" disabled={carregando}>
            {carregando
              ? "Aguarde..."
              : modo === "login"
                ? "Entrar"
                : "Criar conta"}
          </button>
        </form>

        <p className="trocar-auth">
          {modo === "login"
            ? "Ainda não tem uma conta?"
            : "Já tem uma conta?"}
        </p>

        <button
          type="button"
          className="link-auth"
          onClick={alternarModo}
        >
          {modo === "login"
            ? "Cadastre-se"
            : "Fazer login"}
        </button>
      </div>
    </div>
  );
}

export default Auth;
