# POS Web Free - Security Audit Report
Date: 2026-04-30

This document outlines the results of the security audit conducted on the `posweb-free` application, evaluating it against modern web security standards.

## 1. Authentication & Session Management
- **Token Storage**: The application has successfully mitigated Cross-Site Scripting (XSS) risks related to token theft. JWT tokens are no longer stored in `localStorage`. Instead, they are securely managed using `HttpOnly`, `Secure` (in production), and `SameSite=Lax` cookies.
- **API Authentication**: The `/api/auth` middleware properly extracts the token from the `req.cookies` and falls back to the `Authorization: Bearer` header, which is safe and allows programmatic API access while keeping browser sessions secure.
- **Password Storage**: Passwords are cryptographically hashed using `bcryptjs` with a salt round of 10 before being stored in the database. Raw passwords are never exposed or saved.

## 2. API Security & Middlewares
- **HTTP Headers (Helmet)**: The application utilizes the `helmet` package, which sets various HTTP headers to prevent common vulnerabilities such as Clickjacking (`X-Frame-Options`), MIME-type sniffing (`X-Content-Type-Options`), and provides a basic Content Security Policy (CSP).
- **CORS Configuration**: Cross-Origin Resource Sharing (CORS) is strictly configured. It avoids the dangerous wildcard `*` origin and explicitly allows only trusted domains (`http://localhost:5173`, `https://poswebfree.vivutrade.io.vn`, `https://t.me`, and regex-matched subdomains).
- **Rate Limiting**: `express-rate-limit` is actively employed to prevent brute-force and Denial-of-Service (DoS) attacks:
  - Global API limit: 300 requests per 15 minutes.
  - Strict Authentication limit: 30 requests per 15 minutes for `/api/auth` endpoints.

## 3. Database Security
- **SQL Injection (SQLi) Prevention**: When the `sqlite` database provider is used, the application consistently uses parameterized queries via `better-sqlite3` (e.g., `db.prepare(...).run()`). This ensures user inputs are treated as data, completely preventing SQL injection.
- **NoSQL Injection Prevention**: When the `mongo` provider is active, Mongoose ORM models are utilized, ensuring type safety and averting direct NoSQL injections.
- **Dual Mode**: Write operations correctly span across both databases safely without exposing vulnerability points.

## 4. Dependencies & Vulnerabilities (`npm audit`)
- **Backend**: `npm audit` reports **0 vulnerabilities**. The backend dependency tree is clean.
- **Frontend**: `npm audit` reports **6 vulnerabilities** (2 moderate, 4 high). However, these belong exclusively to development dependencies (`vite`, `vite-plugin-pwa`, `esbuild`, `serialize-javascript`). 
  > [!NOTE]
  > Because these are build-time tools, they do not run in the production environment and do not pose a direct threat to end-users or the live application. It is recommended to run `npm audit fix` in the frontend directory to resolve them for development hygiene, though it is not a critical runtime risk.

## 5. Conclusion & Recommendations
The `posweb-free` application adheres to strong modern security standards. The transition from `localStorage` to `HttpOnly` cookies, coupled with defensive middlewares (`helmet`, `cors`, `rate-limit`) and parameterized database queries, provides a robust security posture.

### Recommended Next Steps (Low Priority)
1. Run `npm audit fix` on the root frontend project to update devDependencies (`vite`, `esbuild`).
2. Consider adding an explicit `Content-Security-Policy` (CSP) header customized to the frontend's needs to further lock down asset loading.
