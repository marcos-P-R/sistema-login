import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, '../..');
const prismaBinary = resolve(projectRoot, 'node_modules', '.bin', 'prisma');
const mysqlPort = 3306;

type IntegrationContext = {
  app: Awaited<typeof import('../../src/routes/routes.js')>['app'];
  prisma: Awaited<typeof import('../../src/repository/prismaClient.js')>['prisma'];
  container: StartedTestContainer;
};

let integrationContext: IntegrationContext | null = null;

function buildRuntimeUnavailableMessage() {
  return [
    'Testcontainers não conseguiu iniciar o banco de testes.',
    'Verifique se existe um runtime de containers compatível disponível no ambiente, como Docker Engine, Colima, Rancher Desktop ou Podman com suporte ao Testcontainers.',
    'O projeto não precisa de Dockerfile nem docker-compose.yml para subir os containers efêmeros usados apenas nos testes.',
  ].join(' ');
}

async function runPrismaMigrations(databaseUrl: string) {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      execFileSync(prismaBinary, ['migrate', 'deploy'], {
        cwd: projectRoot,
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
        },
        stdio: 'pipe',
      });
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : undefined;
      await new Promise((resolve) => {
        setTimeout(resolve, attempt * 500);
      });
    }
  }

  throw lastError ?? new Error('Falha ao aplicar migrations no banco de testes.');
}

export async function startTestEnvironment() {
  if (integrationContext) {
    return integrationContext;
  }

  const databaseName = 'sistema_login_test';
  const username = `u${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const password = randomUUID();
  const rootPassword = randomUUID();

  try {
    process.env.NODE_ENV = 'test';

    const container = await new GenericContainer('mysql:8.0.36')
      .withEnvironment({
        MYSQL_ROOT_PASSWORD: rootPassword,
        MYSQL_DATABASE: databaseName,
        MYSQL_USER: username,
        MYSQL_PASSWORD: password,
      })
      .withExposedPorts(mysqlPort)
      .withWaitStrategy(Wait.forLogMessage('ready for connections'))
      .start();

    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });

    const databaseHost = container.getHost() === 'localhost' ? '127.0.0.1' : container.getHost();
    const databaseUrl = `mysql://${username}:${password}@${databaseHost}:${container.getMappedPort(mysqlPort)}/${databaseName}`;

    process.env.DATABASE_URL = databaseUrl;
    process.env.JWT_SECRET = randomUUID();

    await runPrismaMigrations(databaseUrl);

    const [{ app }, { prisma }] = await Promise.all([
      import('../../src/routes/routes.js'),
      import('../../src/repository/prismaClient.js'),
    ]);

    integrationContext = {
      app,
      prisma,
      container,
    };

    return integrationContext;
  } catch (error) {
    throw new Error(buildRuntimeUnavailableMessage(), {
      cause: error instanceof Error ? error : undefined,
    });
  }
}

export async function resetDatabase() {
  const context = await startTestEnvironment();
  await context.prisma.user.deleteMany();
}

export async function stopTestEnvironment() {
  if (!integrationContext) {
    return;
  }

  await integrationContext.prisma.$disconnect();
  await integrationContext.container.stop();
  integrationContext = null;
}

export async function getTestApp() {
  const context = await startTestEnvironment();
  return context.app;
}