# Notion documentation wiki

Developer documentation for this site lives in the **TJG Site Docs** Notion wiki:
https://www.notion.so/37d59b88f2b18072b5fcc8f29814afff

The wiki home is a database hub. Its child pages are editable through MCP; the
hub callout is not. Start at **Environments & site editions**, which records
the deployment model, rollout evidence and documentation checkpoints.

## Page map

| Page | Notion page ID |
| --- | --- |
| Wiki home (hub / index) | `37d59b88f2b18072b5fcc8f29814afff` |
| Environments & site editions | `3d259b88f2b181fe899aef777c807289` |
| Site Overview & Architecture | `37d59b88f2b1813d8ea6d382c6082153` |
| Design System & Theming | `37d59b88f2b181ecb942de065ba3b77e` |
| Navigation & Core Components | `37d59b88f2b181478070f0b0fc4fd668` |
| Blog System | `37d59b88f2b181cc9484c331a16e5df2` |
| Feature Flags | `37d59b88f2b1810b841ec4c5770a4550` |
| Pages Reference | `37d59b88f2b181e4a729d26c2244d867` |
| Integrations, APIs & Environment Variables | `37d59b88f2b18174baa6c78fdd6b219a` |
| Quirks, Easter Eggs & Gotchas | `37d59b88f2b18108a3f6ff5ed6ca8ffe` |
| Beta branch (Sanity migration history) | `37d59b88f2b181658361ff7eb1891950` |

## Automated updates

Two Codex workflows keep the wiki in sync using OpenAI API billing:

- `.github/workflows/docs-impact-review.yml` — **inline PR bot**: posts a
  "Docs impact" comment on non-draft, same-repository PRs into `main`/`beta`,
  listing which wiki pages the change will make stale (or confirming there's no
  impact). Fork and Dependabot PRs are skipped because their runs do not receive
  the API secret. The Codex action also limits execution to actors with repository
  write access by default. A read-only job generates the text; a separate job
  creates or updates the bot's existing comment.
- `.github/workflows/update-docs.yml` — **after merge**: diffs the repo against
  the last documented commit recorded on the Environments page, updates the stale
  wiki sections via the Notion MCP server, verifies the edits, then bumps the
  recorded commit. Runs are serialized and read the latest target-branch commit.
  For an on-demand update, open **Actions → Update Notion docs → Run workflow**
  and select `main` or `beta`.

The separate `.github/workflows/claude.yml` interactive `@claude` bot remains
available and still uses `CLAUDE_CODE_OAUTH_TOKEN`. It is not involved in the two
automatic Codex workflows.

### One-time setup

1. **OpenAI auth**: create an API key in your
   [OpenAI Platform project](https://platform.openai.com/api-keys) with access to
   the Responses API and funded API billing. Add it as `OPENAI_API_KEY` under
   [repository Settings → Secrets and variables → Actions](https://github.com/thatjoshguy67/TJG-Website/settings/secrets/actions).
   Both automatic workflows use `openai/codex-action@v1`, which runs Codex through
   its API proxy with `drop-sudo` protection. Usage is billed to the API project,
   separately from a ChatGPT subscription. No ChatGPT login cache or Claude token
   is required for these workflows. The action uses its default model.
2. **Notion integration**: at https://www.notion.so/profile/integrations create an
   internal integration with read + update + insert content capabilities, then in
   Notion open the TJG Site Docs wiki → ••• → Connections → add the integration.
   Add its token as the `NOTION_TOKEN` repository secret.

The updater installs `@notionhq/notion-mcp-server@2.5.1` before starting Codex.
Its trusted configuration is written under the runner's temporary directory and
forwards `NOTION_TOKEN` through the environment; the token is not embedded in the
prompt or configuration file. Shell commands have read-only access, while the
Notion MCP tools can update the wiki. This token-based server edits Notion blocks;
it does not provide the hosted Notion MCP's Markdown `update_content` operation.

To verify setup, run **Update Notion docs** manually on `main` or `beta` and check
the job's final summary and the Environments page checkpoint. This performs real
wiki updates. The workflows fail early with an explicit message if a required
secret is missing. If Notion access or any edit fails, the checkpoint must stay
unchanged. A manual run needs a valid existing checkpoint; a merged-PR run can
fall back to that PR's diff but leaves the checkpoint unchanged until the missing
history has been reconciled.

See the official [Codex GitHub Action](https://learn.chatgpt.com/docs/github-action)
and [MCP configuration](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)
documentation for configuration details.

### Manual / agent updates

Any agent (Codex, Claude Code, etc.) making a significant change should also
update the affected wiki pages and the documentation checkpoint on the
Environments page. Do not try to update the database hub as a page. The same page map
above applies. Keep edits surgical: update stale sections in place rather than
regenerating whole pages, so manual edits made by humans survive.
