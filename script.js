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

// Form Validation & Cloudflare Database Integration
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnIcon = document.getElementById('btnIcon');
const formStatus = document.getElementById('formStatus');
const statusMessage = document.getElementById('statusMessage');

// Cloudflare Worker API URL - NUTNO ZMĚNIT!
// Po nasazení workeru vložte sem jeho skutečnou URL
// Například: 'https://svepomoci-form-worker.vase-jmeno.workers.dev/submit-form'
//const API_URL = 'https://svepomocizahubicku.cesanom.workers.dev/submit-form'; 
const API_URL = 'https://d1-tutorial.cesanom.workers.dev/submit-form'; 

// Kontrola, zda je API_URL nastaveno správně
//if (API_URL.includes('svepomocizahubicku.cesanom')) {
if (API_URL.includes('d1-tutorial.cesanom')) {    
    console.error('⚠️ UPOZORNĚNÍ: Nezměnili jste API_URL v script.js! Formulář nebude fungovat.');
}

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.textContent = 'Odesílání...';
    btnIcon.setAttribute('data-lucide', 'loader-2');
    btnIcon.classList.add('animate-spin');
    lucide.createIcons();
    
    // Collect form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value || '',
        location: document.getElementById('location').value,
        phase: document.getElementById('phase').value,
        message: document.getElementById('message').value || '',
        consent: document.getElementById('consent').checked,
        timestamp: new Date().toISOString()
    };
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Success
            showStatus('success', 'Děkujeme! Vaše zpráva byla úspěšně odeslána. Ozveme se vám do 48 hodin.');
            contactForm.reset();
        } else {
            // Error from server
            throw new Error(result.message || 'Chyba při odesílání');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        
        // Detailnější chybová hláška pro debugging
        let errorMsg = 'Omlouváme se, došlo k chybě při odesílání. ';
        
        //if (API_URL.includes('svepomocizahubicku.cesanom')) {
        if (API_URL.includes('d1-tutorial.cesanom')) {    
            errorMsg += '⚠️ API není nakonfigurováno - kontaktujte správce webu.';
        } else if (error.message && error.message.includes('Failed to fetch')) {
            errorMsg += 'Server je nedostupný. Zkuste to prosím znovu později.';
        } else {
            errorMsg += 'Zkuste to prosím znovu nebo nás kontaktujte přímo na info@svepomocizahubicku.cz';
        }
        
        showStatus('error', errorMsg);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.textContent = 'Odeslat poptávku';
        btnIcon.setAttribute('data-lucide', 'send');
        btnIcon.classList.remove('animate-spin');
        lucide.createIcons();
    }
});

function showStatus(type, message) {
    formStatus.classList.remove('hidden', 'bg-green-50', 'border-green-200', 'text-green-800', 'bg-red-50', 'border-red-200', 'text-red-800');
    
    if (type === 'success') {
        formStatus.classList.add('bg-green-50', 'border', 'border-green-200', 'text-green-800');
    } else {
        formStatus.classList.add('bg-red-50', 'border', 'border-red-200', 'text-red-800');
    }
    
    statusMessage.textContent = message;
    formStatus.classList.remove('hidden');
    
    // Scroll to status message
    formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

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
