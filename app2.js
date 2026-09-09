document.addEventListener('DOMContentLoaded', () => {
    // 1. Ambient mouse background glow tracking
    const glow = document.getElementById('glow');
    if (glow) {
        window.addEventListener('mousemove', (e) => {
            glow.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
        });
    }

    // 2. 3D Parallax Tilt Effect on Project Cards
    const cards = document.querySelectorAll('.project-card');
    cards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            card.style.transform = `perspective(1000px) rotateX(${-y / 15}deg) rotateY(${x / 15}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });

    // 3. Contact interaction tracking
    const contactLinks = [
        { id: 'contactEmail', label: 'Email' },
        { id: 'contactPhone', label: 'Phone' },
        { id: 'contactLinkedin', label: 'LinkedIn' },
        { id: 'contactInstagram', label: 'Instagram' }
    ];

    contactLinks.forEach(item => {
        const elem = document.getElementById(item.id);
        if (elem) {
            elem.addEventListener('click', () => {
                console.log(`User clicked contact channel: ${item.label}`);
            });
        }
    });

    // 4. Form submission handler
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');

    if (form) {
        form.addEventListener('submit', function () {
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
                submitBtn.style.opacity = '0.7';
                submitBtn.style.pointerEvents = 'none';
            }
        });
    }
});