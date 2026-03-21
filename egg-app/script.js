const canvas = document.getElementById('fwCanvas');
const ctx = canvas.getContext('2d');
const charImg = document.getElementById('char-img');
const msgEl = document.getElementById('msg');
const clicksEl = document.getElementById('clicks');
const lifetimeEl = document.getElementById('lifetime');
const charWrapper = document.getElementById('char-wrapper');
const clearOverlay = document.getElementById('clear-overlay');
const hintEl = document.getElementById('hint');

const bgm = document.getElementById('bgm');
const volumeBar = document.getElementById('volume-bar');
const settingsModal = document.getElementById('settings-modal');

let particles = [];
let isFireworksActive = false;
let clicks = 0;
let lifetime = 0;
let unlockedIds = ['egg'];
let inputSeq = "";

const stages = [
    { id: 'egg', threshold: 0, img: 'character/egg.png', msg: 'タマゴ', condition: '最初から', bgClass: 'bg-egg' },
    { id: 'chicken', threshold: 20, img: 'character/chicken.png', msg: 'ニワトリ', condition: '20回クリック', bgClass: 'bg-chicken' },
    { id: 'dragon', threshold: 60, img: 'character/dragon.png', msg: 'ドラゴン', condition: '60回クリック', bgClass: 'bg-dragon' }
];

const secretStages = {
    'egg': { id: 'jesus', img: 'character/jesus.png', msg: 'イエスキリスト', condition: '??? (聖なる力)' },
    'chicken': { id: 'plane', img: 'character/plane.png', msg: 'ジェット機', condition: 'コマンド入力: shooting' },
    'special': { id: 'block_chicken', img: 'character/block_chiken.png', msg: 'ブロックチキン', condition: 'コマンド入力: block' },
    'puzzle': { id: 'puzzle_chicken', img: 'character/chiken-puzzle.png', msg: 'パズルマスター', condition: 'パズルをクリア' }
};

window.onload = () => {
    loadData();
    bgm.volume = 0;
    const params = new URLSearchParams(window.location.search);


    const clearedType = params.get('cleared');
    if (clearedType) {
        if (clearedType === 'shooting') {
            showSpecialEvolution('chicken');
        } else if (clearedType === 'puzzle') {
            showSpecialEvolution('puzzle');
        } else {
            showSpecialEvolution('special');
        }
        window.history.replaceState({}, document.title, "index.html");
    } else {
        updateMenuButtons();
    }
};

function loadData() {
    clicks = parseInt(localStorage.getItem('egg_clicks')) || 0;
    lifetime = parseInt(localStorage.getItem('egg_lifetime')) || 0;
    unlockedIds = JSON.parse(localStorage.getItem('egg_unlocked')) || ['egg'];
    lifetimeEl.innerText = lifetime;
}

function saveData() {
    localStorage.setItem('egg_clicks', clicks);
    localStorage.setItem('egg_lifetime', lifetime);
    localStorage.setItem('egg_unlocked', JSON.stringify(unlockedIds));
    updateMenuButtons();
}

function updateMenuButtons() {
    document.getElementById('continue-btn').disabled = (lifetime === 0);
}

function enterGame() {
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'flex';
    document.getElementById('ui-layer').style.display = 'block';
    if (bgm.paused) bgm.play().catch(e => console.log("Audio play blocked."));
    updateVisuals();
}

function updateVisuals() {
    let current = stages[0];
    stages.forEach(s => { if (clicks >= s.threshold) current = s; });
    charImg.src = current.img;
    msgEl.innerText = current.msg;
    document.body.className = current.bgClass;
    clicksEl.innerText = clicks;
    lifetimeEl.innerText = lifetime;

    if (hintEl) {
        const hintText = "eorfn      this is not easter egg lol";
        const showLength = Math.floor(lifetime / 60);
        hintEl.innerText = hintText.substring(0, showLength);
    }

    if (!unlockedIds.includes(current.id)) {
        unlockedIds.push(current.id);
        saveData();
    }
    if (clicks >= 60 && !isFireworksActive) startFireworks();
}

charWrapper.onclick = () => {
    if (isFireworksActive) return;
    charWrapper.classList.add('click-bounce');
    setTimeout(() => charWrapper.classList.remove('click-bounce'), 100);
    clicks++; lifetime++;
    saveData(); updateVisuals();
};

window.onkeydown = (e) => {
    const key = e.key.toLowerCase();
    inputSeq += key;
    const currentMsg = msgEl.innerText;
    if ("block".startsWith(inputSeq)) {
        if (inputSeq === "block") window.location.href = "block.html";
    } else if ("shooting".startsWith(inputSeq)) {
        if (inputSeq === "shooting" && currentMsg === "ニワトリ") window.location.href = "shooting.html";
    } else {
        inputSeq = (key === "b" || key === "s") ? key : "";
    }
};

