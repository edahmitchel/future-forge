# Week 10 Deployment Checklist

## Before Deploy
- [ ] `.env` is in `.gitignore`.
- [ ] `.env.example` contains all required keys with safe placeholders.
- [ ] App reads all config from `process.env`.
- [ ] Health route exists and returns 200.

## Atlas
- [ ] Cluster created.
- [ ] Database user created with strong password.
- [ ] Network access configured.
- [ ] `MONGO_URI` tested locally.

## Render or Railway
- [ ] Repo connected.
- [ ] Root directory set to `week8-async-jobs`.
- [ ] Build command set.
- [ ] Start command set.
- [ ] Required env vars added.
- [ ] Initial deploy succeeded.

## GitHub Actions
- [ ] Workflow file committed.
- [ ] PR run passes.
- [ ] Merge to main triggers workflow.
- [ ] Deploy hook secret configured (optional but recommended).

## Security + Ops
- [ ] `JWT_SECRET` is long and random.
- [ ] Error responses do not expose stack traces in production.
- [ ] Request logging enabled.
- [ ] CORS restricted appropriately.
- [ ] Rate limiting considered for auth routes.
