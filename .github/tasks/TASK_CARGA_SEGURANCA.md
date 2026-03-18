# Task: Estruturar Testes de Carga e Testes de Segurança

## Objetivo
Implementar uma estratégia de validação não funcional para o projeto, cobrindo:
- Testes de carga para validar desempenho, estabilidade e comportamento sob concorrência.
- Testes de segurança para identificar falhas comuns de autenticação, autorização, exposição de dados e configuração insegura.

## Escopo
- Configurar ferramentas e cenários de teste de carga para os principais fluxos da API.
- Definir e automatizar verificações de segurança alinhadas às boas práticas da OWASP.
- Produzir uma base reutilizável para execução local e futura integração em CI.

## Entregáveis
- Estrutura de testes de carga com cenários reproduzíveis.
- Estrutura de testes de segurança com checklist automatizável e evidências de execução.
- Scripts NPM para execução dos testes não funcionais.
- Documentação com objetivos, execução e interpretação de resultados.

## Checklist Técnico

### 1. Testes de Carga
- [x] Selecionar ferramenta de carga apropriada para a API (`autocannon`).
- [x] Criar estrutura para cenários de carga, por exemplo:
	- [x] `tests/load/auth.load.ts`
	- [x] `tests/load/user-flow.load.ts`
- [x] Definir cenários mínimos de carga para rotas críticas:
	- [x] cadastro de usuário.
	- [x] login.
	- [x] acesso a rota protegida com JWT.
- [x] Modelar ao menos os seguintes perfis de execução:
	- [x] smoke test para validar disponibilidade básica.
	- [x] carga constante para medir latência média e estabilidade.
	- [x] pico de tráfego para avaliar degradação sob concorrência.
- [x] Definir métricas mínimas a coletar:
	- [x] tempo médio de resposta.
	- [x] percentil 95 de latência.
	- [x] taxa de erro.
	- [x] throughput.
- [x] Definir thresholds objetivos para falha do teste.
- [x] Garantir dados de teste controlados para não invalidar os cenários por efeito colateral.
- [x] Produzir relatório simples com interpretação do comportamento observado.

### 2. Testes de Segurança
- [x] Definir abordagem de segurança cobrindo autenticação, autorização, validação de entrada, exposição de informações sensíveis e configuração.
- [x] Criar estrutura para testes de segurança, por exemplo:
	- [x] `tests/security/auth.security.spec.ts`
	- [x] `tests/security/headers.security.spec.ts`
	- [x] `tests/security/input-validation.security.spec.ts`
- [x] Validar controles de autenticação:
	- [x] rejeição de credenciais inválidas.
	- [x] rejeição de token ausente, expirado, malformado ou adulterado.
	- [x] ausência de mensagens excessivamente detalhadas em falhas de login.
- [ ] Validar controles de autorização:
	- [x] rotas protegidas não devem responder com sucesso sem autenticação.
	- [ ] usuário não deve acessar recursos além do permitido pelo seu contexto.
- [x] Validar tratamento de entrada:
	- [x] payloads inválidos devem ser rejeitados com código adequado.
	- [x] campos inesperados não devem alterar comportamento indevidamente.
	- [x] entradas maliciosas não devem causar erro interno ou vazamento de stack trace.
- [x] Validar exposição de dados:
	- [x] respostas não devem retornar senha, hash, segredo ou metadados internos desnecessários.
	- [x] mensagens de erro não devem expor detalhes internos de banco, Prisma ou implementação.
- [x] Validar headers e configuração HTTP:
	- [x] verificar uso de headers de proteção relevantes via `helmet` ou configuração equivalente.
	- [x] verificar comportamento de CORS conforme esperado.
	- [x] verificar rate limiting nas rotas sensíveis.
- [x] Validar resiliência básica contra abuso:
	- [x] múltiplas tentativas de login devem respeitar limitação configurada.
	- [x] requisições inválidas repetidas não devem derrubar a aplicação.

### 3. Alinhamento com OWASP
- [ ] Usar a OWASP como referência para definir cenários de teste, com foco especial em:
	- [ ] Broken Access Control.
	- [ ] Cryptographic Failures.
	- [ ] Injection.
	- [ ] Security Misconfiguration.
	- [ ] Identification and Authentication Failures.
	- [ ] Software and Data Integrity Failures.
	- [ ] Security Logging and Monitoring Failures.
- [x] Garantir que os testes cubram riscos aplicáveis ao contexto atual da API, sem criar cenários irrelevantes ao projeto.
- [x] Registrar para cada grupo de teste qual risco OWASP está sendo mitigado.

### 4. Ferramentas e Automação
- [x] Adicionar scripts no `package.json`:
	- [x] `test:load`
	- [x] `test:security`
	- [x] `test:nonfunctional` para agregação.
- [x] Definir dependências e configuração mínima para execução local.
- [x] Garantir que os testes possam rodar contra ambiente controlado de desenvolvimento.
- [x] Separar claramente testes destrutivos ou agressivos dos testes seguros para execução frequente.

### 5. Documentação
- [x] Criar seção no `README.md` ou em documentação dedicada explicando:
	- [x] objetivo dos testes de carga.
	- [x] objetivo dos testes de segurança.
	- [x] como executar cada suíte.
	- [x] como interpretar thresholds, falhas e evidências.
	- [x] cuidados para não executar testes agressivos em produção.
- [x] Estruturar a documentação seguindo os princípios do framework Diátaxis:
	- [x] **Tutorial**: descrever o passo a passo para executar pela primeira vez os testes de carga e segurança em ambiente local.
	- [x] **How-to guide**: descrever tarefas específicas como rodar apenas um cenário de carga, validar headers de segurança ou reproduzir um teste de autenticação falha.
	- [x] **Reference**: documentar scripts, arquivos de configuração, variáveis de ambiente, thresholds e convenções.
	- [x] **Explanation**: explicar por que os cenários foram escolhidos, quais riscos OWASP cobrem e quais limites os testes têm.

## Critérios de Aceite
- [x] Existe uma suíte mínima de carga cobrindo login e rota protegida.
- [x] Existe uma suíte mínima de segurança cobrindo autenticação, autorização, validação de entrada e exposição de dados.
- [x] Cada cenário de segurança possui mapeamento para risco OWASP relevante.
- [x] Os testes possuem comando de execução simples via NPM.
- [x] A documentação explica como executar e interpretar os resultados.

## Definição de Pronto (DoD)
- [x] Os testes rodam de forma reproduzível em ambiente local.
- [x] Os thresholds de carga estão explícitos e justificáveis.
- [x] Os testes de segurança não expõem segredos nem dependem de credenciais reais.
- [x] Não há execução automática de testes agressivos contra ambientes não controlados.
- [x] A documentação deixa claro o escopo, as limitações e os riscos cobertos.