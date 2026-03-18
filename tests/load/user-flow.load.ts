import autocannon, {
  type Options as AutocannonOptions,
  type Result as AutocannonResult,
} from 'autocannon';
import {
  buildInterpretation,
  buildStepResult,
  getLoadShape,
  getThresholds,
  type LoadProfile,
  type ScenarioSummary,
  TEST_RUN_ID,
  uniqueEmail,
} from './config.ts';

function runAutocannon(options: AutocannonOptions) {
  return new Promise<AutocannonResult>((resolve, reject) => {
    autocannon(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });
  });
}

async function createAuthenticatedToken(baseUrl: string) {
  const email = uniqueEmail('flow');
  const password = 'senha-segura-123';

  const createResponse = await fetch(`${baseUrl}/user`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'User Flow',
      email,
      password,
    }),
  });

  if (createResponse.status !== 201) {
    throw new Error(`Falha ao preparar usuario para fluxo protegido. Status: ${createResponse.status}`);
  }

  const loginResponse = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (loginResponse.status !== 200) {
    throw new Error(`Falha ao autenticar usuario para fluxo protegido. Status: ${loginResponse.status}`);
  }

  const payload = (await loginResponse.json()) as { token?: string };
  if (!payload.token || payload.token.length < 20) {
    throw new Error('Login nao retornou token JWT valido para o cenario de carga em rota protegida.');
  }

  return payload.token;
}

export async function runUserFlowLoadScenario(baseUrl: string, profile: LoadProfile): Promise<ScenarioSummary> {
  const startedAt = new Date().toISOString();
  const thresholds = getThresholds(profile);
  const shape = getLoadShape(profile);
  const token = await createAuthenticatedToken(baseUrl);

  const pingResult = await runAutocannon({
    url: `${baseUrl}/ping`,
    method: 'GET',
    connections: shape.connections,
    duration: shape.durationSeconds,
    headers: {
      authorization: token,
    },
  });

  const steps = [
    buildStepResult(
      {
        step: 'Acesso a rota protegida com JWT',
        url: `${baseUrl}/ping`,
        method: 'GET',
        result: pingResult,
      },
      thresholds,
    ),
  ];

  const finishedAt = new Date().toISOString();

  return {
    scenario: 'user-flow',
    profile,
    runId: TEST_RUN_ID,
    startedAt,
    finishedAt,
    passed: steps.every((step) => step.passed),
    interpretation: buildInterpretation(steps),
    steps,
  };
}
