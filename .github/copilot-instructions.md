# Doorli Workspace Instructions

This repository is Doorli. When working in VS Code, stay scoped to the current workspace and do not modify unrelated apps or services unless the user asks.

## Composio and AI workflow

- Use the existing Composio-backed AI flow in `services/ai` when the task involves tool use, external actions, or agent behavior.
- Prefer the configured provider order from environment variables instead of hardcoding one model.
- Support these keys when present: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, and `GEMINI_API_KEY`.
- Use `AI_PROVIDER_ORDER` if it is set; otherwise keep the current fallback behavior in code.

## Editing rules

- Make the smallest change that solves the request.
- Preserve the current code style and existing app boundaries.
- If a request is about VS Code behavior, focus on editor/workspace configuration first before changing application logic.

## Useful anchors

- AI service agent logic: `services/ai/src/agent.ts`
- ERP AI helpers: `apps/erp/src/lib/ai/`
- Environment template: `.env.example`