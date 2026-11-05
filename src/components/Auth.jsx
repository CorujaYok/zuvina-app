import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import zuvinaOwl from "../assets/zuvina-owl.png";
import "./Auth.css";

// ======================================================
// [AUTH-00] LOGOTIPO OFICIAL DA ZUVINA
// Usa o arquivo original para preservar o desenho da coruja.
// ======================================================
function ZuvinaIcon({ size = 64 }) {
  return (
    <img
      src={zuvinaOwl}
      alt="Símbolo oficial da Zuvina"
      width={size}
      height={size}
      className="auth-owl-image"
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "block",
        filter: "drop-shadow(0 0 8px rgba(171, 85, 247, 0.75))",
        mixBlendMode: "screen",
      }}
    />
  );
}
// ======================================================
// [AUTH-01] COMPONENTE PRINCIPAL DE AUTENTICAÇÃO
// ======================================================
function Auth({
  recuperandoSenha = false,
  aoConcluirRecuperacao,
}) {
  // [AUTH-02] ESTADOS
  const [modo, setModo] = useState("login");
  const [emailPendente, setEmailPendente] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  // [AUTH-2.1] ESTADOS DA RECUPERAÇÃO DE SENHA
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [senhaRedefinida, setSenhaRedefinida] = useState(false);

  // [AUTH-03] URL DE REDIRECIONAMENTO
  const urlAplicativo = window.location.origin + import.meta.env.BASE_URL;

  // [AUTH-04] LOGIN, CADASTRO E RECUPERAÇÃO
  async function enviarFormulario(evento) {
    evento.preventDefault();
    if (carregando) return;

    setMensagem("");
    setCarregando(true);

    try {
      // [AUTH-04.1] RECUPERAR SENHA
      if (modo === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: urlAplicativo }
        );

        if (error) throw error;

        setMensagem(
          "Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha."
        );
        return;
      }

      // [AUTH-04.2] CRIAR CONTA
      if (modo === "cadastro") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { emailRedirectTo: urlAplicativo },
        });

        if (error) throw error;

        if (!data.session) {
          setEmailPendente(email.trim());
          setSenha("");
          setModo("verificar");
          setMensagem("");
        } else {
          setMensagem("Conta criada com sucesso!");
        }
        return;
      }

      // [AUTH-04.3] FAZER LOGIN
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) throw error;
    } catch (erro) {
      console.error("Erro na autenticação:", erro);

      const codigo = erro?.code || "";
      const status = erro?.status;
      const textoErro = (erro?.message || "").toLowerCase();

      if (status === 429 || codigo.includes("rate_limit") || textoErro.includes("rate limit")) {
        setMensagem("Muitas tentativas realizadas. Aguarde alguns minutos e tente novamente.");
      } else if (codigo === "invalid_credentials" || textoErro.includes("invalid login credentials")) {
        setMensagem("E-mail ou senha incorretos.");
      } else if (codigo === "email_not_confirmed" || textoErro.includes("email not confirmed")) {
        setMensagem("Confirme seu e-mail antes de entrar na conta.");
      } else if (codigo === "weak_password" || textoErro.includes("password should be")) {
        setMensagem("Sua senha não atende aos requisitos de segurança.");
      } else if (erro instanceof TypeError || textoErro.includes("failed to fetch") || textoErro.includes("network")) {
        setMensagem("Não foi possível conectar. Verifique sua internet.");
      } else if (modo === "recuperar") {
        setMensagem("Não foi possível enviar o e-mail agora. Tente novamente mais tarde.");
      } else {
        setMensagem("Não foi possível concluir a operação. Tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  }

  // [AUTH-04.4] REDEFINIR SENHA
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
      setMensagem("Não foi possível redefinir a senha. Solicite um novo link e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  // [AUTH-04.5] REENVIAR E-MAIL DE CONFIRMAÇÃO
  async function reenviarConfirmacao() {
    if (carregando || !emailPendente) return;

    setMensagem("");
    setCarregando(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: emailPendente,
        options: { emailRedirectTo: urlAplicativo },
      });

      if (error) throw error;

      setMensagem("Se houver uma confirmação pendente, um novo e-mail será enviado. Confira também o spam.");
    } catch (erro) {
      console.error("Erro ao reenviar confirmação:", erro);

      if (erro?.status === 429 || erro?.code?.includes("rate_limit")) {
        setMensagem("Muitas tentativas. Aguarde alguns minutos antes de reenviar.");
      } else {
        setMensagem("Não foi possível reenviar agora. Tente novamente mais tarde.");
      }
    } finally {
      setCarregando(false);
    }
  }

  // [AUTH-05] NAVEGAÇÃO ENTRE MODOS
  function mudarModo(novoModo) {
    if (carregando) return;
    setModo(novoModo);
    setMensagem("");
    setSenha("");
  }

  // [AUTH-06] TÍTULOS E BOTÕES
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

  // [AUTH-07] TELA DE VERIFICAÇÃO DE E-MAIL
  if (modo === "verificar" && !recuperandoSenha) {
    return (
      <div className="pagina-auth">
        <div className="cartao-auth">
          <div className="auth-header">
            <ZuvinaIcon size={64} />
            <h1 className="logo-auth">ZUVINA</h1>
            <p className="slogan-auth">SEU FUTURO, MAIS INTELIGENTE.</p>
          </div>

          <div className="icone-verificacao">✉️</div>
          <h2>Verifique seu e-mail</h2>

          <p className="descricao-recuperacao">
            Enviamos um link de confirmação para:
          </p>
          <p className="email-verificacao">{emailPendente}</p>
          <p className="descricao-recuperacao">
            Abra sua caixa de entrada e confirme seu endereço para acessar a Zuvina.
          </p>

          {mensagem && (
            <p className="mensagem-auth" role="status">
              {mensagem}
            </p>
          )}

          <button
            type="button"
            className="btn-principal"
            onClick={reenviarConfirmacao}
            disabled={carregando}
          >
            {carregando ? "Enviando..." : "Reenviar confirmação"}
          </button>

          <button
            type="button"
            className="link-auth"
            onClick={() => mudarModo("login")}
            disabled={carregando}
          >
            Voltar para o login
          </button>
        </div>
      </div>
    );
  }

  // [AUTH-07.1] TELA DE REDEFINIÇÃO DE SENHA
  if (recuperandoSenha) {
    return (
      <div className="pagina-auth">
        <div className="cartao-auth">
          <div className="auth-header">
            <ZuvinaIcon size={64} />
            <h1 className="logo-auth">ZUVINA</h1>
            <p className="slogan-auth">SEU FUTURO, MAIS INTELIGENTE.</p>
          </div>

          <h2>Definir nova senha</h2>

          {senhaRedefinida ? (
            <>
              <p className="mensagem-auth" role="status">
                Senha alterada com sucesso!
              </p>
              <button
                type="button"
                className="btn-principal"
                onClick={aoConcluirRecuperacao}
              >
                Continuar
              </button>
            </>
          ) : (
            <form onSubmit={redefinirSenha}>
              <div className="campo-auth">
                <label htmlFor="nova-senha">Nova senha</label>
                <input
                  id="nova-senha"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  required
                />
              </div>

              <div className="campo-auth">
                <label htmlFor="confirmar-senha">Confirmar nova senha</label>
                <input
                  id="confirmar-senha"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita sua nova senha"
                  required
                />
              </div>

              {mensagem && (
                <p className="mensagem-auth" role="status">
                  {mensagem}
                </p>
              )}

              <button
                type="submit"
                className="btn-principal"
                disabled={carregando}
              >
                {carregando ? "Salvando..." : "Redefinir senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // TELA PADRÃO (LOGIN / CADASTRO / RECUPERAR)
  return (
    <div className="pagina-auth">
      <div className="cartao-auth">
        {/* IDENTIDADE VISUAL */}
        <div className="auth-header">
          <ZuvinaIcon size={64} />
          <h1 className="logo-auth">ZUVINA</h1>
          <p className="slogan-auth">SEU FUTURO, MAIS INTELIGENTE.</p>
        </div>

        <h2>{titulo}</h2>

        {modo === "recuperar" && (
          <p className="descricao-recuperacao">
            Informe seu e-mail para receber um link de recuperação de senha.
          </p>
        )}

        {/* FORMULÁRIO */}
        <form onSubmit={enviarFormulario}>
          <div className="campo-auth">
            <label htmlFor="email-auth">E-mail</label>
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
          </div>

          {/* CAMPO DE SENHA */}
          {modo !== "recuperar" && (
            <div className="campo-auth">
              <label htmlFor="senha-auth">Senha</label>
              <input
                id="senha-auth"
                type="password"
                autoComplete={
                  modo === "login" ? "current-password" : "new-password"
                }
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={modo === "cadastro" ? 8 : undefined}
                placeholder={
                  modo === "cadastro"
                    ? "Mínimo de 8 caracteres"
                    : "Digite sua senha"
                }
                disabled={carregando}
                required
              />
            </div>
          )}

          {/* MENSAGENS */}
          {mensagem && (
            <p className="mensagem-auth" role="status" aria-live="polite">
              {mensagem}
            </p>
          )}

          {/* BOTÃO PRINCIPAL */}
          <button
            type="submit"
            className="btn-principal"
            disabled={carregando}
          >
            {carregando ? "Aguarde..." : textoBotao}
          </button>
        </form>

        {/* ESQUECI MINHA SENHA */}
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

        {/* NAVEGAÇÃO */}
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
          <div className="rodape-auth">
            <p className="trocar-auth">
              {modo === "login"
                ? "Ainda não tem uma conta?"
                : "Já tem uma conta?"}
            </p>
            <button
              type="button"
              className="link-auth-destaque"
              onClick={() =>
                mudarModo(modo === "login" ? "cadastro" : "login")
              }
              disabled={carregando}
            >
              {modo === "login" ? "Cadastre-se" : "Fazer login"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Auth;