<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- App code in `src/` and `Landing/` was imported unchanged from github.com/Kaushika811/proofix-frontend (`frontend/`); keep it faithful to that repo unless the user asks for changes.
- `vite.config.ts` stays on `@lovable.dev/vite-tanstack-config` (the repo's plain Vite config with a backend proxy is not used) so the Lovable preview can run it.
- Agent evidence cards in the architecture timeline render through `pipeline/AgentEvidence.tsx` (one visual variant per agent number, data still from `stageData.ts`) and keep a fixed card height so opening an agent never shifts the timeline.
