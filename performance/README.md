# HealthSync — Enterprise Performance Testing Suite

Built with [k6](https://k6.io) · Follows Google/Stripe/Atlassian best practices

---

## Folder Structure

```
performance/
├── config.js          # All thresholds, env vars, abort conditions
├── utils.js           # HTTP helpers, metrics, auth, random data
├── smoke-test.js      # 2 VUs, sanity check
├── load-test.js       # Gradual ramp 100→10000 VUs
├── stress-test.js     # Beyond capacity — find breaking point
├── spike-test.js      # Sudden burst traffic x3
├── soak-test.js       # 2-hour sustained load (memory leaks)
├── package.json       # npm scripts
├── .env.example       # Environment variable template
├── data/
│   ├── test-users.json
│   └── test-doctors.json
├── reports/           # Auto-generated JSON/CSV output
└── README.md
```

---

## Prerequisites

### 1. Install k6

**Windows (Chocolatey):**
```
choco install k6
```

**Windows (Winget):**
```
winget install k6
```

**macOS:**
```
brew install k6
```

**Linux:**
```
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

**Verify:**
```
k6 version
```

### 2. Configure environment

```
copy .env.example .env
```

Edit `.env` with your test server URL and test credentials.

**IMPORTANT**: Use dedicated test accounts. Never use production credentials.

---

## Running Tests

All commands run from inside the `performance/` directory.

### Quick sanity check (run this first)
```
cd performance
npm run smoke-test
```

### Normal load test (100 → 10000 VUs, ~40 min)
```
npm run load-test
```

### Stress test (find breaking point, ~30 min)
```
npm run stress-test
```

### Spike test (burst traffic x3, ~20 min)
```
npm run spike-test
```

### Soak test (memory leak detection, 2 hours)
```
npm run soak-test
```

### Run all (except soak — too long for CI)
```
npm run perf-all
```

### Override environment variables
```
k6 run load-test.js -e BASE_URL=https://your-server.com -e MAX_USERS=500
```

### With HTML report (requires k6 web dashboard)
```
k6 run --out web-dashboard load-test.js
```

---

## Test Type Explanations

| Test | Purpose | VUs | Duration |
|------|---------|-----|----------|
| **Smoke** | Sanity — confirm every endpoint returns 2xx | 2 | ~30s |
| **Load** | Validate SLOs under normal + peak traffic | 100→10000 | ~40m |
| **Stress** | Find the breaking point (max sustainable load) | Up to 15000 | ~30m |
| **Spike** | Sudden burst (viral moment / promo campaign) | 50→10000 | ~20m |
| **Soak** | Memory leaks and degradation over time | 300 sustained | 2h |

### Smoke Test
Run before every other test. If smoke fails, don't bother with load tests.
Confirms: server alive, login works, key APIs respond.

### Load Test
Gradual ramp simulating real user growth over a day.
Confirms: system meets SLOs at each load level.
If p95 > 500ms at any stage — that stage is the capacity limit.

### Stress Test
Intentionally pushes beyond normal capacity.
Goal: find the exact VU count where errors begin (breaking point).
System should recover after ramp-down.

### Spike Test
Simulates a TV ad, viral tweet, or promo email blast.
Tests auto-scaling responsiveness and connection pool behaviour.
Acceptable: brief latency spike; unacceptable: sustained errors after spike.

### Soak Test
2-hour sustained load at moderate VUs.
Detects: Node.js memory leaks, MongoDB cursor exhaustion,
connection pool depletion, and event loop lag over time.
If p95 latency increases by >50% from hour 1 to hour 2 — memory leak likely.

---

## Metrics Explained

| Metric | Description | Target |
|--------|-------------|--------|
| `http_req_duration` | Total request round-trip time | p95 < 500ms |
| `http_req_duration p(95)` | 95th percentile latency | < 500ms |
| `http_req_duration p(99)` | 99th percentile latency | < 1000ms |
| `http_req_failed` | % of requests with HTTP errors | < 1% |
| `http_req_blocked` | Time waiting for TCP connection | < 50ms |
| `http_req_connecting` | TCP handshake time | < 50ms |
| `http_req_tls_handshaking` | TLS negotiation time | < 100ms |
| `http_req_sending` | Time to send request body | < 10ms |
| `http_req_waiting` | Time-to-first-byte (TTFB) | < 300ms |
| `http_req_receiving` | Time to receive response body | < 50ms |
| `http_reqs` | Total requests (throughput) | Higher = better |
| `vus` | Active virtual users at any moment | — |
| `login_duration` | Custom: login endpoint latency | p95 < 300ms |
| `booking_duration` | Custom: booking endpoint latency | p95 < 700ms |
| `api_errors` | Custom: total API error count | 0 ideally |
| `auth_failures` | Custom: failed login count | 0 |
| `request_timeouts` | Custom: requests that timed out | 0 |

---

## SLO Thresholds

```
p(95) of all requests   < 500ms
p(99) of all requests   < 1000ms
Login p(95)             < 300ms
Appointment booking p95 < 700ms
Error rate              < 1%
Availability            > 99.9%
```

## Abort Conditions (auto-stop)

- Error rate > 5% — system overloaded
- p(99) > 5000ms — severe degradation
- p(99) > 10000ms (stress) — crash imminent

---

## TEST_MODE — Email Bypass

When `TEST_MODE=true` (default for all test scripts):

- The backend should NOT call the real email provider (Nodemailer/SendGrid/etc.)
- Verification tokens are generated and stored in DB as normal
- Email delivery is mocked — no real emails are sent
- All verification/OTP endpoints continue to function for testing
- **Production email behaviour is completely unchanged when `TEST_MODE=false`**

To enable TEST_MODE in backend: check `process.env.TEST_MODE === 'true'` before
calling the email provider in `backend/utils/emailService.js` or equivalent.

---

## Performance Tuning Recommendations

### Server (Node.js + Express)
1. Enable Node.js cluster mode: `cluster.fork()` for each CPU core
2. Set `NODE_ENV=production` — disables dev middleware, enables V8 optimisations
3. Use `--max-old-space-size=4096` for 4GB heap
4. Add response compression: `npm i compression` → `app.use(compression())`
5. Use `helmet()` — reduces response size with security headers
6. Implement request queuing (Bull/BullMQ) for heavy async ops
7. Use HTTP/2 (via nginx/Caddy reverse proxy)
8. Enable keep-alive: `server.keepAliveTimeout = 65000`

### Database (MongoDB)
1. Add indexes on: `appointments.doctorId`, `appointments.userId`,
   `appointments.date`, `doctors.specialization`, `users.email`
2. Use read replicas for GET-heavy endpoints (doctor list, appointments)
3. Enable MongoDB connection pooling: `maxPoolSize: 100` in Mongoose options
4. Use projection to limit returned fields: `.select('name specialization fee')`
5. Add TTL indexes for sessions and OTP tokens
6. Enable MongoDB Atlas auto-scaling (if on Atlas free tier → upgrade)
7. Use aggregation pipeline instead of application-level joins

### Caching
1. Add Redis for: doctor list, appointment slots, user profiles
2. Cache `GET /doctors` for 60 seconds (rarely changes)
3. Cache `GET /doctors/:id` for 5 minutes
4. Use `Cache-Control: public, max-age=60` on public APIs

### Scalability
1. **Horizontal scaling**: Deploy behind a load balancer (nginx/AWS ALB)
   with 3+ Node.js instances
2. **Database**: MongoDB Atlas M10+ for production; M0 free tier
   **cannot handle > 100 concurrent connections**
3. **CDN**: Serve frontend static assets via Cloudflare/AWS CloudFront
4. **Queue**: Move email, notifications, PDF generation to background jobs
   (Bull + Redis) to avoid blocking HTTP workers
5. **Rate limiting**: Current rate limits protect against DDoS but may need
   tuning for legitimate high-traffic scenarios

---

## Capacity Assessment

> **IMPORTANT**: These estimates are based on architectural analysis of the codebase.
> Actual numbers depend on server specs, MongoDB tier, and network.
> Run the tests to get real measured data.

### Assumptions
- Server: Single Node.js instance, 2 vCPU, 4GB RAM
- Database: MongoDB Atlas M0 (free tier) or M10 (512MB RAM)
- No caching layer (Redis) currently configured
- Render.com free tier has cold-start delays of 30–60 seconds

| Users | Assessment | Confidence |
|-------|-----------|------------|
| **100** | ✅ Safe — well within capacity. p95 < 200ms expected. | High |
| **500** | ✅ Likely safe — may see p95 200–400ms. Monitor DB connections. | High |
| **1000** | ⚠️ Borderline — MongoDB free tier will struggle. Upgrade to M10+. | Medium |
| **2000** | ❌ Risky without Redis cache and DB upgrade. Expected p95 > 500ms. | Medium |
| **5000** | ❌ Requires horizontal scaling (2–3 Node instances) + Redis + M20+ DB. | High |
| **10000** | ❌ Requires full cloud-native setup: auto-scaling, CDN, Redis cluster. | High |

### What to do to reach 5000+ users:
1. Upgrade MongoDB to Atlas M10+ (minimum for production)
2. Add Redis caching for doctor list and appointment slots
3. Deploy 3 Node.js instances behind nginx load balancer
4. Move email/notification sending to background job queue
5. Add CDN for frontend static files

Run the actual tests and compare measured p95 values against thresholds to get
real numbers rather than estimates.
