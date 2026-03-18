# Task: Estruturar Estratégia de Testes (Unitário + Integração + BDD)

## Objetivo
Implementar uma base de testes automatizados para o projeto, cobrindo:
- Testes unitários para serviços e regras de negócio.
- Testes de integração para API e persistência usando Testcontainers.
- Testes BDD com Cucumber para cenários de autenticação e fluxo de usuário.

## Escopo
- Configurar e padronizar ferramentas de teste no projeto Node.js com TypeScript.
- Garantir execução local e em CI.
- Criar exemplos iniciais de testes para servir de referência.

## Entregáveis
- Configuração de framework de testes unitários (Vitest).
- Configuração de testes de integração com banco em container (Testcontainers).
- Configuração de BDD com Cucumber (features, steps e hooks).
- Scripts NPM para execução por tipo de teste.
- Documentação curta com comandos e convenções.

## Checklist Técnico

### 1. Testes Unitários
- [ ] Instalar dependências de unit test (`vitest`, `@vitest/coverage-c8`, `@types/node`, ou equivalente).
- [ ] Criar arquivo de configuração (`vitest.config.ts` ou equivalente).
- [ ] Definir padrão de nome de arquivos (`*.spec.ts`).
- [ ] Criar testes para `src/service/UserService.ts` cobrindo:
	- [ ] caso de sucesso de cadastro/autenticação.
	- [ ] validações e erros esperados.
	- [ ] cenários de borda (dados inválidos/ausentes).
- [ ] Mockar `UserRepository` para isolar regra de negócio.

### 2. Testes de Integração com Testcontainers
- [ ] Instalar dependências (`testcontainers`, driver do banco, utilitários de setup).
- [ ] Documentar pré-requisitos de execução do Testcontainers:
	- [ ] o projeto não precisa ter `Dockerfile`.
	- [ ] o projeto não precisa ter `docker-compose.yml`.
	- [ ] é necessário ter um runtime de containers disponível no ambiente de desenvolvimento ou CI, como Docker Engine compatível com Testcontainers.
- [ ] Explicar que o container será usado apenas para infraestrutura efêmera de teste, principalmente o banco, e não para empacotar a aplicação.
- [ ] Criar setup global para subir e derrubar container de banco por suíte.
- [ ] Executar migrations do Prisma no ambiente de teste.
- [ ] Criar testes de integração para rotas principais (`src/routes/routes.ts`), cobrindo:
	- [ ] criação de usuário.
	- [ ] login.
	- [ ] acesso a rota protegida com JWT.
- [ ] Garantir isolamento entre testes (limpeza de base entre cenários).
- [ ] Adicionar validação inicial de ambiente para falhar com mensagem clara quando o runtime de containers não estiver disponível.

### 3. BDD com Cucumber
- [ ] Instalar dependências (`@cucumber/cucumber`, `ts-node`, `tsx` ou equivalente).
- [ ] Criar estrutura:
	- [ ] `tests/bdd/features/*.feature`
	- [ ] `tests/bdd/steps/*.steps.ts`
	- [ ] `tests/bdd/support/hooks.ts`
- [ ] Implementar ao menos 3 cenários Gherkin:
	- [ ] cadastro com sucesso.
	- [ ] login com credenciais inválidas.
	- [ ] acesso negado sem token.
- [ ] Reaproveitar setup de integração (API + banco containerizado) nos steps.

### 4. Scripts e Execução
- [ ] Adicionar scripts no `package.json`:
	- [ ] `test:unit`
	- [ ] `test:integration`
	- [ ] `test:bdd`
	- [ ] `test` (agregador)
- [ ] Validar execução de todos os testes localmente.
- [ ] Validar execução dos testes de integração em ambiente com runtime de containers habilitado.
- [ ] Garantir que a suíte rode em ambiente Linux (compatível com CI).

### 5. Documentação
- [ ] Criar seção no `README.md` com:
	- [ ] objetivo de cada tipo de teste.
	- [ ] comandos de execução.
	- [ ] estratégia de dados e isolamento.
	- [ ] dicas para troubleshooting (container não sobe, timeout, portas ocupadas).
	- [ ] pré-requisitos para testes de integração com Testcontainers.
	- [ ] explicação de que `Dockerfile` e `docker-compose.yml` não são obrigatórios para subir containers de teste.
- [ ] Estruturar a documentação seguindo os princípios do framework Diátaxis:
	- [ ] **Tutorial**: descrever um passo a passo guiado para rodar a suíte completa de testes pela primeira vez no ambiente local.
	- [ ] **How-to guide**: descrever tarefas objetivas como rodar apenas testes unitários, executar testes de integração com Testcontainers, validar o runtime de containers e depurar falhas.
	- [ ] **Reference**: documentar comandos, scripts NPM, variáveis de ambiente, estrutura de pastas de testes, convenções de nomenclatura e pré-requisitos do ambiente containerizado.
	- [ ] **Explanation**: explicar por que a suíte foi dividida entre testes unitários, integração e BDD, quando usar cada abordagem, os trade-offs de isolamento versus fidelidade ao ambiente real e por que Testcontainers não exige `Dockerfile` ou `docker-compose.yml` do projeto.
- [ ] Garantir que cada seção de documentação tenha propósito claro, evitando misturar passo a passo com referência técnica.

## Critérios de Aceite
- [ ] Testes unitários cobrindo regras críticas de `UserService`.
- [ ] Testes de integração executando contra banco real em container.
- [ ] Cenários BDD executando com Cucumber e passando.
- [ ] Pipeline local de testes funcional com scripts NPM.
- [ ] Documentação deixa explícito que Testcontainers depende de runtime de containers, não de `Dockerfile` ou `docker-compose.yml` do projeto.
- [ ] Documentação mínima para onboarding de novos devs.

## Definição de Pronto (DoD)
- [ ] Todas as suítes passam sem flakiness em 2 execuções consecutivas.
- [ ] Sem uso de dados compartilhados entre cenários.
- [ ] Tempo total de execução aceitável para desenvolvimento local.
- [ ] Sem segredos hardcoded em arquivos de teste.
