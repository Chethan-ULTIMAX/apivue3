# APIVue — Phase 2: Finish the existing product

Phase 2 focuses on making the existing product genuinely usable rather than creating a new deployment architecture.

## Product checklist

- [x] 8. Dashboard — overview, connected-source state, quick navigation and responsive shell.
- [x] 9. Profiles — search, add/connect, pin, refresh, open source profile and remove.
- [x] 10. Explore — public profile lookup across supported platforms, profile data, analyze and compare hand-off.
- [x] 11. Progress / history — snapshots, activity history, streaks, metric trends and progress areas.
- [x] 12. Compare — tracked profiles plus public profiles, shared metrics, charts and removable comparison selections.
- [x] 13. Analytics — statistics, activity, progress and trend analysis based on collected data.
- [x] 14. Goals — create, calculate, complete, delete and receive data-based goal suggestions.
- [x] 15. AI Insights — health score, strengths, warnings, observations and prioritized recommendations derived from APIVue data.

## Interaction pass

- Navigation links use real React Router routes.
- Dashboard search jumps to an existing product area.
- AI Insights shortcut opens the AI Insights view.
- Mobile navigation closes without signing the user out.
- Desktop navigation never invokes a sign-out callback.
- Profile actions are wired to React Query mutations.
- Explore actions pass real fetched profile data into Analytics/Compare.
- Compare supports adding and removing public profiles.
- Progress refresh actions refetch stored data.
- Goals support create, complete and delete actions.
- AI filters change the displayed insight set.
- Analytics range controls change the displayed trend window.

## UI pass

The dashboard shell uses a sticky translucent header, breadcrumb context, responsive mobile navigation, active navigation indicators, subtle hover motion, a page-jump control and consistent visual spacing. Dashboard quick-action cards were added to make the product areas immediately discoverable. Existing feature pages retain data-driven cards, charts, empty states and responsive layouts.

## Important deployment note

APIVue is not being redesigned around Vercel. The frontend can remain on GitHub Pages and later use a GitHub Student Pack custom domain such as a `.dev`, `.me`, or `.tech` domain. The backend remains independently deployable because OAuth secrets must stay server-side.

Live provider OAuth/integration verification still requires real provider credentials and a deployed backend; this cannot be truthfully marked as tested from source changes alone.
