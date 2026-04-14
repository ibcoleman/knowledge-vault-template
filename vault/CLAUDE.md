# Knowledge Vault

> This file is the operating schema for the Knowledge Vault. Claude Code loads it automatically at session start. It defines conventions, page formats, and workflows for maintaining the vault.
>
> **Do not put wiki content in this file.** This is pure configuration — conventions and procedures only.

## Vault Overview

### Three Layers

| Layer | Directory | Owner | Purpose |
|-------|-----------|-------|---------|
| Capture | `daily/` | Collaborative (user + Claude) | Quick notes, URLs, observations. Inbox for the system. |
| Raw Sources | `raw/` | User (immutable) | Markdown-converted articles, papers, book chapters. Claude reads but never modifies. |
| Wiki | `wiki/` | Claude | Structured, interlinked pages synthesized from sources and capture. User reads, Claude writes. |

### Directory Structure

```
vault/
├── CLAUDE.md              # This file — schema and workflows
├── daily/                 # One page per day (YYYY-MM-DD.md)
├── raw/                   # Immutable source documents
│   ├── articles/          # Web articles, blog posts
│   ├── papers/            # Academic papers, technical reports
│   ├── books/             # Book chapters, reading notes
│   └── assets/            # Images referenced by sources
├── wiki/                  # LLM-maintained knowledge base
│   ├── entities/          # People, organizations, tools, projects
│   ├── concepts/          # Ideas, patterns, methodologies, topics
│   ├── sources/           # One summary page per ingested source
│   └── syntheses/         # Cross-cutting analyses, comparisons
├── intake/                # Discord bot capture queue (manifests + images)
│   ├── images/            # Image attachments downloaded by the bot
│   └── files/             # File attachments downloaded by the bot
├── index.md               # Content catalog organized by wiki type
└── log.md                 # Chronological append-only operations record
```

### Cardinal Rules

1. **Never modify files in `raw/`.** Raw sources are immutable. Read them; never edit them.
2. **Wiki pages are Claude's responsibility.** User reads wiki pages; Claude writes and maintains them.
3. **Every wiki change gets logged.** Append to `log.md` after every ingest, sweep, or significant wiki update.
4. **Update `index.md` on every wiki page create/delete.** Keep the catalog current.
5. **Always use `[[wikilinks]]` for cross-references.** Never use raw markdown links between vault pages.
6. **Commit after every workflow.** Git is the safety net — every operation is recoverable.
7. **Flag contradictions, never overwrite silently.** When new information conflicts with existing wiki content, surface it explicitly.

## Page Format Conventions

### Frontmatter

Every wiki page starts with YAML frontmatter:

