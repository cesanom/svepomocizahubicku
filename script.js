// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const navbar = document.getElementById('navbar');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('#mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
    });
});

// Navbar Background on Scroll
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('shadow-md');
    } else {
        navbar.classList.remove('shadow-md');
    }
});

// Intersection Observer for Scroll Animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target); // Only animate once
        }
    });
}, observerOptions);

// Observe all elements with scroll-reveal class
document.querySelectorAll('.scroll-reveal').forEach((el) => {
    observer.observe(el);
});

// Form Validation & Google Forms Integration Note
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
    // Basic validation is handled by HTML5 required attributes
    // This is just for any additional JS validation if needed
    
    // Show loading state
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Odesílání...';
    submitBtn.disabled = true;
    
    // Note: In production, replace entry.XXXXXX with actual Google Form entry IDs
    // To get these IDs:
    // 1. Create Google Form with same fields
    // 2. Click "Preview" (eye icon)
    // 3. Right-click > Inspect > Network tab
    // 4. Submit test response
    // 5. Look for "formResponse" in Network tab
    // 6. Check Payload for entry numbers
    
    // For demo purposes, we'll simulate a delay and then let the form submit normally
    setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        lucide.createIcons(); // Re-render icons after changing innerHTML
    }, 1000);
});

// Smooth Scroll for Anchor Links (fallback for older browsers)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Lazy Loading Images (if not supported natively)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                observer.unobserve(img);
            }
        });
    });

    // Observe all images
    document.querySelectorAll('img').forEach(img => {
        imageObserver.observe(img);
    });
}

// Console greeting
console.log('%cSvépomocí za hubičku 🏠', 'color: #0c4a6e; font-size: 20px; font-weight: bold;');
console.log('Děkujeme za zájem o náš projekt!');