# Shared workspace visuals

Inventory, Packages, Parts, Quotes and Activity use `src/catalog/workspace-shell.css` for their common shell. Inventory’s quieter navigation is the reference treatment.

- The main navigation occupies one shared grid and always precedes page-specific headings. Active sections use dark ink with white labels; inactive sections stay quiet. There is no route-specific shell width or navigation theme.
- Inventory areas and Package Studio views use `workspace-context-nav`: matching spacing, icon sizes, sage selection and orange underline. Package views precede the page heading, matching Inventory’s hierarchy.
- `workspace-heading` supplies a shared title scale, description, muted kicker and orange title punctuation. Inventory, purchasing, jobs, packages, quotes, parts and activity opt into this primitive.
- Shared workspace tokens define ink, muted text, orange, borders, surfaces and control radius. Primary actions use orange without the old offset black shadow. Focus remains visibly outlined and reduced-motion preferences remain respected.
- On phones, the five main sections use two rows. Secondary tab icons sit above their labels, preserving readable text and complete click targets. The narrowest layout stacks main navigation icons above labels as needed.

Visual QA covered all five sections at 320, 390, 768 and 1280 pixels. Shared headings and navigation matched at desktop width; there were no clipped navigation buttons or horizontal document overflow. Inventory’s three areas were also checked. The existing application tests and hosted build must pass before release.
