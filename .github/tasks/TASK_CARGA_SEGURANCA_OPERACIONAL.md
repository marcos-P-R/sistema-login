# Task Operacional: Implementar Testes de Carga e Segurança

## Objetivo
Executar a implementação prática da task de testes não funcionais, quebrando o trabalho em etapas pequenas, sequenciais e verificáveis.

## Dependência
- [ ] Esta task depende da definição macro em `.github/tasks/TASK_CARGA_SEGURANCA.md`.

## Resultado Esperado
- [ ] Projeto com suíte mínima de carga usando `autocannon`.
- [ ] Projeto com suíte mínima de segurança usando `Vitest` + `Supertest`.
- [ ] Scripts NPM funcionando para execução local.
- [ ] Documentação de uso e interpretação dos resultados.

## Plano Operacional

### Etapa 0. Preparação do Ambiente
- [ ] Validar como a aplicação sobe localmente e quais variáveis de ambiente são obrigatórias.
- [ ] Confirmar porta padrão da API e comportamento esperado para ambiente de teste.
- [ ] Criar diretórios base:
	- [ ] `tests/load`
	- [ ] `tests/security`
	- [ ] `tests/shared`
- [ ] Definir arquivo utilitário para base URL e autenticação de testes.

### Etapa 1. Ferramentas e Dependências
- [ ] Instalar dependências para testes de segurança:
	- [ ] `vitest`
	- [ ] `supertest`
	- [ ] `@types/supertest`
- [ ] Instalar dependências para teste de carga:
	- [ ] `autocannon` como ferramenta de execução de carga documentada.
- [ ] Criar ou ajustar configuração do `Vitest` para suportar testes HTTP/integrados.
- [ ] Definir convenção de nomes:
	- [ ] `*.security.spec.ts` para segurança.
	- [ ] `*.load.js` ou `*.load.ts` para carga, conforme estratégia adotada.

### Etapa 2. Base de Execução para Testes de Segurança
- [ ] Criar utilitário para subir a aplicação em ambiente de teste ou reutilizar instância já exportada.
- [ ] Garantir que os testes consigam executar requisições HTTP sem depender de execução manual paralela.
- [ ] Criar helper para geração de token válido de teste quando necessário.
- [ ] Criar helper para criação de usuário de teste.
- [ ] Garantir limpeza e isolamento entre cenários.

### Etapa 3. Implementar Testes de Segurança Prioritários

#### 3.1 Autenticação
- [ ] Criar arquivo `tests/security/auth.security.spec.ts`.
- [ ] Implementar cenário de login com credenciais inválidas.
- [ ] Implementar cenário com senha ausente ou payload incompleto.
- [ ] Implementar cenário com token JWT ausente.
- [ ] Implementar cenário com token malformado.
- [ ] Implementar cenário com token adulterado.
- [ ] Validar que mensagens de erro não exponham detalhes internos.

#### 3.2 Autorização
- [ ] Criar arquivo `tests/security/authorization.security.spec.ts`.
- [ ] Validar acesso negado em rota protegida sem autenticação.
- [ ] Validar resposta apropriada para credenciais válidas sem permissão suficiente, caso exista diferenciação de papéis.
- [ ] Confirmar que rotas protegidas nunca retornam status de sucesso para usuários não autenticados.

#### 3.3 Validação de Entrada
- [ ] Criar arquivo `tests/security/input-validation.security.spec.ts`.
- [ ] Testar campos obrigatórios ausentes.
- [ ] Testar tipos inválidos no payload.
- [ ] Testar campos inesperados no body.
- [ ] Testar strings excessivamente longas.
- [ ] Testar payload malicioso simples para verificar robustez contra injection e erro interno.
- [ ] Confirmar que a aplicação não retorna stack trace ou detalhes de Prisma em falhas previsíveis.

#### 3.4 Headers e Configuração
- [ ] Criar arquivo `tests/security/http-hardening.security.spec.ts`.
- [ ] Verificar headers de segurança relevantes, se aplicáveis.
- [ ] Validar comportamento de CORS conforme política esperada.
- [ ] Validar presença e comportamento do rate limiter nas rotas sensíveis.

### Etapa 4. Mapear Cenários para OWASP
- [ ] Criar uma tabela de rastreabilidade na documentação ou no próprio arquivo da task.
- [ ] Mapear autenticação para `Identification and Authentication Failures`.
- [ ] Mapear autorização para `Broken Access Control`.
- [ ] Mapear payloads maliciosos e validação de entrada para `Injection`.
- [ ] Mapear headers, CORS e rate limiting para `Security Misconfiguration` quando aplicável.
- [ ] Mapear exposição de erros e dados sensíveis para `Cryptographic Failures` ou falhas correlatas de exposição, conforme o risco real identificado.

