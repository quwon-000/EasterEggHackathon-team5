const canvas = document.getElementById('fwCanvas');
const ctx = canvas.getContext('2d');
const charImg = document.getElementById('char-img');
const msgEl = document.getElementById('msg');
const clicksEl = document.getElementById('clicks');
const lifetimeEl = document.getElementById('lifetime');
const charWrapper = document.getElementById('char-wrapper');
const clearOverlay = document.getElementById('clear-overlay');

let particles = [];
let isFireworksActive = false;
let clicks = 0;
let lifetime = 0;
let unlockedIds = ['egg'];

const stages = [
    { id: 'egg', threshold: 0, img: 'character/egg.png', msg: 'タマゴ' },
    { id: 'chicken', threshold: 20, img: 'character/chicken.png', msg: 'ニワトリ' },
    { id: 'dragon', threshold: 60, img: 'character/dragon.png', msg: 'ドラゴン' }
];

const secretStages = {
    'タマゴ': { id: 'jesus', img: 'character/jesus.png', msg: 'イエスキリスト' },
    'ニワトリ': { id: 'plane', img: 'character/plane.png', msg: 'ジェット機' }
};

// --- 初期化 ---
window.onload = () => {
    updateMenuButtons();
    // タイトル画面用に累計だけ表示
    const savedLifetime = parseInt(localStorage.getItem('egg_lifetime')) || 0;
    lifetimeEl.innerText = savedLifetime;
};

function updateMenuButtons() {
    const savedLifetime = localStorage.getItem('egg_lifetime');
    const hasData = (savedLifetime && savedLifetime > 0);
    // データがなければContinueボタンを押せなくする
    document.getElementById('continue-btn').disabled = !hasData;
}

function saveData() {
    localStorage.setItem('egg_clicks', clicks);
    localStorage.setItem('egg_lifetime', lifetime);
    localStorage.setItem('egg_unlocked', JSON.stringify(unlockedIds));
    updateMenuButtons();
}

// --- ゲーム進行 ---
function startNewGame() {
    clicks = 0;
    lifetime = 0;
    unlockedIds = ['egg'];
    saveData();
    enterGame();
}

function continueGame() {
    clicks = parseInt(localStorage.getItem('egg_clicks')) || 0;
    lifetime = parseInt(localStorage.getItem('egg_lifetime')) || 0;
    unlockedIds = JSON.parse(localStorage.getItem('egg_unlocked')) || ['egg'];
    enterGame();
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

    if (!unlockedIds.includes(current.id)) {
        unlockedIds.push(current.id);
        saveData();
    }

    if (clicks >= 60) {
        charWrapper.classList.add('finished');
        startFireworks();
    }
}

// キャラクタークリック反応
charWrapper.onclick = () => {
    if (isFireworksActive) return;

    // ぷるんとした反応の演出
    charWrapper.classList.remove('click-bounce');
    void charWrapper.offsetWidth; // リフロー強制（連打でも反応させるため）
    charWrapper.classList.add('click-bounce');
    setTimeout(() => charWrapper.classList.remove('click-bounce'), 80);

    clicks++;
    lifetime++;
    saveData();
    updateVisuals();
};

// 特殊進化
window.onkeydown = (e) => {
    if (e.ctrlKey && e.key === 'Enter' && document.getElementById('game-area').style.display === 'block') {
        const secret = secretStages[msgEl.innerText];
        if (secret) {
            charImg.src = secret.img;
            msgEl.innerText = secret.msg;
            if (!unlockedIds.includes(secret.id)) {
                unlockedIds.push(secret.id);
                saveData();
            }
            charWrapper.classList.add('finished');
            startFireworks();
        }
    }
};

// --- ボタン処理 ---
document.getElementById('new-game-btn').onclick = () => {
    const savedLifetime = localStorage.getItem('egg_lifetime');
    if (savedLifetime && savedLifetime > 0) {
        // データがある時だけ警告を表示
        document.getElementById('confirm-modal').style.display = 'flex';
    } else {
        // データがない時は即開始
        startNewGame();
    }
};

document.getElementById('confirm-yes').onclick = () => {
    document.getElementById('confirm-modal').style.display = 'none';
    startNewGame();
};

document.getElementById('confirm-no').onclick = () => {
    document.getElementById('confirm-modal').style.display = 'none';
};

document.getElementById('continue-btn').onclick = continueGame;

document.getElementById('restart-btn').onclick = () => {
    clicks = 0;
    saveData();
    clearOverlay.style.display = 'none';
    charWrapper.classList.remove('finished');
    updateVisuals();
};

document.getElementById('back-to-title-btn').onclick = () => location.reload();

document.getElementById('encyclopedia-btn').onclick = () => {
    const grid = document.getElementById('collection-grid');
    grid.innerHTML = '';
    const secrets = Object.values(secretStages).filter(s => unlockedIds.includes(s.id));
    const allItems = [...stages, ...secrets];

    allItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'collection-item';
        if (unlockedIds.includes(item.id)) {
            div.classList.add('unlocked');
            div.innerHTML = `<img src="${item.img}"><p class="collection-name">${item.msg}</p>`;
        } else {
            div.innerHTML = `<div style="font-size:3rem;color:#333;">?</div><p class="collection-name">???</p>`;
        }
        grid.appendChild(div);
    });
    document.getElementById('encyclopedia-screen').style.display = 'flex';
};

document.getElementById('close-encyclopedia').onclick = () => {
    document.getElementById('encyclopedia-screen').style.display = 'none';
};

// --- 花火エフェクト ---
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
    isFireworksActive = true;
    animate();
    const interval = setInterval(() => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * (canvas.height * 0.6);
        const color = `hsl(${Math.random() * 360}, 100%, 60%)`;
        for (let i = 0; i < 50; i++) particles.push(new Particle(x, y, color));
    }, 250);
    setTimeout(() => {
        clearInterval(interval);
        isFireworksActive = false;
        setTimeout(() => { clearOverlay.style.display = 'flex'; }, 500);
    }, 3000);
}