// js/portal.js

// State Management
let currentWorkspaceId = null;
let workspaceUnsubscribe = null;
let countdownInterval = null;

/**
 * Handles global processing state for the UI
 */
function setProcessing(isProcessing) {
    if (isProcessing) {
        document.body.classList.add('cursor-wait', 'pointer-events-none', 'opacity-80');
    } else {
        document.body.classList.remove('cursor-wait', 'pointer-events-none', 'opacity-80');
    }
}

/* ==========================================
   0. Toggle PIN Visibility Logic
========================================== */
document.addEventListener('DOMContentLoaded', () => {
    const togglePinBtn = document.getElementById('togglePinBtn');
    const clientPinInput = document.getElementById('clientPin');
    const eyeIcon = document.getElementById('eyeIcon');

    // Existing PIN toggle logic remains...
    if (togglePinBtn && clientPinInput) { /* ... */ }
});

/* Helper to populate fields with existing data */
function fillFormFields(data) {
    const fieldMap = {
        'web_goal': 'q_web_goal', 'web_audience': 'q_web_audience', 'web_refs': 'q_web_refs',
        'web_theme': 'q_web_theme', 'web_hosting': 'q_web_hosting', 'web_features': 'q_web_features',
        'web_journey': 'q_web_journey', 'app_name': 'q_app_name', 'app_platform': 'q_app_platform',
        'app_audience': 'q_app_audience', 'app_purpose': 'q_app_purpose', 'app_refs': 'q_app_refs',
        'app_auth': 'q_app_auth', 'app_admin': 'q_app_admin', 'app_features': 'q_app_features',
        'app_hardware': 'q_app_hardware', 'app_monetization': 'q_app_monetization',
        'comp_mods': 'q_comp_mods', 
        'web_pages': 'q_web_pages', 'app_screens': 'q_app_screens',
        'ui_design': 'q_ui_design', 'api_reqs': 'q_api_reqs',
        'content_status': 'q_content_status'
    };
    Object.keys(fieldMap).forEach(key => {
        const el = document.getElementById(fieldMap[key]);
        if (el && data[key]) el.value = data[key];
    });
}

/* ==========================================
   1. The Handshake (Login Logic)
========================================== */
const loginForm = document.getElementById('portalLoginForm');
const loginError = document.getElementById('loginError');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        setProcessing(true);
        const submitBtn = loginForm.querySelector('button');
        submitBtn.textContent = 'Verifying Credentials...';
        loginError.classList.add('hidden');

        const clientId = document.getElementById('clientId').value.trim().toUpperCase();
        const clientPin = Number(document.getElementById('clientPin').value.trim());

        try {
            const querySnapshot = await db.collection('client_workspaces')
                .where('portalId', '==', clientId)
                .get();

            if (!querySnapshot.empty) {
                const clientDoc = querySnapshot.docs[0];
                const data = clientDoc.data();

                if (data.portalPin === clientPin) {
                    currentWorkspaceId = clientDoc.id;

                    document.getElementById('login-view').classList.add('hidden');
                    document.getElementById('dashboard-view').classList.remove('hidden');
                    document.getElementById('dashboard-view').classList.add('flex');

                    document.getElementById('auth-status').innerHTML = `
                        <span class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse"></span>
                        <span class="text-xs text-green-400 font-mono">Encrypted Session Active</span>
                    `;

                    initLiveDashboard(clientDoc.id);

                } else {
                    loginError.textContent = "ACCESS DENIED. Incorrect PIN.";
                    loginError.classList.remove('hidden');
                }
            } else {
                loginError.textContent = "ACCESS DENIED. Workspace ID not found.";
                loginError.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Login Error:", error);
            loginError.textContent = "CONNECTION REFUSED. Check Firebase Rules.";
            loginError.classList.remove('hidden');
        } finally {
            submitBtn.textContent = 'Initiate Handshake';
            setProcessing(false);
        }
    });
}

