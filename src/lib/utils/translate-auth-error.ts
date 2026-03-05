/**
 * Traduz mensagens de erro do Supabase Auth para PT-BR.
 */
const ERROR_MAP: Record<string, string> = {
  // Signup
  'Password should be at least 6 characters.':
    'A senha deve ter pelo menos 6 caracteres.',
  'Password should be at least 6 characters':
    'A senha deve ter pelo menos 6 caracteres.',
  'User already registered':
    'Este e-mail já está cadastrado.',
  'Email rate limit exceeded':
    'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'Unable to validate email address: invalid format':
    'O formato do e-mail é inválido.',
  'Signup requires a valid password':
    'É necessário informar uma senha válida.',
  'signup is disabled':
    'O cadastro está temporariamente desabilitado.',

  // Login
  'Invalid login credentials':
    'Credenciais inválidas ou acesso não autorizado.',
  'Email not confirmed':
    'E-mail ainda não confirmado. Verifique sua caixa de entrada.',
  'rate limit':
    'Muitas tentativas. Aguarde alguns minutos e tente novamente.',

  // Password reset
  'For security purposes, you can only request this after':
    'Por segurança, aguarde alguns segundos antes de tentar novamente.',

  // Session
  'Auth session missing!':
    'Sessão expirada. Faça login novamente.',
  'Auth session missing':
    'Sessão expirada. Faça login novamente.',

  // General
  'User not found':
    'Usuário não encontrado.',
  'New password should be different from the old password.':
    'A nova senha deve ser diferente da senha atual.',
}

export function translateAuthError(message: string): string {
  // Direct match
  if (ERROR_MAP[message]) return ERROR_MAP[message]

  // Partial match (for messages that include dynamic values)
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return value
  }

  // Fallback: return generic Portuguese error
  return 'Ocorreu um erro. Tente novamente.'
}
