# CertiFlow Architecture Documentation

## 1. Executive System Overview

CertiFlow is a full-stack, enterprise-grade Certificate Generation, Verification, and Bulk Automation Platform. It combines a high-performance interactive visual template designer, a dynamic variable personalization engine, automated client/server PDF rendering, SMTP bulk email dispatching, and a cryptographic public verification portal.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  +---------------------+  +----------------------+  +--------------------------+  |
|  |  React 18 + Vite    |  | Visual Canvas Engine |  | PWA Service Worker       |  |
|  |  Tailwind CSS UI    |  | (Drag/Nudge/Layers)  |  | (Offline & Local Cache)  |  |
|  +---------------------+  +----------------------+  +--------------------------+  |
+-----------------------------------------+-----------------------------------------+
                                          |
                             REST API / JSON Payloads
                                          |
+-----------------------------------------v-----------------------------------------+
|                                 SERVER BACKEND                                    |
|  +---------------------+  +----------------------+  +--------------------------+  |
|  | Express REST Router |  | PDF & QR Generator   |  | SMTP Dispatch Engine     |  |
|  | Rate Limiting & Auth|  | (jsPDF, QRCode)      |  | (Nodemailer + Queue)     |  |
|  +---------------------+  +----------------------+  +--------------------------+  |
+-----------------------------------------+-----------------------------------------+
                                          |
                                    Data Storage
                                          |
+-----------------------------------------v-----------------------------------------+
|                               PERSISTENCE LAYER                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Local JSON Data Stores / SQLite DB + Browser IndexedDB & LocalStorage        |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Hierarchy & Module Boundaries

```
src/
├── components/
│   ├── layout/          # Application shell, Navigation, Header, Offline Banner
│   ├── dashboard/       # Analytics metrics, template gallery, recent issuance
│   ├── maker/           # Visual canvas designer, layer tree, props inspector
│   ├── automation/      # CSV import wizard, merge tag mapping, dispatch queue
│   ├── verification/    # Public certificate lookup & cryptographic validator
│   ├── settings/        # SMTP credentials, branding, API key management
│   └── common/          # Reusable UI widgets (PWA button, Modals, Toast)
├── hooks/               # Custom React hooks (usePWAInstall, useCanvasState)
├── lib/                 # Utility libraries (PDF export, QR code, crypto hashes)
├── types/               # Shared TypeScript interfaces & domain models
└── App.tsx              # Primary application state router
```

---

## 3. Key Subsystem Specifications

### 3.1 Visual Designer & Canvas Engine
- **Coordinate System**: Normalized percentages ($0-100\%$) for resolution-independent rendering across print DPIs (A4 Landscape, Letter, Square, Custom).
- **Element Types**: Text, Headers, Dynamic Merge Variables (`{{recipient_name}}`, `{{issue_date}}`, `{{certificate_id}}`), QR Codes, Signatures, Images/Logos, Shapes, and Watermarks.
- **Interactivity**: Drag-and-drop canvas movement, precision touch nudge pad, layer z-index manipulation, rotation, opacity, font family pairing, and snap-to-grid guidelines.

### 3.2 Bulk Automation Pipeline
- **Parser**: Native CSV/JSON parser with header auto-detection and data type validation.
- **Mapping Engine**: Maps CSV column keys to template variable placeholders with fallback default values.
- **Queue Manager**: Concurrent worker batching with configurable rate limits to prevent SMTP throttling.

### 3.3 Verification Engine
- **UID Generation**: SHA-256 derived truncated unique certificates IDs formatted as `CRT-YYYY-XXXXXX`.
- **Validation Route**: `/api/verify/:uid` returns authenticity status, issue timestamp, recipient metadata, and issuer verification signatures.

---

## 4. Deployment Topology

- **Runtime Container**: Single-container Node.js deployment served via Express with Vite SSR/middleware integration on Port `3000`.
- **Static Assets**: Pre-compiled static assets served with HTTP caching headers.
- **Network Interface**: External reverse-proxy routing through Port 3000 with HTTPS termination.
