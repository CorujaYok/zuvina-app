
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./Auth.css";

// ======================================================
// [AUTH-01] COMPONENTE PRINCIPAL DE AUTENTICAÇÃO
// ======================================================

function Auth({
  recuperandoSenha = false,
  aoConcluirRecuperacao,
}) {
  // ----------------------------------------------------
  // [AUTH-02] ESTADOS
  // ----------------------------------------------------

  // Modos disponíveis: login, cadastro, recuperar
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  // ----------------------------------------------------
  // [AUTH-2.1] ESTADOS DA RECUPERAÇÃO DE SENHA
  // ----------------------------------------------------

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [senhaRedefinida, setSenhaRedefinida] = useState(false);

  // ----------------------------------------------------
  // [AUTH-03] URL DE REDIRECIONAMENTO
  // ----------------------------------------------------

  // Funciona no localhost e no GitHub Pages.
  const urlAplicativo =
    window.location.origin + import.meta.env.BASE_URL;

  // ----------------------------------------------------
  // [AUTH-04] LOGIN, CADASTRO E RECUPERAÇÃO
  // ----------------------------------------------------

  async function enviarFormulario(evento) {
    evento.preventDefault();

    if (carregando) return;

    setMensagem("");
    setCarregando(true);

    try {
      // [AUTH-04.1] RECUPERAR SENHA
      if (modo === "recuperar") {
        const { error } =
          await supabase.auth.resetPasswordForEmail(
            email.trim(),
            {
              redirectTo: urlAplicativo,
            }
          );

        if (error) throw error;

        setMensagem(
          "Se esse e-mail estiver cadastrado, você receberá " +
          "um link para redefinir sua senha."
        );

        return;
      }

      // [AUTH-04.2] CRIAR CONTA
      if (modo === "cadastro") {
        const { data, error } =
          await supabase.auth.signUp({
            email: email.trim(),
            password: senha,
            options: {
              emailRedirectTo: urlAplicativo,
            },
          });

        if (error) throw error;

        if (!data.session) {
          setMensagem(
            "Cadastro solicitado! Confira seu e-mail " +
            "para confirmar a conta."
          );
        } else {
          setMensagem("Conta criada com sucesso!");
        }

        return;
      }

      // [AUTH-04.3] FAZER LOGIN
      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });

      if (error) throw error;
  // [AUTH-04.4] MENSAGENS DE ERRO  
} catch (erro) {
  console.error("Erro na autenticação:", erro);

  const codigo = erro?.code || "";
  const status = erro?.status;
  const textoErro = (erro?.message || "").toLowerCase();

  // Muitas tentativas ou limite de e-mails
  if (
    status === 429 ||
    codigo.includes("rate_limit") ||
    textoErro.includes("rate limit")
  ) {
    setMensagem(
      "Muitas tentativas realizadas. " +
      "Aguarde alguns minutos e tente novamente."
    );

  // E-mail ou senha incorretos
  } else if (
    codigo === "invalid_credentials" ||
    textoErro.includes("invalid login credentials")
  ) {
    setMensagem("E-mail ou senha incorretos.");

  // E-mail ainda não confirmado
  } else if (
    codigo === "email_not_confirmed" ||
    textoErro.includes("email not confirmed")
  ) {
    setMensagem(
      "Confirme seu e-mail antes de entrar na conta."
    );

  // Senha muito fraca
  } else if (
    codigo === "weak_password" ||
    textoErro.includes("password should be")
  ) {
    setMensagem(
      "Sua senha não atende aos requisitos de segurança."
    );

  // Problemas de conexão
  } else if (
    erro instanceof TypeError ||
    textoErro.includes("failed to fetch") ||
    textoErro.includes("network")
  ) {
    setMensagem(
      "Não foi possível conectar. Verifique sua internet."
    );

  // Outros erros na recuperação
  } else if (modo === "recuperar") {
    setMensagem(
      "Não foi possível enviar o e-mail agora. " +
      "Tente novamente mais tarde."
    );

  // Outros erros
  } else {
    setMensagem(
      "Não foi possível concluir a operação. " +
      "Tente novamente."
    );
  }

} finally {
      setCarregando(false);
    }
  }
// ----------------------------------------------------
// [AUTH-04.4] REDEFINIR SENHA
// ----------------------------------------------------

