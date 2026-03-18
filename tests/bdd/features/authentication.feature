Feature: Autenticacao e acesso protegido
  Como consumidor da API
  Quero validar os principais fluxos de autenticacao
  Para garantir que o comportamento da aplicacao permaneca estavel

  Scenario: Cadastro com sucesso
    Given que eu possuo dados validos para cadastro
    When eu envio a requisicao de cadastro
    Then o cadastro deve ser concluido com sucesso

  Scenario: Login com credenciais invalidas
    Given que existe um usuario cadastrado
    When eu tento autenticar com senha invalida
    Then a autenticacao deve falhar com credenciais invalidas

  Scenario: Acesso negado sem token
    When eu acesso a rota protegida sem token
    Then o acesso deve ser negado