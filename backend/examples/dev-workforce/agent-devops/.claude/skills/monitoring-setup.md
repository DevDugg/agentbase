# Monitoring & Observability Skill

Set up comprehensive monitoring, logging, and observability for production systems.

## Capabilities

- Configure Prometheus for metrics collection
- Set up Grafana dashboards
- Implement structured logging
- Configure distributed tracing
- Set up alerting and notifications
- Design SLI/SLO monitoring
- Implement APM solutions

## Complete Monitoring Stack

### 1. Prometheus + Grafana Setup

```yaml
# prometheus-values.yaml
prometheus:
  prometheusSpec:
    retention: 30d
    retentionSize: "50GB"
    storageSpec:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 100Gi
    resources:
      requests:
        memory: 2Gi
        cpu: 1000m
      limits:
        memory: 4Gi
        cpu: 2000m

    # ServiceMonitor selector
    serviceMonitorSelector:
      matchLabels:
        prometheus: kube-prometheus

    # Additional scrape configs
    additionalScrapeConfigs:
      - job_name: 'custom-app'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__

grafana:
  adminPassword: "secure-password-here"
  persistence:
    enabled: true
    size: 10Gi

  dashboardProviders:
    dashboardproviders.yaml:
      apiVersion: 1
      providers:
      - name: 'default'
        orgId: 1
        folder: ''
        type: file
        disableDeletion: false
        editable: true
        options:
          path: /var/lib/grafana/dashboards/default

  datasources:
    datasources.yaml:
      apiVersion: 1
      datasources:
      - name: Prometheus
        type: prometheus
        url: http://prometheus-kube-prometheus-prometheus:9090
        access: proxy
        isDefault: true
      - name: Loki
        type: loki
        url: http://loki:3100
        access: proxy

alertmanager:
  config:
    global:
      resolve_timeout: 5m
      slack_api_url: 'YOUR_SLACK_WEBHOOK_URL'

    route:
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'slack-notifications'
      routes:
      - match:
          severity: critical
        receiver: 'pagerduty'
      - match:
          severity: warning
        receiver: 'slack-notifications'

    receivers:
    - name: 'slack-notifications'
      slack_configs:
      - channel: '#alerts'
        title: 'Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

    - name: 'pagerduty'
      pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
```

### 2. Application Metrics (Node.js)

```typescript
// metrics.ts
import { Registry, Counter, Histogram, Gauge } from 'prom-client';
import express from 'express';

export class MetricsService {
  private registry: Registry;

  // Metrics
  public httpRequestsTotal: Counter;
  public httpRequestDuration: Histogram;
  public activeConnections: Gauge;
  public databaseQueryDuration: Histogram;
  public errorCount: Counter;

  constructor() {
    this.registry = new Registry();

    // HTTP request counter
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry]
    });

    // HTTP request duration
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry]
    });

    // Active connections
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      registers: [this.registry]
    });

    // Database query duration
    this.databaseQueryDuration = new Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries',
      labelNames: ['query_type', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry]
    });

    // Error counter
    this.errorCount = new Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'severity'],
      registers: [this.registry]
    });

    // Collect default metrics (CPU, memory, etc.)
    require('prom-client').collectDefaultMetrics({ register: this.registry });
  }

  // Express middleware
  middleware() {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const start = Date.now();
      this.activeConnections.inc();

      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path;

        this.httpRequestsTotal.inc({
          method: req.method,
          route,
          status: res.statusCode
        });

        this.httpRequestDuration.observe(
          {
            method: req.method,
            route,
            status: res.statusCode
          },
          duration
        );

        this.activeConnections.dec();
      });

      next();
    };
  }

  // Metrics endpoint
  getMetrics() {
    return this.registry.metrics();
  }
}

// Usage in Express app
import express from 'express';

const app = express();
const metrics = new MetricsService();

app.use(metrics.middleware());

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.end(await metrics.getMetrics());
});

// Track custom events
app.post('/api/orders', async (req, res) => {
  try {
    const start = Date.now();

    // Your business logic
    const order = await createOrder(req.body);

    // Track database query time
    metrics.databaseQueryDuration.observe(
      { query_type: 'insert', table: 'orders' },
      (Date.now() - start) / 1000
    );

    res.json(order);
  } catch (error) {
    metrics.errorCount.inc({ type: 'order_creation', severity: 'error' });
    res.status(500).json({ error: 'Failed to create order' });
  }
});
```

### 3. Structured Logging

```typescript
// logger.ts
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const esTransportOpts = {
  level: 'info',
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
  },
  index: 'logs'
};

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'myapp',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.VERSION || '1.0.0'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new ElasticsearchTransport(esTransportOpts)
  ]
});

// Usage
logger.info('User logged in', {
  userId: '123',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0'
});

logger.error('Database connection failed', {
  error: err.message,
  stack: err.stack,
  database: 'postgres',
  host: 'db.example.com'
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: Date.now() - start,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
});
```

### 4. Prometheus Alert Rules

```yaml
# prometheus-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: app-alerts
  namespace: monitoring
spec:
  groups:
  - name: app.rules
    interval: 30s
    rules:
    # High error rate
    - alert: HighErrorRate
      expr: |
        (
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m]))
        ) > 0.05
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value | humanizePercentage }} for {{ $labels.service }}"

    # High response time
    - alert: HighResponseTime
      expr: |
        histogram_quantile(0.95,
          rate(http_request_duration_seconds_bucket[5m])
        ) > 2
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "High response time"
        description: "P95 response time is {{ $value }}s for {{ $labels.route }}"

    # Database connection pool exhaustion
    - alert: DatabasePoolExhausted
      expr: |
        database_pool_active_connections / database_pool_max_connections > 0.9
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Database pool nearly exhausted"
        description: "{{ $value | humanizePercentage }} of connection pool in use"

    # Memory usage
    - alert: HighMemoryUsage
      expr: |
        (
          container_memory_usage_bytes{pod=~"myapp-.*"}
          /
          container_spec_memory_limit_bytes{pod=~"myapp-.*"}
        ) > 0.9
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage"
        description: "Pod {{ $labels.pod }} is using {{ $value | humanizePercentage }} of memory"

    # Pod restarts
    - alert: PodRestartingFrequently
      expr: |
        rate(kube_pod_container_status_restarts_total[15m]) > 0
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Pod restarting frequently"
        description: "Pod {{ $labels.pod }} has restarted {{ $value }} times in the last 15 minutes"

    # API availability
    - alert: APIAvailabilityLow
      expr: |
        (
          sum(rate(http_requests_total{status!~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m]))
        ) < 0.99
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "API availability below SLA"
        description: "API availability is {{ $value | humanizePercentage }}, below 99% SLA"
```

### 5. Grafana Dashboard (JSON)

```json
{
  "dashboard": {
    "title": "Application Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "sum(rate(http_requests_total[5m])) by (status)"
        }],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))"
        }],
        "type": "graph"
      },
      {
        "title": "Response Time (P95)",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
        }],
        "type": "graph"
      },
      {
        "title": "Active Connections",
        "targets": [{
          "expr": "active_connections"
        }],
        "type": "graph"
      }
    ]
  }
}
```

## Best Practices

1. **Use structured logging** (JSON format)
2. **Implement distributed tracing** for microservices
3. **Set up SLIs/SLOs** for critical services
4. **Alert on symptoms, not causes**
5. **Use dashboards for visualization**
6. **Implement health checks**
7. **Monitor business metrics** alongside technical metrics
8. **Set up log aggregation** (ELK, Loki)