/* ==========================================
   2. Live Dashboard Engine & Milestones
========================================== */
function initLiveDashboard(docId) {
    workspaceUnsubscribe = db.collection('client_workspaces').doc(docId).onSnapshot((doc) => {
        if (!doc.exists) return;

        const data = doc.data();

        // Update Basic Info
        const workspaceId = data.portalId || 'Unknown';
        document.getElementById('dash-workspace-id').textContent = workspaceId;
        document.getElementById('dash-status').textContent = data.status || 'Architecture in Progress';
        
        // Auto-Set Project Type and UI
        const projectType = data.projectType || 'web'; 
        document.getElementById('display-project-type').textContent = projectType === 'both' ? 'Full Ecosystem' : (projectType + ' Architecture');
        toggleSections(projectType);

        // Milestone and Persistence logic
        fillFormFields(data);

        const totalPrice = parseFloat(data.total_price || 0);
        const alreadyPaid = parseFloat(data.paid_amount || 0);
        document.getElementById('totalPrice').textContent = `₹${totalPrice.toLocaleString('en-IN')}`;

        // ================= MILESTONE CALCULATIONS =================
        let paidPercentage = 0;
        if (totalPrice > 0) {
            paidPercentage = Math.round((alreadyPaid / totalPrice) * 100);
        }

        // Update Progress Bar
        const progressBar = document.getElementById('paymentProgressBar');
        const statusText = document.getElementById('paymentStatusText');
        const nextUnlockText = document.getElementById('nextUnlockText');

        if (progressBar && statusText) {
            progressBar.style.width = `${paidPercentage}%`;
            statusText.textContent = `${paidPercentage}% Paid (₹${alreadyPaid.toLocaleString('en-IN')})`;

            if (nextUnlockText) {
                const targetPreview = totalPrice * 0.60; // 60% for Live Preview
                const targetFinal = totalPrice;          // 100% for Final Delivery

                if (alreadyPaid < targetPreview) {
                    const requireMore = targetPreview - alreadyPaid;
                    nextUnlockText.innerHTML = `Pay <span class="text-green-400 font-bold">₹${requireMore.toLocaleString('en-IN')}</span> more to unlock <br>Live Architecture Preview`;
                } else if (alreadyPaid < targetFinal) {
                    const requireMore = targetFinal - alreadyPaid;
                    nextUnlockText.innerHTML = `Pay <span class="text-green-400 font-bold">₹${requireMore.toLocaleString('en-IN')}</span> more to clear <br>Final Delivery Balance`;
                } else {
                    nextUnlockText.innerHTML = `<span class="text-green-400 font-bold uppercase tracking-widest">All Milestones Cleared</span>`;
                }
            }

            // Hide Payment Input if 100% Paid
            const paymentInputArea = document.getElementById('paymentInputArea');
            if (paymentInputArea) {
                if (paidPercentage >= 100 || totalPrice === 0) {
                    paymentInputArea.classList.add('hidden');
                    document.getElementById('paymentArea')?.classList.add('hidden');
                } else {
                    paymentInputArea.classList.remove('hidden');
                }
            }
        }

        // ================= STEP-BY-STEP VISIBILITY =================
        const assetVault = document.getElementById('assetVaultContainer');

        // Step 1: Vault Open?
        if (assetVault) {
            if (data.asset_link && data.asset_link.trim() !== '') {
                assetVault.classList.remove('hidden');
                document.getElementById('assetDriveLink').href = data.asset_link;
            } else {
                assetVault.classList.add('hidden');
            }
        }

        // Step 2: Live Preview Unlocked? (Req: >= 60% Paid) & Secure Button Setup
        const previewBtn = document.getElementById('openSecurePreviewBtn');
        if (previewBtn) {
            if (paidPercentage >= 60 && data.is_preview_active === true && data.tunnel_url && data.tunnel_url.trim() !== '') {
                previewBtn.classList.remove('pointer-events-none', 'opacity-50');
                previewBtn.textContent = "Launch Secure Preview";
                previewBtn.onclick = () => {
                    window.open(`preview.html?id=${docId}`, '_blank', 'width=1200,height=800,menubar=no,toolbar=no');
                };
            } else {
                previewBtn.classList.add('pointer-events-none', 'opacity-50');
                if (paidPercentage < 60) {
                    previewBtn.textContent = "Pending 60% Milestone...";
                } else {
                    previewBtn.textContent = "Waiting for Architecture Link...";
                }
                previewBtn.onclick = null;
            }
        }

        // Call Timer and Form Handlers
        setupTimerLogic(data);

        // Setup Criteria Modal (New logic for terms & conditions)
        const viewCriteria = document.getElementById('viewCriteriaBtn');
        if (viewCriteria) {
            viewCriteria.onclick = () => {
                const modal = document.getElementById('criteriaModal');
                if (modal) {
                    modal.classList.remove('hidden');
                    modal.classList.add('flex');
                }
            };
        }
        window.closeCriteriaModal = () => {
            document.getElementById('criteriaModal')?.classList.add('hidden');
        };
    });

    setupBargainEasterEgg();
}

