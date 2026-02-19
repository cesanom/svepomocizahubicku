document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // UI stav: Odesílání
            submitBtn.disabled = true;
            submitBtn.querySelector('span').textContent = 'Odesílám...';
            formStatus.className = 'rounded-lg p-4 text-sm flex gap-3 items-start bg-blue-50 text-blue-800';
            formStatus.innerHTML = '<p>Odesílám zprávu, prosím strpení...</p>';
            formStatus.classList.remove('hidden');

            const formData = new FormData(contactForm);

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    // Úspěch
                    formStatus.className = 'rounded-lg p-4 text-sm flex gap-3 items-start bg-green-50 text-green-800';
                    formStatus.innerHTML = '<p>✅ Zpráva byla úspěšně odeslána! Ozveme se vám do 48 hodin.</p>';
                    contactForm.reset();
                    submitBtn.querySelector('span').textContent = 'Odesláno';
                } else {
                    throw new Error('Server vrátil chybu');
                }
            } catch (error) {
                // Chyba
                formStatus.className = 'rounded-lg p-4 text-sm flex gap-3 items-start bg-red-50 text-red-800';
                formStatus.innerHTML = '<p>❌ Omlouváme se, došlo k chybě při odesílání. Zkuste to prosím později nebo nám napište přímo na email.</p>';
                submitBtn.disabled = false;
                submitBtn.querySelector('span').textContent = 'Zkusit znovu odeslat';
            }
        });
    }
});
