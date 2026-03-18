import autocannon, {
  type Options as AutocannonOptions,
  type Request as AutocannonRequest,
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

type SeededCredential = {
  email: string;
  password: string;
};

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

async function createLoginCredential(baseUrl: string, index: number, password: string) {
  const email = uniqueEmail(`auth-login-${index}`);

  const response = await fetch(`${baseUrl}/user`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: `Auth Login Seed ${index}`,
      email,
      password,
    }),
  });

  if (response.status !== 201) {
    throw new Error(`Falha ao preparar usuario para carga de login. Status: ${response.status}`);
  }

  return { email, password };
}

async function seedLoginCredentials(baseUrl: string, count: number, password: string) {
  const credentials: SeededCredential[] = [];

  for (let index = 0; index < count; index += 1) {
    credentials.push(await createLoginCredential(baseUrl, index, password));
  }

  return credentials;
}

export async function runAuthLoadScenario(baseUrl: string, profile: LoadProfile): Promise<ScenarioSummary> {
  const startedAt = new Date().toISOString();
  const shape = getLoadShape(profile);
  const thresholds = getThresholds(profile);
  const defaultPassword = 'senha-segura-123';

  const registerRequests: AutocannonRequest[] = Array.from({ length: shape.amount }, (_, index) => {
    const body = JSON.stringify({
      name: `Load User ${index + 1}`,
      email: uniqueEmail('auth-register'),
      password: defaultPassword,
    });

    return {
      method: 'POST' as const,
      path: '/user',
      headers: {
        'content-type': 'application/json',
      },
      body,
    };
  });

  const registerResult = await runAutocannon({
    url: baseUrl,
    connections: 1,
    amount: registerRequests.length,
    requests: registerRequests,
  });

  const loginPoolSize = Math.max(shape.connections * 30, 120);
  const seededCredentials = await seedLoginCredentials(baseUrl, loginPoolSize, defaultPassword);

  const loginRequests: AutocannonRequest[] = seededCredentials.map((credential) => {
    const body = JSON.stringify({ email: credential.email, password: credential.password });

    return {
      method: 'POST' as const,
      path: '/login',
      headers: {
        'content-type': 'application/json',
      },
      body,
    };
  });

  const loginResult = await runAutocannon({
    url: baseUrl,
    connections: shape.connections,
    duration: shape.durationSeconds,
    requests: loginRequests,
  });

  const steps = [
    buildStepResult(
      {
        step: 'Cadastro de usuario',
        url: `${baseUrl}/user`,
        method: 'POST',
        result: registerResult,
      },
      thresholds,
    ),
    buildStepResult(
      {
        step: 'Login de usuario',
        url: `${baseUrl}/login`,
        method: 'POST',
        result: loginResult,
      },
      thresholds,
    ),
  ];

  const finishedAt = new Date().toISOString();

  return {
    scenario: 'auth',
    profile,
    runId: TEST_RUN_ID,
    startedAt,
    finishedAt,
    passed: steps.every((step) => step.passed),
    interpretation: buildInterpretation(steps),
    steps,
  };
}
