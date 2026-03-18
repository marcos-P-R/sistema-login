import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { startTestEnvironment, stopTestEnvironment } from '../shared/testEnvironment.js';
import {
  resolveProfile,
  summaryReportPath,
  type ScenarioSummary,
} from './config.ts';
import { runAuthLoadScenario } from './auth.load.ts';
import { runUserFlowLoadScenario } from './user-flow.load.ts';

const allowedScenarios = new Set(['auth', 'user-flow', 'all']);

type LoadScenario = 'auth' | 'user-flow' | 'all';

function resolveScenario(arg?: string): LoadScenario {
  const scenario = (arg ?? 'all') as LoadScenario;
  if (!allowedScenarios.has(scenario)) {
    throw new Error(`Cenario invalido: ${arg}. Use auth, user-flow ou all.`);
  }
  return scenario;
}

async function startServer() {
  const { app } = await startTestEnvironment();

  return new Promise<{ close: () => Promise<void>; baseUrl: string }>((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Nao foi possivel obter a porta do servidor de carga.'));
        return;
      }

      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () =>
          new Promise<void>((closeResolve, closeReject) => {
            server.close((error) => {
              if (error) {
                closeReject(error);
                return;
              }
              closeResolve();
            });
          }),
      });
    });

    server.on('error', reject);
  });
}

async function writeScenarioReport(summary: ScenarioSummary) {
  const reportPath = summaryReportPath(summary.scenario, summary.profile);
  await mkdir('tests/load/reports', { recursive: true });
  await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf-8');
  return reportPath;
}

function printScenarioSummary(summary: ScenarioSummary, reportPath: string) {
  const status = summary.passed ? 'PASSOU' : 'FALHOU';
  console.log(`\n[load:${summary.scenario}] ${status} (${summary.profile})`);
  console.log(`[load:${summary.scenario}] relatorio: ${reportPath}`);

  for (const step of summary.steps) {
    console.log(
      `[load:${summary.scenario}] ${step.step} | avg=${step.metrics.avgLatencyMs.toFixed(2)}ms | p95=${step.metrics.p95LatencyMs.toFixed(2)}ms | erro=${(step.metrics.errorRate * 100).toFixed(2)}% | throughput=${step.metrics.throughputRps.toFixed(2)} req/s`,
    );
  }

  console.log(`[load:${summary.scenario}] interpretacao: ${summary.interpretation}`);
}

function collectFailures(summaries: ScenarioSummary[]) {
  return summaries
    .flatMap((scenarioSummary) =>
      scenarioSummary.steps
        .filter((step) => !step.passed)
        .map((step) => `[${scenarioSummary.scenario}] ${step.step}: ${step.failures.join('; ')}`),
    );
}

async function main() {
  process.env.DISABLE_RATE_LIMITER = 'true';

  const scenario = resolveScenario(process.argv[2]);
  const profile = resolveProfile(process.env.LOAD_PROFILE);
  const { baseUrl, close } = await startServer();
  const summaries: ScenarioSummary[] = [];

  try {
    if (scenario === 'auth' || scenario === 'all') {
      const summary = await runAuthLoadScenario(baseUrl, profile);
      const reportPath = await writeScenarioReport(summary);
      printScenarioSummary(summary, reportPath);
      summaries.push(summary);
    }

    if (scenario === 'user-flow' || scenario === 'all') {
      const summary = await runUserFlowLoadScenario(baseUrl, profile);
      const reportPath = await writeScenarioReport(summary);
      printScenarioSummary(summary, reportPath);
      summaries.push(summary);
    }

    const failures = collectFailures(summaries);
    if (failures.length > 0) {
      throw new Error(`Thresholds violados em ${failures.length} etapa(s): ${failures.join(' | ')}`);
    }
  } finally {
    await close();
    await stopTestEnvironment();
  }
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await stopTestEnvironment();
  process.exit(1);
});
