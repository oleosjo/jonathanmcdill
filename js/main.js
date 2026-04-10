/* ============================================================
   STARFIELD — nebula canvas, dominant deep-blue ocean palette
   (mirrors John Register painting #3 — the "window" is space)
   ============================================================ */

const canvas = document.getElementById('starfield');
const ctx    = canvas.getContext('2d');

let stars = [];
let time  = 0;
let rafId;

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

function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    createStars();
}

function createStars() {
    stars = [];
    const area  = canvas.width * canvas.height;
    const count = Math.floor(area / 1100);   // dense field

    for (let i = 0; i < count; i++) {
        const tier = Math.random();
        // Tier: 5% bright accent stars, 15% medium, 80% fine
        const isBright = tier < 0.05;
        const isMid    = tier < 0.20;

        stars.push({
            x:         Math.random() * canvas.width,
            y:         Math.random() * canvas.height,
            // drift speed — brighter stars drift faster (parallax depth)
            drift:     isBright ? 0.12 + Math.random() * 0.08
                     : isMid    ? 0.04 + Math.random() * 0.04
                     :            0.01 + Math.random() * 0.02,
            size:      isBright
                          ? Math.random() * 2.0 + 1.6
                          : isMid
                              ? Math.random() * 1.0 + 0.7
                              : Math.random() * 0.8 + 0.2,
            baseAlpha: isBright
                          ? Math.random() * 0.3 + 0.70
                          : isMid
                              ? Math.random() * 0.4 + 0.30
                              : Math.random() * 0.50 + 0.12,
            speed:     Math.random() * 0.010 + 0.003,
            offset:    Math.random() * Math.PI * 2,
            // Color: mostly cool blue-white to match ocean; occasional warm
            hue:       Math.random() < 0.18
                          ? [180, 210, 255]      // cool blue-white
                          : Math.random() < 0.08
                              ? [255, 230, 170]  // warm amber
                              : [228, 220, 208], // neutral cream
        });
    }
}

function drawNebula() {
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    nebulaClouds.forEach(c => {
        const gx = c.cx * canvas.width;
        const gy = c.cy * canvas.height;
        const gr = c.r  * Math.max(canvas.width, canvas.height);
        const [r, g, b] = c.color;

        const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        grad.addColorStop(0,    `rgba(${r},${g},${b},${c.alpha})`);
        grad.addColorStop(0.40, `rgba(${r},${g},${b},${c.alpha * 0.40})`);
        grad.addColorStop(0.75, `rgba(${r},${g},${b},${c.alpha * 0.12})`);
        grad.addColorStop(1,    'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    // A faint luminous horizon band — echoes the ocean/sky line in the painting
    const horizon = ctx.createLinearGradient(0, canvas.height * 0.38, 0, canvas.height * 0.55);
    horizon.addColorStop(0,   'rgba(0,0,0,0)');
    horizon.addColorStop(0.5, 'rgba(20,50,100,0.10)');
    horizon.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = horizon;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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

        // Respawn star at center when it drifts off-screen
        if (star.x < -10 || star.x > canvas.width + 10 ||
            star.y < -10 || star.y > canvas.height + 10) {
            star.x = cx + (Math.random() - 0.5) * 40;
            star.y = cy + (Math.random() - 0.5) * 40;
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
    time++;
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

window.addEventListener('resize', () => {
    cancelAnimationFrame(rafId);
    resize();
    animate();
}, { passive: true });

resize();
animate();