function toggleSections(val) {
    const webSection = document.getElementById('webScopeSection');
    const appSection = document.getElementById('appScopeSection');
    const compSection = document.getElementById('compScopeSection');
    const sharedSection = document.getElementById('sharedScopeSection');
    const standardAssets = document.getElementById('standardAssetList');
    const componentAssets = document.getElementById('componentAssetList');
    const toolboxHeader = document.getElementById('toolboxHeader');
    // const lockAgreementText = document.getElementById('lockAgreementText'); // Removed as per new UI
    const scopeTimerNotice = document.getElementById('scopeTimerNotice');
    
    // Normalize 'website' to 'web' if needed
    const isWeb = (val === 'web' || val === 'website' || val === 'both');
    const isApp = (val === 'app' || val === 'both');
    const isComp = (val === 'component');
    const isProject = isWeb || isApp;

    if (sharedSection) sharedSection.classList.toggle('hidden', !isProject);
    if (webSection) webSection.classList.toggle('hidden', !isWeb);
    if (appSection) appSection.classList.toggle('hidden', !isApp);
    if (compSection) compSection.classList.toggle('hidden', val !== 'component');

    // Assets Visibility
    if (standardAssets) standardAssets.classList.toggle('hidden', isComp);
    if (componentAssets) componentAssets.classList.toggle('hidden', !isComp);

    // Dynamic Header & Agreement Text
    if (toolboxHeader) {
        toolboxHeader.textContent = isComp ? 'The Toolbox (Assets to prepare)' : 'Phase 3: The Toolbox (Assets to prepare)';
    }

    // if (lockAgreementText) {
    //     const hours = isComp ? '24' : '48';
    //     lockAgreementText.textContent = `I agree that no major changes occur once the ${hours}-Hour Scope Timer finishes.`;
    // }
    // Removed old agreement logic in favor of unified checkbox

    if (scopeTimerNotice) {
        scopeTimerNotice.textContent = isComp ? '24 hours' : '48 hours';
    }
}


/* ==========================================
   4. The Timer, Form Validation & Preview Modal
========================================== */

