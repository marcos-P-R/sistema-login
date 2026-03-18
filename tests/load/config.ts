import { randomUUID } from 'node:crypto';

export const PROFILE = process.env.LOAD_PROFILE ?? 'smoke';
export const TEST_RUN_ID = process.env.TEST_RUN_ID ?? `${Date.now()}`;

export type LoadProfile = 'smoke' | 'constant' | 'spike';

export type LoadShape = {
  connections: number;
  durationSeconds: number;
  amount: number;
};

export type Thresholds = {
  maxAvgLatencyMs: number;
  maxP95LatencyMs: number;
  maxErrorRate: number;
  minThroughputRps: number;
};

export type ScenarioStepResult = {
  step: string;
  url: string;
  method: string;
  metrics: {
    avgLatencyMs: number;
    p95LatencyMs: number;
    errorRate: number;
    throughputRps: number;
    totalRequests: number;
    failedRequests: number;
  };
  thresholds: Thresholds;
  passed: boolean;
  failures: string[];
};

export type ScenarioSummary = {
  scenario: 'auth' | 'user-flow';
  profile: LoadProfile;
  runId: string;
  startedAt: string;
  finishedAt: string;
  passed: boolean;
  interpretation: string;
  steps: ScenarioStepResult[];
};

const profileShape: Record<LoadProfile, LoadShape> = {
  smoke: {
    connections: 2,
    durationSeconds: 20,
    amount: 120,
  },
  constant: {
    connections: 20,
    durationSeconds: 90,
    amount: 1800,
  },
  spike: {
    connections: 80,
    durationSeconds: 30,
    amount: 2400,
  },
};

const profileThresholds: Record<LoadProfile, Thresholds> = {
  smoke: {
    maxAvgLatencyMs: 400,
    maxP95LatencyMs: 800,
    maxErrorRate: 0.01,
    minThroughputRps: 5,
  },
  constant: {
    maxAvgLatencyMs: 500,
    maxP95LatencyMs: 1000,
    maxErrorRate: 0.05,
    minThroughputRps: 5,
  },
  spike: {
    maxAvgLatencyMs: 700,
    maxP95LatencyMs: 1500,
    maxErrorRate: 0.07,
    minThroughputRps: 5,
  },
};

export function resolveProfile(value = PROFILE): LoadProfile {
  if (value === 'smoke' || value === 'constant' || value === 'spike') {
    return value;
  }

  return 'smoke';
}

export function getLoadShape(profile: LoadProfile) {
  return profileShape[profile];
}

export function getThresholds(profile: LoadProfile) {
  return profileThresholds[profile];
}

type RawAutocannonResult = {
  latency?: {
    average?: number;
    p95?: number;
    p97_5?: number;
    p99?: number;
  };
  requests?: {
    average?: number;
    total?: number;
    sent?: number;
  };
  errors?: number;
  non2xx?: number;
  timeouts?: number;
};

function toNumber(value: number | undefined, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function readP95(latency?: { p95?: number; p97_5?: number; p99?: number; average?: number }) {
  if (!latency) {
    return 0;
  }

  return (
    toNumber(latency.p95) ||
    toNumber(latency.p97_5) ||
    toNumber(latency.p99) ||
    toNumber(latency.average)
  );
}

export function buildStepResult(
  input: {
    step: string;
    url: string;
    method: string;
    result: RawAutocannonResult;
  },
  thresholds: Thresholds,
): ScenarioStepResult {
  const totalRequests = toNumber(input.result.requests?.total ?? input.result.requests?.sent, 1);
  const failedRequests = toNumber(input.result.errors) + toNumber(input.result.non2xx) + toNumber(input.result.timeouts);
  const safeTotal = totalRequests > 0 ? totalRequests : 1;

  const metrics = {
    avgLatencyMs: toNumber(input.result.latency?.average),
    p95LatencyMs: readP95(input.result.latency),
    errorRate: totalRequests > 0 ? failedRequests / safeTotal : 1,
    throughputRps: toNumber(input.result.requests?.average),
    totalRequests,
    failedRequests,
  };

  const failures: string[] = [];

  if (metrics.avgLatencyMs > thresholds.maxAvgLatencyMs) {
    failures.push(
      `latencia media ${metrics.avgLatencyMs.toFixed(2)}ms acima de ${thresholds.maxAvgLatencyMs}ms`,
    );
  }

  if (metrics.p95LatencyMs > thresholds.maxP95LatencyMs) {
    failures.push(
      `latencia p95 ${metrics.p95LatencyMs.toFixed(2)}ms acima de ${thresholds.maxP95LatencyMs}ms`,
    );
  }

  if (metrics.errorRate > thresholds.maxErrorRate) {
    failures.push(
      `taxa de erro ${(metrics.errorRate * 100).toFixed(2)}% acima de ${(thresholds.maxErrorRate * 100).toFixed(2)}%`,
    );
  }

  if (metrics.throughputRps < thresholds.minThroughputRps) {
    failures.push(
      `throughput ${metrics.throughputRps.toFixed(2)} req/s abaixo de ${thresholds.minThroughputRps} req/s`,
    );
  }

  return {
    step: input.step,
    url: input.url,
    method: input.method,
    metrics,
    thresholds,
    passed: failures.length === 0,
    failures,
  };
}

export function buildInterpretation(steps: ScenarioStepResult[]) {
  const failedSteps = steps.filter((step) => !step.passed);
  if (failedSteps.length === 0) {
    return 'Todos os thresholds foram respeitados para o perfil selecionado.';
  }

  const reasons = failedSteps
    .map((step) => `${step.step}: ${step.failures.join('; ')}`)
    .join(' | ');

  return `Foram detectadas degradacoes acima dos thresholds. Detalhes: ${reasons}`;
}

export function uniqueEmail(prefix = 'load-user') {
  const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
  return `${prefix}-${TEST_RUN_ID}-${suffix}@example.com`;
}

export function summaryReportPath(testName: string, profile: LoadProfile) {
  return `tests/load/reports/${testName}-${profile}-summary.json`;
}
