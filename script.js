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

// 画像パスに「character/」を追加
const stages = [
    { threshold: 0, img: 'character/egg.png', msg: 'タマゴ' },
    { threshold: 20, img: 'character/chicken.png', msg: 'ニワトリ' },
    { threshold: 60, img: 'character/dragon.png', msg: 'ドラゴン' }
];

const secretStages = {
    'タマゴ': { img: 'character/jesus.png', msg: 'イエスキリスト' },
    'ニワトリ': { img: 'character/plane.png', msg: 'ジェット機' }
};

// --- 初期設定 ---
window.onload = () => {
    checkContinue();
    loadLifetimeOnly();
};

function loadLifetimeOnly() {
    lifetime = parseInt(localStorage.getItem('egg_lifetime')) || 0;
    lifetimeEl.innerText = lifetime;
}

function checkContinue() {
    const savedClicks = localStorage.getItem('egg_clicks');
    document.getElementById('continue-btn').disabled = (!savedClicks || savedClicks == "0");
}

function saveData() {
    localStorage.setItem('egg_clicks', clicks);
    localStorage.setItem('egg_lifetime', lifetime);
}

// --- 花火ロジック ---
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = { x: (Math.random() - 0.5) * 12, y: (Math.random() - 0.5) * 12 };
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.02;
    }
    update() {
        this.velocity.y += 0.1;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= this.decay;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

function animate() {
    if (!isFireworksActive && particles.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(18, 18, 18, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
        if (p.alpha > 0) {
            p.update();
            p.draw();
        } else {
            particles.splice(i, 1);
        }
    });
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
        setTimeout(() => {
            clearOverlay.style.display = 'flex';
        }, 500);
    }, 3000);
}

// --- ゲームイベント ---
function startGame(isNew) {
    if (isNew) {
        clicks = 0;
        saveData();
    } else {
        clicks = parseInt(localStorage.getItem('egg_clicks')) || 0;
        lifetime = parseInt(localStorage.getItem('egg_lifetime')) || 0;
    }
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    updateVisuals();
}

function updateVisuals() {
    let current = stages[0];
    stages.forEach(s => { if (clicks >= s.threshold) current = s; });
    charImg.src = current.img;
    msgEl.innerText = current.msg;
    clicksEl.innerText = clicks;
    lifetimeEl.innerText = lifetime;

    if (clicks >= 60) {
        charWrapper.classList.add('finished');
        startFireworks();
    }
}

charWrapper.onclick = () => {
    clicks++;
    lifetime++;
    saveData();
    updateVisuals();
};

window.onkeydown = (e) => {
    if (e.ctrlKey && e.key === 'Enter' && document.getElementById('game-area').style.display === 'block') {
        const secret = secretStages[msgEl.innerText];
        if (secret) {
            charImg.src = secret.img;
            msgEl.innerText = secret.msg;
            charWrapper.classList.add('finished');
            startFireworks();
        }
    }
};

function restartGame() {
    clicks = 0;
    saveData();
    clearOverlay.style.display = 'none';
    charWrapper.classList.remove('finished');
    updateVisuals();
}

// --- ボタンクリックイベント登録 ---
document.getElementById('new-game-btn').onclick = () => {
    if (confirm("最初から始めますか？※通算クリックは維持されます")) {
        startGame(true);
    }
};

document.getElementById('continue-btn').onclick = () => {
    startGame(false);
};

document.getElementById('restart-btn').onclick = restartGame;