/* ==========================================
   4. The Timer, Form Validation & Preview Modal
========================================== */
function setupTimerLogic(data) {
    const formInputs = document.querySelectorAll('#blueprintForm input, #blueprintForm select, #blueprintForm textarea');
    const saveBtn = document.getElementById('saveScopeBtn');
    const timerDisplay = document.getElementById('countdownTimer');
    const timerLabel = document.getElementById('timerLabel');
    const timerBadge = document.getElementById('timerBadge');

    // STATE 1: Locked (Admin or Timer)
    if (data.admin_locked === true || data.timer_finished === true) {
        timerDisplay.textContent = "LOCKED";
        timerLabel.textContent = "SCOPE IS:";
        timerBadge.classList.replace('border-white/20', 'border-red-500');
        timerDisplay.classList.add('text-red-500');
        document.getElementById('formLockedOverlay').classList.remove('hidden');

        // Enhanced PDF Trigger with Signature Handling
        const pdfBtn = document.getElementById('downloadLockedPdfBtn');
        const signInput = document.getElementById('clientSignUpload');

        pdfBtn.onclick = () => {
            if (!data.client_signature_url) {
                const proceed = confirm("Professionalism requires a client signature. Would you like to upload a photo of your signature now to include it in the blueprint?");
                if (proceed) {
                    signInput.click();
                } else {
                    generateProfessionalPDF(data);
                }
            } else {
                generateProfessionalPDF(data);
            }
        };

        signInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    generateProfessionalPDF(data, event.target.result);
                };
                reader.readAsDataURL(file);
            }
        };

        disableForm(formInputs, saveBtn);
        if (countdownInterval) clearInterval(countdownInterval);
        return;
    }

    // STATE 2: Timer Running
    if (data.timer_started_at) {
        timerLabel.textContent = "LOCKS IN:";
        timerBadge.classList.add('border-accentPurple');

        const startTime = data.timer_started_at.toDate().getTime();
        const hours = data.projectType === 'component' ? 24 : 48;
        const endTime = startTime + (hours * 60 * 60 * 1000);

        if (!countdownInterval) {
            countdownInterval = setInterval(async () => {
                const now = new Date().getTime();
                const distance = endTime - now;

                if (distance <= 0) {
                    clearInterval(countdownInterval);
                    timerDisplay.textContent = "00:00:00";
                    if (currentWorkspaceId) {
                        await db.collection('client_workspaces').doc(currentWorkspaceId).update({ timer_finished: true });
                        // Notify admin when timer naturally ends
                        await fetch('/.netlify/functions/notifyAdmin', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ category: 'BLUEPRINT_SUBMITTED', portalId: data.portalId, email: data.email })
                        }).catch(e=>console.log(e));
                    }
                    window.location.reload(); // Refresh to show locked state
                } else {
                    let h = Math.floor(distance / (1000 * 60 * 60));
                    let m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    let s = Math.floor((distance % (1000 * 60)) / 1000);
                    timerDisplay.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                }
            }, 1000);
        }
    }
    // STATE 3: Waiting
    else {
        timerDisplay.textContent = "WAITING FOR PAYMENT";
        timerDisplay.classList.add('text-gray-500', 'text-[10px]');
        timerDisplay.classList.remove('text-xl');
        enableForm(formInputs, saveBtn);
    }

    // PREVIEW MODAL LOGIC
    if (saveBtn) {
        saveBtn.onclick = () => {
            const form = document.getElementById('blueprintForm');

            // Check only visible fields
            const visibleInputs = Array.from(form.querySelectorAll('input, select, textarea')).filter(el => el.offsetParent !== null);

            for (let el of visibleInputs) {
                if (el.hasAttribute('required') && !el.value.trim()) {
                    el.reportValidity();
                    return;
                }
            }

            const agreeTerms = document.getElementById('q_agreeTerms'); 
            if (!agreeTerms || !agreeTerms.checked) {
                alert("CRITICAL: Please review and agree to the Development Criteria. Note that the current quote covers development only, excluding hosting/domain/store fees.");
                return; 
            }

            // Use the same professional generation logic for modal
            const previewBox = document.getElementById('previewContentArea');
            let previewHTML = ``;
            visibleInputs.forEach(input => {
                if (input.type !== 'checkbox' && input.value.trim() !== '') {
                    const label = input.placeholder || (input.options ? input.options[input.selectedIndex].text : "") || input.id;
                    previewHTML += `<div class="mb-4 group"><div class="text-gray-500 text-[10px] uppercase font-bold">Q: ${label}</div><div class="text-white bg-white/5 p-3 rounded-lg border border-white/5">A: ${input.value}</div></div>`;
                }
            });
            previewBox.innerHTML = previewHTML;
            document.getElementById('formPreviewModal').classList.remove('hidden');
            document.getElementById('formPreviewModal').style.display = 'flex';

            // Print Button Action (Modal)
            document.getElementById('printPreviewBtn').onclick = () => generateProfessionalPDF(data, null);

            // Confirm & Save Action
            document.getElementById('confirmSaveBtn').onclick = async () => {
                const btn = document.getElementById('confirmSaveBtn');
                setProcessing(true);
                btn.textContent = 'Encrypting Data...';

                // --- SECURITY METADATA CAPTURE ---
                let securityMeta = {
                    client_device: navigator.userAgent,
                    submission_timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    client_ip: 'Unknown',
                    location: 'Permission Denied/Unavailable'
                };

                try {
                    // 1. Fetch IP Address
                    const ipRes = await fetch('https://api.ipify.org?format=json');
                    const ipData = await ipRes.json();
                    securityMeta.client_ip = ipData.ip;
                } catch (e) { console.warn("Metadata: IP Fetch Failed"); }

                try {
                    // 2. Fetch Precise Coordinates (Lat/Long)
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0
                        });
                    });
                    securityMeta.location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                } catch (e) { console.warn("Metadata: Geolocation failed or denied"); }

                let finalScopeData = { 
                    terms_agreed: true, 
                    last_updated: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Gather all inputs based on Project Type
                const pt = data.projectType;
                if (pt === 'web' || pt === 'website' || pt === 'both') {
                    finalScopeData.web_goal = document.getElementById('q_web_goal').value;
                    finalScopeData.web_audience = document.getElementById('q_web_audience').value;
                    finalScopeData.web_refs = document.getElementById('q_web_refs').value;
                    finalScopeData.web_theme = document.getElementById('q_web_theme').value;
                    finalScopeData.web_hosting = document.getElementById('q_web_hosting').value;
                    finalScopeData.web_features = document.getElementById('q_web_features').value;
                    finalScopeData.web_pages = document.getElementById('q_web_pages').value;
                    finalScopeData.web_journey = document.getElementById('q_web_journey').value;
                    finalScopeData.ui_design = document.getElementById('q_ui_design').value;
                    finalScopeData.api_reqs = document.getElementById('q_api_reqs').value;
                    finalScopeData.content_status = document.getElementById('q_content_status').value;
                }
                if (pt === 'app' || pt === 'both') {
                    finalScopeData.app_name = document.getElementById('q_app_name').value;
                    finalScopeData.app_platform = document.getElementById('q_app_platform').value;
                    finalScopeData.app_audience = document.getElementById('q_app_audience').value;
                    finalScopeData.app_screens = document.getElementById('q_app_screens').value;
                    finalScopeData.app_purpose = document.getElementById('q_app_purpose').value;
                    finalScopeData.app_refs = document.getElementById('q_app_refs').value;
                    finalScopeData.app_auth = document.getElementById('q_app_auth').value;
                    finalScopeData.app_admin = document.getElementById('q_app_admin').value;
                    finalScopeData.app_features = document.getElementById('q_app_features').value;
                    finalScopeData.app_hardware = document.getElementById('q_app_hardware').value;
                    finalScopeData.app_monetization = document.getElementById('q_app_monetization').value;
                    finalScopeData.ui_design = document.getElementById('q_ui_design').value;
                    finalScopeData.api_reqs = document.getElementById('q_api_reqs').value;
                    finalScopeData.content_status = document.getElementById('q_content_status').value;
                }
                if (pt === 'component') {
                    finalScopeData.comp_mods = document.getElementById('q_comp_mods').value;
                }

                // Merge security metadata into final object
                finalScopeData.security_audit = securityMeta;

                try {
                    await db.collection('client_workspaces').doc(currentWorkspaceId).update(finalScopeData);
                    
                    document.getElementById('formPreviewModal').classList.add('hidden');
                    saveBtn.textContent = 'Blueprint Secured';
                    btn.textContent = 'Confirm & Save Blueprint';
                    setTimeout(() => saveBtn.textContent = 'Save Architecture Blueprint', 3000);
                } catch (error) {
                    btn.textContent = 'Error!';
                } finally {
                    setProcessing(false);
                }
            };
        };
    }
}

