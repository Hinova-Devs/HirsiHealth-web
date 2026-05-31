# HersiHealth 🏥

> **A Personal Health Document Wallet for Patient-Controlled Medical Records**

HersiHealth gives patients a secure, centralized place to store, organize, and share their medical documents — lab results, prescriptions, diagnoses, imaging reports, and vaccination records — accessible from any device, at any time.

Built on [FHIR R4](https://www.hl7.org/fhir/) standards from day one, so it grows from a personal wallet into a nationally interoperable health platform without a rebuild.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Stack](#running-the-stack)
- [Team Workflow](#team-workflow)
- [FHIR Data Model](#fhir-data-model)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Academic Context](#academic-context)

---

## Overview

| What it does                | How                                                         |
| --------------------------- | ----------------------------------------------------------- |
| Secure document storage     | FHIR `Binary` + `DocumentReference` resources               |
| Patient identity            | FHIR `Patient` resource with unique HersiHealth ID          |
| Emergency profile           | Public read-only endpoint — blood type, allergies, contacts |
| Controlled sharing          | Time-limited signed document links                          |
| Future hospital integration | FHIR R4 API ready from day one                              |

**Current phase:** MVP web application to validate the Medplum backend.
**Next phase:** React Native mobile app.

---

## Tech Stack

| Layer                 | Technology                                        |
| --------------------- | ------------------------------------------------- |
| Frontend (Web)        | React 18 + Vite + TypeScript                      |
| Frontend (Mobile)     | React Native (Expo) — _coming Phase 2_            |
| Routing               | TanStack Router                                   |
| Styling               | Tailwind CSS                                      |
| Backend / FHIR Server | [Medplum](https://www.medplum.com/) (self-hosted) |
| Database              | PostgreSQL 16 (managed by Medplum)                |
| Cache / Queue         | Redis 7                                           |
| Container Runtime     | Docker + Docker Compose                           |
| Language              | TypeScript throughout                             |

---

## Project Structure

```
hersihealth/
├── apps/
│   ├── web/                  # React + Vite web application
│   └── mobile/               # React Native (Expo) — coming soon
├── infra/
│   ├── docker-compose.yml    # Full local stack (Medplum + Postgres + Redis)
│   ├── medplum.config.json   # Medplum server configuration
│   └── postgres/             # Postgres init scripts and config
├── .env.example              # Environment variable template
├── .gitignore
└── README.md
```

---

## Prerequisites

Make sure you have these installed before starting:

| Tool           | Version       | Download                                       |
| -------------- | ------------- | ---------------------------------------------- |
| Git            | Any           | https://git-scm.com                            |
| Node.js        | 20 or higher  | https://nodejs.org                             |
| npm            | 10 or higher  | Comes with Node.js                             |
| Docker Desktop | 4.x or higher | https://www.docker.com/products/docker-desktop |

Verify your setup:

```bash
node --version    # v20.x.x
npm --version     # 10.x.x
docker --version  # Docker version 26.x.x
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_ORG/hersihealth.git
cd hersihealth
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the values. For local development the defaults work out of the box — see [Environment Variables](#environment-variables).

### 3. Start the backend stack

```bash
docker compose -f infra/docker-compose.yml up -d
```

This starts three services:

- **Medplum server** on `http://localhost:8103`
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`

Wait for all services to be healthy:

```bash
docker compose -f infra/docker-compose.yml ps
```

All three should show `running` or `healthy` before proceeding.

### 4. Install and run the web app

```bash
cd apps/web
npm install
npm run dev
```

Open `http://localhost:3001` in your browser.

### 5. First-time Medplum setup

On first run you need to create a super admin account in Medplum:

1. Open `http://localhost:8103/` in your browser
2. Complete the registration wizard
3. Create a **Patient** account with your email and password
4. Use those credentials to log in to the HersiHealth web app

---

## Environment Variables

Copy `.env.example` to `.env`. For local development you only need two values:

```env
# URL of your local Medplum FHIR server
VITE_MEDPLUM_BASE_URL=http://localhost:8103/

# Medplum OAuth2 client ID (get this from Medplum admin after setup)
VITE_MEDPLUM_CLIENT_ID=
```

> **Never commit `.env` to Git.** It is in `.gitignore`. Use `.env.example` for sharing variable names with the team.

---

## Running the Stack

### Start everything

```bash
docker compose -f infra/docker-compose.yml up -d
cd apps/web && npm run dev
```

### Stop everything

```bash
docker compose -f infra/docker-compose.yml down
```

### Full reset (wipes all data)

```bash
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up -d
```

### View backend logs

```bash
# All services
docker compose -f infra/docker-compose.yml logs -f

# Medplum only
docker compose -f infra/docker-compose.yml logs -f medplum

# Postgres only
docker compose -f infra/docker-compose.yml logs -f postgres
```

### Service URLs

| Service             | URL                           |
| ------------------- | ----------------------------- |
| HersiHealth Web App | http://localhost:3001         |
| Medplum FHIR API    | http://localhost:8103/fhir/R4 |
| Medplum Admin UI    | http://localhost:8103         |

---

## Team Workflow

Every team member follows the same setup. Nobody runs Medplum from source — it runs as a Docker image pulled automatically.

```
┌─────────────────────────────────────────────┐
│  Your machine                               │
│                                             │
│  npm run dev          (web app)             │
│       ↓                                     │
│  Docker Compose                             │
│  ├── medplum-server   :8103                 │
│  ├── postgres         :5432                 │
│  └── redis            :6379                 │
└─────────────────────────────────────────────┘
```

### Branch strategy

```
main          ← stable, always deployable
develop       ← integration branch
feature/xxx   ← individual features
fix/xxx       ← bug fixes
```

**Never push directly to `main`.** Open a pull request from your feature branch into `develop`.

### Commit message format

```
type: short description

Examples:
feat: add document upload page
fix: correct FHIR DocumentReference category mapping
chore: update docker-compose healthcheck
docs: update README setup steps
```

---

## FHIR Data Model

HersiHealth uses standard FHIR R4 resources. No custom schemas.

| Resource            | Purpose                                                 |
| ------------------- | ------------------------------------------------------- |
| `Patient`           | Core identity, emergency profile, blood type, allergies |
| `DocumentReference` | Document metadata — title, category, date, status       |
| `Binary`            | Actual file content — PDF, image                        |
| `RelatedPerson`     | Emergency contacts                                      |
| `AuditEvent`        | Document access and share audit trail                   |
| `Bundle`            | Bulk export / document package                          |

Document categories use [LOINC](https://loinc.org/) codes:

| Category         | LOINC Code |
| ---------------- | ---------- |
| Lab Result       | 11502-2    |
| Prescription     | 57833-6    |
| Imaging Report   | 18748-4    |
| Diagnosis / Note | 11488-4    |
| Vaccination      | 11369-6    |
| General          | 34117-2    |

---

## Roadmap

- [x] **Phase 1** — Personal Health Document Wallet (current)
  - [x] Backend: Medplum FHIR server running locally
  - [x] Web MVP: login, document library, upload, emergency profile
  - [ ] Mobile app: React Native (Expo)

- [ ] **Phase 2** — Connected Sharing & Consent Management
  - Provider access requests
  - Time-limited consent grants
  - Full AuditEvent logging

- [ ] **Phase 3** — Hospital Integration & FHIR Interoperability
  - Partner hospital API integration
  - Automated document push from providers
  - Structured clinical data ingestion

- [ ] **Phase 4** — National Health Infrastructure Layer
  - Multi-tenant architecture
  - Population health analytics
  - Cross-border care continuity

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run the app and verify everything works
5. Commit: `git commit -m "feat: your feature description"`
6. Push: `git push origin feature/your-feature`
7. Open a pull request into `develop`

---

## Academic Context

HersiHealth is a final year graduation project at the **Faculty of Computing & ICT, Borama University**, Somaliland.

It addresses a real problem in the local healthcare context: patients carry paper records that are fragile, easily lost, and impossible to share instantly. HersiHealth provides a mobile-first, FHIR-native document wallet that works today and scales toward national digital health infrastructure.

**Supervisors:** Eng. Guuleed Maxamuud Cabdilaahi & Eng. Fadxi Cabdi Daahir

---

<div align="center">
  <sub>Built with care at Borama University — Faculty of Computing & ICT</sub>
</div>
