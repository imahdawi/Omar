// ================================================================
//  🎮 FIND YOUR LIGHT - FULL GAME
// ================================================================

// ====== DOM REFS ======
const screens = {
    start: document.getElementById('screen-start'),
    game: document.getElementById('screen-game'),
    end: document.getElementById('screen-end')
};

const introText = document.getElementById('intro-text');
const btnStart = document.getElementById('btn-start');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const starCounter = document.getElementById('star-counter');
const progressFill = document.getElementById('progress-fill');
const messageBox = document.getElementById('message-box');
const floatingText = document.getElementById('floating-text');
const letterText = document.getElementById('letter-text');
const letterBox = document.getElementById('letter-box');
const btnReplay = document.getElementById('btn-replay');
const btnCloseLetter = document.getElementById('btn-close-letter');

// ====== JOYSTICK ======
const joystickBase = document.getElementById('joystick-base');
const joystickThumb = document.getElementById('joystick-thumb');

// ====== COUNTERS ======
const daysHer = document.getElementById('days-her');
const hoursHer = document.getElementById('hours-her');
const minutesHer = document.getElementById('minutes-her');
const secondsHer = document.getElementById('seconds-her');

const daysHis = document.getElementById('days-his');
const hoursHis = document.getElementById('hours-his');
const minutesHis = document.getElementById('minutes-his');
const secondsHis = document.getElementById('seconds-his');

// ====== STATE ======
const state = {
    starsCollected: 0,
    totalStars: 5,
    gamePhase: 'collect',
    dateHer: new Date(2026, 4, 8, 0, 0, 0),
    dateHis: new Date(2020, 4, 18, 0, 0, 0),
    isEnding: false,
    collectedWords: []
};

// ====== STAR DATA ======
const starWords = ['ثقة', 'دعم', 'صبر', 'حب', 'أمل'];
const starEmojis = ['💪', '🤝', '⏳', '❤️', '🌟'];
const starAdvice = [
    'قيمتك دايما كبيرة متثبتهاش لحد',
    'عمرك مهتكون لوحدك احنا جمبك',
    'اعمل اللي عليك ودايما هتلاقي نتيجة',
    'الحب مش بس كلام لا الحب الحقيقي احترام وثقة',
    'الأمل هو الضوء في نهاية النفق'
];

const stars = [];

// ====== PLAYER ======
const player = {
    x: 0, y: 0,
    size: 16,
    speed: 4,
    targetX: 0, targetY: 0,
    moving: false,
    trail: []
};

// ====== JOYSTICK STATE ======
let joystickActive = false;
let joystickX = 0;
let joystickY = 0;
let counterInterval = null;

// ================================================================
//  🕹️ JOYSTICK CONTROLS
// ================================================================

function setupJoystick() {
    const base = joystickBase;
    const thumb = joystickThumb;

    function handleMove(x, y) {
        const rect = base.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = x - cx;
        let dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = rect.width / 2 - thumb.offsetWidth / 2;

        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }

        thumb.style.transform = `translate(${dx}px, ${dy}px)`;
        joystickX = dx / maxDist;
        joystickY = dy / maxDist;
        joystickActive = true;
    }

    function handleEnd() {
        thumb.style.transform = 'translate(-50%, -50%)';
        joystickX = 0;
        joystickY = 0;
        joystickActive = false;
    }

    base.addEventListener('mousedown', (e) => {
        e.preventDefault();
        handleMove(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', (e) => {
        if (joystickActive) handleMove(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', () => {
        if (joystickActive) handleEnd();
    });

    base.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
    });

    document.addEventListener('touchmove', (e) => {
        if (joystickActive) {
            e.preventDefault();
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        }
    }, { passive: false });

    document.addEventListener('touchend', () => {
        if (joystickActive) handleEnd();
    });
}

// ================================================================
//  🎨 CANVAS SETUP
// ================================================================

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', () => {
    resizeCanvas();
    if (stars.length === 0) initStars();
    initPlayer();
});

resizeCanvas();

// ================================================================
//  ⭐ STARS INIT
// ================================================================

function initStars() {
    stars.length = 0;
    const positions = [
        { x: canvas.width * 0.08, y: canvas.height * 0.15 },
        { x: canvas.width * 0.85, y: canvas.height * 0.12 },
        { x: canvas.width * 0.50, y: canvas.height * 0.35 },
        { x: canvas.width * 0.10, y: canvas.height * 0.70 },
        { x: canvas.width * 0.88, y: canvas.height * 0.75 }
    ];

    for (let i = 0; i < state.totalStars; i++) {
        stars.push({
            x: positions[i].x,
            y: positions[i].y,
            collected: false,
            word: starWords[i],
            emoji: starEmojis[i],
            radius: 32,
            pulse: Math.random() * Math.PI * 2,
            scale: 0.9 + Math.random() * 0.3,
            floatOffset: Math.random() * 100,
            advice: starAdvice[i],
            showAdvice: false
        });
    }
}

function initPlayer() {
    player.x = canvas.width / 2;
    player.y = canvas.height - 80;
    player.targetX = player.x;
    player.targetY = player.y;
    player.trail = [];
}

// ================================================================
//  📨 MESSAGES
// ================================================================

let messageTimeout = null;
let floatingTimeout = null;

function showMessage(text, duration = 4000) {
    if (messageTimeout) clearTimeout(messageTimeout);
    messageBox.className = 'message-box hide';
    setTimeout(() => {
        messageBox.textContent = text;
        messageBox.className = 'message-box show';
        messageTimeout = setTimeout(() => {
            messageBox.className = 'message-box hide';
        }, duration);
    }, 200);
}

function showFloatingText(text, x, y, duration = 4000) {
    const el = floatingText;
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.opacity = '1';
    el.style.transform = 'translateY(0) scale(1)';
    if (floatingTimeout) clearTimeout(floatingTimeout);
    floatingTimeout = setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-50px) scale(1.2)';
    }, duration);
}


// ================================================================
//  🎨 DRAWING
// ================================================================

function drawBackground() {
    const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.8
    );
    grad.addColorStop(0, '#0A0A1A');
    grad.addColorStop(0.5, '#080812');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 60; i++) {
        const x = ((i * 137.5 + 42) % canvas.width);
        const y = ((i * 97.3 + 84) % canvas.height);
        const size = 0.5 + (i % 3) * 0.5;
        const alpha = 0.15 + (i % 5) * 0.08;
        const twinkle = 0.5 + 0.5 * Math.sin(Date.now() / 2000 + i);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha * twinkle})`;
        ctx.fill();
    }
}

function drawStars() {
    const time = Date.now() / 1000;
    stars.forEach(star => {
        if (star.collected) return;

        const floatY = Math.sin(time * 0.8 + star.floatOffset) * 6;
        const pulse = Math.sin(time * 1.5 + star.pulse) * 0.15 + 1;
        const radius = star.radius * star.scale * pulse;
        const x = star.x;
        const y = star.y + floatY;

        const glow = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 5);
        glow.addColorStop(0, `rgba(255,215,0,${0.25 * pulse})`);
        glow.addColorStop(0.5, `rgba(255,215,0,${0.08 * pulse})`);
        glow.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, radius * 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 30 * pulse;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        drawStarShape(ctx, x, y, 5, radius, radius * 0.45);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = `${Math.round(radius * 0.55)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(star.emoji, x, y - radius * 0.15);

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = `bold ${Math.round(radius * 0.4)}px Cairo, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(star.word, x, y + radius * 0.9);

        if (star.showAdvice) {
            ctx.fillStyle = 'rgba(255,215,0,0.9)';
            ctx.font = `bold ${Math.round(radius * 0.3)}px Cairo, sans-serif`;
            ctx.textBaseline = 'bottom';
            ctx.fillText(star.advice, x, y - radius * 1.2);
        }
    });
}

function drawStarShape(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = -Math.PI / 2;
    const step = Math.PI / spikes;
    ctx.moveTo(cx + outerRadius * Math.cos(rot), cy + outerRadius * Math.sin(rot));
    for (let i = 1; i <= spikes * 2; i++) {
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = rot + i * step;
        ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }
    ctx.closePath();
}

function drawPlayer() {
    const time = Date.now() / 1000;

    player.trail.forEach((pos, index) => {
        const alpha = index / player.trail.length * 0.3;
        const size = player.size * (0.3 + 0.7 * (index / player.trail.length));
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(108, 99, 255, ${alpha})`;
        ctx.fill();
    });

    const glow = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 40);
    glow.addColorStop(0, 'rgba(108,99,255,0.15)');
    glow.addColorStop(1, 'rgba(108,99,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = '#6C63FF';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#6C63FF';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const eyeOffset = player.size * 0.45;
    const eyeSize = player.size * 0.25;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(player.x - eyeOffset, player.y - eyeSize * 0.3, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + eyeOffset, player.y - eyeSize * 0.3, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0A0A0A';
    const pupilSize = eyeSize * 0.5;
    ctx.beginPath();
    ctx.arc(player.x - eyeOffset + 2, player.y - eyeSize * 0.2, pupilSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + eyeOffset + 2, player.y - eyeSize * 0.2, pupilSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y + player.size * 0.1, player.size * 0.3, 0.1, Math.PI - 0.1);
    ctx.stroke();
}

function drawDoor() {
    if (state.gamePhase !== 'door' || state.isEnding) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const w = 100, h = 160;
    const time = Date.now() / 1000;
    const glowPulse = Math.sin(time * 1.5) * 0.5 + 0.5;

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
    glow.addColorStop(0, `rgba(108,99,255,${0.05 + glowPulse * 0.05})`);
    glow.addColorStop(1, 'rgba(108,99,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 200, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = `rgba(108,99,255,${0.1 + glowPulse * 0.1})`;
    ctx.shadowBlur = 30;
    const grad = ctx.createLinearGradient(cx - w/2, cy - h/2, cx + w/2, cy - h/2);
    grad.addColorStop(0, '#1A1A3E');
    grad.addColorStop(0.5, '#2A2A5E');
    grad.addColorStop(1, '#1A1A3E');
    ctx.fillStyle = grad;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.roundRect(cx - w/2, cy - h/2, w, h, 8);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(108,99,255,${0.15 + glowPulse * 0.1})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - w/2, cy - h/2, w, h, 8);
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10 * glowPulse;
    ctx.beginPath();
    ctx.arc(cx + w/2 - 20, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('🚪', cx, cy - h/2 - 15);

    ctx.fillStyle = `rgba(255,255,255,${0.15 + glowPulse * 0.1})`;
    ctx.font = '16px Cairo, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('مش كل الأبطال بيلبسوا كاب...', cx, cy + h/2 + 20);

    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + time * 0.5;
        const dist = 140 + Math.sin(time * 2 + i) * 15;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist;
        const size = 2 + Math.sin(time * 3 + i * 2) * 1 + 2;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(108,99,255,${0.1 + Math.sin(time + i) * 0.05 + 0.05})`;
        ctx.fill();
    }
}

// ================================================================
//  🔄 UPDATE & RENDER
// ================================================================

function update() {
    if (joystickActive && !state.isEnding) {
        const speed = 3;
        player.targetX = Math.max(player.size, Math.min(canvas.width - player.size, player.x + joystickX * speed));
        player.targetY = Math.max(player.size, Math.min(canvas.height - player.size, player.y + joystickY * speed));
        player.moving = true;
    }

    if (player.moving) {
        const dx = player.targetX - player.x;
        const dy = player.targetY - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 2) {
            const speed = Math.min(player.speed, dist);
            player.x += (dx / dist) * speed;
            player.y += (dy / dist) * speed;
        } else {
            player.x = player.targetX;
            player.y = player.targetY;
            player.moving = false;
            checkStarCollection();
            checkDoorInteraction();
        }
        player.trail.push({ x: player.x, y: player.y });
        if (player.trail.length > 15) player.trail.shift();
    } else {
        if (player.trail.length > 0) player.trail.shift();
    }
    stars.forEach(star => { if (!star.collected) star.pulse += 0.02; });
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawStars();
    drawDoor();
    drawPlayer();
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// ================================================================
//  🖱️ MOUSE CONTROLS
// ================================================================

function movePlayer(x, y) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    player.targetX = Math.max(player.size, Math.min(canvas.width - player.size, (x - rect.left) * scaleX));
    player.targetY = Math.max(player.size, Math.min(canvas.height - player.size, (y - rect.top) * scaleY));
    player.moving = true;
}

canvas.addEventListener('mousemove', (e) => { if (!state.isEnding && !joystickActive) movePlayer(e.clientX, e.clientY); });

// ================================================================
//  ⭐ COLLECT
// ================================================================

function checkStarCollection() {
    stars.forEach(star => {
        if (star.collected) return;
        const dx = player.x - star.x;
        const dy = player.y - star.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.size + star.radius * 0.6) {
            collectStar(star);
        }
    });
}

function collectStar(star) {
    star.collected = true;
    state.starsCollected++;
    state.collectedWords.push(star.word);

    starCounter.textContent = `⭐ ${state.starsCollected} / ${state.totalStars}`;
    progressFill.style.width = `${(state.starsCollected / state.totalStars) * 100}%`;

    star.showAdvice = true;
    
    // ✅ النصيحة تظهر لمدة 5 ثواني بدل 2 ثانية
    showFloatingText(`✨ ${star.emoji} ${star.word}: ${star.advice}`, star.x - 80, star.y - 60, 3000);

    canvas.style.transform = 'scale(0.98)';
    setTimeout(() => canvas.style.transform = 'scale(1)', 150);

    if (state.starsCollected >= state.totalStars) {
        setTimeout(() => {
            state.gamePhase = 'door';
            showMessage('🔓 ظهر باب غامض... اقترب منه!', 3500);
        }, 800);
    }
}


// ================================================================
//  🚪 DOOR
// ================================================================

function checkDoorInteraction() {
    if (state.gamePhase !== 'door' || state.isEnding) return;
    const cx = canvas.width / 2, cy = canvas.height / 2, w = 100, h = 160;
    if (player.x > cx - w/2 && player.x < cx + w/2 && player.y > cy - h/2 && player.y < cy + h/2) {
        state.isEnding = true;
        showMessage('🔓 الباب يفتح...', 1500);
        canvas.style.transform = 'scale(0.95)';
        setTimeout(() => canvas.style.transform = 'scale(1)', 500);
        setTimeout(() => { showEndScreen(); }, 2000);
    }
}

// ================================================================
//  💌 END SCREEN
// ================================================================

function showEndScreen() {
    screens.game.classList.remove('active');
    screens.end.classList.add('active');

    document.getElementById('door-her').style.display = 'block';
    document.getElementById('door-his').style.display = 'block';
    letterBox.style.display = 'none';

    function updateCounters() {
        const now = new Date();
        
        const diffHer = now - state.dateHer;
        if (diffHer > 0) {
            const days = Math.floor(diffHer / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffHer % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diffHer % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diffHer % (1000 * 60)) / 1000);
            if (daysHer) daysHer.textContent = String(days).padStart(2, '0');
            if (hoursHer) hoursHer.textContent = String(hours).padStart(2, '0');
            if (minutesHer) minutesHer.textContent = String(mins).padStart(2, '0');
            if (secondsHer) secondsHer.textContent = String(secs).padStart(2, '0');
        }

        const diffHis = now - state.dateHis;
        if (diffHis > 0) {
            const days = Math.floor(diffHis / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffHis % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diffHis % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diffHis % (1000 * 60)) / 1000);
            if (daysHis) daysHis.textContent = String(days).padStart(2, '0');
            if (hoursHis) hoursHis.textContent = String(hours).padStart(2, '0');
            if (minutesHis) minutesHis.textContent = String(mins).padStart(2, '0');
            if (secondsHis) secondsHis.textContent = String(secs).padStart(2, '0');
        }
    }

    updateCounters();
    if (counterInterval) clearInterval(counterInterval);
    counterInterval = setInterval(updateCounters, 1000);
}

// ================================================================
//  📖 LETTERS
// ================================================================

const letters = {
    her: `"بص يا قلبي انتا صحبي واخويا وحبيبي وبابا ملكش دعوه بالعيال الوحشه دي هما مش عارفين هما بيتكلمو معا مين ولا مصاحبين مين عوزاك توريهم مين عمر بشطرتك يا روح قلبي متخليش كلام أي حد يأثر فيك الناس هتتكلم مهما عملت لكن قيمتك مش بتتحدد بكلامهم ركز في نفسك وفي مستقبلك وسيب أفعالك هي اللي ترد عليهم وأنا واثقة فيك ومتخليش حد يقلل منك أبدًا 🤍 بحبك اوي يا نور عيني"`,
    his: `"يمكن الكلمات دي اتقالت في رسالة...
لكن كان يستاهل تتحول لتجربة.
عشان كل مرة تفتح الموقع ده...
تفتكر إن فيه حد آمن بيك قبل ما الدنيا كلها تصدّقك.
حافظ عليها... وربنا يديمكم لبعض. ❤️"`
};

function showLetter(type) {
    const text = type === 'her' ? letters.her : letters.his;
    const lines = text.split('\n');
    let html = '';
    lines.forEach((line, i) => {
        if (line === '') {
            html += `<div style="margin:12px 0;border-top:1px solid rgba(255,255,255,0.04);"></div>`;
        } else {
            html += `<div class="line" style="animation-delay:${i * 0.3}s">${line}</div>`;
        }
    });
    letterText.innerHTML = html;
    letterBox.style.display = 'block';
    document.getElementById('door-her').style.display = 'none';
    document.getElementById('door-his').style.display = 'none';
}

document.getElementById('door-her').addEventListener('click', () => showLetter('her'));
document.getElementById('door-his').addEventListener('click', () => showLetter('his'));

btnCloseLetter.addEventListener('click', () => {
    letterBox.style.display = 'none';
    document.getElementById('door-her').style.display = 'block';
    document.getElementById('door-his').style.display = 'block';
});

// ================================================================
//  🎬 START
// ================================================================

function createBackgroundStars() {
    const container = document.getElementById('bg-stars');
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = 1 + Math.random() * 2.5;
        star.style.cssText = `
            width:${size}px;height:${size}px;
            left:${Math.random()*100}%;top:${Math.random()*100}%;
            --d:${2+Math.random()*4}s;
            animation-delay:${Math.random()*4}s;
        `;
        container.appendChild(star);
    }
}

function typeText(element, text, speed = 40) {
    let index = 0;
    element.innerHTML = '';
    const cursor = '<span class="cursor"></span>';
    function type() {
        if (index < text.length) {
            const char = text[index];
            const span = document.createElement('span');
            span.textContent = char;
            span.style.opacity = '0';
            element.appendChild(span);
            requestAnimationFrame(() => {
                span.style.transition = 'opacity 0.08s ease';
                span.style.opacity = '1';
            });
            index++;
            setTimeout(type, char === '\n' ? 100 : speed);
        } else {
            element.innerHTML += cursor;
        }
    }
    type();
}

function startGame() {
    screens.start.classList.remove('active');
    screens.game.classList.add('active');

    resizeCanvas();
    initStars();
    initPlayer();
    state.starsCollected = 0;
    state.gamePhase = 'collect';
    state.isEnding = false;
    state.collectedWords = [];
    starCounter.textContent = `⭐ 0 / ${state.totalStars}`;
    progressFill.style.width = '0%';

    if (counterInterval) { clearInterval(counterInterval); counterInterval = null; }

    if (!window.gameLoopStarted) {
        gameLoop();
        window.gameLoopStarted = true;
    }
}

function replayGame() {
    if (counterInterval) { clearInterval(counterInterval); counterInterval = null; }
    screens.end.classList.remove('active');
    screens.start.classList.add('active');
    letterBox.style.display = 'none';
    const text = 'كل واحد فينا بيعدي بأيام صعبة...\nلكن ساعات شخص واحد بيغير كل حاجة.';
    typeText(introText, text);
}

// ================================================================
//  🎬 EVENTS
// ================================================================

btnStart.addEventListener('click', startGame);
btnReplay.addEventListener('click', replayGame);

// ================================================================
//  🚀 INIT
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    createBackgroundStars();
    setupJoystick();
    const text = 'كل واحد فينا بيعدي بأيام صعبة...\nلكن ساعات شخص واحد بيغير كل حاجة.';
    typeText(introText, text);
});

// ================================================================
//  🔧 ROUND RECT POLYFILL
// ================================================================

if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
        const r = typeof radii === 'number' ? radii : (radii || 0);
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        return this;
    };
}