function disableForm(inputs, btn) {
    inputs.forEach(el => { el.disabled = true; el.classList.add('opacity-50', 'cursor-not-allowed'); });
    if (btn) { btn.disabled = true; btn.classList.add('hidden'); }
}
function enableForm(inputs, btn) {
    inputs.forEach(el => { el.disabled = false; el.classList.remove('opacity-50', 'cursor-not-allowed'); });
    if (btn) { btn.disabled = false; btn.classList.remove('hidden'); }
}

/* ==========================================
   5. Flexible Payment UPI Logic
========================================== */
const generateUPIBtn = document.getElementById('generateUPIBtn');

const MY_UPI_ID = "coderkaushal@upi";
const RECEIVER_NAME = "Ashutosh Kaushal";

if (generateUPIBtn) {
    generateUPIBtn.addEventListener('click', async () => {
        if (!currentWorkspaceId) return;

        const customAmountInput = document.getElementById('customPayAmount');
        const amountToPay = parseFloat(customAmountInput.value);

        const senderNameInput = document.getElementById('paymentSenderName');
        const senderName = senderNameInput ? senderNameInput.value.trim() : "";

        if (senderNameInput && !senderName) {
            alert("Please enter the Sender's Bank Account Name for verification.");
            return;
        }

        if (!amountToPay || amountToPay <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        const doc = await db.collection('client_workspaces').doc(currentWorkspaceId).get();
        const data = doc.data();

        const totalAgreedPrice = parseFloat(data.total_price || 0);
        const alreadyPaid = parseFloat(data.paid_amount || 0);
        const remainingBalance = totalAgreedPrice - alreadyPaid;

        if (amountToPay > remainingBalance) {
            alert(`You only need to pay ₹${remainingBalance.toLocaleString('en-IN')} to clear the balance.`);
            return;
        }

        const paymentArea = document.getElementById('paymentArea');
        const dynamicAmount = document.getElementById('dynamicAmount');

        paymentArea.classList.remove('hidden');
        document.getElementById('qrCodePlaceholder').classList.remove('hidden');
        document.getElementById('upiDeepLink').classList.remove('hidden');

        dynamicAmount.textContent = `₹${amountToPay.toLocaleString('en-IN')}`;
        const upiString = `upi://pay?pa=${MY_UPI_ID}&pn=${encodeURIComponent(RECEIVER_NAME)}&am=${amountToPay}&cu=INR`;

        document.getElementById('upiDeepLink').href = upiString;
        document.getElementById('qrImage').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}&color=000000&bgcolor=ffffff`;
        document.getElementById('qrImage').classList.remove('hidden');

        const MY_WHATSAPP = "91XXXXXXXXXX"; // Your WhatsApp Number
        const whatsappProofBtn = document.getElementById('whatsappProofBtn');
        if (whatsappProofBtn) {
            const waMsg = `Hi, I am Client ID ${data.portalId || currentWorkspaceId}. I have paid ₹${amountToPay.toLocaleString('en-IN')} from the bank account of *${senderName}*. Here is my screenshot proof:`;
            whatsappProofBtn.href = `https://wa.me/${MY_WHATSAPP}?text=${encodeURIComponent(waMsg)}`;
        }
    });
}

