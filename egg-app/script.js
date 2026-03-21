const canvas = document.getElementById('fwCanvas');
const ctx = canvas.getContext('2d');
const charImg = document.getElementById('char-img');
const msgEl = document.getElementById('msg');
const clicksEl = document.getElementById('clicks');
const lifetimeEl = document.getElementById('lifetime');
const charWrapper = document.getElementById('char-wrapper');
const clearOverlay = document.getElementById('clear-overlay');
const hintEl = document.getElementById('hint');

let particles = [];
let isFireworksActive = false;
let clicks = 0;
let lifetime = 0;
let unlockedIds = ['egg'];
let inputSeq = "";

const stages = [
    { id: 'egg', threshold: 0, img: 'character/egg.png', msg: 'タマゴ' },
    { id: 'chicken', threshold: 20, img: 'character/chicken.png', msg: 'ニワトリ' },
    { id: 'dragon', threshold: 60, img: 'character/dragon.png', msg: 'ドラゴン' }
];

const secretStages = {
    'egg': { id: 'jesus', img: 'character/jesus.png', msg: 'イエスキリスト' },
    'chicken': { id: 'plane', img: 'character/plane.png', msg: 'ジェット機' },
    'special': { id: 'block_chicken', img: 'character/block_chiken.png', msg: 'ブロックチキン' }
};

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cleared') === 'true') {
        loadData();
        showSpecialEvolution('special');
        window.history.replaceState({}, document.title, "index.html");
    } else {
        updateMenuButtons();
    }
    const savedLifetime = parseInt(localStorage.getItem('egg_lifetime')) || 0;
    lifetimeEl.innerText = savedLifetime;
};

function loadData() {
    clicks = parseInt(localStorage.getItem('egg_clicks')) || 0;
    lifetime = parseInt(localStorage.getItem('egg_lifetime')) || 0;
    unlockedIds = JSON.parse(localStorage.getItem('egg_unlocked')) || ['egg'];
}

function showSpecialEvolution(type) {
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    // 特殊進化時もボタンを表示し続ける
    document.getElementById('encyclopedia-btn').style.display = 'block';
    document.getElementById('back-to-title-btn').style.display = 'block';

    const secret = secretStages[type];
    charImg.src = secret.img;
    msgEl.innerText = secret.msg;
    if (!unlockedIds.includes(secret.id)) unlockedIds.push(secret.id);
    saveData();
    charWrapper.classList.add('finished');
    startFireworks();
}

function updateMenuButtons() {
    const savedLifetime = localStorage.getItem('egg_lifetime');
    document.getElementById('continue-btn').disabled = !(savedLifetime && savedLifetime > 0);
}

function saveData() {
    localStorage.setItem('egg_clicks', clicks);
    localStorage.setItem('egg_lifetime', lifetime);
    localStorage.setItem('egg_unlocked', JSON.stringify(unlockedIds));
    updateMenuButtons();
}

function enterGame() {
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    document.getElementById('encyclopedia-btn').style.display = 'block';
    document.getElementById('back-to-title-btn').style.display = 'block';
    updateVisuals();
}

function updateVisuals() {
    let current = stages[0];
    stages.forEach(s => { if (clicks >= s.threshold) current = s; });
    charImg.src = current.img;
    msgEl.innerText = current.msg;
    clicksEl.innerText = clicks;
    lifetimeEl.innerText = lifetime;

    if (hintEl) {
        const hintText = "eorfn";
        const showLength = Math.floor(lifetime / 60);
        hintEl.innerText = hintText.substring(0, showLength);
    }

    if (!unlockedIds.includes(current.id)) {
        unlockedIds.push(current.id);
        saveData();
    }

    if (clicks >= 60) {
        charWrapper.classList.add('finished');
        startFireworks();
    }
}

charWrapper.onclick = () => {
    if (isFireworksActive) return;
    charWrapper.classList.remove('click-bounce');
    void charWrapper.offsetWidth;
    charWrapper.classList.add('click-bounce');
    setTimeout(() => charWrapper.classList.remove('click-bounce'), 80);

    clicks++;
    lifetime++;
    saveData();
    updateVisuals();
};

window.onkeydown = (e) => {
    const key = e.key.toLowerCase();
    inputSeq += key;
    if ("block".startsWith(inputSeq)) {
        if (inputSeq === "block") window.location.href = "block.html";
    } else {
        inputSeq = (key === "b") ? "b" : "";
    }

    if (e.ctrlKey && e.key === 'Enter' && document.getElementById('game-area').style.display === 'block') {
        let currentMainId = "";
        const currentMsg = msgEl.innerText;
        stages.forEach(s => { if (s.msg === currentMsg) currentMainId = s.id; });
        if (secretStages[currentMainId]) showSpecialEvolution(currentMainId);
    }
};

// --- 図鑑生成ロジック (ブロックチキンをニワトリの左に配置) ---
document.getElementById('encyclopedia-btn').onclick = () => {
    const container = document.getElementById('tree-container');
    container.innerHTML = '';

    // タマゴ行 (右にイエス)
    container.appendChild(createTreeRow('egg', 'jesus', 'right'));

    // ニワトリ行 (左にブロックチキン、右にジェット機)
    if (unlockedIds.includes('chicken')) {
        container.appendChild(createVArrow('chicken'));
        container.appendChild(createFullTreeRow('chicken', 'block_chicken', 'plane'));
    }

    // ドラゴン行
    if (unlockedIds.includes('dragon')) {
        container.appendChild(createVArrow('dragon'));
        container.appendChild(createTreeRow('dragon', null, 'none'));
    }

    document.getElementById('encyclopedia-screen').style.display = 'flex';
};