async function redefinirSenha(evento) {
  evento.preventDefault();

  if (carregando) return;

  setMensagem("");

  if (novaSenha.length < 8) {
    setMensagem("A senha precisa ter pelo menos 8 caracteres.");
    return;
  }

  if (novaSenha !== confirmarSenha) {
    setMensagem("As senhas não coincidem.");
    return;
  }

  setCarregando(true);

  try {
    const { error } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    if (error) throw error;

    setSenhaRedefinida(true);
    setNovaSenha("");
    setConfirmarSenha("");
    setMensagem("Senha redefinida com sucesso!");
  } catch (erro) {
    console.error("Erro ao redefinir senha:", erro);

    setMensagem(
      "Não foi possível redefinir a senha. " +
      "Solicite um novo link e tente novamente."
    );
  } finally {
    setCarregando(false);
  }
}
  // ----------------------------------------------------
  // [AUTH-05] NAVEGAÇÃO ENTRE MODOS
  // ----------------------------------------------------

  function mudarModo(novoModo) {
    if (carregando) return;

    setModo(novoModo);
    setMensagem("");
    setSenha("");
  }

  // ----------------------------------------------------
  // [AUTH-06] TÍTULOS E BOTÕES
  // ----------------------------------------------------

  const titulo =
    modo === "login"
      ? "Bem-vindo de volta!"
      : modo === "cadastro"
        ? "Crie sua conta"
        : "Recuperar senha";

  const textoBotao =
    modo === "login"
      ? "Entrar"
      : modo === "cadastro"
        ? "Criar conta"
        : "Enviar link de recuperação";

  // ----------------------------------------------------
  // [AUTH-07] INTERFACE
  // ----------------------------------------------------
 
 
 
 
  // ----------------------------------------------------
  // [AUTH-07.1] TELA DE REDEFINIÇÃO DE SENHA
  // ----------------------------------------------------

if (recuperandoSenha) {
  return (
    <div className="pagina-auth">
      <div className="cartao-auth">
        <h1 className="logo-auth">zuvina.</h1>

        <p className="slogan-auth">
          Seu dinheiro, mais leve.
        </p>

        <h2>Definir nova senha</h2>

        {senhaRedefinida ? (
          <>
            <p className="mensagem-auth" role="status">
              Senha alterada com sucesso!
            </p>

            <button
              type="button"
              onClick={aoConcluirRecuperacao}
            >
              Continuar
            </button>
          </>
        ) : (
          <form onSubmit={redefinirSenha}>
            <label htmlFor="nova-senha">
              Nova senha
            </label>

            <input
              id="nova-senha"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={novaSenha}
              onChange={(e) =>
                setNovaSenha(e.target.value)
              }
              placeholder="Mínimo de 8 caracteres"
              required
            />

            <label htmlFor="confirmar-senha">
              Confirmar nova senha
            </label>

            <input
              id="confirmar-senha"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmarSenha}
              onChange={(e) =>
                setConfirmarSenha(e.target.value)
              }
              placeholder="Repita sua nova senha"
              required
            />

            {mensagem && (
              <p className="mensagem-auth" role="status">
                {mensagem}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
            >
              {carregando
                ? "Salvando..."
                : "Redefinir senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
  return (
    <div className="pagina-auth">
      <div className="cartao-auth">

        {/* [AUTH-07.1] IDENTIDADE VISUAL */}
        <h1 className="logo-auth">zuvina.</h1>

        <p className="slogan-auth">
          Seu dinheiro, mais leve.
        </p>

        <h2>{titulo}</h2>

        {modo === "recuperar" && (
          <p className="descricao-recuperacao">
            Informe seu e-mail para receber um link
            de recuperação de senha.
          </p>
        )}

        {/* [AUTH-07.2] FORMULÁRIO */}
        <form onSubmit={enviarFormulario}>

          <label htmlFor="email-auth">
            E-mail
          </label>

          <input
            id="email-auth"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            disabled={carregando}
            required
          />

          {/* [AUTH-07.3] CAMPO DE SENHA */}
          {modo !== "recuperar" && (
            <>
              <label htmlFor="senha-auth">
                Senha
              </label>

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
                minLength={
                  modo === "cadastro" ? 8 : undefined
                }
                placeholder={
                  modo === "cadastro"
                    ? "Mínimo de 8 caracteres"
                    : "Digite sua senha"
                }
                disabled={carregando}
                required
              />
            </>
          )}

          {/* [AUTH-07.4] MENSAGENS */}
          {mensagem && (
            <p
              className="mensagem-auth"
              role="status"
              aria-live="polite"
            >
              {mensagem}
            </p>
          )}

          {/* [AUTH-07.5] BOTÃO PRINCIPAL */}
          <button
            type="submit"
            disabled={carregando}
          >
            {carregando ? "Aguarde..." : textoBotao}
          </button>
        </form>

        {/* [AUTH-07.6] ESQUECI MINHA SENHA */}
        {modo === "login" && (
          <button
            type="button"
            className="link-auth link-recuperacao"
            onClick={() => mudarModo("recuperar")}
            disabled={carregando}
          >
            Esqueci minha senha
          </button>
        )}

        {/* [AUTH-07.7] NAVEGAÇÃO */}
        {modo === "recuperar" ? (
          <button
            type="button"
            className="link-auth"
            onClick={() => mudarModo("login")}
            disabled={carregando}
          >
            Voltar para o login
          </button>
        ) : (
          <>
            <p className="trocar-auth">
              {modo === "login"
                ? "Ainda não tem uma conta?"
                : "Já tem uma conta?"}
            </p>

            <button
              type="button"
              className="link-auth"
              onClick={() =>
                mudarModo(
                  modo === "login" ? "cadastro" : "login"
                )
              }
              disabled={carregando}
            >
              {modo === "login"
                ? "Cadastre-se"
                : "Fazer login"}
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default Auth;
