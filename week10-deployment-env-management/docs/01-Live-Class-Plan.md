# Week 10 Live Class Plan

## Session Objective
Deploy the existing API from Week 8 to production with safe environment management and CI/CD automation.

## Class Setup Checklist
- Confirm everyone can run `week8-async-jobs` locally.
- Ensure GitHub repo access is working.
- Confirm each student has Atlas + Render or Railway accounts.

## Step-by-Step Delivery

1. Baseline local health check
- Start the Week 8 API locally.
- Verify `/health` and one authenticated route.

2. Move to cloud database
- Create Atlas cluster.
- Create DB user and update local `MONGO_URI`.
- Test local app against Atlas.

3. Host deployment
- Connect GitHub repo to Render/Railway.
- Set root directory to `week8-async-jobs`.
- Add required environment variables.
- Deploy and validate health endpoint.

4. Add CI/CD
- Commit `.github/workflows/week10-api-ci.yml`.
- Open PR and verify workflow run.
- Merge and confirm deployment trigger.

5. Production-readiness checks
- Review logs for request flow and startup output.
- Confirm no secrets are committed.
- Review CORS, error messages, and token settings.

## In-Class Troubleshooting Exercise
Break one env var intentionally, then have learners:
1. Read logs.
2. Identify root cause.
3. Patch env var.
4. Re-test endpoint.

## Exit Ticket
Each learner submits:
- API base URL.
- Screenshot of successful workflow run.
- Short note: one issue faced and how they fixed it.
