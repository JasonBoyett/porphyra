# Future Compatibility: Portico Server

Porphyra is being developed as a cloud-hosted application, but should remain architecturally compatible with a potential future project called **Portico Server**, part of the Acts 2:44 Technology ecosystem.

Portico is envisioned as a lightweight, self-hosted application hub that allows churches with unreliable internet connectivity to run Acts 2:44 applications on inexpensive local hardware, including older Windows or Linux computers. Applications would remain functional over the local network without internet access, support local writes, and synchronize with hosted services when connectivity returns.

Portico is **not currently in development**, and Porphyra must not implement speculative offline synchronization, local orchestration, or Portico-specific infrastructure.

When making architectural decisions, prefer:

- **Deployment independence:** Avoid unnecessary dependencies on cloud-provider-specific functionality.
- **Service boundaries:** Keep authentication, application logic, and persistence clearly separated.
- **Portable persistence:** Avoid coupling business logic directly to a particular database hosting provider.
- **Stable identifiers:** Use identifiers that could eventually support records created independently across multiple deployments.
- **Explicit state management:** Avoid relying on process-local state for durable application behavior.

These are architectural preferences, not requirements to build abstractions prematurely. Favor the simplest reliable implementation that meets Porphyra's current needs.

**The priority is shipping Porphyra.** Portico should be considered only when resources and project maturity justify dedicated development.

## Ephemeral Registry Review Rule

A class named `*Registry` represents high-volume, process-local ephemeral state, such as WebSocket connections, subscriptions, presence, or cache invalidation registrations.

- Keep registry interfaces narrow and implementation details private.
- Do not expose mutable internal collections to Python callers.
- Prefer explicit lifecycle and mutation methods over direct state access.
- Keep Python ownership limited to orchestration and application integration.
- When performance, memory use, or concurrency warrants it, implement the registry's backing data structures in Rust through PyO3.
- Rust-backed registries must expose read-only getters and explicit mutation methods, avoiding unnecessary Rust/Python copies or conversions.
- Do not make durable business behavior depend on registry state.
- Treat registries as process-local unless an explicit cross-process mechanism is designed.
- During review, flag registry implementations that accumulate complex, high-volume mutable state in Python without a documented reason.

## Encapsulation and Private Members

Use the `_name` convention for every non-public implementation member in Python and TypeScript. Application code must access another object's public interface rather than its `_`-prefixed members.

- Configure Python linting to flag protected/private-member access (including Ruff's `SLF001` rule).
- Configure TypeScript linting to flag external access to `_`-prefixed members. Prefer native `#private` fields when they are compatible with the surrounding code; use `_name` where framework interoperability or an intentional test seam requires it.
- Tests must exercise public behavior rather than private members, except for narrowly scoped tests of the owning class.
- A private-member access requires a documented, narrow justification. Reviewers should flag undocumented access, including access added by agents.

## Web Theme

The web application uses shadcn/ui as its styling and component primitive. The current canonical theme is https://tweakcn.com/r/themes/cmwed1t8g000004l84ogbafa3.

- Update the web theme through the TweakCN CLI rather than manually recreating its generated theme values.
- Keep the shared web theme in the canonical `globals.css` location so it provides the common styling base for the web application.
- Mobile applications share semantic design tokens where appropriate but do not consume web CSS directly.

## Web UI Architecture and Conventions

### Styling and UI Primitives

- Tailwind CSS is the default web styling system. Use utility classes for layout,
  spacing, typography, colors, states, and responsive behavior whenever they
  express the needed behavior clearly.
- Use custom CSS only when Tailwind cannot express the needed behavior cleanly.
  Custom CSS should extend Tailwind rather than replace it, and should not grow
  into feature-wide styling systems.
- shadcn/ui is the base component primitive for the web application. Add
  primitives through the shadcn CLI.
- Use an existing shadcn primitive when it fits. When it does not, compose the
  required interface from shadcn primitives instead of building a hand-rolled
  replacement for an available primitive.

### Component and Page Boundaries

- Web UI components live in `frontend/app/web/src/components`.
- A component directory exports one primary component from `index.tsx`.
- Component prop types live in `types.ts`. Focused helpers and meaningful
  subcomponents may live alongside the primary component in that directory.
- Prefer one component per file. Extract distinct subcomponents rather than
  accumulating unrelated UI in one module.
- Pages and route-level feature entry points provide scaffolding only: load and
  marshal API data, coordinate route-level state, and pass typed props to UI
  components. They must not become the place where product UI is built.

### Readability

- Optimize for human readability rather than minimum line count.
- Use multiline JSX for nested or nontrivial markup. Do not compress UI trees,
  CSS, or control flow into dense one-line blocks.
- Use meaningful names for intermediate values and leave visual separation
  between conceptual sections of code.
- Format code consistently. Visual clarity matters more than brevity.

## Frontend Delivery Order

Build and validate new product workflows in the web application first. Implement the corresponding mobile experience only after the web workflow is established, so browser-based development and testing can validate the product behavior before platform-specific mobile adaptation.
