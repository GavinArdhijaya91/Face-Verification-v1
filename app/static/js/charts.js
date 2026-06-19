// charts.js — Native Web Animations API (no external dependencies)

function animatePath(pathEl, duration, delay = 0) {
    if (!pathEl) return;
    const length = pathEl.getTotalLength ? pathEl.getTotalLength() : 150;
    pathEl.style.strokeDasharray = String(length);
    pathEl.style.strokeDashoffset = String(length);
    setTimeout(() => {
        pathEl.animate(
            [{ strokeDashoffset: String(length) }, { strokeDashoffset: '0' }],
            { duration, fill: 'forwards', easing: 'ease-in-out' }
        );
        setTimeout(() => {
            pathEl.style.strokeDashoffset = '0';
        }, duration + 50);
    }, delay);
}

export function drawCharts() {
    // Animate neon line paths drawing (via stroke dashoffset)
    const distPath = document.getElementById('path-dist');
    const rocPath = document.getElementById('path-roc');
    const agePath = document.getElementById('path-age');

    animatePath(distPath, 1500, 0);
    animatePath(rocPath, 1500, 200);
    animatePath(agePath, 1500, 400);

    // Animate scatter points — scale 0 -> 1.3 -> 1
    const ageDots = document.querySelectorAll('.age-dot');
    ageDots.forEach((dot, index) => {
        setTimeout(() => {
            dot.style.opacity = '0';
            dot.style.transform = 'scale(0)';
            dot.animate(
                [
                    { opacity: 0, transform: 'scale(0)' },
                    { opacity: 1, transform: 'scale(1.3)' },
                    { opacity: 0.8, transform: 'scale(1)' }
                ],
                { duration: 400, fill: 'forwards', easing: 'ease-out' }
            );
            setTimeout(() => {
                dot.style.opacity = '0.8';
                dot.style.transform = 'scale(1)';
            }, 450);
        }, 300 + index * 100);
    });
}

export function resetCharts() {
    const distPath = document.getElementById('path-dist');
    const rocPath = document.getElementById('path-roc');
    const agePath = document.getElementById('path-age');

    if (distPath) distPath.style.strokeDashoffset = '150';
    if (rocPath) rocPath.style.strokeDashoffset = '150';
    if (agePath) agePath.style.strokeDashoffset = '100';

    const ageDots = document.querySelectorAll('.age-dot');
    ageDots.forEach(dot => {
        dot.style.opacity = '0';
        dot.style.transform = 'scale(0)';
    });
}
