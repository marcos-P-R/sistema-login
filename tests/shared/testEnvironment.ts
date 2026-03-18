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
    'Testcontainers could not start the test database.',
    'Check whether a compatible container runtime is available in the environment, such as Docker Engine, Colima, Rancher Desktop, or Podman with Testcontainers support.',
    'The project does not require a Dockerfile or docker-compose.yml to start ephemeral containers used only during tests.',
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

  throw lastError ?? new Error('Failed to apply migrations in the test database.');
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