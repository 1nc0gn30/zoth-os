const line = document.getElementById('line');
const talk = document.getElementById('talk');
let busy = false;

function say(text) {
  line.textContent = text || '';
}

window.addEventListener('zoth-stage-ready', async () => {
  try {
    const res = await fetch('/api/watch/avatar');
    if (!res.ok) return;
    const body = await res.json();
    if (body.avatar && window.ZothStage) window.ZothStage.setAvatar(body.avatar);
    if (window.ZothStage && typeof body.maskOn === 'boolean') window.ZothStage.setMask(body.maskOn);
  } catch {
    /* the default zoth-prime figure still stands in the ring */
  }
});

async function ask(text) {
  const heard = String(text || '').trim();
  if (!heard || busy) return;
  busy = true;
  say('');
  if (window.ZothStage) window.ZothStage.setBusy(true);
  try {
    const res = await fetch('/api/watch/say', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: heard }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      say(body.error || 'No answer');
      return;
    }
    const reply = String(body.text || '').trim();
    say(reply);
    if (reply && window.ZothWatch && window.ZothWatch.speak) window.ZothWatch.speak(reply);
  } catch {
    say('Zoth is not on this network');
  } finally {
    busy = false;
    if (window.ZothStage) window.ZothStage.setBusy(false);
  }
}

window.onHeard = (text) => {
  ask(text);
};

talk.addEventListener('click', () => {
  if (busy) return;
  say('Listening');
  if (window.ZothWatch && window.ZothWatch.listen) {
    window.ZothWatch.listen();
    return;
  }
  say('Open this on the watch');
});
