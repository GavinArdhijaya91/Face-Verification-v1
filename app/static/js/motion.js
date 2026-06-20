// motion.js — Native Web Animations API (no external dependencies)

function animateEl(el, keyframes, options) {
    if (!el) return;
    const anim = el.animate(keyframes, options);
    // Keep last frame state
    anim.addEventListener('finish', () => {
        anim.commitStyles();
        anim.cancel();
    }, {
        once: true
    });
    return anim;
}

export function triggerPageAnimations() {
    // Page fade-in: body opacity 0 -> 1
    document.body.animate(
        [{
            opacity: 0
        }, {
            opacity: 1
        }], {
            duration: 600,
            fill: 'forwards',
            easing: 'ease-out'
        }
    );

    // Cards slide up + fade in with stagger
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach((card, i) => {
        card.animate(
            [{
                opacity: 0,
                transform: 'translateY(20px)'
            }, {
                opacity: 1,
                transform: 'translateY(0)'
            }], {
                duration: 500,
                delay: 100 + i * 60,
                fill: 'forwards',
                easing: 'ease-out'
            }
        );
    });

    // Verify button pulse (infinite loop via CSS-like approach)
    const verifyBtn = document.getElementById('verify-btn');
    if (verifyBtn) {
        verifyBtn.animate(
            [{
                    transform: 'scale(0.95)',
                    boxShadow: '0 0 10px rgba(34,211,238,0.2)'
                },
                {
                    transform: 'scale(1.05)',
                    boxShadow: '0 0 25px rgba(34,211,238,0.6)'
                },
                {
                    transform: 'scale(0.95)',
                    boxShadow: '0 0 10px rgba(34,211,238,0.2)'
                }
            ], {
                duration: 2000,
                iterations: Infinity,
                easing: 'ease-in-out'
            }
        );
    }

    // Card hover effects via JS
    const hoverCards = document.querySelectorAll('.card-hover');
    hoverCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.animate(
                [{
                    transform: 'scale(1)'
                }, {
                    transform: 'scale(1.03)'
                }], {
                    duration: 200,
                    fill: 'forwards',
                    easing: 'ease-out'
                }
            );
        });
        card.addEventListener('mouseleave', () => {
            card.animate(
                [{
                    transform: 'scale(1.03)'
                }, {
                    transform: 'scale(1)'
                }], {
                    duration: 200,
                    fill: 'forwards',
                    easing: 'ease-out'
                }
            );
        });
    });
}

export function animateResults(similarity, distance, durationMs, label) {
    const resPercentage = document.getElementById('result-percentage');
    const circularFill = document.getElementById('circular-meter-fill');
    const resultCard = document.getElementById('result-card');
    const resultScoreBlock = document.getElementById('result-score-block');

    // Card pop-in
    if (resultCard) {
        resultCard.animate(
            [{
                transform: 'scale(0.95)'
            }, {
                transform: 'scale(1.02)'
            }, {
                transform: 'scale(1)'
            }], {
                duration: 400,
                fill: 'forwards',
                easing: 'ease-out'
            }
        );
    }

    // Score block scale 0.8 -> 1
    if (resultScoreBlock) {
        resultScoreBlock.animate(
            [{
                opacity: 0,
                transform: 'scale(0.8)'
            }, {
                opacity: 1,
                transform: 'scale(1)'
            }], {
                duration: 500,
                fill: 'forwards',
                easing: 'ease-out'
            }
        );
    }

    if (circularFill) {
        if (label === "Mirip sekali") {
            circularFill.style.stroke = "#10b981"; 
        } else if (label === "Mirip") {
            circularFill.style.stroke = "#0ea5e9"; 
        } else if (label === "Tidak mirip") {
            circularFill.style.stroke = "#f59e0b"; 
        } else {
            circularFill.style.stroke = "#ef4444"; 
        }

        const finalOffset = 264 - (264 * similarity);
        circularFill.animate(
            [{
                strokeDashoffset: '264'
            }, {
                strokeDashoffset: String(finalOffset)
            }], {
                duration: 1500,
                fill: 'forwards',
                easing: 'ease-out'
            }
        );
        // Commit final style
        setTimeout(() => {
            circularFill.style.strokeDashoffset = String(finalOffset);
        }, 1600);
    }

    // Numeric counter 0 -> similarity%
    if (resPercentage) {
        const start = performance.now();
        const duration = 1500;
        const targetVal = similarity * 100;
        const tick = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            resPercentage.innerText = (eased * targetVal).toFixed(1) + '%';
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
}

export function resetResultsMotion() {
    const circularFill = document.getElementById('circular-meter-fill');
    if (circularFill) {
        circularFill.style.strokeDashoffset = '264';
    }
}