export enum messageResponse {
  NOT_FOUND_EMAIL = 'Email não encontrado',
  SUCESS_AUTH = 'Sucess login',
  FAILED_AUTH = 'Failed login',
  PASSWORD_AUTH_FAILED = 'Senha incorreta',
  INVALID_CREDENTIALS = 'Credenciais inválidas',
  FAILED_TOKEN = 'Failed to authenticate token',
  INVALID_REGISTRATION_DATA = 'Dados de cadastro inválidos',
  INVALID_AUTH_DATA = 'Dados de autenticação inválidos',
  EMAIL_ALREADY_EXISTS = 'Email já cadastrado',
  INTERNAL_ERROR = 'Erro interno ao processar a requisição'
}