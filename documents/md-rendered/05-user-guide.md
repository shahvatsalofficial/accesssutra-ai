# User guide

## 1. Install or run without installing

```bash
npx accesssutra-ai doctor
npm install -g accesssutra-ai      # optional; provides `accesssutra`
```

Requires Node.js 22 or newer. No account, no API key, no network access.

## 2. See a full example

```bash
accesssutra demo --out ./accesssutra-demo
```

Open `accesssutra-demo/assessment.html`. The bundled page is synthetic and intentionally broken.

## 3. Scan your page

Save the rendered HTML to a file, then:

```bash
accesssutra scan --input page.html --out scan.json
accesssutra manual --task task.json --out manual.json
accesssutra report --scan scan.json --manual manual.json --out ./report
```

You get `assessment.html` for people, `assessment.md` for pull requests and `assessment.json` for tools.

## 4. Gate CI

```bash
accesssutra scan --input dist/index.html --out scan.json --fail-on serious
```

Exit code 3 fails the job when a serious finding exists. Remember a pass here means only "no static candidates".

## 5. Do the human testing

Open the manual plan. For each check, a person tests with a real keyboard, screen reader, zoom and so on, then records an observation file (reviewer, environment, note, status). Re-run `manual --observations` and `report`. Use synthetic data on a safe test instance. Never put passwords, tokens or personal data in notes.

## 6. Optional: observe a real browser

```bash
npm install --no-save playwright @axe-core/playwright
npx playwright install chromium
accesssutra browser --url http://localhost:3000 --out browser.json
accesssutra report --scan scan.json --browser browser.json --out ./report
```

Only `file:` and loopback URLs are accepted. Tab sampling is a sample, not proof of focus order.

## 7. Produce a trust report about the tool

```bash
accesssutra audit --out ./assurance
accesssutra verify --report ./assurance/assurance-report.json
```

## 8. Use the agent kit in your IDE

```bash
accesssutra install-ide --target ../my-project --host claude --dry-run
accesssutra install-ide --target ../my-project --host claude
```

Review the copied files, then enable them in your host manually. Whether the host loads them is not verified by this tool.

## Reading a finding

Each finding says what was seen, where (file, line, selector), which WCAG criteria it may relate to, how confident the evidence is, how to reproduce and what to change. Treat it as a lead to confirm, not a verdict.