/* ==========================================
   6. Hidden Easter Egg (The Bargain Click)
========================================== */
function setupBargainEasterEgg() {
    let clickCount = 0;
    const bargainLabel = document.getElementById('bargainTriggerLabel');
    const hiddenBox = document.getElementById('hiddenNegotiationBox');
    const submitBtn = document.getElementById('submitBargainBtn');
    const msg = document.getElementById('bargainMessage');

    if (bargainLabel && hiddenBox) {
        bargainLabel.addEventListener('click', () => {
            clickCount++;
            if (clickCount === 3) {
                hiddenBox.classList.remove('hidden');
            }
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const amount = document.getElementById('bargainAmount').value;
            if (!amount) return;
        setProcessing(true);

            submitBtn.textContent = 'Sending...';
            try {
                await db.collection('client_workspaces').doc(currentWorkspaceId).update({
                    bargain_requested: true,
                    bargain_amount: parseFloat(amount),
                    bargain_time: firebase.firestore.FieldValue.serverTimestamp()
                });
                msg.textContent = "Override request sent.";
                msg.classList.remove('hidden');
                submitBtn.classList.add('hidden');
            } catch (e) {
                submitBtn.textContent = 'Error';
        } finally {
            setProcessing(false);
            }
        });
    }
}

/* ==========================================
   7. Terminate Session
========================================== */
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (workspaceUnsubscribe) workspaceUnsubscribe();
        currentWorkspaceId = null;
        window.location.reload();
    });
}

/**
 * Professional PDF Generation Engine - Moved to Global Scope
 */
