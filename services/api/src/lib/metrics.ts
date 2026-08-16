const requestCounts = new Map<string, number>();
const durationBuckets = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, Infinity];
const requestDurations = new Map<string, number[]>();

function label(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

export function observeRequest(method: string, path: string, status: number, durationSeconds: number) {
  const labels = `method="${label(method)}",path="${label(path)}",status="${status}"`;
  requestCounts.set(labels, (requestCounts.get(labels) || 0) + 1);
  const durations = requestDurations.get(labels) || Array.from({ length: durationBuckets.length }, () => 0);
  durationBuckets.forEach((bucket, index) => {
    if (durationSeconds <= bucket) durations[index]++;
  });
  requestDurations.set(labels, durations);
}

export function renderMetrics(): string {
  const lines = [
    '# HELP http_requests_total Total HTTP requests handled by the API.',
    '# TYPE http_requests_total counter',
  ];
  requestCounts.forEach((count, labels) => lines.push(`http_requests_total{${labels}} ${count}`));
  lines.push('# HELP http_request_duration_seconds HTTP request duration histogram.', '# TYPE http_request_duration_seconds histogram');
  requestDurations.forEach((buckets, labels) => {
    durationBuckets.forEach((bucket, index) => {
      const le = Number.isFinite(bucket) ? bucket : '+Inf';
      lines.push(`http_request_duration_seconds_bucket{${labels},le="${le}"} ${buckets[index]}`);
    });
    const count = buckets[buckets.length - 1];
    lines.push(`http_request_duration_seconds_count{${labels}} ${count}`);
  });
  return `${lines.join('\n')}\n`;
}
