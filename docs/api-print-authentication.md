# API and print authentication (#57, #66)

API requests require a validated Supabase session and return JSON 401 when
anonymous. Print pages redirect anonymous requests to `/sign-in`; their loaders
also validate the server scope, independently of middleware. Protected paths
fail closed if authentication infrastructure fails.

Exceptions are listed in `lib/supabase/auth-policy.ts`, by exact path and method:

- `POST /api/javali-avistamentos/report` remains public. `/avistamento-javali`
  is an existing community reporting page with location selection and an offline
  queue, without a login prerequisite. Requiring a session would break this
  product flow. Other javali APIs remain protected. This is the decision for #57.
- `POST /api/balneario-municipal/sync` can bypass session authentication only
  when its bearer header matches the configured, nonempty `CRON_SECRET`.
  Anonymous callers with a missing/incorrect secret receive 401. The handler
  retains its own machine authorization check.

Auth callbacks are outside `/api`; `/api/auth/role` remains protected. Scheduled
FIRMS/MapBiomas ingestion calls Supabase Edge Functions directly; those functions
continue validating `CRON_SECRET` in `supabase/functions/_shared/edge.ts`.

Print action dossiers resolve a tenant and return 404 for inaccessible actions.
Property dossiers authorize base data by spatial overlap with regions owned by
the resolved organization, narrowed to every region assigned to the user when
assignments exist. Owner and superadmin grants cover owned organization regions. Other users
without a regional assignment receive 404 for property and map printing; an
empty regional grant never expands to the whole organization. Related operational actions are also
filtered by organization; global environmental base data remains shared.

Map snapshots resolve organization and region before loading the catalog/data.
Layer ownership is checked before reading data or groups; generic global layers
remain visible, and action groups cannot expose another organization's labels.

Regression coverage uses mocked authentication/database boundaries and real
Next responses/Drizzle SQL construction. It does not substitute for a deployed
Supabase/PostGIS integration check with accounts from two organizations.
