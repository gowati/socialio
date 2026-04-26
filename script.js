const SUPABASE_URL = 'https://yourid.supabase.co'; 
const SUPABASE_KEY = 'your-long-anon-key-here';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const container = document.getElementById('game-container');
const chatInput = document.getElementById('chat-input');
const messages = document.getElementById('messages');
const myId = Math.random().toString(36).substring(7); // Temporary ID for testing
let myPos = { x: 100, y: 100 };
const players = {};

// 2. JOIN REALTIME CHANNEL
const channel = supabase.channel('socialia-room', {
    config: { presence: { key: myId } }
});

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    updatePlayers(state);
  })
  .on('broadcast', { event: 'chat' }, (payload) => {
    addChatMessage(payload.payload.msg);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ x: myPos.x, y: myPos.y });
    }
  });

// 3. MOVEMENT LOGIC
window.addEventListener('keydown', (e) => {
    const speed = 15;
    if (e.key === 'ArrowUp') myPos.y -= speed;
    if (e.key === 'ArrowDown') myPos.y += speed;
    if (e.key === 'ArrowLeft') myPos.x -= speed;
    if (e.key === 'ArrowRight') myPos.x += speed;
    
    updateMyAvatar();
    channel.track({ x: myPos.x, y: myPos.y }); // Tell everyone where we are
});

// 4. CHAT LOGIC
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && chatInput.value !== '') {
        channel.send({
            type: 'broadcast',
            event: 'chat',
            payload: { msg: `${myId}: ${chatInput.value}` }
        });
        addChatMessage(`Me: ${chatInput.value}`);
        chatInput.value = '';
    }
});

// HELPERS
function updatePlayers(state) {
    // Remove players who left
    Object.keys(players).forEach(id => {
        if (!state[id]) {
            players[id].remove();
            delete players[id];
        }
    });

    // Update or create players
    for (const id in state) {
        const data = state[id][0];
        if (!players[id]) {
            const div = document.createElement('div');
            div.className = 'player';
            if (id === myId) div.style.border = "3px solid white";
            container.appendChild(div);
            players[id] = div;
        }
        players[id].style.left = data.x + 'px';
        players[id].style.top = data.y + 'px';
    }
}

function updateMyAvatar() {
    if (players[myId]) {
        players[myId].style.left = myPos.x + 'px';
        players[myId].style.top = myPos.y + 'px';
    }
}

function addChatMessage(msg) {
    const div = document.createElement('div');
    div.innerText = msg;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}
