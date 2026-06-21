# Uppler — Braintrust Prompts

Uppler uses [Braintrust](https://braintrust.dev) to manage and version LLM prompts. Each `.md` file in this directory is one prompt. Create each one in your own Braintrust project, then set the corresponding slug in your `.env` file.

## Setup

1. Create a Braintrust account and project.
2. Set `BRAINTRUST_API_KEY`, `BRAINTRUST_PROJECT_ID`, and `BRAINTRUST_PROJECT_NAME` in your `.env`.
3. For each prompt below: create it in Braintrust, copy its slug, and set the env var.

## File format

Each prompt file follows this structure:

```markdown
---
description: One-line summary of what the prompt does.
slug: BRAINTRUST_SLUG_ENV_VAR_NAME
model: Claude Sonnet 4.6 # or Haiku 4.5 for lighter tasks
temperature: 0.3 # optional, omit to use Braintrust default
---

# System Prompt

<the full prompt text>

## Input variables (Sent as a user message)

- `VAR_NAME` — description

**Expected output:**

`TypeName` — description
```

## Prompts

| File                                                         | Env var                                             | Description                                                                                        |
| ------------------------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [resume-validity-check.md](resume-validity-check.md)         | `BRAINTRUST_SLUG_IS_VALID_RESUME`                   | Determines whether an uploaded document is actually a résumé/CV                                    |
| [core-resume-extraction.md](core-resume-extraction.md)       | `BRAINTRUST_SLUG_CORE_RESUME_EXTRACTION`            | Extracts structured data from a résumé (personal info, work history, education, etc.)              |
| [extract-skills.md](extract-skills.md)                       | `BRAINTRUST_SLUG_EXTRACT_SKILLS`                    | Identifies and categorises technical and soft skills mentioned in a résumé                         |
| [resume-moderator.md](resume-moderator.md)                   | `BRAINTRUST_SLUG_RESUME_MODERATION`                 | Flags résumés that contain inappropriate or unsafe content                                         |
| [resume-extract-projects.md](resume-extract-projects.md)     | `BRAINTRUST_SLUG_RESUME_PROJECTS_EXTRACTION`        | Extracts project descriptions and inferred skills from a résumé                                    |
| [job-description-moderator.md](job-description-moderator.md) | `BRAINTRUST_SLUG_JOB_DESCRIPTION_MODERATION`        | Checks whether a pasted job description is legitimate and safe to process                          |
| [extract-required-skills.md](extract-required-skills.md)     | `BRAINTRUST_SLUG_JOB_DESCRIPTION_SKILLS_EXTRACTION` | Extracts required skills from a job description with expected proficiency levels                   |
| [learning-advisor.md](learning-advisor.md)                   | `BRAINTRUST_SLUG_ROADMAP_CURRICULUM`                | Generates a structured learning roadmap to close the gap between a user's skills and a target role |
