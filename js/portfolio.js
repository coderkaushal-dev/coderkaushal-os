/* ==========================================
   1. Preloader Logic 
========================================== */
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => preloader.remove(), 700);
        }, 1000); 
    }
});

/* ==========================================
   2. Typewriter Effect Logic
========================================== */
const words = ["Digital Ecosystems.", "Professional Websites & Apps.", "Animated Websites.", "Portfolio Websites.", "Secure Client Portals.", "High-Performance Systems.", "Native Admin Apps."];
let i = 0; let j = 0; let currentWord = ""; let isDeleting = false;
const typewriterElement = document.getElementById('typewriter');

function type() {
    if (!typewriterElement) return; 
    
    currentWord = words[i];
    if (isDeleting) {
        typewriterElement.textContent = currentWord.substring(0, j - 1);
        j--;
    } else {
        typewriterElement.textContent = currentWord.substring(0, j + 1);
        j++;
    }

    if (!isDeleting && j === currentWord.length) {
        isDeleting = true;
        setTimeout(type, 2000); 
    } else if (isDeleting && j === 0) {
        isDeleting = false;
        i = (i + 1) % words.length;
        setTimeout(type, 500); 
    } else {
        setTimeout(type, isDeleting ? 50 : 100);
    }
}
type(); 

/* ==========================================
   3. Scroll Reveal Animation Logic
========================================== */
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));


/* ==========================================
   4. Firebase Smart Data Fetching, UI & Modal
========================================== */
const gridClient = document.getElementById('grid-client');
const gridPersonal = document.getElementById('grid-personal');
const gridNormal = document.getElementById('grid-normal');

// SMART AUTO-FILL LOGIC FOR MAIN PROJECTS (Mobile Optimized)
window.scrollToForm = function(projectName, category) {
    const refInput = document.getElementById('leadReference');
    const budgetSelect = document.getElementById('leadBudget');
    const typeSelect = document.getElementById('leadProjectType');
    const formSection = document.getElementById('intake-form');

    if (refInput && formSection) {
        if(category === 'component') {
            refInput.value = `Customize Component: ${projectName}`;
            if(budgetSelect) budgetSelect.value = "least-budget"; 
            if(typeSelect) typeSelect.value = "component"; 
        } else {
            refInput.value = `Order Similar: ${projectName}`;
            if(budgetSelect) budgetSelect.value = ""; 
            if(typeSelect) typeSelect.value = ""; 
        }
        setTimeout(() => { formSection.scrollIntoView({ behavior: 'smooth' }); }, 100);
    }
};

// ================= MODAL LOGIC FOR FREE COMPONENTS ================= //
const compModal = document.getElementById('freeComponentModal');
const modalContent = document.getElementById('modalContentBox');

window.openComponentModal = function(title, repoUrl, liveUrl) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalLiveLink').href = liveUrl || '#';
    document.getElementById('modalRepoLink').href = repoUrl || '#';
    
    if(compModal && modalContent) {
        compModal.classList.remove('hidden');
        compModal.classList.add('flex');
        setTimeout(() => {
            compModal.classList.remove('opacity-0');
            modalContent.classList.remove('scale-95');
        }, 10);
    }
};

window.closeComponentModal = function() {
    if(compModal && modalContent) {
        compModal.classList.add('opacity-0');
        modalContent.classList.add('scale-95');
        setTimeout(() => {
            compModal.classList.add('hidden');
            compModal.classList.remove('flex');
        }, 300);
    }
};

window.triggerPaidCustomization = function() {
    const title = document.getElementById('modalTitle').textContent;
    closeComponentModal();
    setTimeout(() => {
        window.scrollToForm(title, 'component');
    }, 400);
};

// ================= MODAL LOGIC FOR CRITERIA (T&C) ================= //
window.openCriteriaModal = function() {
    const criteriaModal = document.getElementById('criteriaModal');
    if(criteriaModal) {
        criteriaModal.classList.remove('hidden');
        criteriaModal.classList.add('flex');
    }
};

window.closeCriteriaModal = function() {
    const criteriaModal = document.getElementById('criteriaModal');
    if(criteriaModal) {
        criteriaModal.classList.add('hidden');
        criteriaModal.classList.remove('flex');
    }
};

