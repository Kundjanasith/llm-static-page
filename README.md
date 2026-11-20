# Nova: GitHub Pages + in-browser AI

A ready-to-deploy, responsive static website with an embedded AI assistant.

## Deploy to GitHub Pages

1. Create a public GitHub repository, e.g. `nova-ai-site`.
2. Upload **all files from this folder** to the repository root (do not upload only the zip).
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select **main**, **/(root)**, then **Save**.
6. Your site will appear at `https://YOUR-USERNAME.github.io/nova-ai-site/`.

No build or hosting backend is needed. Test locally with `python3 -m http.server 8000` and visit `http://localhost:8000`.

## How AI works

- Click **Load AI model** to load an LLM using WebLLM.
- Requires a WebGPU-compatible browser and GPU; not all devices are compatible.
- The first load downloads large model files from third-party hosts. Subsequent loads may use browser caching.
- Inference and chat history are in the visitor's browser (chat is not sent to a website-operated backend). Chats are not persisted between refreshes.
- Browser resource requirements, performance and availability vary; the website itself remains visible without WebGPU.
- This example uses a small 1B model; responses can be limited or incorrect.

## Customize

- Edit page branding and content: `index.html`
- Update colors and layout: `styles.css`
- Edit model selection and instructions: `MODEL_ID` and `SYSTEM_PROMPT` in `app.js`
- Change `@mlc-ai/web-llm@0.2.89` in `app.js` only after validating compatibility.

## Important limitations

GitHub Pages only serves static assets. Never put a secret API key (such as an OpenAI key) into browser JavaScript. For a cloud AI provider instead, use a separate backend/proxy (Cloudflare Worker, serverless function, etc.) to secure the key and implement abuse protection. Such a backend is **not included** here.

WebLLM: https://github.com/mlc-ai/web-llm
GitHub Pages: https://docs.github.com/en/pages/quickstart
# llm-static-page
