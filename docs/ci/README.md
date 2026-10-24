# Continuous-integration setup

The application is locally validated, but the GitHub Actions workflow is **not activated** in this checkpoint. GitHub rejected creating `.github/workflows/ci.yml` because the provided push credential does not have the `workflow` scope. Code and documentation pushes do not need that extra scope.

The complete tested-check configuration is saved as [portfolio-checks.yml](portfolio-checks.yml). It installs the locked dependencies, verifies assets, runs TypeScript and the static export, installs Chromium, runs both browser suites and uploads the resulting screenshots/reports.

## Activate when authorized

A repository owner can add the contents of this template as `.github/workflows/ci.yml` using GitHub's own editor, or use a credential explicitly authorized to manage workflows. Do not put a token in this file or in chat. No credential change is required for the portfolio application itself or its existing Vercel deployment.

After activation, inspect the first run in the repository's Actions tab. The saved local reports in `docs/qa/` are evidence of this checkpoint, not a claim that a remote CI run has completed.