```yaml
---
type: entity | concept | source | synthesis
tags: [topic1, topic2]
sources: ["raw/articles/filename.md"]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

**Required fields:**
- `type`: One of `entity`, `concept`, `source`, `synthesis`
- `tags`: List of topic tags. Lowercase, kebab-case. Use nested tags for specificity (`ai/machine-learning`).
- `sources`: List of raw source file paths that contributed to this page. Empty list `[]` is valid for syntheses.
- `created`: Date page was first created (YYYY-MM-DD).
- `updated`: Date page was last meaningfully modified (YYYY-MM-DD).

**Optional fields:**
- `aliases`: Alternative names for the topic (enables Obsidian search by alias).

### File Naming

- **Kebab-case**, lowercase: `reinforcement-learning.md`, `openai.md`
- **No spaces** in filenames
- **Descriptive** — a reader should know the topic from the filename alone
- **Entities**: Use the most common name (`openai.md` not `open-ai-inc.md`)
- **Concepts**: Use the concept term (`transformer-architecture.md`)
- **Sources**: Slug of the source title (`attention-is-all-you-need.md`)
- **Syntheses**: Descriptive slug of the analysis (`comparison-of-llm-training-approaches.md`)
- **Daily pages**: `YYYY-MM-DD.md` in `daily/`

### Wikilinks

- **Basic link**: `[[page-name]]`
- **Display text**: `[[page-name|display text]]`
- **Section link**: `[[page-name#heading]]`
- **Omit file extensions**: `[[transformer-architecture]]` not `[[transformer-architecture.md]]`
- **Omit directory paths** when page names are unique across the vault. Obsidian resolves automatically. Use paths only to disambiguate duplicates.
- **Duplicate filenames across subdirectories**: A concept page and a source summary may share the same slug (e.g., `wiki/concepts/llm-wiki-pattern.md` and `wiki/sources/llm-wiki-pattern.md`). When listing these in `index.md` or citing them in wiki pages, append a clarifying note in the surrounding text: "the concept page" vs "the source summary". In `index.md`, each section header (Concepts, Sources) provides the necessary disambiguation.
- **First-mention rule**: On each wiki page, wikilink the first mention of another wiki topic. Don't link every occurrence.

### Page Templates

#### Entity (`wiki/entities/`)

People, organizations, tools, projects, products.

```markdown
---
type: entity
tags: [relevant-tags]
sources: ["raw/path/to/source.md"]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Entity Name

Brief description (1-2 sentences).

## Key Facts

- Fact attributed to source (from [[source-summary]])
- Another fact (from [[source-summary]])

## Related

- [[related-entity]]
- [[related-concept]]
```

#### Concept (`wiki/concepts/`)

Ideas, patterns, methodologies, topics.

```markdown
---
type: concept
tags: [relevant-tags]
sources: ["raw/path/to/source.md"]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Concept Name

Definition and overview (1-3 paragraphs).

## Key Points

- Important aspect with attribution (from [[source-summary]])

## Connections

- How this relates to [[other-concept]]
- Where this appears in [[entity]]'s work

## Sources

- [[source-summary-1]] — what this source says about the concept
- [[source-summary-2]] — additional perspective
```

#### Source Summary (`wiki/sources/`)

One page per ingested raw source.

```markdown
---
type: source
tags: [relevant-tags]
sources: ["raw/path/to/original.md"]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Source Title

**Raw source:** `raw/path/to/original.md`
**Original URL:** https://example.com/original-source (if applicable)
**Author:** Author Name
**Date:** Publication date

## Summary

2-4 paragraph summary of the source.

## Key Takeaways

1. First key point
2. Second key point
3. Third key point

## Entities Mentioned

- [[entity-1]] — context from this source
- [[entity-2]] — context from this source

## Concepts Covered

- [[concept-1]] — how this source discusses it
- [[concept-2]] — how this source discusses it
```

#### Synthesis (`wiki/syntheses/`)

Cross-cutting analyses derived from multiple wiki pages.

```markdown
---
type: synthesis
tags: [relevant-tags]
sources: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Synthesis Title

## Question

The question or analysis prompt that motivated this synthesis.

## Analysis

Multi-paragraph analysis drawing from multiple wiki pages.
Every claim cites its wiki source: "...claim... ([[page-name]])."

## Pages Consulted

- [[page-1]]
- [[page-2]]
- [[page-3]]
```

## Cross-Referencing Rules

### When to Link

- Link to existing wiki pages whenever a topic is mentioned
- Wikilink entities and concepts on first mention within each page
- Source summaries link to all entities and concepts they discuss
- Daily pages link to wiki pages when observations are wiki-worthy

### When to Create a New Page

- An entity or concept appears in **two or more sources** — it deserves its own page
- A single source covers an entity or concept **extensively** (multiple paragraphs of substance)
- User explicitly requests a page on a topic
- An end-of-day sweep identifies a daily observation as wiki-worthy

### When NOT to Create a Page

- Trivial mention (name-dropped once with no substance)
- Topic has no meaningful content for a standalone page
- Topic is adequately covered as a section within another page

### Disambiguation

- If two entities share a name, use qualifying suffixes: `[[john-smith-physicist]]` vs `[[john-smith-historian]]`
- Add `aliases:` to frontmatter for alternative names so Obsidian search finds them

## Quality Standards

### Citations

- Every factual claim on a wiki page must trace back to a source
- Attribution format: "claim text (from [[source-summary-page]])"
- Multiple sources: "(from [[source-1]], [[source-2]])"
- Syntheses cite wiki pages consulted, not raw sources directly

### Contradiction Handling

When new information conflicts with existing wiki content:

1. **Do not silently overwrite.** The existing content may be correct.
2. Add a `## Contradictions` section (or append to existing one):
   ```
   ## Contradictions

   - [[source-a]] says X, but [[source-b]] says Y. (flagged YYYY-MM-DD)
   ```
3. Let the user decide how to resolve the contradiction.

### Page Length

- **Target**: 200-800 words per page (excluding frontmatter)
- **Split threshold**: If a page exceeds ~1500 words, consider splitting into sub-pages and linking them
- **Minimum viable page**: Must have enough substance to justify existence. A name and one sentence should be a mention on another page, not its own page. An entity page with only an authorship attribution and no independently verifiable facts should be merged into the source summary rather than standing alone.

### Staleness

- `updated` frontmatter field reflects the last meaningful content change
- During lint, flag pages not updated in 90+ days if newer sources exist on the topic

---

## Workflows

### Daily Page Template

Daily pages live in `daily/` and use the filename format `YYYY-MM-DD.md`. Create one when the first capture of the day arrives.

Replace `YYYY-MM-DD` with today's date when creating the file.

```markdown
# YYYY-MM-DD

## Inbox

<!-- Quick captures, URLs to process, tasks. Items here are unprocessed. -->
<!-- Mark items with - [x] when processed, or carry forward to next day. -->

## Work Log

<!-- Chronological record of what happened today. -->

## Notes

<!-- Observations, thoughts, ideas that emerged during the day. -->
<!-- Wiki-worthy notes get a [[wikilink]] when promoted to the wiki. -->
```

**Section conventions:**
- **Inbox**: Unprocessed items. Each item is a checklist entry (`- [ ]`). URLs get a link prefix. When processed, mark as `- [x]`.
- **Work Log**: Timestamped entries describing what was done. Entries use `HH:MM — description` format. Not every entry needs wiki promotion.
- **Notes**: Longer-form observations and ideas. These are the primary candidates for wiki promotion.

### Wiki-Worthiness Heuristic

Use this heuristic to decide whether a captured observation belongs in the wiki or should stay in the daily page only.

**Promote to wiki when:**
- The observation is about an entity or concept that already has a wiki page (update that page)
- The observation contains substantive, reusable knowledge — something you'd want to find again in 3 months
- The observation connects two existing wiki topics in a new way
- The user explicitly says "add this to the wiki" or similar

**Keep in daily page only when:**
- It's a bare URL with no context or commentary (just save in Inbox for later processing)
- It's a task or reminder, not knowledge ("buy milk", "email John")
- It's a transient observation tied to today only ("server was slow this morning")
- There isn't enough substance for a meaningful wiki entry (one vague sentence)

**When in doubt:** Keep it in the daily page. The end-of-day sweep will catch anything that should have been promoted.

### Capture: Conversational Mode

When the user shares an observation, URL, or note during conversation:

**Step 1: Create or open today's daily page**
- Check if `daily/YYYY-MM-DD.md` exists (using today's date)
- If not, create it from the Daily Page Template above

**Step 2: Classify the capture**

| Input type | Daily page action | Wiki action |
|-----------|-------------------|-------------|
| Bare URL, no context | Add to Inbox as `- [ ] [URL]` | None |
| URL with commentary | Add to Inbox as `- [ ] [URL] — commentary` | None (process during sweep or ingest) |
| Quick observation | Add to Notes section | Apply wiki-worthiness heuristic |
| Task / reminder | Add to Inbox as `- [ ] task description` | None |
| Substantial knowledge | Add to Notes with `[[wikilink]]` | Update or create wiki page |

**Step 3: If wiki-worthy** (per the heuristic above):
1. Add the observation to the daily page Notes section with a wikilink to the target page
2. Update the existing wiki page with the new information, attributing it: "(noted YYYY-MM-DD)"
3. Or create a new wiki page if the topic doesn't have one yet (following page format conventions)
4. Update `index.md` if a new wiki page was created
5. Append to `log.md`: `## [YYYY-MM-DD] capture | Topic Name` (whether updating or creating the wiki page)

**Step 4: Confirm to user**
- Tell the user what was captured and where it went
- If a wiki page was updated/created, mention it

### Capture: End-of-Day Sweep

Run this when the user says "sweep", "end of day", or at the end of a work session. This processes the day's accumulation.

**Step 1: Read today's daily page**
- Open `daily/YYYY-MM-DD.md`
- If it doesn't exist, report "No daily page for today — nothing to sweep."

**Step 2: Process Inbox items**
- For each unchecked item (`- [ ]`):
  - **URLs**: If the URL has enough context to ingest, suggest it. If bare, carry forward.
  - **Tasks**: Leave as-is (tasks are the user's responsibility)
  - **Other items**: Evaluate for wiki-worthiness

**Step 3: Process Notes**
- For each note without a `[[wikilink]]`:
  - Apply the wiki-worthiness heuristic
  - If wiki-worthy: update/create wiki page, add wikilink to the note
  - If not wiki-worthy: leave as-is

**Step 4: Carry forward unchecked Inbox items**
- Create tomorrow's daily page if it doesn't exist
- Copy all unchecked Inbox items (`- [ ]`) to tomorrow's Inbox section
- Do NOT mark them as checked on today's page — leave them as `- [ ]` so today's page reflects what was unprocessed

**Step 5: Update navigation**
- Update `index.md` if any new wiki pages were created
- Append to `log.md`: `## [YYYY-MM-DD] sweep | [swept-date] (N promoted, M carried forward)`
- List what was promoted, what was carried forward

**Step 6: Commit**
- Stage all changed files
- Commit with message: `chore: end-of-day sweep YYYY-MM-DD`

**Step 7: Report to user**
- Summary of what was promoted to wiki
- Summary of what was carried forward
- Any URLs suggested for ingest

### Ingest: Process a Source into the Wiki

Run when the user places a markdown file in `raw/` and asks Claude to process it, or when a URL from a daily page is ready for full ingestion.

**Step 1: Read the source**
- Read the raw source file completely
- Identify: title, author, publication date, key entities, key concepts, main arguments/findings

**Step 2: Discuss with user**
- Present a brief summary of what the source covers
- Highlight the key entities and concepts found
- Ask the user:
  - "Are there specific aspects you want me to emphasize?"
  - "Any entities or concepts I should prioritize or skip?"
  - "Does this connect to anything you're currently thinking about?"
- Wait for user input before proceeding to write wiki pages

**Step 3: Write source summary page**
- Create `wiki/sources/<source-slug>.md` using the Source Summary template
- Include: raw source path, author, date, summary, key takeaways
- Link to all entity and concept pages that will be created/updated
- Every claim in the summary must be traceable to the source

**Step 4: Create or update entity pages**
For each significant entity mentioned in the source:

- **If entity page exists:** Update it (see Page Update Conventions below)
- **If entity page doesn't exist** and entity meets page-creation criteria: Create it using Entity template
- Add the new source summary to the entity's sources list in frontmatter
- Attribute all new facts: "(from [[source-summary-page]])"

**Step 5: Create or update concept pages**
For each key concept in the source:

- **If concept page exists:** Update it (see Page Update Conventions below)
- **If concept page doesn't exist** and concept meets page-creation criteria: Create it using Concept template
- Add the new source summary to the concept's sources list in frontmatter

**Step 6: Check for contradictions**
- Before writing any update to an existing page, compare the new information with existing content
- If the new source contradicts existing information:
  1. Do NOT overwrite the existing content
  2. Add or append to a `## Contradictions` section on the affected page
  3. Format: `- [[new-source]] says X, but [[existing-source]] says Y. (flagged YYYY-MM-DD)`
  4. Mention the contradiction in your report to the user

**Step 7: Update index.md**
- Add entries for every new wiki page created
- Each entry format: `- [[page-name]] — one-line summary`
- Place entries in the correct type section (Entities, Concepts, Sources, Syntheses)
- Keep entries within each section in alphabetical order

**Step 8: Append to log.md**
- Add entry: `## [YYYY-MM-DD] ingest | Source Title`
- Below the heading, list what was created/updated:
  ```
  - Created: [[source-summary]]
  - Created: [[new-entity-1]], [[new-entity-2]]
  - Updated: [[existing-concept-1]]
  - Contradictions flagged: [[affected-page]]
  ```

**Step 9: Commit**
- Stage all new and modified files
- Commit: `feat: ingest <source-title-slug>`

**Step 10: Report to user**
- Summary of what was created and updated
- Any contradictions flagged
- Suggestions for follow-up (related sources to read, concepts to explore)

### Page Update Conventions

When a new source adds information to an existing wiki page, follow these rules to preserve existing content and maintain attribution.

**General principle:** Accumulate, don't replace. Each source's contributions remain identifiable.

#### Updating Entity Pages

1. **Add new facts** to the Key Facts section with source attribution
2. **Do not modify** existing facts from other sources unless they are demonstrably wrong (in which case, flag as contradiction)
3. **Update** the `sources` list in frontmatter to include the new source path
4. **Update** the `updated` date in frontmatter
5. **Add new Related links** if the new source reveals connections

Example — entity page before:
```markdown
## Key Facts

- Founded in 2015 (from [[source-a-summary]])
```

After ingesting a second source:
```markdown
## Key Facts

- Founded in 2015 (from [[source-a-summary]])
- Raised $1B in Series C funding in 2023 (from [[source-b-summary]])
- Expanded to European markets in 2024 (from [[source-b-summary]])
```

#### Updating Concept Pages

1. **Extend existing sections** rather than rewriting them
2. **Add new perspectives** from the new source, attributed
3. **Update the Sources section** at the bottom with what the new source says
4. **Add new Connections** if the new source links this concept to other topics
5. **Update** frontmatter `sources` and `updated` fields

#### Updating Source Summary Pages

Source summaries should rarely need updating after creation. Exceptions:
- Fixing an error in the original summary
- Adding a note about a retraction or correction to the original source

### Query: Answer Questions from the Wiki

Run when the user asks a question that the wiki might be able to answer.

**Step 1: Search the index**
- Read `index.md` to identify pages relevant to the question
- Look for matching entities, concepts, sources, and syntheses
- If no relevant pages are found, go to Step 1b

**Step 1b: No wiki coverage**
- Tell the user explicitly: "The wiki doesn't have coverage on this topic yet."
- Do NOT answer from general knowledge and present it as wiki-sourced
- Suggest: "Would you like me to look for sources on this topic?" or "If you have a source, I can ingest it."
- Stop here unless the user wants to proceed differently

**Step 2: Read relevant pages**
- Read each relevant wiki page identified in Step 1
- Follow wikilinks to related pages if the question requires broader context
- Note which pages contribute to the answer

**Step 3: Synthesize answer**
- Compose an answer drawing from the wiki pages read
- **Cite every claim** with wikilinks: "According to [[entity-name]], ... ([[source-summary]])"
- Use `[[page-name]]` inline citations — every factual statement must have one
- If wiki pages contain contradictions relevant to the question, surface them:
  "Note: there's a contradiction on this topic — [[source-a]] says X while [[source-b]] says Y."

**Step 4: Offer to file as synthesis**
- If the answer is substantial (3+ paragraphs, draws from 3+ pages, or produces a novel comparison/analysis):
  - Ask: "This answer is substantial. Would you like me to file it as a synthesis page in the wiki?"
- If the user says yes:
  1. Create `wiki/syntheses/<descriptive-slug>.md` using the Synthesis template
  2. Record the question in the `## Question` section
  3. Copy the analysis into `## Analysis` with all citations preserved
  4. List all consulted pages in `## Pages Consulted`
  5. Update `index.md` with the new synthesis entry
  6. Append to `log.md`: `## [YYYY-MM-DD] query | Synthesis Title`
  7. Commit: `feat: add synthesis <slug>`

**Step 5: Report**
- Present the answer to the user
- List which wiki pages were consulted
- If applicable, note gaps where additional sources could strengthen the answer

### Lint: Wiki Health Check

Run when the user asks to "lint", "health-check", or "audit" the wiki. Produces an actionable checklist — never silently fixes things.

**Step 1: Scan for orphan pages**
- Read every file in `wiki/entities/`, `wiki/concepts/`, `wiki/sources/`, `wiki/syntheses/`
- For each wiki page, search all other wiki pages and daily pages for `[[page-name]]` links pointing to it
- A page with **zero inbound links** from other pages is an orphan
- List orphans in the report

**Step 2: Scan for broken wikilinks**
- Read every wiki page and daily page
- Extract all `[[wikilink]]` references
- **Skip wikilinks inside HTML comments** (`<!-- ... -->`) — template placeholders such as `<!-- [[wikilink]] -->` in daily page templates are not real links
- Check if the target page exists (search by filename across the vault)
- List all wikilinks pointing to non-existent pages

**Step 3: Scan for contradictions**
- Read all pages that have a `## Contradictions` section
- List each unresolved contradiction with the affected page and conflicting sources
- Also scan for cases where two pages make conflicting claims about the same entity/concept without a formal contradiction flag

**Step 4: Scan for stale content**
- Check `updated` frontmatter dates on all wiki pages
- Flag pages not updated in 90+ days if newer sources exist on the same topic (check `sources` field overlap)

**Step 5: Scan for missing cross-references**
- Look for entity/concept names mentioned in wiki pages that aren't wikilinked
- Look for topics discussed substantially across multiple pages that lack their own page

**Step 6: Produce actionable checklist**
Format the report as a numbered checklist, grouped by category:

```markdown
## Lint Report — YYYY-MM-DD

### Orphan Pages
1. [ ] [[page-name]] — no inbound links. Action: add links from related pages or delete if obsolete.

### Broken Links
2. [ ] [[nonexistent-page]] linked from [[source-page]]. Action: create page or fix link.

### Unresolved Contradictions
3. [ ] [[affected-page]] — [[source-a]] vs [[source-b]] on topic X. Action: resolve with user.

### Stale Pages
4. [ ] [[old-page]] — last updated YYYY-MM-DD, newer sources exist. Action: review and update.

### Missing Cross-References
5. [ ] "Topic X" mentioned in [[page-a]], [[page-b]] but has no page. Action: create concept page.

### Summary
- Orphans: N
- Broken links: N
- Contradictions: N
- Stale pages: N
- Missing cross-refs: N
```

If all categories are empty, output only the Summary section with all counts at zero and the message: "Wiki is healthy — no issues found."

**Step 7: Get user approval**
- Present the checklist to the user
- Ask: "Which items should I fix? (Enter numbers, 'all', or 'none')"
- Only execute the approved actions
- For contradictions, always ask the user how to resolve — never decide unilaterally

**Step 8: Execute approved actions**
- Perform each approved fix
- Update `index.md` if pages were created or deleted
- Append to `log.md`: `## [YYYY-MM-DD] lint | Wiki health check`
- List actions taken below the log heading

**Step 9: Commit**
- Stage all changes
- Commit: `chore: lint pass YYYY-MM-DD`

### Process Intake: Batch Process Discord Captures

Run when the user says "process intake" or similar. This processes manifest files saved by the Discord intake bot in `intake/`.

**Step 1: Scan the queue**
- Read all `.md` files in `intake/` (excluding `.gitkeep`)
- Parse YAML frontmatter from each file to get `type` field
- Present summary: "N items in intake queue: X URLs, Y images, Z notes."
- If no items found, report "Intake queue is empty — nothing to process." and stop

**Step 2: Process each item chronologically** (sorted by filename, which starts with date)

For each manifest file, read its frontmatter `type` and process accordingly:

| Type | Processing |
|------|-----------|
| `url` | Extract URL from manifest body. Fetch the article content (try WebFetch first, fall back to curl). Convert to markdown. Save to `raw/articles/{slug}.md`. Run the existing **Ingest** workflow (Step 2 onward — skip the "discuss with user" step for batch processing). |
| `image` | Copy image file(s) from `intake/images/` to `raw/assets/` using the paths in the manifest's Attachments section. If the manifest has accompanying text that meets the wiki-worthiness heuristic, create or update a wiki page. Otherwise, add a note to today's daily page referencing the image. |
| `file` | Read the file(s) listed under `## Files` in the manifest from `intake/files/`. For `.md` files: copy to `raw/articles/{slug}.md` (slugify the filename). Run the existing **Ingest** workflow (Step 2 onward — skip the "discuss with user" step for batch processing). For other file types: copy to `raw/assets/` and add a note to today's daily page. |
| `note` | Add the note text to today's daily page (Notes section). Apply the wiki-worthiness heuristic — if wiki-worthy, also create/update the relevant wiki page per the existing **Capture: Conversational Mode** workflow. |

**Error handling:** If a URL is unreachable or an image file is missing, log the failure and continue with remaining items. Do not stop the batch. Report all failures at the end.

**Step 3: Clean up**
- Delete each successfully processed manifest file from `intake/`
- Delete associated image files from `intake/images/` and file attachments from `intake/files/` for processed manifests
- Leave failed manifest files in `intake/` for retry next session

**Step 4: Report and commit**
- Summary of what was processed:
  - URLs: list of articles ingested
  - Images: list of assets saved
  - Notes: list of daily page additions
- Any failures (unreachable URLs, missing images)
- Stage all new and modified files
- Commit with message: `feat: process intake batch YYYY-MM-DD`
- Append to `log.md`: `## [YYYY-MM-DD] intake-batch | Process intake (N URLs, N images, N notes)`
