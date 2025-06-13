console.log('🟢 llm-chat.js wird ausgeführt');

document.addEventListener('DOMContentLoaded', function () {
    const chatBox = document.getElementById('llm-chat-box');
    const form = document.getElementById('llm-form');
    const input = document.getElementById('llm-input');
    const output = document.getElementById('llm-response');
  
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const prompt = input.value.trim();
      if (!prompt) return;
  
      output.innerText = '⏳ LLM denkt ...';
      input.disabled = true;
  
      try {
        const res = await fetch('/api/llm/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt })
        });
  
        const data = await res.json();
        output.innerText = data.response || data.error || 'Keine Antwort erhalten.';
      } catch (err) {
        output.innerText = '⚠️ Fehler beim Abrufen der Antwort.';
        console.error(err);
      } finally {
        input.disabled = false;
        input.value = '';
      }
    });
  });
  
  