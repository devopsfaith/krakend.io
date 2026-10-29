# AI Governance

> Enforce rate limits, validate prompts, and route multi-LLM traffic with policy-based governance in KrakenD's AI Gateway.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/governance/

KrakenD AI Governance empowers organizations to deploy large language models responsibly by enforcing compliance, security, and operational guardrails inline with AI traffic. Leverage granular controls on prompts, responses, usage, and reuse of prompt templates to standardize AI across teams, tenants, and projects.

## Prompt Policy Enforcement

Prompt policies enforce constraints on input prompts by pattern matching, contextual validation, or checking request metadata to prevent abusive or sensitive content from being processed downstream. These policies can reject or modify incoming requests with custom error messages, offering a powerful line of defense integrated directly within the API Gateway.

What prompt policies can do:

- Enforce rules to detect and block abusive, sensitive, or off-policy prompt content
- Apply pattern matching and data sanitizaion on prompt inputs
- Reject or modify requests that fail validation with custom error messages

Components that you can use are:

- [Prompt Guard](https://www.krakend.io/docs/enterprise/ai-gateway/prompt-guard/) to block prompt injection, jailbreaks, and malicious payloads with regular expressions, CEL policies, or an external classifier.
- [JSON Schema Validator](https://www.krakend.io/docs/endpoints/json-schema/) to make sure that payload passed adheres to your business rules, including the usage of regexp patterns or complex data structures.
- [Request Body Modifier](https://www.krakend.io/docs/enterprise/backends/response-body-generator/) to filter or craft the body sent before passing it to the LLM
- [Limit the request size](https://www.krakend.io/docs/enterprise/endpoints/maximum-request-size/#limit-the-maximum-request-size-to-an-endpoint)
- [Use Prompt Templates](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#vendor-transformation) and generate the prompt instead of requesting it to the user.

## Response Guardrails

Ensure responses from LLMs meet compliance and security standards by inspecting and modifying outputs inline. Response guardrails prevent revealing sensitive data or unsafe content in AI outputs.

Features:

- Validate response content against policies (e.g., disallow certain words or patterns)
- Mask or redact sensitive information automatically
- Modify responses to conform with brand or legal guidelines
- Reject or flag non-compliant responses for audit

Policies block or allow responses based on content rules. Redaction uses regex to mask sensitive data patterns, such as social security numbers. Proper response validation reduces compliance risks while maintaining user safety.

## Rate Limiting per tenant/team/project

KrakenD AI Gateway applies fine-grained rate limiting controls to manage AI usage and prevent abuse or unexpected cost spikes. Limits can be defined per tenant, team, or project to enforce usage budgets aligned with organizational policies. Capabilities

- Define concurrency and request rate caps scoped to tenant or project identifiers
- Enforce limits based on API keys, JWT claims, or custom headers
- Support burst capacity and smooth rate limiting behavior
- Integrate with monitoring and alerting systems for visibility

## Prompt Validation Templates

To promote consistency and reuse, KrakenD governance supports prompt validation templates. These templates standardize prompt structures and validation rules across teams and projects, simplifying management and ensuring compliance.

Benefits:

- Reuse common prompt patterns and validation logic without duplicating configs
- Enforce a uniform prompt design to improve downstream AI model behavior
- Enable rapid onboarding of teams with ready-made prompt templates
