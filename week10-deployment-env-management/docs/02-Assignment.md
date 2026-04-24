# Assignment — Deploy API, Connect Atlas, Setup GitHub Actions

## Objective
Productionize your existing backend (recommended target: Week 8 project) and prove it with a public URL and CI/CD evidence.

## Required Deliverables

1. Live Deployment
- Deploy your API to Render or Railway.
- API must expose a working `GET /health` endpoint.

2. MongoDB Atlas Integration
- Connect your deployed API to Atlas.
- Demonstrate create + read flow from one real endpoint.

3. Environment Management
- Keep `.env` local only.
- Keep `.env.example` updated and safe.
- Store production secrets only in host platform settings.

4. GitHub Actions
- Add and run `.github/workflows/week10-api-ci.yml`.
- Workflow should pass on pull request.
- Main branch merge should trigger deploy step if webhook secret exists.

5. Security + Logging Baseline
- No hardcoded secrets.
- Safe production error handling.
- Basic request logging enabled.
- CORS policy not fully open for production unless justified.

## Submission Format
Submit one markdown file named `week10-submission.md` in your project root with:
- Deployed API URL.
- Atlas cluster name (no credentials).
- Link to a successful GitHub Actions run.
- Short evidence of one successful endpoint call.
- 5-10 lines: what failed first and how you fixed it.

## Grading Guide
- Deployment works reliably: 30%
- Atlas correctly connected: 25%
- CI/CD configured and passing: 25%
- Environment management quality: 10%
- Security and logging baseline: 10%

## Bonus
- Add staging vs production environments in GitHub Actions.
- Add basic smoke test job that hits deployed `/health` after deploy.
