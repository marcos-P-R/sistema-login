# Estrategia de Testes

## Tutorial

### Primeira execucao da suite completa

1. Instale as dependencias com `npm install`.
2. Garanta runtime de containers ativo (Docker Engine, Colima, Rancher Desktop ou Podman compativel com Testcontainers).
3. Rode `npm test` para validar unitarios, integracao e BDD.

### Primeira execucao de testes nao funcionais

1. Instale as dependencias do projeto com `npm install` (inclui `autocannon`).
2. Execute `npm run test:security` para validar controles de autenticacao, autorizacao, headers e validacao de entrada.
3. Execute `npm run test:load` para rodar carga `smoke` em ambiente controlado (app e banco efemeros).
4. Consulte os artefatos em `tests/load/reports/*.json`.

## How-to Guide

### Rodar apenas um tipo de teste funcional

- Unitario: `npm run test:unit`
- Integracao: `npm run test:integration`
- BDD: `npm run test:bdd`

### Rodar apenas testes de seguranca

- `npm run test:security`

### Rodar cenarios de carga especificos

- Somente autenticacao: `npm run test:load:auth`
- Fluxo com rota protegida: `npm run test:load:user-flow`
- Carga constante: `npm run test:load:constant`
- Pico de trafego: `npm run test:load:spike`

### Reproduzir verificacao de headers de seguranca

- Execute `npm run test:security -- tests/security/headers.security.spec.ts`.
- Verifique headers como `x-content-type-options`, `x-frame-options` e ausencia de `x-powered-by`.

### Reproduzir falha de autenticacao sem detalhe excessivo

- Execute `npm run test:security -- tests/security/auth.security.spec.ts`.
- Compare respostas de login com email inexistente e senha invalida; ambas devem retornar a mesma mensagem (`Credenciais invalidas`).

### Rodar todas as verificacoes nao funcionais de uma vez

- `npm run test:nonfunctional`

## Reference

### Escopo de testes

- Unitarios: `tests/unit/**/*.spec.ts`
- Integracao: `tests/integration/**/*.spec.ts`
- BDD: `tests/bdd/**/*`
- Seguranca: `tests/security/**/*.spec.ts`
- Carga (autocannon): `tests/load/*.load.ts`

### Scripts NPM

- `npm run test:unit`
- `npm run test:integration`
- `npm run test:bdd`
- `npm run test:security`
- `npm run test:load`
- `npm run test:load:auth`
- `npm run test:load:user-flow`
- `npm run test:load:constant`
- `npm run test:load:spike`
- `npm run test:nonfunctional`
- `npm test`

### Configuracao de carga

Perfis suportados via `LOAD_PROFILE`:

- `smoke`: disponibilidade basica
- `constant`: concorrencia sustentada
- `spike`: crescimento e queda abrupta de concorrencia

Thresholds minimos configurados nos cenarios autocannon:

- `http_req_duration`: media e percentil 95
- `http_req_failed`: taxa de erro
- `http_reqs`: throughput

### Variaveis de ambiente relevantes

- `DATABASE_URL`: configurada automaticamente no ambiente de testes com Testcontainers.
- `JWT_SECRET`: configurada automaticamente no ambiente de testes.
- `DISABLE_RATE_LIMITER`: quando `true`, desabilita o rate limiter global.
- `RATE_LIMIT_WINDOW_MS`: janela do rate limiter global.
- `RATE_LIMIT_MAX`: maximo de requisicoes por janela no rate limiter global.
- `LOAD_PROFILE`: perfil de carga (`smoke`, `constant`, `spike`).

### Evidencias de execucao

- Relatorios autocannon em JSON: `tests/load/reports/*.json`
- Resultado das suites Vitest no terminal
- Suites de seguranca mapeadas por risco OWASP no nome dos `describe`

### Mapeamento OWASP por suite de seguranca

- `tests/security/auth.security.spec.ts`:
  - A01 Broken Access Control
  - A07 Identification and Authentication Failures
- `tests/security/headers.security.spec.ts`:
  - A05 Security Misconfiguration
- `tests/security/input-validation.security.spec.ts`:
  - A02 Cryptographic Failures (nao exposicao de segredos)
  - A03 Injection (entrada maliciosa)
  - A08 Software and Data Integrity Failures (dados inesperados)

### Convencoes e isolamento

- Testes de seguranca usam banco efemero via Testcontainers, sem credenciais reais.
- Runner de carga sobe app/banco locais em porta aleatoria e finaliza ao terminar.
- Dados de carga usam email unico por iteracao para evitar colisoes de estado.

## Explanation

### Por que estes cenarios de carga foram escolhidos

Os cenarios cobrem os fluxos mais criticos da API atual:

- `POST /user` (cadastro)
- `POST /login` (autenticacao)
- `GET /ping` (rota protegida por JWT)

`smoke` confirma disponibilidade minima, `constant` mede estabilidade em concorrencia sustentada e `spike` observa degradacao sob pico abrupto.

### Por que os cenarios de seguranca focam nesses controles

A API trabalha com autenticacao JWT e dados de usuario. Por isso, os testes priorizam:

- falhas de autenticacao sem detalhamento excessivo
- negacao de acesso sem token ou token invalido
- validacao de payloads maliciosos/invalidos
- nao exposicao de segredos internos
- hardening HTTP via headers
- limitacao de abuso por repeticao de tentativas

### Limites conhecidos da cobertura atual

- A aplicacao ainda nao possui recursos com escopo de autorizacao por usuario (ex.: recurso privado por dono). Por isso, o teste de autorizacao cobre bloqueio de acesso sem autenticacao e com token invalido, mas nao isolamento entre recursos de usuarios distintos.
- Os testes de carga sao focados em API e nao substituem observabilidade de infraestrutura em ambiente produtivo.

### Cuidados operacionais

- Nao execute `spike` ou perfis agressivos contra producao.
- Rode testes nao funcionais apenas em ambiente controlado de desenvolvimento/CI.
- Ajuste thresholds conforme baseline real de infraestrutura e capacidade esperada.
