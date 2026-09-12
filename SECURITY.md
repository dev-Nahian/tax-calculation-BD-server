# Security Policy & Architecture - TaxBD

## 1. Overview
TaxBD is designed with a defense-in-depth security architecture to ensure calculation integrity, data confidentiality, and regulatory compliance under the **Bangladesh Income Tax Act 2023** and **Finance Act 2024**.

---

## 2. Backend Security Implementations

### A. HTTP Security Headers (Helmet)
- Configured with Content Security Policy (CSP), cross-origin protections, frameguard (clickjacking prevention), and XSS filters.
- Eliminates `X-Powered-By` disclosure.

### B. CORS Configuration
- Strict origin whitelist matching `CLIENT_URL` (e.g., `http://localhost:5173`, production domains).
- Credentials enabled with restricted HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`) and preflight caching.

### C. Tiered Rate Limiting
- **Global API Limiter**: 200 requests / 15 minutes per IP.
- **Authentication Limiter**: 15 attempts / 15 minutes per IP to prevent brute-force attacks.
- **Tax Calculation Limiter**: 60 requests / minute per IP.
- **Admin Mutation Limiter**: 40 requests / 5 minutes per IP.

### D. Request Size Limits
- `express.json` and `express.urlencoded` bodies are strictly constrained to **10kb** to protect against payload memory exhaustion and denial-of-service (DoS) attacks.

### E. MongoDB Operator Injection & Input Sanitization
- Dedicated recursive sanitization middleware (`mongoSanitize`) strips prohibited query operators (keys containing `$` or `.`).
- All string inputs are trimmed and sanitized.

### F. Authentication & JWT Security
- Password hashing using `bcryptjs` with standard 10 salt rounds.
- JWT tokens signed and verified with algorithm pinning (`HS256`) and strict 7-day expiration.
- Production environment validates that default/weak JWT secrets are replaced with cryptographically secure secrets.

### G. Role-Based Access Control (RBAC)
- Strict access segregation between `user`, `admin`, `tax_officer`, and `super_admin`.
- All `/api/admin/*` and `/api/v1/admin/*` administrative routes require valid JWT tokens and verified administrative roles.

### H. Sensitive Information Protection
The application guarantees that the following are **never exposed**:
1. **MongoDB URI**: Redacted from logs, error messages, and health checks.
2. **JWT Secret**: Protected in environment variables and never returned in API payloads.
3. **Admin Credentials & Passwords**: User passwords use `select: false` and are stripped from all queries.
4. **Internal Errors & Stack Traces**: Suppressed in production (`NODE_ENV === 'production'`) with generic sanitized messages.

---

## 3. Calculation Integrity & Zero-Trust Architecture

### Never Trust Frontend Calculations
- All client-supplied intermediate or aggregate numbers (such as `totalTax`, `taxableIncome`, `regularTax`, `slabBreakdown`, `effectiveTaxRate`) are **explicitly stripped and discarded**.
- The backend TaxEngine independently computes 100% of taxable income, progressive slabs, rebate caps, minimum tax overrides, and surcharge rates.

### Strict Tax Rule Security (Zero-Fallback Policy)
- Only active and verified tax rules published under statutory NBR acts (e.g., Finance Act 2024) may be utilized for computation.
- If an unsupported, unverified, or archived assessment year is requested:
  - The API returns:
    > `"Tax calculation is currently unavailable for this assessment year."`
  - **The engine strictly NEVER falls back to another year's tax rules.**

---

## 4. Privacy-Conscious Logging

- Centralized structured logger (`server/src/utils/logger.js`) redacts all sensitive keys:
  - `password`, `token`, `jwtSecret`, `mongoUri`
  - Personal financial figures: `basicSalary`, `grossIncome`, `grossSalary`, `salary`, `totalTax`, `tinNumber`
- Dedicated audit trails:
  - **Calculation Errors**: Logs error code, assessment year, and timestamp without logging user salaries.
  - **Authentication Failures**: Logs masked email, IP, and timestamp without logging submitted passwords.
  - **Admin Actions & Rule Changes**: Logs administrator identity, target entity, and sanitized diffs to `AdminAuditLog`.

---

## 5. User Data Privacy & Rights

- **Anonymous Calculation**: Basic tax calculation requires no registration, TIN, or user login.
- **Explicit Storage Opt-In**: Calculation history is only saved when explicitly requested by authenticated users.
- **Right to Delete**:
  - `DELETE /api/tax/history/:id` or `DELETE /api/v1/tax/history/:id` deletes specific records.
  - `DELETE /api/tax/history` or `DELETE /api/v1/tax/history` wipes all calculation records for the user.
- **Privacy Policy**: Accessible via `GET /api/tax/privacy`.

---

## 6. Reporting a Vulnerability

If you discover a security vulnerability within TaxBD, please report it via security@taxbd.gov.bd or file a private advisory. All security reports are acknowledged within 24 hours.