// 左右に隠しキャラがいる特別な行を作成
function createFullTreeRow(mainId, leftSecretId, rightSecretId) {
    const row = document.createElement('div');
    row.className = 'tree-row-grid';

    // 左側 (ブロックチキン)
    const leftCont = document.createElement('div');
    leftCont.className = 'node-left-container'; // CSSで調整
    if (unlockedIds.includes(leftSecretId)) {
        leftCont.appendChild(createNode(leftSecretId));
        leftCont.innerHTML += `<div class="arrow-h">◀</div><div class="line-h"></div>`;
        leftCont.style.display = 'flex';
        leftCont.style.alignItems = 'center';
        leftCont.style.gridColumn = '1';
        leftCont.style.justifyContent = 'flex-end';
    }
    row.appendChild(leftCont);

    // 中央 (メイン)
    const mainDiv = document.createElement('div');
    mainDiv.className = 'node-main';
    mainDiv.appendChild(createNode(mainId));
    row.appendChild(mainDiv);

    // 右側 (ジェット機)
    const rightCont = document.createElement('div');
    rightCont.className = 'node-secret-container';
    if (unlockedIds.includes(rightSecretId)) {
        rightCont.innerHTML = `<div class="line-h"></div><div class="arrow-h">▶</div>`;
        rightCont.appendChild(createNode(rightSecretId));
    }
    row.appendChild(rightCont);

    return row;
}

function createTreeRow(mainId, secretId, side) {
    const row = document.createElement('div');
    row.className = 'tree-row-grid';
    const mainDiv = document.createElement('div');
    mainDiv.className = 'node-main';
    mainDiv.appendChild(createNode(mainId));
    row.appendChild(mainDiv);

    if (side === 'right' && secretId && unlockedIds.includes(secretId)) {
        const secretCont = document.createElement('div');
        secretCont.className = 'node-secret-container';
        secretCont.innerHTML = `<div class="line-h"></div><div class="arrow-h">▶</div>`;
        secretCont.appendChild(createNode(secretId));
        row.appendChild(secretCont);
    }
    return row;
}

function createVArrow(targetId) {
    const row = document.createElement('div');
    row.className = 'tree-arrow-row';
    const cont = document.createElement('div');
    cont.className = `arrow-v-container ${unlockedIds.includes(targetId) ? 'active' : ''}`;
    cont.innerText = '▼';
    row.appendChild(cont);
    return row;
}

function createNode(id) {
    const node = document.createElement('div');
    node.className = 'char-node unlocked';
    const data = stages.find(s => s.id === id) || Object.values(secretStages).find(s => s.id === id);
    node.innerHTML = `<img src="${data.img}"><span>${data.msg}</span>`;
    return node;
}

// --- 以下共通処理 ---
document.getElementById('new-game-btn').onclick = () => {
    const savedLifetime = localStorage.getItem('egg_lifetime');
    if (savedLifetime && savedLifetime > 0) document.getElementById('confirm-modal').style.display = 'flex';
    else startNewGame();
};
document.getElementById('confirm-yes').onclick = () => { document.getElementById('confirm-modal').style.display = 'none'; startNewGame(); };
document.getElementById('confirm-no').onclick = () => document.getElementById('confirm-modal').style.display = 'none';
document.getElementById('continue-btn').onclick = () => { loadData(); enterGame(); };
function startNewGame() { clicks = 0; lifetime = 0; unlockedIds = ['egg']; saveData(); enterGame(); }
document.getElementById('restart-btn').onclick = () => { clicks = 0; saveData(); clearOverlay.style.display = 'none'; charWrapper.classList.remove('finished'); updateVisuals(); };
document.getElementById('back-to-title-btn').onclick = () => location.reload();
document.getElementById('close-encyclopedia').onclick = () => document.getElementById('encyclopedia-screen').style.display = 'none';

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.velocity = { x: (Math.random() - 0.5) * 12, y: (Math.random() - 0.5) * 12 };
        this.alpha = 1; this.decay = Math.random() * 0.02 + 0.02;
    }
    update() { this.velocity.y += 0.1; this.x += this.velocity.x; this.y += this.velocity.y; this.alpha -= this.decay; }
    draw() { ctx.save(); ctx.globalAlpha = this.alpha; ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill(); ctx.restore(); }
}
function animate() {
    if (!isFireworksActive && particles.length === 0) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
    requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(18, 18, 18, 0.2)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => { if (p.alpha > 0) { p.update(); p.draw(); } else { particles.splice(i, 1); } });
}
function startFireworks() {
    isFireworksActive = true; animate();
    const interval = setInterval(() => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * (canvas.height * 0.6);
        const color = `hsl(${Math.random() * 360}, 100%, 60%)`;
        for (let i = 0; i < 50; i++) particles.push(new Particle(x, y, color));
    }, 250);
    setTimeout(() => { clearInterval(interval); isFireworksActive = false; setTimeout(() => { clearOverlay.style.display = 'flex'; }, 500); }, 3000);
}