function generateProfessionalPDF(data, tempClientSign = null) {
    const printWindow = window.open('', '_blank');
    const projectType = data.projectType || 'unknown';
    const workspaceId = data.portalId || 'CK-XXX';
    const clientName = data.name || 'Valued Client';
    
    // Fetch client signature URL if available
    const clientSignatureUrl = tempClientSign || data.client_signature_url || '';

    const visibleInputs = Array.from(document.querySelectorAll('#blueprintForm input, #blueprintForm select, #blueprintForm textarea')).filter(el => el.offsetParent !== null && el.type !== 'checkbox');

    let pdfContent = `
        <div class="watermark">Coder Kaushal</div>
        <h1>ARCHITECTURE BLUEPRINT</h1>
        <div class="meta">Workspace ID: <strong>${workspaceId}</strong> | Date: ${new Date().toLocaleDateString()}</div>
        <div class="type-box">PROJECT TYPE: <span>${projectType.toUpperCase()} ARCHITECTURE</span></div>
    `;
    
    visibleInputs.forEach(input => {
        const label = input.placeholder || (input.options ? input.options[input.selectedIndex].text : "") || input.id;
        if (input.value.trim() !== '') {
            pdfContent += `<div class="qa-block"><div class="q">${label}</div><div class="a">${input.value}</div></div>`;
        }
    });

    // Add signature section at the end
    pdfContent += `
        <div class="signature-section">
            <div class="signature-block">
                <div class="signature-line"></div>
                <p class="signature-name">Ashutosh Kaushal</p>
                <p class="signature-title">Founder & Lead Architect, CoderKaushal</p>
            </div>
            <div class="signature-block client-sign">
                ${clientSignatureUrl ? `<img src="${clientSignatureUrl}" class="client-signature-img">` : '<div class="signature-line"></div>'}
                <p class="signature-name">${clientName}</p>
                <p class="signature-title">Authorized Client Representative</p>
                <p style="font-size: 8px; color: #999; margin-top: 5px;">(Digitally Verified via CK-Portal)</p>
            </div>
        </div>
    `;

    const websiteLink = "https://coderkaushal.netlify.app";

    printWindow.document.write(`
        <html>
        <head>
            <title>Blueprint_${workspaceId}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=Roboto+Mono:wght@400&display=swap');
                body { font-family: 'Inter', 'Helvetica', 'Arial', sans-serif; padding: 40px 60px; color: #1a1a1a; line-height: 1.8; position: relative; background: #f8f8f8; }
                .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; font-weight: 900; color: #8b5cf6; opacity: 0.05; z-index: -1; white-space: nowrap; pointer-events: none; }
                h1 { color: #8b5cf6; border-bottom: 3px solid #8b5cf6; padding-bottom: 15px; font-size: 28px; text-align: center; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; }
                .meta { text-align: center; font-size: 10px; margin-bottom: 40px; color: #888; font-family: 'Roboto Mono', monospace; border-top: 1px solid #eee; padding-top: 10px; }
                .type-box { border: 2px solid #8b5cf6; padding: 20px; margin-bottom: 40px; text-align: center; background: #fdfbff; color: #8b5cf6; border-radius: 12px; }
                .type-box span { font-size: 20px; display: block; margin-top: 5px; }
                .qa-block { margin-bottom: 20px; page-break-inside: avoid; border-left: 3px solid #8b5cf633; padding-left: 20px; }
                .q { font-size: 10px; color: #8b5cf6; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; }
                .a { font-size: 14px; color: #222; font-weight: 500; background: #fafafa; padding: 10px 15px; border-radius: 8px; border: 1px solid #f0f0f0; }
                .footer { position: fixed; bottom: 30px; left: 80px; right: 80px; text-align: center; border-top: 1px solid #eee; padding-top: 15px; }
                .links a { color: #8b5cf6; text-decoration: none; margin: 0 10px; font-size: 9px; font-weight: 700; }
                .qr-container { position: absolute; bottom: 60px; right: 60px; text-align: center; width: 100px; }
                .qr-img { width: 80px; height: 80px; border: 1px solid #eee; }
                .qr-logo-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; background: white; padding: 2px; }
                
                /* Signature Section Styles */
                .signature-section {
                    display: flex;
                    justify-content: space-around;
                    margin-top: 60px;
                    padding-top: 30px;
                    border-top: 2px solid #f0f0f0;
                    page-break-inside: avoid;
                }
                .signature-block {
                    text-align: center;
                    width: 45%;
                }
                .signature-line {
                    border-bottom: 2px solid #eee;
                    width: 80%;
                    margin: 0 auto 10px auto;
                }
                .signature-name { font-weight: 800; font-size: 14px; color: #111; margin-bottom: 2px; }
                .signature-title { font-size: 10px; color: #777; font-weight: 600; text-transform: uppercase; }
                
                /* Ashutosh's Text Signature */
                .architect-sign .signature-line { border-bottom: 0; font-family: 'Dancing Script', cursive; font-size: 24px; color: #8b5cf6; margin-bottom: -5px; }

                .client-signature-img {
                    max-height: 60px;
                    object-fit: contain;
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            ${pdfContent}
            <div class="footer">
                <div class="links">
                    <a href="https://coderkaushal.netlify.app">WEBSITE</a> <a href="https://instagram.com/coderkaushal">INSTAGRAM</a>
                    <a href="https://youtube.com/@coderkaushal">YOUTUBE</a> <a href="https://github.com/coderkaushal">GITHUB</a>
                    <a href="https://t.me/coderkaushal">TELEGRAM</a>
                </div>
                <p style="font-size: 9px; margin-top: 10px; color: #aaa;">© Ashutosh Kaushal | Secure Architecture Protocol</p>
            </div>
        </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 700);
}