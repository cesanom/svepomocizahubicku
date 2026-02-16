// =============================
// Mobile Menu Toggle
// =============================
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const navbar = document.getElementById('navbar');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}

// Close mobile menu when clicking on a link
document.querySelectorAll('#mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
    });
});

// =============================
// Navbar Background on Scroll
// =============================
window.addEventListener('scroll', () => {
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('shadow-md');
        } else {
            navbar.classList.remove('shadow-md');
        }
    }
});

// =============================
// Scroll Reveal Animations
// =============================
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.scroll-reveal').forEach((el) => {
    observer.observe(el);
});

// =============================
// CONTACT FORM → Cloudflare Function
// =============================
const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const status = document.getElementById('form-status');
        const originalText = submitBtn.innerHTML;

        submitBtn.innerHTML =
            '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Odesílání...';
        submitBtn.disabled = true;
        if (status) status.textContent = "";

        const formData = new FormData(contactForm);

        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            location: formData.get("location"),
            phase: formData.get("phase"),
            message: formData.get("message")
        };

        try {
            const response = await fetch("/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error("Server error");
            }

            if (status) {
                status.textContent = "✅ Děkujeme! Ozveme se vám do 24 hodin.";
                status.className = "text-green-600 text-center text-sm mt-4";
            }

            contactForm.reset();

        } catch (error) {
            if (status) {
                status.textContent = "❌ Došlo k chybě. Zkuste to prosím znovu.";
                status.className = "text-red-600 text-center text-sm mt-4";
            }
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabl
