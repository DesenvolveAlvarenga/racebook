// Traduz os códigos de erro do Supabase Auth para mensagens em português.
// Referência de códigos: https://supabase.com/docs/guides/auth/debugging/error-codes

type AuthLikeError = { code?: string; status?: number; message?: string } | null | undefined;

const MESSAGES: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Você ainda não confirmou seu e-mail. Verifique sua caixa de entrada.",
  user_already_exists: "Já existe uma conta com este e-mail.",
  email_exists: "Já existe uma conta com este e-mail.",
  weak_password: "Senha muito fraca. Use letras, números e pelo menos 8 caracteres.",
  same_password: "A nova senha precisa ser diferente da atual.",
  email_address_invalid: "Este endereço de e-mail não é aceito.",
  signup_disabled: "Novos cadastros estão temporariamente desativados.",
  over_email_send_rate_limit:
    "Muitos e-mails enviados em pouco tempo. Aguarde alguns minutos e tente novamente.",
  over_request_rate_limit: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  otp_expired: "Este link expirou. Solicite um novo.",
  session_not_found: "Sua sessão expirou. Entre novamente.",
  user_banned: "Esta conta está bloqueada.",
  reauthentication_needed: "Por segurança, saia e entre novamente antes de alterar a senha.",
};

export function authErrorMessage(error: AuthLikeError): string {
  if (error?.code && MESSAGES[error.code]) return MESSAGES[error.code];
  if (error?.status === 429) return MESSAGES.over_request_rate_limit;
  return "Não foi possível concluir a operação. Tente novamente em instantes.";
}
