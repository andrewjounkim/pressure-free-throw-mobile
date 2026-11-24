# Prompt Log — HW10 (Pressure Free Throw Mobile)

Prompts are copied verbatim, in order. Notes in *italics* are not prompts.

## Tools used

- Claude Code (Claude Opus 5.5) in the VS Code extension, in agent mode, for setup, learning, the build and the fixes.
- A second, fresh Claude Code agent (general-purpose subagent with no access to the build conversation) for the review that produced REVIEW.md.
- Expo CLI, Expo Go, GitHub CLI.

## Setup & learning prompts

```
I'm doing CMU 15-114 HW10: build a React Native app with Expo, demoed on my phone via Expo Go. I'm on a Mac. Do the following, stopping where noted:

1. Run `node --version`. If it's below 22.13, stop and tell me to install the LTS from nodejs.org.
2. Run `npx create-expo-app@latest shot-log` with NO --template flag (the course requires this so the SDK matches the current Expo Go). Tell me the exact template/SDK it printed (e.g. default@sdk-58).
3. cd into shot-log, run `git init`, and create a .gitignore if one doesn't exist (include node_modules, .expo).
4. Install AsyncStorage with `npx expo install @react-native-async-storage/async-storage`.
5. Check for AGENTS.md, CLAUDE.md, or .claude/settings.json in the project and summarize anything in them that would affect how you work.
6. Explain to me, as someone brand new to React Native: how the files in src/app/ become screens, what _layout.tsx does, how a View differs from a div, and what useState does. Use src/app/index.tsx as the example.
7. Do NOT delete the starter code and do NOT write any app code yet.

Then stop and tell me to: run `npx expo login` and `npx expo start` myself, scan the QR code, and write SPEC.md.
```

```
help with that i did make an account
```

## Build prompt

```
Read SPEC.md in this project. Implement the full mobile app exactly as specified.
This is an Expo project using Expo Router, so screens belong in src/app/.
Check package.json for the exact Expo SDK version and write code for that version.
Create all necessary files, components, and navigation. Make sure that appropriate data is persistent (use @react-native-async-storage/async-storage, already installed).
Avoid security risks for sensitive data. Include proper error handling.
Use a consistent 2–3 color scheme, readable text, clear screen titles, and buttons that look tappable.
Make sure the app starts without errors and displays the home screen correctly; run `npx expo export --platform ios` or a TypeScript check to catch errors since you can't see my phone.
When done, list every file you created or changed. Do not commit. I will test on my phone and commit the raw output myself.
```

*The agent stopped because there was no SPEC.md in the project yet.*

```
its in the pressure free throw one
```

*The agent pointed out that this SPEC.md was for my desktop browser game from an earlier assignment (mouse, F key, canvas, "no mobile/touch controls"), so it couldn't be built as-is for a phone.*

```
just make a mobile version of the game using information from the spec.md already written but change it to make it more apt for a mobile game. list ideas for features and I will write spec.md using the information.
```

## Review prompt

*Sent to a fresh agent that had not seen the build conversation. The first line (the project path) was added; the rest is the course's review prompt verbatim.*

```
The project is at /Users/andrewjounkim/shot-log (work only inside that folder).

Review the React Native/Expo code in this project against the spec in SPEC.md.
For each acceptance criterion in the spec, verify whether the code actually implements it correctly.
Also check for:
- Bugs or logic errors
- Missing error handling
- Code quality issues (unclear naming, repeated code, etc.)
- Best practices for React Native or other technologies

Format your review as a numbered list of findings, each marked as [PASS], [FAIL], or [WARN].
Be specific. Reference file names and line numbers.
Do not fix anything in this session. Report only.
Export the review as REVIEW.md at the root of the project.
```

## Fix prompts

*Sent while the build was still running. The placeholders in angle brackets were never filled in.*

```
Read SPEC.md and REVIEW.md. Fix every [FAIL] item and these [WARN] items: <list the ones you chose>. I'm NOT fixing <findings you disagree with> because <reason>.
Don't modify REVIEW.md or SPEC.md. For each fix, explain in 1–2 sentences what was wrong and why the fix works, since I'm learning React Native.
After fixes, tell me to commit with "Fixes after AI review".

Then:
1. Create README.md with these headings, leaving the first three EMPTY with a "TODO (Andrew writes this, no AI)" note, because my course forbids AI for them:
   - What it does and why
   - Screens
   - What surprised me about mobile development
   - Setup and run: fill this in accurately (clone, npm install, npx expo start, Expo Go sign-in requirement, tunnel fallback, the exact Expo SDK version from package.json, and "Tested on: <DEVICE>" for me to fill in)
   - Review decisions: a "TODO" placeholder for my one-sentence explanations of findings I chose not to fix
2. Create prompt_log.md with sections: Tools used; Setup & learning prompts; Build prompt; Review prompt; Fix prompts; Manual interventions. Leave each section as a placeholder. Do NOT invent or paraphrase prompts, since the course requires my verbatim prompts and I'll paste them in.
3. Give me a checklist to verify every acceptance criterion on my phone, including closing Expo Go completely and reopening it to confirm persistence.
```

```
so is it done as per these requirements
```

*Followed by the full HW10 assignment page pasted in (omitted here because of its length).*

```
complete everything else for me first and then guide me through setting it up on my phone and then lastly i will film the video
```

*Since I hadn't chosen which [WARN] items to fix, the agent fixed every [FAIL] plus the [WARN] items that affect gameplay or reliability, and listed the rest under "Review decisions" in the README with a drafted reason for each.*

```
it ran it all works
```

```
its iphone 15 ios 26 get the screnshots urself and js make the portfolio card and commit that to my portfolio urself ill do the other stuff later
```

*The agent couldn't reach my phone and this Mac has no Xcode simulator, so it captured the portfolio screenshots from the app's web preview at iPhone 15 size, and captioned them that way.*

## Manual interventions

- I didn't edit any code by hand.
- I stepped in during the build twice:
  1. I pointed the agent to the SPEC.md in my earlier pressure-free-throw project, because I hadn't put one in this repo.
  2. When it said that spec was for a desktop browser game, I told it to adapt the features and the game for mobile.
- I ran the project on ExpoGo and tried out the game to make sure everything was up to expectations and I was able to film the video demoing my work.
