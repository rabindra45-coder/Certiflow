# CertiFlow Security Architecture & Production Review

## 1. Security Architecture & Threat Model

CertiFlow implements defense-in-depth controls across authentication, input handling, API rate limiting, email dispatch, and cryptographic verification.

```
+-----------------------------------------------------------------------------------+
|                                 THREAT MITIGATION                                 |
+------------------------------------+----------------------------------------------+
| Potential Threat Vector            | Security Mitigation Mechanism                |
+------------------------------------+----------------------------------------------+
| Certificate Forgery & Tampering    | SHA-256 Hash-derived UIDs & Public Lookup    |
| Cross-Site Scripting (XSS)         | React Auto-Escaping & Input Sanitization     |
| Server-Side Request Forgery (SSRF) | Strict URL validation for assets & webhooks  |
| Email Header Injection             | Nodemailer sanitized header construction     |
| API Abuse & Denial of Service      | Express Rate Limiter (Max 100 reqs/15 mins)  |
| Credential Exposure                | Environment variable isolation (`.env`)      |
+------------------------------------+----------------------------------------------+
```

---

## 2. Certificate Verification & Anti-Forgery Controls

1. **Cryptographic Certificate Identifier (UID)**:
   - Generated using SHA-256 algorithm over `(recipient_id + issue_date + issuer_secret + salt)`.
   - Truncated and formatted as `CRT-YYYY-XXXXXX` for visual human readability.
2. **Dynamic Verification QR Code**:
   - Every certificate rendered includes a QR code containing `https://<domain>/verify?id=CRT-YYYY-XXXXXX`.
   - QR codes are rendered as vector paths to prevent image artifacts or tampering.
3. **Immutability of Public Records**:
   - Issued certificate records stored in the verification lookup ledger cannot be modified retroactively without breaking the cryptographic hash signature.

---

## 3. Data Privacy & Input Handling

- **Zero Unrequested External Logging**: No personal recipient data (names, email addresses) is transmitted to third-party tracking services.
- **Input Sanitization**: All user-supplied template fields and CSV imports are sanitized before canvas rendering or PDF DOM output.
- **CORS Configuration**: Server API endpoints restrict Cross-Origin Resource Sharing to authorized application origins.

---

## 4. Production Code Review Checklist

### 4.1 Environment & Secrets Management
- [x] No secrets or API keys committed to repository source code.
- [x] `.env.example` documents all required environment variables (`PORT`, `SMTP_HOST`, `SMTP_USER`, `APP_DOMAIN`).
- [x] Express backend reads credentials strictly via `process.env`.

### 4.2 Type Safety & Code Quality
- [x] Strict TypeScript configuration with `--noEmit` passing without errors.
- [x] All props and state interfaces explicitly typed in `src/types/`.
- [x] ESLint linting passes without warnings or syntax errors.

### 4.3 Runtime Resilience & Build Verification
- [x] Application builds cleanly via `npm run build` producing optimized production artifacts.
- [x] Graceful degradation and fallback handlers for offline mode and network interruptions.
- [x] Responsive layout tested across desktop, tablet, and mobile viewports.
