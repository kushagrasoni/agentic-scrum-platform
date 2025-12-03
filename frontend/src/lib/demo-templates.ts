/**
 * Demo Scenario Templates
 * Pre-built templates to showcase human-AI collaboration use cases
 */

export interface DemoTemplate {
  id: string;
  name: string;
  category: 'feature' | 'technical-debt' | 'bug-fix' | 'api-design' | 'data-engineering' | 'infrastructure';
  description: string;
  requirements: string;
  context: string;
  constraints: string;
}

export const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    id: 'login-mfa',
    name: 'Login with MFA',
    category: 'feature',
    description: 'Build secure user authentication with multi-factor authentication',
    requirements: `Build a secure user login system with multi-factor authentication (MFA) for a banking application.

Key Features:
- Username/password authentication with password strength validation
- Email-based one-time password (OTP) for MFA
- "Remember this device" option (30-day session)
- Account lockout after 5 failed attempts (15-minute cooldown)
- Forgot password flow with email verification
- Session timeout after 15 minutes of inactivity
- Accessibility compliance (WCAG 2.1 AA)`,
    context: `The application currently has basic username/password auth that doesn't meet new security compliance requirements. We need to upgrade to MFA before the Q1 security audit. The system serves ~50,000 active users, with peak login traffic of 2,000 logins/minute during market open (9:30 AM ET). Current auth service is built with Node.js/Express and uses PostgreSQL for user data. Email service is already integrated (SendGrid API).`,
    constraints: `- Must complete within current 2-week sprint
- Frontend: React 18 + TypeScript, use existing design system (Material-UI)
- Backend: Node.js 18 + Express + TypeScript
- Database: PostgreSQL 15 (cannot change schema of existing users table - use migration)
- Email OTP must expire after 5 minutes
- Store MFA secrets encrypted (use existing KMS integration)
- Must support existing SSO integration for enterprise customers
- Performance: Login flow must complete in <3 seconds (p95)
- Zero downtime deployment required
- Must maintain existing API contracts for mobile apps`
  },
  {
    id: 'payment-api',
    name: 'Payment Processing REST API',
    category: 'api-design',
    description: 'Design REST API for payment processing with refund capabilities',
    requirements: `Design and implement a RESTful API for payment processing that supports multiple payment methods and refund workflows.

Core Endpoints:
- POST /payments - Create new payment
- GET /payments/{id} - Get payment details
- POST /payments/{id}/refund - Issue full/partial refund
- GET /payments?status=&date_range= - List payments with filters
- POST /payments/{id}/retry - Retry failed payment

Payment Methods: Credit Card, ACH, Wire Transfer
Status Flow: pending → processing → completed|failed
Refund Support: Full refunds, partial refunds, automatic fraud reversals`,
    context: `Current payment system uses a monolithic architecture where payments are processed synchronously in the main application. This causes timeout issues for wire transfers (can take 30+ seconds) and makes it hard to retry failed payments. New API should be event-driven, with async processing for long-running payment methods. System processes ~10,000 payments/day with average ticket of $500. Must integrate with existing payment gateway (Stripe) and fraud detection service (Sift).`,
    constraints: `- Deliver API specification and implementation within 2-week sprint
- Backend: Python 3.11 + FastAPI + async/await
- Use OpenAPI 3.0 spec with full documentation
- Database: PostgreSQL for payment records, Redis for idempotency checks
- Payment gateway calls must be idempotent (use idempotency keys)
- All payment events must publish to Kafka topic payments.events
- Refunds must trigger automatic reconciliation job
- Support webhook callbacks for async payment status updates
- Rate limiting: 100 requests/minute per API key
- Compliance: PCI-DSS Level 1, log all payment events for audit
- Error responses must use RFC 7807 Problem Details standard`
  },
  {
    id: 'sql-to-nosql',
    name: 'Migrate SQL to NoSQL',
    category: 'technical-debt',
    description: 'Plan migration from PostgreSQL to MongoDB for flexible schema',
    requirements: `Plan and execute migration of customer profile data from PostgreSQL to MongoDB to support flexible schema requirements for international expansion.

Current Schema Issues:
- Fixed columns cannot accommodate country-specific fields (e.g., Japan "My Number", EU VAT ID)
- Adding new fields requires schema migrations that block releases
- 80+ columns in customers table, many NULL values

Migration Scope:
- ~2 million customer records
- 150 GB total data size
- Need to support gradual rollout (dual-write period)
- Zero data loss requirement
- Must maintain API backward compatibility`,
    context: `Current PostgreSQL database has become a bottleneck for international expansion. Each new country requires adding 5-10 columns for regulatory fields, and current schema has 40% NULL values due to country-specific data. Engineering team spends ~20 hours/month on schema migrations. MongoDB will allow document-based storage where each country can have its own sub-schema without affecting others. Traffic: 5,000 reads/second, 200 writes/second. Current read replicas lag by ~2 seconds.`,
    constraints: `- Complete migration within 3-week sprint (planning + execution)
- Dual-write period: 2 weeks (write to both databases)
- Must use change data capture (CDC) for backfill from PostgreSQL
- MongoDB cluster: 3-node replica set in AWS (us-east-1)
- Zero downtime migration - use feature flags for gradual rollout
- API must remain stable - internal implementation change only
- Performance must match or exceed current: <50ms read latency (p95)
- Set up MongoDB indexes before migration (plan index strategy)
- Data validation: 100% record parity check before cutover
- Rollback plan: ability to switch back to PostgreSQL within 1 hour
- Budget: ~$5,000/month for MongoDB Atlas cluster`
  },
  {
    id: 'critical-bug',
    name: 'Production Bug: Memory Leak',
    category: 'bug-fix',
    description: 'Diagnose and fix memory leak causing weekly service restarts',
    requirements: `Investigate and fix critical memory leak in user session service that requires weekly restarts.

Symptoms:
- Memory usage grows from 2GB to 16GB over 5-7 days
- Service becomes unresponsive when memory reaches 14GB
- Requires manual restart every Sunday night
- CPU usage normal (20-30%)
- No obvious memory leaks in heap dumps

Impact:
- 15-minute downtime weekly (during restart)
- ~5,000 users experience session loss
- Customer complaints increasing

Need: Root cause analysis, fix implementation, and monitoring improvements`,
    context: `Service is Node.js 18 application running in Kubernetes (8 pods, 16GB memory limit per pod). Service handles user sessions using Redis for session storage and maintains in-memory cache of user preferences. Memory leak started appearing 3 weeks ago after deploying v2.4.0 which added real-time notifications via WebSocket. Heap dumps show large arrays but no clear leak source. Grafana dashboards show steady memory growth at ~200MB/day per pod.`,
    constraints: `- Critical priority - fix within 3-day sprint
- Must identify root cause before implementing fix (no guesswork)
- Cannot increase memory limits (already at max for cost reasons)
- Solution must be backward compatible (no API changes)
- Testing requirements:
  * Load test with 10,000 concurrent users for 24 hours
  * Memory profiling with clinic.js or similar
  * Verify fix in staging for 48 hours before production
- Deployment: Rolling restart during low-traffic window (2-4 AM EST)
- Add monitoring: Alerts if memory growth exceeds 500MB/day
- Document findings for team knowledge base
- Consider adding Node.js memory heap snapshots on schedule`
  },
  {
    id: 'payment-admin-ui',
    name: 'Payment Admin Dashboard',
    category: 'feature',
    description: 'Build treasury operations dashboard for payment management (current default)',
    requirements: `Deliver a payment admin workspace this sprint that lets treasury ops search merchants and payment batches, drill into settlement timelines, trigger refunds/adjustments, and approve payouts with automated allocation rules. Integrate with PaymentCore for ledger data, Payment Rail APIs for disbursements, surface anomaly alerts, and export audit-ready reports.`,
    context: `Treasury Operations currently reconciles commercial payments across ACH, RTP, and wire rails using spreadsheets and terminal screens, which slows down exception handling and audit preparation. The new UI must unify PaymentCore (Postgres) and Payment Rail event streams, support ~60 analysts across US/EU regions, and preserve existing approval workflows so managers can sign off on 400+ payouts per day.`,
    constraints: `- Deliver production-ready MVP within the current 2-week sprint
- Frontend: Next.js 14 + TypeScript + shadcn/ui; align with existing design tokens
- Backend integrations must call PaymentCore GraphQL + Payment Rail REST APIs via API Gateway (mTLS + OAuth2 client credentials)
- All payment actions must emit audit logs to Kafka topic audit.payments and S3 archive for SOX
- Data sources are read-only replicas; mutation goes through Payment Actions service (no direct DB writes or schema changes)
- Enforce RBAC (OpsAnalyst, Manager, Auditor) with feature gating on approval actions
- Performance: search/filter < 1.5s, payout initiation < 4s round-trip
- Deploy inside private VNet - no third-party SaaS or external network calls`
  },
  // Data Engineering Templates
  {
    id: 'etl-pipeline',
    name: 'Real-time ETL Pipeline',
    category: 'data-engineering',
    description: 'Build streaming ETL pipeline for real-time analytics',
    requirements: `Design and implement a real-time ETL pipeline to process customer transaction data for fraud detection and analytics.

Pipeline Components:
- Ingest: Kafka topics for transaction events (10,000 events/sec peak)
- Transform: Enrich with customer data, calculate risk scores, detect anomalies
- Load: Write to ClickHouse for analytics, Redis for real-time alerts, S3 for archive

Data Sources:
- Transaction events (Kafka): payment_id, amount, merchant_id, customer_id, timestamp
- Customer profiles (PostgreSQL): demographics, history, risk tier
- Merchant data (API): category, location, fraud history

Output Requirements:
- Real-time dashboard updates (< 5 second latency)
- Fraud alerts pushed to downstream systems within 2 seconds
- Daily aggregated reports for compliance`,
    context: `Current batch ETL runs every 4 hours, causing delayed fraud detection and stale analytics dashboards. Business needs real-time visibility into transaction patterns. Peak traffic occurs during lunch hours (11 AM - 2 PM) and evening (6-9 PM). Current Spark batch jobs process 50M records/day but take 45 minutes per run. Need to move to streaming architecture while maintaining data quality and exactly-once semantics.`,
    constraints: `- Deliver MVP within 3-week sprint
- Stack: Apache Flink for stream processing, Kafka for messaging
- Must achieve exactly-once processing semantics
- Data quality: < 0.01% data loss, schema validation on ingest
- Latency SLA: end-to-end < 5 seconds (p99)
- Must handle late-arriving data (up to 1 hour late)
- Backpressure handling for traffic spikes (3x normal)
- Monitoring: Grafana dashboards for lag, throughput, error rates
- Cost budget: $15,000/month for streaming infrastructure
- DR requirement: failover to secondary region within 5 minutes`
  },
  {
    id: 'data-lakehouse',
    name: 'Data Lakehouse Architecture',
    category: 'data-engineering',
    description: 'Implement Delta Lake for unified batch and streaming analytics',
    requirements: `Migrate from traditional data warehouse to a modern lakehouse architecture using Delta Lake on Databricks.

Migration Scope:
- 500+ existing Hive tables (200 TB total)
- 150 scheduled ETL jobs (Airflow DAGs)
- 50 BI dashboards (Tableau, Looker)
- Real-time streaming tables for operational analytics

Key Features:
- ACID transactions on data lake
- Time travel for data versioning (30-day retention)
- Schema enforcement and evolution
- Unified batch and streaming processing
- Z-ordering for query optimization`,
    context: `Current Hive-based data warehouse suffers from data consistency issues during concurrent writes, no support for updates/deletes, and slow query performance on large tables. Data engineering team spends 30% of time on data quality issues. Business analysts wait 2-3 hours for dashboards to refresh. Moving to Delta Lake will provide ACID guarantees, faster queries, and support for streaming use cases.`,
    constraints: `- Complete migration in 8-week program (phased rollout)
- Databricks Runtime 13.3 LTS on AWS
- Must maintain backward compatibility with existing SQL queries
- Zero downtime for BI dashboards during migration
- Performance target: 50% query time reduction for top 20 queries
- Storage optimization: 30% reduction through Z-ordering and compaction
- Governance: Unity Catalog for access control and lineage
- Cost: Stay within current $80,000/month compute budget
- Training: 2 workshops for data engineering team on Delta Lake patterns`
  },
  {
    id: 'data-quality-framework',
    name: 'Data Quality Framework',
    category: 'data-engineering',
    description: 'Build automated data quality monitoring and alerting system',
    requirements: `Implement a comprehensive data quality framework to monitor, alert, and remediate data issues across the analytics platform.

Quality Dimensions:
- Completeness: Missing values, NULL ratios
- Accuracy: Range validation, referential integrity
- Consistency: Cross-table validation, business rule checks
- Timeliness: Data freshness, SLA monitoring
- Uniqueness: Duplicate detection, key validation

Key Features:
- Automated profiling for new data sources
- Configurable quality rules (YAML-based)
- Real-time alerting (Slack, PagerDuty)
- Quality score dashboards per domain
- Self-healing capabilities for common issues`,
    context: `Data quality issues cost the organization ~$500K annually in incorrect reports, manual fixes, and downstream failures. Current approach is reactive - issues discovered by business users days after data lands. Need proactive monitoring with clear ownership and SLAs. Data platform serves 200+ data consumers across Finance, Marketing, Operations, and Analytics teams.`,
    constraints: `- Deliver framework within 4-week sprint
- Stack: Great Expectations for validation, Airflow for orchestration
- Must integrate with existing Databricks/Snowflake infrastructure
- Alert fatigue prevention: smart grouping, severity levels
- Performance: Quality checks must not add >10% to pipeline runtime
- Coverage: Start with 50 critical tables, expand to 500+ over 3 months
- Documentation: Runbooks for top 20 failure scenarios
- Governance: Quality metrics visible in data catalog (Atlan/DataHub)
- Budget: $5,000/month for tooling and compute`
  },
  {
    id: 'feature-store',
    name: 'ML Feature Store',
    category: 'data-engineering',
    description: 'Build centralized feature store for ML model training and serving',
    requirements: `Design and implement an ML feature store to centralize feature engineering and serve features consistently across training and inference.

Core Capabilities:
- Feature registry with versioning and metadata
- Batch feature computation (daily, hourly)
- Real-time feature serving (< 10ms latency)
- Point-in-time correct joins for training data
- Feature monitoring and drift detection

Initial Features (100+ planned):
- Customer features: RFM scores, lifetime value, churn risk
- Transaction features: rolling aggregates, velocity metrics
- Behavioral features: click patterns, session metrics`,
    context: `ML team currently copies feature code between projects, leading to training-serving skew and inconsistent model performance. Each model has its own feature pipelines, causing 60% code duplication. Feature computation costs $40K/month due to redundant processing. Data scientists spend 40% of time on feature engineering instead of model development. Need centralized feature management to accelerate ML development.`,
    constraints: `- Deliver MVP within 6-week sprint
- Stack: Feast for feature store, Redis for online serving
- Offline store: Databricks Feature Store (Delta tables)
- Online serving latency: < 10ms (p99) for 50 features
- Batch computation: Spark jobs on Databricks
- Support 500 concurrent model serving requests
- Versioning: Full lineage from raw data to features
- Access control: Team-based permissions via Unity Catalog
- Cost optimization: Feature computation costs < $25K/month
- Integration: Python SDK for data scientists, REST API for services`
  },
  {
    id: 'cdc-replication',
    name: 'CDC Data Replication',
    category: 'data-engineering',
    description: 'Implement change data capture for real-time database replication',
    requirements: `Set up Change Data Capture (CDC) to replicate transactional databases to the analytics platform in near real-time.

Source Systems:
- Order Management (PostgreSQL): 50M rows, 10K changes/min
- Inventory System (MySQL): 20M rows, 5K changes/min
- Customer CRM (SQL Server): 10M rows, 2K changes/min

Target: Databricks Delta Lake with bronze/silver/gold architecture

CDC Requirements:
- Initial full load + ongoing incremental sync
- Schema evolution handling (new columns, type changes)
- Soft delete support (capture deletes as tombstones)
- Exactly-once delivery guarantee`,
    context: `Current nightly batch loads cause analytics to be 12-24 hours stale. Business needs near real-time visibility into orders and inventory. Previous CDC attempt failed due to connector issues and schema drift. Production databases are critical - CDC must not impact source system performance. Target environment runs on Databricks with Unity Catalog for governance.`,
    constraints: `- Deliver production-ready CDC within 4-week sprint
- Stack: Debezium for CDC, Kafka for streaming, Spark Structured Streaming
- Source impact: < 5% additional CPU/IO on production databases
- Replication lag: < 5 minutes (p95) under normal load
- Handle 3x traffic spikes during peak hours
- Schema registry for schema evolution (Confluent Schema Registry)
- Monitoring: Debezium metrics, lag alerts, data quality checks
- DR: Resume from last committed offset on failure
- Security: Encrypted connections, no PII in Kafka (tokenization)
- Cost: $8,000/month for Kafka cluster and compute`
  },
  // More Feature Templates
  {
    id: 'notification-system',
    name: 'Multi-channel Notification System',
    category: 'feature',
    description: 'Build unified notification service for email, SMS, and push',
    requirements: `Design a multi-channel notification service that handles email, SMS, push notifications, and in-app messages with preference management.

Core Features:
- Template management with variables and localization
- User preference center (opt-in/opt-out per channel)
- Rate limiting and batching (digest mode)
- Delivery tracking and analytics
- Retry logic with exponential backoff

Notification Types:
- Transactional: Order confirmations, password resets (immediate)
- Marketing: Promotions, newsletters (batched, preference-based)
- Alerts: Security events, price alerts (priority queue)`,
    context: `Currently notifications are scattered across 5 different services with inconsistent delivery and no centralized preference management. Users complain about notification spam while missing important alerts. Marketing team cannot track campaign effectiveness. Need unified service with clear SLAs and user control.`,
    constraints: `- Deliver MVP within 3-week sprint
- Backend: Go for high throughput (100K notifications/minute target)
- Providers: SendGrid (email), Twilio (SMS), Firebase (push)
- Storage: PostgreSQL for templates/preferences, Redis for rate limiting
- Queue: AWS SQS with DLQ for failed deliveries
- Delivery SLA: < 30 seconds for transactional, < 5 minutes for marketing
- Cost: Stay within $10K/month provider costs
- Compliance: CAN-SPAM, GDPR unsubscribe requirements
- Monitoring: Delivery rates, bounce rates, engagement metrics`
  },
  {
    id: 'search-service',
    name: 'Product Search with Elasticsearch',
    category: 'feature',
    description: 'Build fast, relevant product search with autocomplete',
    requirements: `Implement a product search service using Elasticsearch that provides fast, relevant results with autocomplete and faceted filtering.

Search Features:
- Full-text search across product name, description, attributes
- Autocomplete with typo tolerance (did you mean?)
- Faceted navigation (category, brand, price range, ratings)
- Personalized ranking based on user behavior
- Recently viewed and search history

Performance Requirements:
- Search latency < 100ms (p95)
- Autocomplete < 50ms (p95)
- Support 1000 concurrent searches`,
    context: `Current MySQL LIKE queries are slow (2-3 seconds) and don't support relevance ranking. Users abandon searches due to poor results. Competitors have instant search with suggestions. Product catalog has 500K SKUs with 50 attributes each. Need to index from PostgreSQL product database and keep in sync.`,
    constraints: `- Deliver within 3-week sprint
- Stack: Elasticsearch 8.x on AWS OpenSearch
- Indexing: Near real-time sync from PostgreSQL (< 1 minute lag)
- Cluster: 3 nodes, auto-scaling based on query load
- Index design: Optimize for search and facets separately
- Query tuning: BM25 with custom boosting rules
- Analytics: Track searches, clicks, zero-result queries
- A/B testing: Framework for relevance experiments
- Cost: $4,000/month for OpenSearch cluster`
  },
  // Infrastructure Templates
  {
    id: 'k8s-migration',
    name: 'Kubernetes Migration',
    category: 'infrastructure',
    description: 'Migrate legacy VMs to Kubernetes containers',
    requirements: `Migrate 15 legacy applications from EC2 VMs to Amazon EKS (Kubernetes) for improved scalability, deployment automation, and cost efficiency.

Applications to Migrate:
- 8 Java Spring Boot services (microservices)
- 4 Node.js APIs
- 2 Python ML inference services
- 1 Legacy Java monolith (containerize first)

Infrastructure Requirements:
- Multi-AZ deployment for HA
- Auto-scaling based on CPU/memory and custom metrics
- Service mesh for observability (Istio/Linkerd)
- GitOps deployment with ArgoCD`,
    context: `Current VM-based deployment requires manual scaling and has inconsistent environments between dev/staging/prod. Deployments take 2 hours and require change tickets. Cost is $50K/month for underutilized VMs. Team wants to adopt GitOps, improve deployment frequency from weekly to daily, and reduce infrastructure costs by 30%.`,
    constraints: `- Complete migration in 12-week program
- EKS version: 1.28+ with managed node groups
- Zero downtime migration (blue-green per service)
- Maintain current monitoring (Datadog) and logging (Splunk)
- Security: Pod security standards, network policies, secrets management
- Cost target: < $35K/month after migration
- Training: K8s certification for 5 engineers
- Documentation: Runbooks for all services
- DR: Cross-region failover capability`
  },
  {
    id: 'api-gateway',
    name: 'API Gateway Implementation',
    category: 'infrastructure',
    description: 'Deploy centralized API gateway with rate limiting and auth',
    requirements: `Implement a centralized API gateway to handle authentication, rate limiting, and routing for all public and partner APIs.

Gateway Features:
- JWT validation and OAuth2 token introspection
- Rate limiting per API key (tiered plans)
- Request/response transformation
- API versioning support
- Developer portal with self-service key management

Traffic Handling:
- 50,000 requests/minute peak
- 99.99% availability SLA
- Geographic routing for latency optimization`,
    context: `Currently each service handles its own auth and rate limiting, leading to inconsistent policies and security gaps. Partners complain about unclear API documentation and no self-service portal. Need centralized gateway to enforce policies, improve developer experience, and enable monetization of APIs.`,
    constraints: `- Deliver within 4-week sprint
- Stack: Kong Gateway (OSS) on Kubernetes
- Plugins: JWT, rate-limiting, request-transformer, prometheus
- Latency overhead: < 10ms added per request
- HA: Multi-AZ with automatic failover
- Developer portal: Kong Developer Portal or custom Next.js
- Monitoring: Request metrics, error rates, latency percentiles
- Security: WAF integration, DDoS protection
- Cost: $8,000/month for gateway infrastructure`
  }
];

export function getTemplateById(id: string): DemoTemplate | undefined {
  return DEMO_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: DemoTemplate['category']): DemoTemplate[] {
  return DEMO_TEMPLATES.filter(t => t.category === category);
}