// ================= CREATE CARD LOGIC ================= //
function createCard(project, category) {
    const rawTitle = project.title || 'Untitled Core';
    const safeTitle = rawTitle.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safeRepo = (project.repo_link || '').replace(/'/g, "\\'");
    const safeLive = (project.live_link || '').replace(/'/g, "\\'");
    
    let actionButtons = '';
    
    if (category === 'client' || category === 'personal') {
        actionButtons = `
            <div class="flex gap-3 mb-3">
                ${project.live_link ? `<a href="${project.live_link}" target="_blank" class="flex-1 text-center px-4 py-2 bg-accentPurple/20 text-accentPurple rounded-lg text-sm font-semibold hover:bg-accentPurple hover:text-white active:scale-95 transition-all">View Live</a>` : ''}
            </div>
            <button onclick="window.scrollToForm('${safeTitle}', '${category}')" class="w-full px-4 py-2.5 bg-transparent border border-accentPurple text-accentPurple rounded-lg text-sm font-semibold hover:bg-accentPurple hover:text-white active:scale-95 transition-all shadow-[0_0_10px_rgba(139,92,246,0.1)] cursor-pointer">
                Order Similar Project
            </button>
        `;
    } else { 
        actionButtons = `
            <button onclick="window.openComponentModal('${safeTitle}', '${safeRepo}', '${safeLive}')" class="w-full px-4 py-3 bg-accentPurple text-white rounded-lg text-sm font-bold hover:bg-purple-500 active:scale-95 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] cursor-pointer">
                Unlock Free Component
            </button>
        `;
    }

    return `
        <div class="glass-card p-6 flex flex-col justify-between group h-full">
            <div>
                <div class="w-full h-48 bg-white/5 rounded-xl mb-6 overflow-hidden relative border border-white/5">
                    ${project.image_url 
                        ? `<img src="${project.image_url}" alt="${rawTitle}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">` 
                        : `<div class="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">Preview Unavailable</div>`
                    }
                </div>
                <h3 class="text-2xl font-bold text-white mb-2">${rawTitle}</h3>
                <p class="text-sm text-accentPurple mb-4 font-mono tracking-wide">${project.tech_stack || 'Tech Stack'}</p>
            </div>
            <div class="mt-4">${actionButtons}</div>
        </div>
    `;
}

// FETCHING FROM 3 SEPARATE COLLECTIONS
if (typeof db !== 'undefined') {
    db.collection('client_works').onSnapshot((snap) => {
        let p = []; snap.forEach(d => p.push(d.data()));
        if(gridClient) { gridClient.parentElement.style.display = p.length===0?'none':'block'; gridClient.innerHTML = p.map(x => createCard(x, 'client')).join(''); }
    });

    db.collection('personal_works').onSnapshot((snap) => {
        let p = []; snap.forEach(d => p.push(d.data()));
        if(gridPersonal) { gridPersonal.parentElement.style.display = p.length===0?'none':'block'; gridPersonal.innerHTML = p.map(x => createCard(x, 'personal')).join(''); }
    });

    db.collection('micro_components').onSnapshot((snap) => {
        let p = []; snap.forEach(d => p.push(d.data()));
        if(gridNormal) { gridNormal.parentElement.style.display = p.length===0?'none':'block'; gridNormal.innerHTML = p.map(x => createCard(x, 'component')).join(''); }
    });
}


/* ==========================================
   5. Form Submission Logics (Firebase + Netlify Auto-Email/Telegram)
========================================== */

const leadForm = document.getElementById('leadForm');
const formMessage = document.getElementById('formMessage');

if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const submitBtn = leadForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Processing & Securing...';
        submitBtn.disabled = true;

        // Data Capture
        const leadData = {
            reference: document.getElementById('leadReference') ? document.getElementById('leadReference').value : '',
            projectType: document.getElementById('leadProjectType') ? document.getElementById('leadProjectType').value : '', 
            features: document.getElementById('leadFeatures') ? document.getElementById('leadFeatures').value : '',
            name: document.getElementById('leadName').value,
            email: document.getElementById('leadEmail') ? document.getElementById('leadEmail').value : '',
            whatsapp: document.getElementById('leadWhatsapp').value,
            budget: document.getElementById('leadBudget').value,
            timeline: document.getElementById('leadTimeline').value,
            status: 'pending', 
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            // 1. Firebase Database mein save karein
            await db.collection('inquiries').add(leadData);

            // 2. Netlify API Call (Ab ye ek call Telegram notification aur Client Email dono ka kaam karega)
            try {
                const response = await fetch('/.netlify/functions/notifyAdmin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(leadData)
                });
                const result = await response.json();
                console.log("Backend Response:", result);
            } catch (apiError) {
                console.warn("Local PC par Telegram/Email bypass ho gaya. (Live deploy hone par chalega)");
            }

            // 3. Success Message UI
            submitBtn.textContent = 'Architecture Request Secured!';
            submitBtn.classList.replace('bg-accentPurple', 'bg-green-500');
            leadForm.reset();
            
            setTimeout(() => {
                submitBtn.textContent = 'Submit Architecture Request';
                submitBtn.classList.replace('bg-green-500', 'bg-accentPurple');
                submitBtn.disabled = false;
            }, 4000);

        } catch (error) {
            console.error("Error submitting form: ", error);
            submitBtn.textContent = 'Database Error. Please Try Again.';
            submitBtn.disabled = false;
        }
    });
}

// ==========================================
// 🚀 THE SHRINK-TO-FIT MAGIC (For Typewriter)
// ==========================================
function setupShrinkToFit() {
    const box = document.getElementById('typewriter-box');
    const wrapper = document.getElementById('shrink-wrapper');
    const typewriterSpan = document.getElementById('typewriter');

    if (!box || !wrapper || !typewriterSpan) return;

    const adjustSize = () => {
        wrapper.style.transform = 'scale(1)';
        const boxWidth = box.clientWidth;
        const textWidth = wrapper.scrollWidth;

        if (textWidth > boxWidth) {
            const scaleRatio = boxWidth / textWidth;
            wrapper.style.transform = `scale(${scaleRatio * 0.98})`; 
        }
    };

    const observer = new MutationObserver(() => {
        adjustSize();
    });

    observer.observe(typewriterSpan, { childList: true, characterData: true, subtree: true });
    window.addEventListener('resize', adjustSize);
}

setupShrinkToFit();