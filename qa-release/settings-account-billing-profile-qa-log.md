# Settings, Account, Billing & Profile QA Log

Last updated: 2026-06-21 (FIX-290: AI + automation usage limits, plan gates, usage meters)

## FIX-290 — Billing Gate Results

| Area | Gate | Plan Tier | Expected | Result | Score |
|------|------|-----------|----------|--------|-------|
| AI Copilot | Monthly message cap | starter | Blocked (aiEnabled=false) | checkAiCap returns allowed=false, reason shown | 5 |
| AI Copilot | Monthly message cap | operator | Blocked (aiEnabled=false) | checkAiCap returns allowed=false, reason shown | 5 |
| AI Copilot | Monthly message cap | scale | 500 msg/month | checkAiCap counts ai_chat_messages WHERE role=user, gte startOfMonth | 5 |
| AI Copilot | Monthly message cap | pro_agency | 2000 msg/month | checkAiCap counts against plan limit | 5 |
| AI Copilot | Monthly message cap | enterprise | Unlimited (9999) | Sentinel skips count query | 5 |
| AI Copilot | Hourly rate limit | scale | 60/hr | checkAiRateLimit counts last 60min | 5 |
| AI Copilot | Output token cap | scale | 1500 tokens | planMaxTokens passed to gatewayStream | 5 |
| AI Copilot | Input truncation | scale | 4000 tokens (~16000 chars) | effectiveUserTurn truncated before API call | 5 |
| AI Copilot | Plan gate UI | starter/operator | Upgrade CTA shown | CopilotChatScreen shows Sparkles + upgrade button when capInfo.enabled=false | 5 |
| AI Copilot | Usage meter | scale/pro_agency | Progress bar shown | CopilotChatScreen footer shows used/limit bar (hidden for unlimited/enterprise) | 5 |
| Automations | Plan gate | starter/operator | Blocked | gateAutomation + checkAutomationEnabled return not allowed | 5 |
| Automations | Monthly run cap | scale | 1000 runs/month | isWithinAutomationCap counts smart_rule_runs | 5 |
| Automations | Max definitions | scale | 50 active rules | checkMaxDefinitions counts smart_rules WHERE enabled=true | 5 |
| Automations | Plan gate UI | starter/operator | Upgrade CTA shown | HomePage shows Sparkles + upgrade button when automationPlanEnabled=false | 5 |
| Automations | Usage meter UI | scale/pro_agency | Runs meter shown | Right rail card shows runsUsed/runsLimit progress bar (hidden for unlimited) | 5 |
| /api/ai/usage | GET endpoint | all | Returns {used,limit,enabled} | New endpoint reads checkAiCap for the user's workspace | 5 |

## Notes

- All billing gates FAIL OPEN on store errors (transient DB hiccup never locks a paying user out).
- AI caps FAIL CLOSED on known-exceeded limits (spend protection).
- Per-hour rate limit: 429 + Retry-After: 300 header.
- Monthly cap: 402 Payment Required with clear upgrade message.
- PLAN_LIMITS aligned to existing tiers: starter | operator | scale | pro_agency | enterprise.
- Token limits enforced server-side before API call; input truncated client-message before sending to LLM.
