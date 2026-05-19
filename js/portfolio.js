/* ==========================================
   1. Preloader & URL Parameter Logic 
========================================== */
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    let preloaderDelay = 0;

    if (preloader) {
        preloaderDelay = 1700; // 1000ms delay + 700ms transition
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => preloader.remove(), 700);
        }, 1000); 
    }

    // Scroll via URL Parameter (e.g., ?section=components)
    const urlParams = new URLSearchParams(window.location.search);
    const sectionParam = urlParams.get('section');
    if (sectionParam) {
        const targetSection = document.getElementById(sectionParam);
        if (targetSection) {
            setTimeout(() => {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }, preloaderDelay + 100); // Wait for preloader to finish
        }
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
    const timelineSelect = document.getElementById('leadTimeline');
    const formSection = document.getElementById('intake-form');

    if (refInput && formSection) {
        if(category === 'component') {
            refInput.value = `Customize Component: ${projectName}`;
            if(typeSelect) {
                typeSelect.value = "component"; 
                typeSelect.dispatchEvent(new Event('change'));
            }
            if(budgetSelect) budgetSelect.value = "500-1500"; 
            if(timelineSelect) timelineSelect.value = "1-3 Days";
        } else {
            refInput.value = `Order Similar: ${projectName}`;
            if(typeSelect) {
                typeSelect.value = ""; 
                typeSelect.dispatchEvent(new Event('change'));
            }
            if(budgetSelect) budgetSelect.value = ""; 
            if(timelineSelect) timelineSelect.value = "";
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

// ================= COMPONENT LIVE SEARCH LOGIC ================= //
const componentSearch = document.getElementById('component-search');
if (componentSearch) {
    componentSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('#grid-normal > div'); 
        
        cards.forEach(card => {
            const title = card.querySelector('h3') ? card.querySelector('h3').textContent.toLowerCase() : '';
            const techStack = card.querySelector('p.font-mono') ? card.querySelector('p.font-mono').textContent.toLowerCase() : '';
            const projectId = card.querySelector('.absolute.top-3.left-3') ? card.querySelector('.absolute.top-3.left-3').textContent.toLowerCase() : '';
            
            if (title.includes(searchTerm) || techStack.includes(searchTerm) || projectId.includes(searchTerm)) {
                card.style.display = 'flex'; 
            } else {
                card.style.display = 'none'; 
            }
        });
    });
}

// ================= CREATE CARD LOGIC (WITH SMART IMAGE FALLBACK) ================= //
function createCard(project, category, index = 0) {
    const rawTitle = project.title || 'Untitled Core';
    const safeTitle = rawTitle.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safeRepo = (project.repo_link || '').replace(/'/g, "\\'");
    const safeLive = (project.live_link || '').replace(/'/g, "\\'");
    
    let actionButtons = '';
    let idTag = ''; 
    
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
        const projectId = project.project_id || `CK-${(index + 1).toString().padStart(2, '0')}`;
        idTag = `<div class="absolute top-3 left-3 z-20 bg-black/70 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-xs font-bold text-accentPurple">${projectId}</div>`;
        
        actionButtons = `
            <button onclick="window.openComponentModal('${safeTitle}', '${safeRepo}', '${safeLive}')" class="w-full px-4 py-3 bg-accentPurple text-white rounded-lg text-sm font-bold hover:bg-purple-500 active:scale-95 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] cursor-pointer">
                Unlock Free Component
            </button>
        `;
    }

    // SMART IMAGE FALLBACK LOGIC
    let imageContent = '';
    if (project.image_url && project.image_url.trim() !== '') {
        imageContent = `<img src="${project.image_url}" alt="${rawTitle}" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 relative z-10">`;
    } else if (project.live_link && project.live_link.trim() !== '') {
        // WordPress MShots API se Live Screenshot
        const screenshotUrl = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(project.live_link)}?w=600&h=400`;
        imageContent = `
            <div class="relative w-full h-full bg-black/40">
                <img src="${screenshotUrl}" alt="${rawTitle} Preview" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 relative z-10">
                <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <span class="bg-accentPurple text-white text-[10px] uppercase tracking-widest px-3 py-1 rounded font-bold">Auto Preview</span>
                </div>
            </div>`;
    } else {
        // Gradient Fallback agar koi image ya link nahi hai
        imageContent = `
            <div class="absolute inset-0 bg-gradient-to-br from-accentPurple/20 to-indigo-900/40 flex items-center justify-center relative z-10 transition-transform duration-700 group-hover:scale-110">
                <div class="flex flex-col items-center opacity-50">
                    <img src="assets/logo.svg" alt="CK Logo" class="w-10 h-10 mb-2">
                    <span class="text-[10px] font-mono text-white uppercase tracking-widest">Architecture Core</span>
                </div>
            </div>`;
    }

    return `
        <div class="glass-card p-6 flex flex-col justify-between group h-full relative overflow-hidden">
            ${idTag}
            <div>
                <div class="w-full h-48 bg-black/50 rounded-xl mb-6 overflow-hidden relative border border-white/5">
                    ${imageContent}
                </div>
                <h3 class="text-2xl font-bold text-white mb-2 relative z-10">${rawTitle}</h3>
                <p class="text-sm text-accentPurple mb-4 font-mono tracking-wide relative z-10">${project.tech_stack || 'Tech Stack'}</p>
            </div>
            <div class="mt-4 relative z-10">${actionButtons}</div>
        </div>
    `;
}

// 🚨 UPDATED: FETCHING WITH SAFE JAVASCRIPT SORTING (Ascending Order)
if (typeof db !== 'undefined') {
    
    // Sort logic to handle missing timestamps (Oldest first, Newest at bottom)
    function sortAscending(a, b) {
        let t1 = a.timestamp && typeof a.timestamp.toMillis === 'function' ? a.timestamp.toMillis() : 0;
        let t2 = b.timestamp && typeof b.timestamp.toMillis === 'function' ? b.timestamp.toMillis() : 0;
        return t1 - t2; 
    }

    // Client works
    db.collection('client_works').onSnapshot((snap) => {
        let p = []; snap.forEach(d => p.push(d.data()));
        p.sort(sortAscending); // Naya item sabse niche aayega
        if(gridClient) { gridClient.parentElement.style.display = p.length===0?'none':'block'; gridClient.innerHTML = p.map((x, i) => createCard(x, 'client', i)).join(''); }
    });

    // Personal works
    db.collection('personal_works').onSnapshot((snap) => {
        let p = []; snap.forEach(d => p.push(d.data()));
        p.sort(sortAscending); // Naya item sabse niche aayega
        if(gridPersonal) { gridPersonal.parentElement.style.display = p.length===0?'none':'block'; gridPersonal.innerHTML = p.map((x, i) => createCard(x, 'personal', i)).join(''); }
    });

    // Micro Components
    db.collection('micro_components').onSnapshot((snap) => {
        let p = []; snap.forEach(d => p.push(d.data()));
        p.sort(sortAscending); // Naya item sabse niche aayega
        if(gridNormal) { gridNormal.parentElement.style.display = p.length===0?'none':'block'; gridNormal.innerHTML = p.map((x, i) => createCard(x, 'component', i)).join(''); }
    });
}

/* ==========================================
   5. Lead Form Submission (With Custom Validations, Pricing & Timelines)
========================================== */
const leadForm = document.getElementById('leadForm');
const projectTypeSelect = document.getElementById('leadProjectType');
const budgetSelect = document.getElementById('leadBudget');
const timelineSelect = document.getElementById('leadTimeline');
const customBudgetInput = document.getElementById('leadCustomBudget');

// --- Dynamic Pricing Engine (Mid-Range) ---
const budgetTiers = {
    website: [
        { value: "5000-10000", label: "₹5,000 - ₹10,000 (Standard)" },
        { value: "10000-20000", label: "₹10,000 - ₹20,000 (Premium)" },
        { value: "20000+", label: "₹20,000+ (Advanced)" }
    ],
    app: [
        { value: "8000-15000", label: "₹8,000 - ₹15,000 (Basic Android)" },
        { value: "15000-25000", label: "₹15,000 - ₹25,000 (Native Android)" },
        { value: "25000+", label: "₹25,000+ (Advanced Android)" }
    ],
    ecosystem: [
        { value: "15000-25000", label: "₹15,000 - ₹25,000 (Web + App)" },
        { value: "25000-40000", label: "₹25,000 - ₹40,000 (Premium System)" },
        { value: "40000+", label: "₹40,000+ (Full Scale)" }
    ],
    component: [
        { value: "500-1500", label: "₹500 - ₹1,500" },
        { value: "1500-3000", label: "₹1,500 - ₹3,000" }
    ]
};

// --- Dynamic Timeline Engine ---
const timelineTiers = {
    website: [
        { value: "1-2 Weeks", label: "1 - 2 Weeks (Urgent)" },
        { value: "2-4 Weeks", label: "2 - 4 Weeks" },
        { value: "1 Month+", label: "1 Month+" },
        { value: "Flexible", label: "Flexible / Not Sure" }
    ],
    app: [
        { value: "3-4 Weeks", label: "3 - 4 Weeks (Urgent)" },
        { value: "1-2 Months", label: "1 - 2 Months" },
        { value: "2 Months+", label: "2 Months+" },
        { value: "Flexible", label: "Flexible / Not Sure" }
    ],
    ecosystem: [
        { value: "1-2 Months", label: "1 - 2 Months (Urgent)" },
        { value: "2-3 Months", label: "2 - 3 Months" },
        { value: "3 Months+", label: "3 Months+" },
        { value: "Flexible", label: "Flexible / Not Sure" }
    ],
    component: [
        { value: "1-3 Days", label: "1 - 3 Days" },
        { value: "Less than 1 Week", label: "Less than 1 Week" },
        { value: "Flexible", label: "Flexible / Not Sure" }
    ]
};

// --- Dynamic Custom Budget Minimums ---
const customMinBudgets = {
    website: 5000,
    app: 8000,
    ecosystem: 15000,
    component: 500
};

// Update Budget, Timelines and Minimums when Project Type changes
if (projectTypeSelect && budgetSelect && timelineSelect && customBudgetInput) {
    projectTypeSelect.addEventListener('change', (e) => {
        const type = e.target.value;
        
        // 1. Update Budget Options
        budgetSelect.innerHTML = '<option value="" disabled selected>Estimated Budget *</option>';
        if (budgetTiers[type]) {
            budgetTiers[type].forEach(opt => {
                budgetSelect.innerHTML += `<option value="${opt.value}">${opt.label}</option>`;
            });
        }
        budgetSelect.innerHTML += '<option value="custom">Custom Amount</option>';
        
        // 2. Update Timeline Options
        timelineSelect.innerHTML = '<option value="" disabled selected>Required Timeline *</option>';
        if (timelineTiers[type]) {
            timelineTiers[type].forEach(opt => {
                timelineSelect.innerHTML += `<option value="${opt.value}">${opt.label}</option>`;
            });
        }

        // 3. Set Dynamic Minimum for Custom Budget
        const minPrice = customMinBudgets[type] || 500;
        customBudgetInput.min = minPrice;
        customBudgetInput.placeholder = `Enter custom budget (Min ₹${minPrice}) *`;
        
        // Hide custom box if open
        const customBox = document.getElementById('leadCustomBudgetBox');
        if(customBox) {
            customBox.classList.add('hidden');
            customBudgetInput.required = false;
        }
    });
}

if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const projectType = document.getElementById('leadProjectType').value;
        const refValue = document.getElementById('leadReference') ? document.getElementById('leadReference').value.trim() : '';
        const featuresValue = document.getElementById('leadFeatures') ? document.getElementById('leadFeatures').value.trim() : '';

        // 🚨 STRICT VALIDATION 1: Detailed Features Length Check
        if (featuresValue.length < 50) {
            alert("SECURITY HALT: Please provide a detailed architectural breakdown. Your description is too short (Minimum 50 characters required).");
            return;
        }

        // 🚨 STRICT VALIDATION 2: Component Customization check
        if (projectType === 'component') {
            const isInternalComponent = refValue.startsWith('Customize Component:') || 
                                        refValue.includes('coderkaushal') || 
                                        refValue.includes('github.com/CoderKaushal');
            
            if (!isInternalComponent) {
                alert("ACCESS DENIED: Component customization is strictly reserved for CoderKaushal proprietary micro-components. Please select a valid component from the library or choose a different project type.");
                return;
            }
        }

        const submitBtn = leadForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processing & Securing...';
        submitBtn.disabled = true;

        // Extract Budget Logic
        let finalBudget = document.getElementById('leadBudget').value;
        if(finalBudget === 'custom') {
            finalBudget = "₹" + document.getElementById('leadCustomBudget').value;
        }

        const leadData = {
            reference: refValue || 'None',
            projectType: projectType, 
            features: featuresValue,
            name: document.getElementById('leadName').value,
            email: document.getElementById('leadEmail') ? document.getElementById('leadEmail').value : '',
            whatsapp: document.getElementById('leadWhatsapp').value,
            budget: finalBudget,
            timeline: document.getElementById('leadTimeline').value,
            status: 'pending', 
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('inquiries').add(leadData);

            // Create a clean copy for the notification (Remove Firebase specific objects)
            const notificationData = { ...leadData, category: 'LEAD' };
            delete notificationData.timestamp;

            try {
                await fetch('/.netlify/functions/notifyAdmin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(notificationData)
                });
            } catch (apiError) {
                console.warn("Local env: Telegram bypass.");
            }

            submitBtn.textContent = 'Architecture Request Secured!';
            submitBtn.classList.replace('bg-accentPurple', 'bg-green-500');
            leadForm.reset();
            
            // Reset dropdowns explicitly
            budgetSelect.innerHTML = '<option value="" disabled selected>Estimated Budget (Select Project Type First) *</option>';
            timelineSelect.innerHTML = '<option value="" disabled selected>Required Timeline (Select Project Type First) *</option>';
            const customBox = document.getElementById('leadCustomBudgetBox');
            if(customBox) customBox.classList.add('hidden');
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.classList.replace('bg-green-500', 'bg-accentPurple');
                submitBtn.disabled = false;
            }, 4000);

        } catch (error) {
            console.error(error);
            submitBtn.textContent = 'Database Error. Please Try Again.';
            submitBtn.disabled = false;
        }
    });
}

/* ==========================================
   6. Contact & Report Form Submission Logic
========================================== */

// Contact Form
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = contactForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = "Encrypting & Sending...";
        btn.disabled = true;

        const data = {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            platform: document.getElementById('contactPlatform').value,
            platform_id: document.getElementById('contactId').value,
            message: document.getElementById('contactMessage').value,
            status: 'unread',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('contacts').add(data);
            
            const notificationData = { ...data, category: 'CONTACT' };
            delete notificationData.timestamp;

            try {
                await fetch('/.netlify/functions/notifyAdmin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(notificationData)
                });
            } catch (err) {}

            btn.textContent = "Message Sent Securely!";
            btn.classList.replace('bg-white/10', 'bg-green-500');
            
            setTimeout(() => {
                contactForm.reset();
                document.getElementById('contactModal').classList.add('hidden');
                document.getElementById('contactModal').classList.remove('flex');
                btn.textContent = originalText;
                btn.classList.replace('bg-green-500', 'bg-white/10');
                btn.disabled = false;
            }, 2000);
        } catch (error) {
            console.error(error);
            btn.textContent = "Network Error.";
            btn.disabled = false;
        }
    });
}

// Report Form
const reportForm = document.getElementById('reportForm');
if (reportForm) {
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = reportForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = "Filing Report...";
        btn.disabled = true;

        const data = {
            email: document.getElementById('repEmail').value,
            type: document.getElementById('repType').value,
            description: document.getElementById('repDesc').value,
            status: 'unresolved',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('reports').add(data);
            
            const notificationData = { ...data, category: 'REPORT' };
            delete notificationData.timestamp;

            try {
                await fetch('/.netlify/functions/notifyAdmin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(notificationData)
                });
            } catch (err) {}

            btn.textContent = "Report Filed Successfully.";
            btn.classList.replace('bg-red-500/20', 'bg-green-500');
            btn.classList.replace('text-red-500', 'text-white');
            
            setTimeout(() => {
                reportForm.reset();
                document.getElementById('reportModal').classList.add('hidden');
                document.getElementById('reportModal').classList.remove('flex');
                btn.textContent = originalText;
                btn.classList.replace('bg-green-500', 'bg-red-500/20');
                btn.classList.replace('text-white', 'text-red-500');
                btn.disabled = false;
            }, 2000);
        } catch (error) {
            console.error(error);
            btn.textContent = "Database Error.";
            btn.disabled = false;
        }
    });
}

/* ==========================================
   7. THE SHRINK-TO-FIT MAGIC (For Typewriter)
========================================== */
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