### Etapa 5. Base de Execução para Testes de Carga
- [ ] Definir URL base da aplicação para execução via `autocannon`.
- [ ] Criar massa de dados controlada para cadastros e logins.
- [ ] Garantir que o ambiente alvo seja seguro para testes de carga.
- [ ] Definir estratégia para evitar colisão de usuários durante cadastros concorrentes.

### Etapa 6. Implementar Testes de Carga Prioritários

#### 6.1 Smoke Test
- [ ] Criar arquivo `tests/load/auth-smoke.load.js`.
- [ ] Validar disponibilidade do endpoint de login.
- [ ] Validar disponibilidade da rota protegida com token válido.
- [ ] Definir poucos usuários virtuais e curta duração.

#### 6.2 Carga Constante
- [ ] Criar arquivo `tests/load/auth-constant.load.js`.
- [ ] Executar carga constante sobre login.
- [ ] Coletar taxa de erro, média, p95 e throughput.
- [ ] Definir thresholds iniciais documentados.

#### 6.3 Pico de Tráfego
- [ ] Criar arquivo `tests/load/auth-spike.load.js`.
- [ ] Simular aumento repentino de usuários virtuais.
- [ ] Observar degradação e recuperação.
- [ ] Documentar comportamento esperado e comportamento observado.

#### 6.4 Fluxo de Usuário
- [ ] Criar arquivo `tests/load/user-flow.load.js`.
- [ ] Simular sequência de cadastro, login e acesso a rota protegida.
- [ ] Validar se o fluxo permanece funcional sob concorrência moderada.

### Etapa 7. Scripts e Automação
- [ ] Adicionar no `package.json`:
	- [ ] `test:security`
	- [ ] `test:load:smoke`
	- [ ] `test:load:constant`
	- [ ] `test:load:spike`
	- [ ] `test:load`
	- [ ] `test:nonfunctional`
- [ ] Garantir que scripts falhem com código diferente de zero em caso de erro.
- [ ] Separar scripts seguros para execução frequente dos scripts mais agressivos.

### Etapa 8. Documentação no Formato Diátaxis
- [ ] Criar um **Tutorial** para primeira execução de testes de carga e segurança.
- [ ] Criar **How-to guides** para:
	- [ ] rodar apenas testes de segurança.
	- [ ] rodar um cenário específico de carga.
	- [ ] analisar falha de autenticação em teste de segurança.
	- [ ] interpretar thresholds falhos no `autocannon`.
- [ ] Criar **Reference** com:
	- [ ] scripts NPM.
	- [ ] estrutura de diretórios.
	- [ ] variáveis de ambiente.
	- [ ] thresholds adotados.
	- [ ] mapeamento OWASP.
- [ ] Criar **Explanation** com justificativa da escolha de `autocannon`, `Vitest` e `Supertest`, além dos limites da abordagem.

### Etapa 9. Validação Final
- [ ] Executar suíte de segurança completa.
- [ ] Executar ao menos smoke test e carga constante.
- [ ] Validar que os relatórios ou logs gerados são compreensíveis.
- [ ] Revisar flakiness e pontos de falsa falha.
- [ ] Revisar se algum teste agressivo pode causar bloqueio indevido no ambiente local.

## Critérios de Aceite Operacionais
- [ ] Existe ao menos 1 arquivo de segurança por categoria principal: autenticação, autorização, validação de entrada e hardening HTTP.
- [ ] Existe ao menos 1 cenário de carga por perfil: smoke, constante e spike.
- [ ] Os scripts NPM executam as suítes sem intervenção manual complexa.
- [ ] A documentação informa claramente como rodar e quando não rodar cada teste.
- [ ] Os cenários têm rastreabilidade mínima para os riscos OWASP cobertos.

## Riscos e Cuidados
- [ ] Não executar testes de carga contra produção.
- [ ] Não usar credenciais reais nos testes.
- [ ] Não registrar tokens válidos em logs persistentes.
- [ ] Não assumir que teste automatizado substitui revisão manual de segurança.

## Definição de Pronto (DoD)
- [ ] Suite de segurança implementada e executando localmente.
- [ ] Suite de carga implementada com thresholds explícitos.
- [ ] Scripts e documentação concluídos.
- [ ] Mapeamento OWASP registrado.
- [ ] Execução validada em ambiente Linux.