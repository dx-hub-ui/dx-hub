# AGENTS.md

## Purpose
DX Hub uses AI/code agents (e.g., Codex) to accelerate development.  
These rules are **binding**: agents must follow them when proposing or making changes.

> **Golden Rule**: **Never** downgrade functionality, UX, performance, accessibility, or visual quality **unless explicitly expressed by maintainers in the task description.** When in doubt, preserve or enhance.

---

## Design North Star — “vibe.monday.com”
Agents must align all UI/UX work to a modern, clean, Monday.com-inspired vibe:

- **Layout:** spacious grid; clear hierarchy; generous paddings/margins; distinct sections; no cramped UIs.
- **Surfaces:** subtle shadows; soft, rounded corners; layered depth for focus; avoid harsh borders.
- **Color:** professional base palette with purposeful accents; clear status colors; consistent semantic usage.
- **Typography:** crisp, legible, modern font pairing; strong contrast; consistent scale and rhythm.
- **Interactions:** smooth micro-interactions; responsive hover/focus/active states; snappy drag-and-drop; optimistic UI where viable.
- **Components:** clean cards, data tables with sticky headers, filter chips, dropdowns, tabs, toasts, empty/error states that educate.
- **Responsiveness:** first-class mobile, tablet, desktop; collapsible/peekable sidebars; content reflow without loss.

> **Do not** introduce dated patterns (dense skeuomorphism, noisy gradients, cramped tables, modal overuse) unless explicitly requested.

---

## Technical Alignment
- **Design Tokens:** Use DX Hub tokens for color, spacing, radii, shadows, and typography. Never hard-code values already defined in tokens.
- **State & Data:** Preserve existing APIs, contracts, analytics events (PostHog), and error/reporting hooks (Sentry).
- **Multi-Tenant:** All UI should respect org context (slug, roles: owner/leader/rep) and theme overrides.

---

## Functionality & Quality Rules
1. **No Downgrades**: Do not remove features, reduce capabilities, or regress design fidelity without explicit written instruction in the task.
2. **Enhance, Don’t Reduce**: Prefer additive, opt-in improvements and progressive disclosure to simplify complexity.
3. **Performance Without Trade-Down**: Optimize rendering, bundle size, and network usage **without** removing UX affordances.
4. **Accessibility**: Maintain or improve a11y: keyboard nav, ARIA, focus rings, contrast, semantics.
5. **Stability**: Do not break public interfaces, routes, or analytics events. Add deprecations with migration notes when necessary.

---

## Agent Operating Mode
- If a requested change **might** reduce functionality/design quality, **halt** and produce a short note titled `POTENTIAL_DOWNGRADE` with:
  - **Scope** (what would be reduced)
  - **Impact** (users affected, UX implications)
  - **Alternatives** (equal-or-better solutions)
  - **Decision Needed** (yes/no)
- Downgrades require an explicit maintainer line containing:  
  `EXPLICIT_DOWNGRADE: <reason> | <scope> | <duration/branch>`

---

## PR Self-Check (Required)
Before opening a PR, agents must verify all items below:

### A. Design Vibe & Visuals
- [ ] Layout uses a spacious, grid-based structure with consistent gutters.
- [ ] Corners, shadows, and borders match DX Hub tokens (rounded-2xl, subtle elevation).
- [ ] Color usage follows semantic roles and brand accents; no ad-hoc hex values where tokens exist.
- [ ] Typography scale, weights, and line-height adhere to tokens; truncation/ellipsis applied where needed.
- [ ] Empty states, loading states, and error states are present and on-brand.

### B. Interactions & Components
- [ ] Hover/focus/active states implemented for all interactive elements.
- [ ] Transitions are smooth and performant (CSS transforms/opacity; avoid layout thrash).
- [ ] Drag-and-drop (where applicable) feels snappy; keyboard fallback provided.
- [ ] Tooltips, toasts, and inline validation are contextual and non-intrusive.

### C. Responsiveness
- [ ] Mobile, tablet, and desktop views tested; no overflow or inaccessible controls.
- [ ] Sidebar collapses or docks appropriately; main content remains readable and focused.
- [ ] Touch targets meet minimum size; scroll behaviors are intentional.

### D. Functionality & Data Integrity
- [ ] No feature removals or capability reductions introduced.
- [ ] All existing routes, query params, and API contracts preserved.
- [ ] Analytics (PostHog) events retained or enhanced; naming remains consistent.
- [ ] Error handling integrated with Sentry; user-facing errors are friendly with recovery guidance.

### E. Accessibility
- [ ] Keyboard navigation covers all controls; focus order logical.
- [ ] ARIA roles/labels used where semantics aren’t native.
- [ ] Contrast meets WCAG AA; focus ring visible and not disabled.
- [ ] Forms have labels, descriptions, and error associations.

### F. Performance (No UX Trade-Down)
- [ ] Code-split heavy views; avoid blocking main thread.
- [ ] Images optimized; SVGs preferred for icons.
- [ ] Avoid unnecessary re-renders (memoization, stable keys).
- [ ] Network requests are batched/cached where safe; skeletons or shimmers for perceived speed.

### G. Theming & Tokens
- [ ] Uses DX Hub tokens for colors, typography, spacing, radii, shadows.
- [ ] No hard-coded spacing/size if token exists; request new tokens when needed.
- [ ] Dark mode supported where applicable (no illegible states).

### H. Multi-Tenant & Roles
- [ ] UI respects org context (slug) and role gating (owner/leader/rep).
- [ ] No data leakage across orgs; all filters and queries scoped correctly.
- [ ] Copy and visuals are neutral and reusable across org brands.

### I. QA & Docs
- [ ] Updated stories/examples/screenshots for changed components.
- [ ] Added concise migration notes if APIs changed (additive only).
- [ ] Tests updated/added for critical logic and accessibility.

---

## Commit & PR Template (Copy into your PR)
**Title:** `<scope>: <concise summary> (no downgrades)`

**Description:**
- Problem / Goal:
- Approach (aligns with vibe.monday.com):
- Tokens used/added:
- Accessibility considerations:
- Performance considerations:
- Multi-tenant/role notes:
- Screens / GIFs:

**Checklist:** (paste Section “PR Self-Check” and tick all boxes)

**Breaking Changes:** _None_ (required; if any, provide migration with no net downgrade)  
**Analytics:** Events preserved/added  
**Sentry:** Error paths validated

---

## Forbidden Without Explicit Approval
- Removing features, shortcuts, or information density that users rely on.
- Replacing tokenized styles with hard-coded values.
- Lowering contrast, removing focus indicators, or disabling animations globally.
- Collapsing responsive layouts to a single breakpoint.
- Eliminating error/empty/loading states.

---

## How to Request an Exception
Maintainer must include a line in the task or PR comment:

