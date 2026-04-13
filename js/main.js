/* ============================================================
   STARFIELD — nebula canvas, dominant deep-blue ocean palette
   (mirrors John Register painting #3 — the "window" is space)
   ============================================================ */

const canvas = document.getElementById('starfield');
const ctx    = canvas.getContext('2d');

let stars = [];
let time  = 0;
let rafId;
let nebulaCanvas = null;
let nebulaCtx    = null;
let nebulaDirty  = true;

/* Nebula cloud config — ocean-blue dominant, matching painting #3.
   Positions are fractions of canvas size so they scale on resize. */
const nebulaClouds = [
    // Central ocean abyss — the deep blue that fills the painting's window
    { cx: 0.62, cy: 0.50, r: 0.65, color: [8,  20, 50],  alpha: 0.80 },
    // Upper field — lighter horizon blue
    { cx: 0.55, cy: 0.15, r: 0.48, color: [18, 45, 90],  alpha: 0.55 },
    // Deep violet/indigo cloud — upper right
    { cx: 0.82, cy: 0.22, r: 0.44, color: [30, 12, 80],  alpha: 0.52 },
    // Crimson edge — far right, like light pollution at horizon
    { cx: 0.96, cy: 0.62, r: 0.36, color: [65, 8,  22],  alpha: 0.42 },
    // Teal-blue — lower left, deep ocean
    { cx: 0.18, cy: 0.68, r: 0.38, color: [6,  28, 52],  alpha: 0.45 },
    // Faint blue-white veil across the center — the "Milky Way" band
    { cx: 0.50, cy: 0.48, r: 0.80, color: [12, 28, 62],  alpha: 0.20 },
];

function targetCount() {
    return Math.floor((canvas.width * canvas.height) / 2200);
}

function makeStar(cx, cy) {
    const tier     = Math.random();
    const isBright = tier < 0.05;
    const isMid    = tier < 0.20;
    // Spawn at a random angle, small radius from center — spread enough to avoid clumping
    const angle  = Math.random() * Math.PI * 2;
    const radius = Math.random() * 120;
    const x = cx !== undefined ? cx + Math.cos(angle) * radius : Math.random() * canvas.width;
    const y = cy !== undefined ? cy + Math.sin(angle) * radius : Math.random() * canvas.height;
    return {
        x,
        y,
        drift:     isBright ? 0.12 + Math.random() * 0.08
                 : isMid    ? 0.04 + Math.random() * 0.04
                 :             0.01 + Math.random() * 0.02,
        size:      isBright ? Math.random() * 2.0 + 1.6
                 : isMid    ? Math.random() * 1.0 + 0.7
                 :             Math.random() * 0.8 + 0.2,
        baseAlpha: isBright ? Math.random() * 0.3  + 0.70
                 : isMid    ? Math.random() * 0.4  + 0.30
                 :             Math.random() * 0.50 + 0.12,
        speed:     Math.random() * 0.010 + 0.003,
        offset:    Math.random() * Math.PI * 2,
        hue:       Math.random() < 0.18
                      ? [180, 210, 255]      // cool blue-white
                      : Math.random() < 0.08
                          ? [255, 230, 170]  // warm amber
                          : [228, 220, 208], // neutral cream
    };
}

function createStars() {
    stars = [];
    const count = targetCount();
    for (let i = 0; i < count; i++) stars.push(makeStar());
}

function resize() {
    const prevW = canvas.width  || window.innerWidth;
    const prevH = canvas.height || window.innerHeight;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    if (stars.length === 0) {
        createStars();
        return;
    }

    // Scale existing star positions to the new canvas size — no flash/reset
    const scaleX = canvas.width  / prevW;
    const scaleY = canvas.height / prevH;
    stars.forEach(s => { s.x *= scaleX; s.y *= scaleY; });

    // Trim or top-up star count to match new target
    const target = targetCount();
    if (stars.length > target) {
        stars.length = target;
    } else {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        while (stars.length < target) stars.push(makeStar(cx, cy));
    }
}

/* Render the static nebula to an offscreen canvas (only on resize). */
function renderNebulaToCache() {
    if (!nebulaCanvas) {
        nebulaCanvas = document.createElement('canvas');
        nebulaCtx    = nebulaCanvas.getContext('2d');
    }
    nebulaCanvas.width  = canvas.width;
    nebulaCanvas.height = canvas.height;

    nebulaCtx.fillStyle = '#060810';
    nebulaCtx.fillRect(0, 0, canvas.width, canvas.height);

    nebulaClouds.forEach(c => {
        const gx = c.cx * canvas.width;
        const gy = c.cy * canvas.height;
        const gr = c.r  * Math.max(canvas.width, canvas.height);
        const [r, g, b] = c.color;

        const grad = nebulaCtx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        grad.addColorStop(0,    `rgba(${r},${g},${b},${c.alpha})`);
        grad.addColorStop(0.40, `rgba(${r},${g},${b},${c.alpha * 0.40})`);
        grad.addColorStop(0.75, `rgba(${r},${g},${b},${c.alpha * 0.12})`);
        grad.addColorStop(1,    'rgba(0,0,0,0)');

        nebulaCtx.fillStyle = grad;
        nebulaCtx.fillRect(0, 0, canvas.width, canvas.height);
    });

    // A faint luminous horizon band — echoes the ocean/sky line in the painting
    const horizon = nebulaCtx.createLinearGradient(0, canvas.height * 0.38, 0, canvas.height * 0.55);
    horizon.addColorStop(0,   'rgba(0,0,0,0)');
    horizon.addColorStop(0.5, 'rgba(20,50,100,0.10)');
    horizon.addColorStop(1,   'rgba(0,0,0,0)');
    nebulaCtx.fillStyle = horizon;
    nebulaCtx.fillRect(0, 0, canvas.width, canvas.height);

    nebulaDirty = false;
}

function drawNebula() {
    if (nebulaDirty) renderNebulaToCache();
    ctx.drawImage(nebulaCanvas, 0, 0);
}

function drawStars() {
    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;

    stars.forEach(star => {
        // Drift outward from center — flying through space
        const dx = star.x - cx;
        const dy = star.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        star.x += (dx / dist) * star.drift;
        star.y += (dy / dist) * star.drift;

        // Respawn star near center when it drifts off-screen
        if (star.x < -10 || star.x > canvas.width + 10 ||
            star.y < -10 || star.y > canvas.height + 10) {
            const angle  = Math.random() * Math.PI * 2;
            const radius = Math.random() * 120;
            star.x = cx + Math.cos(angle) * radius;
            star.y = cy + Math.sin(angle) * radius;
        }

        const twinkle = Math.sin(time * star.speed + star.offset);
        const alpha   = star.baseAlpha * (0.65 + 0.35 * twinkle);
        const [r, g, b] = star.hue;

        // Soft glow halo for bright accent stars
        if (star.size > 1.8) {
            const glowR = star.size * 5.5;
            const glow  = ctx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, glowR
            );
            glow.addColorStop(0,   `rgba(${r},${g},${b},${alpha * 0.6})`);
            glow.addColorStop(0.30,`rgba(${r},${g},${b},${alpha * 0.15})`);
            glow.addColorStop(1,   'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(star.x, star.y, glowR, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
    });
}

function animate() {
    // Wrap time to avoid floating-point precision loss over long sessions.
    // 2π / min(speed) ≈ 2094 frames per full cycle; 100 000 gives ~27 min
    // of unique twinkle phase per star before seamless wrap.
    time = (time + 1) % 100000;
    drawNebula();
    drawStars();
    rafId = requestAnimationFrame(animate);
}

/* ============================================================
   NAV — scroll state
   ============================================================ */

const nav = document.getElementById('nav');

window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 56);
}, { passive: true });

/* ============================================================
   SMOOTH ANCHOR SCROLLING
   ============================================================ */

document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

/* ============================================================
   FADE-IN on scroll
   ============================================================ */

const fadeTargets = document.querySelectorAll(
    '.about-grid, .timeline-item, .project-card, .skill-group, .contact-heading, .contact-body'
);

fadeTargets.forEach(el => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(16px)';
    el.style.transition = 'opacity 0.75s ease, transform 0.75s ease';
});

const observer = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity   = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.07, rootMargin: '0px 0px -40px 0px' }
);

fadeTargets.forEach(el => observer.observe(el));

/* Staggered entrance for project cards */
document.querySelectorAll('.project-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 90}ms`;
});

/* ============================================================
   INIT
   ============================================================ */

let resizeTimer;
window.addEventListener('resize', () => {
    cancelAnimationFrame(rafId);
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        resize();
        nebulaDirty = true;
        animate();
    }, 100);
}, { passive: true });

resize();
nebulaDirty = true;
animate();
