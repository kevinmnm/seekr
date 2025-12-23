# Podcast Assessment Agent

Transform raw podcast transcripts into marketing-ready intelligence with a single agent flow. This project boots an AnythingLLM instance that forces the user to:

1. Provide an OpenAI-compatible API key (required for agent execution).
2. Upload podcast transcripts before the chat UI loads.
3. Trigger a pre-configured agent flow that cleans transcripts, generates summaries, extracts quotes, and performs a mock fact-check.

The repo already includes a working flow (`flow_c6bef2ce-f82f-40cf-b9b8-7603ded6701c`) aligned with the take-home assessment requirements.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
   - [Run with Docker Compose](#run-with-docker-compose)
   - [Run with local Node/Yarn](#run-with-local-nodeyarn)
3. [Using the App](#using-the-app)
   - [Supplying the OpenAI Key](#supplying-the-openai-key)
   - [Uploading Podcast Transcripts](#uploading-podcast-transcripts)
   - [Triggering the Agent Flow](#triggering-the-agent-flow)
4. [Optional Knowledge-Base Uploads](#optional-knowledge-base-uploads)
5. [Troubleshooting](#troubleshooting)
6. [Deployment Strategy](#deployment-strategy)

---

## Prerequisites

- **Node.js ≥ 18** – only required for local development.
- **Yarn** – enable via `corepack enable` if you already have Node installed.
- **Docker & Docker Compose** – optional but recommended for the most reproducible setup.
- **OpenAI API Key (or compatible proxy)** – the agent flow requires an OpenAI-compatible chat model.

---

## Quick Start

### Run with Docker Compose

1. Edit `docker/.env` and set your OpenAI key:

   ```bash
   OPEN_AI_KEY='sk-your-key'
   ```

2. From the project root run:

   ```bash
   yarn docker-compose-up
   ```

3. Once the containers are healthy, open **http://localhost:3001** in a browser.

### Run with local Node/Yarn

1. Edit `server/.env` (or `server/.env.development`) and set:

   ```bash
   OPEN_AI_KEY='sk-your-key'
   ```

2. Install dependencies and wire up the monorepo:

   ```bash
   yarn setup
   ```

3. Start all services:

   ```bash
   yarn dev:all
   ```

4. Open **http://localhost:3000** in a browser.

---

## Using the App

### Supplying the OpenAI Key

On first load you will be blocked by an **OpenAI Settings** modal. The key is not persisted, so you may be prompted again after a hard refresh. Paste the key and click **Save API Key** to proceed.

### Uploading Podcast Transcripts

Immediately after the key modal closes, you’ll see the **Podcast Transcript Upload** dialog. Drag in one or more transcript files (plain text, JSON, DOCX, etc.) and click **Upload transcript**. The server wipes `server/storage/podcast-transcripts/` whenever the chat screen reloads, so re-upload if you refresh.

### Triggering the Agent Flow

1. Open the **brain** icon at the bottom, pick a high-context OpenAI model (GPT‑4o, GPT‑4.1, etc.), and click **Use this model**.
2. In the chat composer send an agent invocation. The flow only runs when a message starts with `@agent`. Examples:
   ```
   @agent flow_c6bef2ce-f82f-40cf-b9b8-7603ded6701c
   Please analyse the uploaded podcast transcripts and produce the assessment brief.
   ```
3. Expand the agent reasoning panel to watch each step (normalization, summary, fact-check, Markdown assembly) or tail the server logs for structured output.

If the flow reports `NO_TRANSCRIPTS_FOUND`, confirm the upload path is non-empty:

```bash
curl http://localhost:3001/api/podcast-transcripts/all?meta=true
```

---

## Optional Knowledge-Base Uploads

Adding context improves the mock fact-check:

1. Click the folder icon in the left sidebar.
2. Use the drag-and-drop area to upload supporting docs (PDF, HTML, Markdown, etc.).
3. Move uploaded files into the active workspace and click **Save and Embed**.
4. Pin important documents so the agent ranks them higher during retrieval.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| Agent outputs boilerplate summary | Configured agent flow JSON not correctly parsed by LLM | Refresh the page and try again. |
| “OpenAI API key must be provided to use agents” | Key is missing/expired | Refresh the page and make sure to provide valid key. The key isn’t persisted upon container restart. |
| “Exceeded content limit” | Selected model has small context window | Refresh the page and pick a higher-context model via the brain icon. |

---

## Deployment Strategy

> **Goal:** Run the podcast-assessment workflow on Google Cloud Platform with predictable cost, high availability, and strong observability.

### 1. Target Architecture

| Layer | GCP Service | Notes |
| --- | --- | --- |
| **Compute** | Google Kubernetes Engine (Autopilot or Standard) | One cluster hosts separate Deployments for `frontend`, `server`, and `collector`. HPAs react to CPU usage and queue depth. Autopilot simplifies node management; Standard mode lets you carve GPU/high-memory pools for embedding-heavy work. |
| **Data Plane** | Cloud SQL for PostgreSQL (with `pgvector`) | Replace SQLite/LanceDB. Use HA configuration with automatic failover and PITR. |
| **Object Storage** | Google Cloud Storage | Stores transcript uploads, knowledge-bank files, and generated briefs. Enable versioning and lifecycle policies. |
| **Caching / Queues** | Memorystore for Redis + Cloud Tasks / Pub/Sub | Redis backs caching + ephemeral queues; Cloud Tasks or Pub/Sub handles long-running agent jobs asynchronously. |
| **Networking** | Google Cloud Load Balancing + Cloud Armor + Traefik Ingress | External HTTPS LB fronts the cluster, but inside GKE we run Traefik with ACME integration to issue/renew free TLS certificates for multiple FQDNs. Cloud Armor provides WAF rules; internal services remain behind ClusterIP or internal load balancers. |
| **Secrets** | Secret Manager + Workload Identity | Store OpenAI keys and DB credentials; workloads access them via Workload Identity without long-lived service-account keys. |

### 2. Build & Release Automation

- Containerize each subproject (`frontend/`, `server/`, `collector/`) with a shared base Node image.
- Build and publish versioned Helm charts (component-level or umbrella) to Google Artifact Registry (OCI format).
- Use Google Cloud Build or GitHub Actions to lint/test, build Docker images, package/push charts, and promote tagged releases.
- Argo CD or Helmfile watches the registry and applies `helm upgrade` rollouts to GKE (blue/green or canary).

### 3. Scalability

- **Horizontal scaling:** HPAs driven by Cloud Monitoring metrics (CPU, custom queue length). Collector workers scale on Redis/Cloud Tasks backlog.
- **Vertical scaling:** Autopilot auto-provisions resources; Standard clusters add GPU/high-memory node pools for embedding-heavy workloads.
- **Async workloads:** Long agent runs enqueue work to Cloud Tasks or Pub/Sub; dedicated worker pods consume queues without blocking user-facing pods.

### 4. High Availability & Fault Tolerance

- Regional GKE clusters span multiple zones; Pod Disruption Budgets keep replicas online during upgrades.
- Cloud SQL HA with automated backups and point-in-time recovery.
- GCS bucket versioning + lifecycle rules provide durable storage while controlling cost.
- Readiness and liveness probes restart unhealthy pods quickly.

### 5. Observability & Operations

- **Metrics:** Managed Prometheus (or OSS Prometheus) feeds dashboards in Cloud Monitoring / Grafana (LLM latency, transcript ingestion rate, queue backlog).
- **Logging:** Ship structured logs to Cloud Logging; configure alerts via Cloud Monitoring, PagerDuty, or Opsgenie.
- **Tracing:** Use Cloud Trace / Cloud Profiler or OpenTelemetry for end-to-end visibility from HTTP request through agent execution.
- **Runbooks:** Document OpenAI key rotation (Secret Manager), Helm rollbacks, transcript restoration from GCS, and Cloud SQL failover drills.

### 6. Security & Compliance

- Cloud Armor shields the HTTPS load balancer; Identity-Aware Proxy or BeyondCorp restricts admin access.
- Encrypt data at rest (Cloud SQL CMEK, GCS CMEK, Artifact Registry CMEK) and enforce TLS in transit. Add mTLS inside the cluster with Anthos Service Mesh/Istio if zero-trust is required.
- Use VPC Service Controls, Private Service Connect, and firewall rules to keep Cloud SQL/Memorystore off the public internet.
- Apply least-privilege IAM with Workload Identity; rotate secrets centrally in Secret Manager.
- Bake security scans into CI/CD: run Trivy against every image build and Semgrep against the codebase before packaging/publishing Helm charts. Gate releases on a clean scan or approved exceptions.

### 7. Cost Controls

- Autopilot right-sizes pods automatically but charges a premium per vCPU/GB; Standard clusters can mix on-demand and Spot nodes for batch/worker workloads when you need tighter cost control.
- GCS lifecycle policies archive or delete stale transcripts; Cloud SQL disk auto-scaling and alerts prevent overprovisioning.
- Budgets and quota alerts in Cloud Monitoring track OpenAI spend, GKE usage, and Cloud SQL consumption.
- Scheduled scale-down (KEDA or CronJobs) lowers replica counts during predictable off-hours.

This GCP-first blueprint delivers:

- **Resilience** (regional GKE, HA Cloud SQL, versioned GCS),
- **Performance** (autoscaled pods, asynchronous job handling, pgvector-backed lookup),
- **Visibility** (Cloud Monitoring, Logging, Trace),
- **Security** (Secret Manager, Workload Identity, Cloud Armor), and
- **Predictable costs** (Autopilot/Spot scaling, lifecycle policies, budgets).

It satisfies the assessment requirements and leaves room to add new flows, metadata sources, or tenants without re-architecting the platform.***
