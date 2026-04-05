# Actions & Forms

## Actions

Astro Actions are type-safe server functions with built-in validation. They replace manual API route boilerplate for most form/data mutation use cases.

### Defining actions

```ts
// src/actions/index.ts
import { defineAction, ActionError } from 'astro:actions'
import { z } from 'astro/zod'

export const server = {
  newsletter: defineAction({
    accept: 'form',               // 'form' for FormData, omit for JSON
    input: z.object({
      email: z.email(),  // Zod 4: top-level validators
    }),
    handler: async (input, context) => {
      // context has: locals, cookies, request
      if (!context.locals.user) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Must be logged in' })
      }
      await db.subscribers.insert({ email: input.email })
      return { success: true }
    },
  }),
}
```

### Calling from HTML forms

```astro
---
import { actions, isInputError } from 'astro:actions'
const result = Astro.getActionResult(actions.newsletter)
const inputErrors = isInputError(result?.error) ? result.error.fields : {}
---
<form method="POST" action={actions.newsletter}>
  <input name="email" type="email" />
  {inputErrors.email && <p>{inputErrors.email.join(', ')}</p>}
  <button>Subscribe</button>
</form>
```

### Calling from client JavaScript

```ts
import { actions } from 'astro:actions'

// Safe pattern — returns { data, error }
const { data, error } = await actions.newsletter({ email: 'test@example.com' })
if (error) {
  console.log(error.code, error.message)
}

// Or throw on error
const data = await actions.newsletter.orThrow({ email: 'test@example.com' })
```

### Calling from server code

```ts
// In .astro pages or middleware
const { data, error } = await Astro.callAction(actions.newsletter, { email })

// In API endpoints
export const POST: APIRoute = async (context) => {
  const { data, error } = await context.callAction(actions.newsletter, { email })
}
```

### Organizing actions

```ts
// src/actions/user.ts
export const user = {
  getProfile: defineAction({ /* ... */ }),
  updateProfile: defineAction({ /* ... */ }),
}

// src/actions/index.ts
import { user } from './user'
export const server = { user }
// Usage: actions.user.getProfile()
```

### Form input validation types

Form data has special coercion rules:

```ts
input: z.object({
  name: z.string(),                    // text input
  age: z.coerce.number(),              // number input (string → number)
  agreed: z.coerce.boolean(),          // checkbox (on/off → true/false)
  files: z.array(z.instanceof(File)),  // file input with multiple
})
```

Empty form values become `null` (except booleans → `false` and arrays → `[]`).

### Return type serialization

Actions serialize: Date, Map, Set, URL, BigInt, Uint8Array. Inspect `data` in code, not raw network responses (they use devalue format, not plain JSON).

## Actions vs API Routes

| | Actions | API Routes |
|---|---|---|
| **Use when** | Form handling, data mutations, RPC-style calls | Webhooks, third-party integrations, streaming responses |
| **Validation** | Built-in Zod | Manual |
| **CSRF** | Protected by default | Manual |
| **Type safety** | End-to-end (input + output) | Manual |
| **Location** | `src/actions/` | `src/pages/api/` |

Prefer Actions for most form/mutation work. Use API routes when you need raw Request/Response control.

Security note: treat Actions as public server endpoints. Validate authorization in the handler, and keep authentication state in server-side sessions / HttpOnly cookies rather than browser storage.

## Plain Form Handling (without Actions)

For simple forms without Actions:

```astro
---
// src/pages/contact.astro
export const prerender = false  // required for POST handling

let message = ''
if (Astro.request.method === 'POST') {
  const formData = await Astro.request.formData()
  const name = formData.get('name')
  // process...
  message = 'Received!'
}
---
<form method="POST">
  <input name="name" required />
  <button>Send</button>
</form>
{message && <p>{message}</p>}
```

## Common Agent Mistakes

| Agents do | Correct |
|---|---|
| Build manual POST API routes for forms | Use Actions — they handle validation, CSRF, types |
| Forget `accept: 'form'` for form submissions | JSON by default; form data needs explicit `accept: 'form'` |
| Try to use Actions on prerendered pages | Form submissions require on-demand rendering (`export const prerender = false` or `output: 'server'`) |
| Don't handle errors from Actions | Always check `error` — actions return `{ data, error }`, not raw data |
| Assume Actions are private | Actions are **public endpoints** at `/_actions/[name]` — always validate authorization in the handler |
| Import from wrong module | Actions: `astro:actions`, Zod: `astro/zod` (not `zod` directly) |
| Use `z.string().email()` | `z.email()` (Zod 4 top-level validators) |
| Use `z.string().url()` | `z.url()` (Zod 4 top-level validators) |
| Use `{ message: "..." }` in Zod errors | `{ error: "..." }` (Zod 4 syntax) |
