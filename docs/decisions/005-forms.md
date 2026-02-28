# 005 — Forms: Conform + Zod

Date: 2026-02-27

Status: Accepted

## Context

We need form handling that supports server-side validation, client-side
validation, and progressive enhancement (forms should work without JavaScript).
The main contenders were:

- **Conform** + Zod — Progressive enhancement-first form library
- **react-hook-form** + Zod — The most popular React form library
- **Manual handling** — Using `request.formData()` directly

## Decision

We chose Conform with Zod for validation schemas.

Conform was designed for progressive enhancement from the start. It works with
standard HTML `<form>` elements and the browser's native form submission. When
JavaScript loads, it enhances the forms with client-side validation. This is
exactly the model React Router encourages — server-first with progressive
enhancement.

react-hook-form is excellent, but it's client-first. It manages form state in
React, which means forms don't work without JavaScript. In a server-rendered
app with React Router's action model, Conform is a more natural fit.

Zod handles the validation schema definition. We define each form's schema once
and use it in both the server action (with `parseWithZod`) and the client
(with `onValidate`). One schema, validated in two places.

**Note:** We use the `@conform-to/zod/v4` import path, not `@conform-to/zod`.
The `/v4` subpath is required for compatibility with Zod v4. The default export
imports Zod v3 internals that don't exist in v4.

## Consequences

**Good:**
- Progressive enhancement — forms work without JavaScript
- Single Zod schema for both client and server validation
- Works naturally with React Router's `<Form>` and action model
- Accessible by default (proper error association, ARIA attributes)
- Type-safe form values after validation

**Neutral:**
- Smaller community than react-hook-form
- The `getFormProps` / `getInputProps` API is different from what most React
  developers are used to

**Trade-offs:**
- Less documentation and fewer examples than react-hook-form
- The `/v4` subpath import is easy to forget and causes confusing build errors
- Complex dynamic forms (arrays, nested objects) require more Conform-specific
  knowledge
