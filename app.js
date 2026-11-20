// Static, API-key-free AI chat powered by WebLLM in a WebGPU-compatible browser.
// You can change the default assistant instructions and model ID here.
const MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
const SYSTEM_PROMPT = 'You are Nova, a helpful, clear and friendly assistant embedded in a website. Respond concisely and accurately. If unsure, say so.';
const $ = (id) => document.getElementById(id);
const messagesNode = $('messages');
const loadBtn = $('loadModel');
const promptNode = $('prompt');
const sendBtn = $('send');
const history = [{ role: 'system', content: SYSTEM_PROMPT }];
let engine = null;
let busy = false;

function setStatus(status, label) {
  $('statusLabel').textContent = label;
  $('statusDot').className = 'status-dot ' + status;
}
function bubble(role, content = '') {
  const message = document.createElement('div');
  message.className = 'message ' + role;
  if (role === 'assistant') {
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '✳';
    message.appendChild(avatar);
  }
  const el = document.createElement('div');
  el.className = 'bubble';
  el.textContent = content;
  message.appendChild(el);
  messagesNode.appendChild(message);
  messagesNode.scrollTop = messagesNode.scrollHeight;
  return el;
}
function showLoadError(message) {
  setStatus('', 'Unavailable');
  $('progressText').textContent = message;
  loadBtn.disabled = false;
  loadBtn.textContent = 'Retry loading ↗';
}
async function loadModel() {
  if (engine || busy) return;
  if (!navigator.gpu) {
    showLoadError('This browser does not expose WebGPU. Try a current WebGPU-enabled Chrome or Edge on a compatible device.');
    return;
  }
  busy = true;
  loadBtn.disabled = true;
  loadBtn.textContent = 'Loading…';
  $('progressTrack').hidden = false;
  setStatus('loading', 'Loading model');
  try {
    const { CreateMLCEngine } = await import('https://esm.run/@mlc-ai/web-llm@0.2.89');
    engine = await CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (progress) => {
        const fraction = Number(progress.progress);
        if (Number.isFinite(fraction)) $('progressBar').style.width = Math.round(Math.min(1, Math.max(0, fraction)) * 100) + '%';
        if (progress.text) $('progressText').textContent = progress.text;
      },
    });
    setStatus('ready', 'AI ready · running locally');
    $('progressTrack').hidden = true;
    $('progressText').textContent = 'Model ready. Messages are processed in this browser, without a chat backend.';
    loadBtn.textContent = 'AI ready ✓';
    promptNode.disabled = false;
    sendBtn.disabled = false;
    promptNode.focus();
  } catch (error) {
    engine = null;
    console.error(error);
    showLoadError('Unable to load the model: ' + (error?.message || String(error)));
  } finally {
    busy = false;
  }
}
async function sendMessage(text) {
  if (!engine || busy || !text.trim()) return;
  const input = text.trim();
  promptNode.value = '';
  busy = true;
  sendBtn.disabled = true;
  $('suggestions').hidden = true;
  bubble('user', input);
  const answer = bubble('assistant', 'Thinking…');
  const requestMessages = [...history, { role: 'user', content: input }];
  try {
    const completion = await engine.chat.completions.create({ messages: requestMessages, temperature: 0.7, max_tokens: 512, stream: true });
    let response = '';
    for await (const chunk of completion) {
      response += chunk.choices?.[0]?.delta?.content || '';
      answer.textContent = response || 'Thinking…';
      messagesNode.scrollTop = messagesNode.scrollHeight;
    }
    answer.textContent = response || '(No response returned.)';
    if (response) history.push({ role: 'user', content: input }, { role: 'assistant', content: response });
  } catch (error) {
    answer.textContent = 'Sorry, there was a generation error: ' + (error?.message || String(error));
    console.error(error);
  } finally {
    busy = false;
    sendBtn.disabled = false;
    promptNode.focus();
  }
}
loadBtn.addEventListener('click', loadModel);
$('chatForm').addEventListener('submit', (event) => { event.preventDefault(); sendMessage(promptNode.value); });
promptNode.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(promptNode.value); } });
$('clearChat').addEventListener('click', () => {
  history.length = 1;
  messagesNode.textContent = '';
  bubble('assistant', 'Conversation cleared. What would you like to discuss?');
  $('suggestions').hidden = false;
});
document.querySelectorAll('[data-prompt]').forEach((button) => button.addEventListener('click', () => {
  const text = button.dataset.prompt;
  if (engine) sendMessage(text);
  else { promptNode.value = text; loadModel(); }
}));
if (!navigator.gpu) {
  $('progressText').textContent = 'WebGPU not detected. AI requires a compatible browser and GPU. The rest of this website works normally.';
}
