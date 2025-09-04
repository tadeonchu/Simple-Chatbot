const chatEl = document.getElementById('chat');
const messageEl = document.getElementById('message');
const chatForm = document.getElementById('chatForm');
const sendBtn = document.getElementById('sendBtn');
const statusPill = document.getElementById('statusPill');
const aiModeEl = document.getElementById('aiMode');

const newChatBtn = document.getElementById('newChatBtn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');

let history = []; // {role: 'user'|'assistant', content: string}

function setStatus(text){ statusPill.textContent = text; }

function nowString(){
  const d = new Date();
  return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}

function el(tag, className, text){
  const n = document.createElement(tag);
  if(className) n.className = className;
  if(text) n.textContent = text;
  return n;
}

function renderMessage(role, content){
  const row = el('div','row');
  const avatar = el('div','avatar' + (role==='user'?' user':''), role==='user'?'U':'A');
  const wrap = el('div');
  const bubble = el('div','bubble' + (role==='user'?' user':'')); 
  bubble.innerText = content;
  const time = el('div','timestamp', nowString());
  wrap.appendChild(bubble); wrap.appendChild(time);
  row.appendChild(avatar); row.appendChild(wrap);
  chatEl.appendChild(row);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function resetComposer(){
  messageEl.value = '';
  messageEl.style.height = '56px';
  messageEl.focus();
}

// Auto-grow textarea
messageEl.addEventListener('input', ()=>{
  messageEl.style.height = '56px';
  messageEl.style.height = Math.min(messageEl.scrollHeight, 160) + 'px';
});

// Press Enter to send, Shift+Enter for new line
messageEl.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault(); // stop newline
    sendBtn.click();    // trigger send
  }
});

// Submit
chatForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const text = messageEl.value.trim();
  if(!text) return;

  // UI: show user message
  renderMessage('user', text);
  history.push({role:'user', content: text});
  resetComposer();

  // UI: lock send
  sendBtn.disabled = true; setStatus('Thinking…');
  try{
    const res = await fetch('/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history })
    });
    const data = await res.json();
    if(!data.ok) throw new Error(data.error || 'Request failed');
    const reply = data.reply || '(no content)';
    renderMessage('assistant', reply);
    history.push({role:'assistant', content: reply});
    setStatus('Ready');
  }catch(err){
    console.error(err);
    renderMessage('assistant', 'Sorry—there was an error. Please try again.');
    setStatus('Error');
  }finally{
    sendBtn.disabled = false;
  }
});

// New chat: softly clear in-page history
newChatBtn.addEventListener('click', ()=>{
  history = [];
  chatEl.innerHTML = '';
  renderMessage('assistant', 'New chat started. How can I help?');
});

// Clear all: hard reset (UI only)
clearBtn.addEventListener('click', ()=>{
  if(confirm('Clear the conversation on this page?')){
    history = [];
    chatEl.innerHTML = '';
    renderMessage('assistant', 'Cleared. Ask me anything!');
  }
});

// Export chat as JSON
exportBtn.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify({ history }, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'chat_export.json'; a.click();
  URL.revokeObjectURL(url);
});

// Seed a welcome message
renderMessage('assistant', 'Hello! I\'m ready. Ask me anything.');