function showSpecialEvolution(type) {
    enterGame();
    const secret = secretStages[type];
    charImg.src = secret.img;
    msgEl.innerText = secret.msg;
    if (!unlockedIds.includes(secret.id)) unlockedIds.push(secret.id);
    saveData();
    if (!isFireworksActive) startFireworks();
}

document.getElementById('settings-btn').onclick = () => settingsModal.style.display = 'flex';
document.getElementById('close-settings').onclick = () => settingsModal.style.display = 'none';
volumeBar.oninput = (e) => { bgm.volume = e.target.value; };

document.getElementById('encyclopedia-btn').onclick = () => {
    const container = document.getElementById('tree-container');
    container.innerHTML = '';
    container.appendChild(createRow('egg', 'puzzle_chicken', 'jesus'));
    if (unlockedIds.includes('chicken')) {
        container.appendChild(createVArrow());
        container.appendChild(createRow('chicken', 'block_chicken', 'plane'));
    }
    if (unlockedIds.includes('dragon')) {
        container.appendChild(createVArrow());
        container.appendChild(createRow('dragon', null, null));
    }
    document.getElementById('encyclopedia-screen').style.display = 'flex';
};

function createRow(mainId, leftId, rightId) {
    const row = document.createElement('div');
    row.className = 'tree-row-grid';
    const left = document.createElement('div');
    left.className = 'node-left-container';
    if (leftId && unlockedIds.includes(leftId)) {
        left.appendChild(createNode(leftId));
        left.innerHTML += '<div class="arrow-h">◀</div><div class="line-h"></div>';
    }
    row.appendChild(left);
    const mid = document.createElement('div');
    mid.className = 'node-main';
    mid.appendChild(createNode(mainId));
    row.appendChild(mid);
    const right = document.createElement('div');
    right.className = 'node-secret-container';
    if (rightId && unlockedIds.includes(rightId)) {
        right.innerHTML += '<div class="line-h"></div><div class="arrow-h">▶</div>';
        right.appendChild(createNode(rightId));
    }
    row.appendChild(right);
    return row;
}

function createNode(id) {
    const node = document.createElement('div');
    node.className = 'char-node';
    const data = stages.find(s => s.id === id) || Object.values(secretStages).find(s => s.id === id);
    node.innerHTML = `<img src="${data.img}"><span>${data.msg}</span><div class="tooltip">条件: ${data.condition}</div>`;
    return node;
}

function createVArrow() {
    const div = document.createElement('div');
    div.className = 'tree-arrow-row'; div.innerText = '▼';
    return div;
}

document.getElementById('new-game-btn').onclick = () => {
    if (lifetime > 0) document.getElementById('confirm-modal').style.display = 'flex';
    else startNewGame();
};
document.getElementById('confirm-yes').onclick = () => { startNewGame(); document.getElementById('confirm-modal').style.display = 'none'; };
document.getElementById('confirm-no').onclick = () => document.getElementById('confirm-modal').style.display = 'none';
document.getElementById('continue-btn').onclick = enterGame;
document.getElementById('back-to-title-btn').onclick = () => location.reload();
document.getElementById('close-encyclopedia').onclick = () => document.getElementById('encyclopedia-screen').style.display = 'none';

document.getElementById('mini-egg-deco').onclick = () => {
    window.location.href = 'jigsaw-puzzle/jigsaw-puzzle.html';
};

document.getElementById('restart-btn').onclick = () => {
    clicks = 0; saveData();
    document.getElementById('clear-overlay').style.display = 'none';
    isFireworksActive = false; particles = [];
    enterGame();
};

function startNewGame() { clicks = 0; lifetime = 0; unlockedIds = ['egg']; saveData(); enterGame(); }

function startFireworks() {
    isFireworksActive = true; resize();
    const interval = setInterval(() => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * (canvas.height * 0.5);
        const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        for (let i = 0; i < 30; i++) particles.push(new Particle(x, y, color));
    }, 300);
    setTimeout(() => { clearInterval(interval); document.getElementById('clear-overlay').style.display = 'flex'; }, 3000);
    animate();
}

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.v = { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 };
        this.a = 1;
    }
    draw() {
        ctx.globalAlpha = this.a; ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    update() { this.x += this.v.x; this.y += this.v.y; this.v.y += 0.1; this.a -= 0.02; }
}

function animate() {
    if (particles.length === 0 && !isFireworksActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => { p.update(); p.draw(); if (p.a <= 0) particles.splice(i, 1); });
    requestAnimationFrame(animate);
}

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.onresize = resize; resize();