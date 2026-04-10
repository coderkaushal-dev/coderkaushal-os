// js/portal.js

// State Management
let currentWorkspaceId = null;
let workspaceUnsubscribe = null;
let countdownInterval = null;

/* ==========================================
   1. The Handshake (Login Logic)
========================================== */
const loginForm = document.getElementById('portalLoginForm');
const loginError = document.getElementById('loginError');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = loginForm.querySelector('button');
        submitBtn.textContent = 'Verifying Credentials...';
        
        const clientId = document.getElementById('clientId').value.trim().toUpperCase();
        const clientPin = document.getElementById('clientPin').value.trim();

        try {
            const querySnapshot = await db.collection('client_workspaces')
                .where('client_id', '==', clientId)
                .where('pin', '==', clientPin)
                .get();

            if (!querySnapshot.empty) {
                const clientDoc = querySnapshot.docs[0];
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
                loginError.textContent = "ACCESS DENIED. Invalid ID or PIN.";
                loginError.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Login Error:", error);
            loginError.textContent = "SERVER ERROR. Connection Refused.";
            loginError.classList.remove('hidden');
        } finally {
            submitBtn.textContent = 'Initiate Handshake';
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

        // Basic Info
        document.getElementById('dash-workspace-id').textContent = data.client_id;
        document.getElementById('dash-status').textContent = data.status || 'Architecture in Progress';
        
        // Price Info 
        const totalPrice = parseFloat(data.total_price || 0);
        const alreadyPaid = parseFloat(data.paid_amount || 0);
        document.getElementById('totalPrice').textContent = `₹${totalPrice.toLocaleString('en-IN')}`;

        // ================= MILESTONE CALCULATIONS =================
        let paidPercentage = 0;
        if(totalPrice > 0) {
            paidPercentage = Math.round((alreadyPaid / totalPrice) * 100);
        }
        
        // Update Progress Bar
        const progressBar = document.getElementById('paymentProgressBar');
        const statusText = document.getElementById('paymentStatusText');
        const nextUnlockText = document.getElementById('nextUnlockText'); // Make sure this exists in HTML

        if(progressBar && statusText) {
            progressBar.style.width = `${paidPercentage}%`;
            statusText.textContent = `${paidPercentage}% Paid (₹${alreadyPaid.toLocaleString('en-IN')})`;

            // NAYA: MATH LOGIC: "Kitna aur dena hai?"
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
            if(paymentInputArea) {
                if(paidPercentage >= 100) {
                    paymentInputArea.classList.add('hidden');
                    document.getElementById('paymentArea')?.classList.add('hidden');
                } else {
                    paymentInputArea.classList.remove('hidden');
                }
            }
        }

        // ================= STEP-BY-STEP VISIBILITY =================
        const previewContainer = document.getElementById('previewContainer');
        const previewSection = previewContainer ? previewContainer.parentElement : null;
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

        // Step 2: Live Preview Unlocked? (Req: >= 60% Paid)
        if (previewSection) {
            if (paidPercentage >= 60) {
                previewSection.classList.remove('hidden'); // Show Preview Box
                const iframe = document.getElementById('livePreviewIframe');
                const placeholder = document.getElementById('tunnelPlaceholder');
                
                if (data.is_preview_active === true && data.tunnel_url && data.tunnel_url.trim() !== '') {
                    iframe.src = data.tunnel_url;
                    iframe.classList.remove('hidden');
                    placeholder.classList.add('hidden');
                } else {
                    iframe.src = '';
                    iframe.classList.add('hidden');
                    placeholder.classList.remove('hidden');
                }
            } else {
                previewSection.classList.add('hidden'); // Hide Preview Box completely
            }
        }

        // Call Timer and Form Handlers
        setupTimerLogic(data);
    });

    setupBargainEasterEgg();
}

/* ==========================================
   3. The Form Toggle Logic (Web vs App)
========================================== */
const scopeSelector = document.getElementById('projectScopeSelector');
const webSection = document.getElementById('webScopeSection');
const appSection = document.getElementById('appScopeSection');

if (scopeSelector) {
    scopeSelector.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'web') {
            webSection.classList.remove('hidden');
            appSection.classList.add('hidden');
        } else if (val === 'app') {
            webSection.classList.add('hidden');
            appSection.classList.remove('hidden');
        } else if (val === 'both') {
            webSection.classList.remove('hidden');
            appSection.classList.remove('hidden');
        }
    });
}

/* ==========================================
   4. The Timer, Form Validation & Preview Modal
========================================== */
function setupTimerLogic(data) {
    const formInputs = document.querySelectorAll('#blueprintForm input, #blueprintForm select, #blueprintForm textarea');
    const saveBtn = document.getElementById('saveScopeBtn');
    const timerDisplay = document.getElementById('countdownTimer');
    const timerLabel = document.getElementById('timerLabel');
    const timerBadge = document.getElementById('timerBadge');

    // STATE 1: Locked
    if (data.admin_locked === true || data.timer_finished === true) {
        disableForm(formInputs, saveBtn);
        timerDisplay.textContent = "LOCKED";
        timerLabel.textContent = "SCOPE IS:";
        timerBadge.classList.replace('border-white/20', 'border-red-500');
        timerDisplay.classList.add('text-red-500');
        if(countdownInterval) clearInterval(countdownInterval);
        return; 
    }

    // STATE 2: Timer Running
    if (data.timer_started_at) {
        timerLabel.textContent = "LOCKS IN:";
        timerBadge.classList.add('border-accentPurple');
        
        const startTime = data.timer_started_at.toDate().getTime();
        const endTime = startTime + (48 * 60 * 60 * 1000);

        if (!countdownInterval) {
            countdownInterval = setInterval(async () => {
                const now = new Date().getTime();
                const distance = endTime - now;

                if (distance <= 0) {
                    clearInterval(countdownInterval);
                    timerDisplay.textContent = "00:00:00";
                    disableForm(formInputs, saveBtn);
                    
                    if (currentWorkspaceId) {
                        await db.collection('client_workspaces').doc(currentWorkspaceId).update({ timer_finished: true });
                    }
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
            const agreeLock = document.getElementById('q_agreeLock');
            if (!agreeTerms || !agreeTerms.checked || !agreeLock || !agreeLock.checked) {
                alert("Please agree to the strict timelines and terms to proceed.");
                return;
            }

            // Generate Preview Content
            const projectType = scopeSelector.value;
            const previewBox = document.getElementById('previewContentArea');
            let htmlContent = `<div class="mb-4 pb-2 border-b border-white/20"><span class="text-accentPurple font-bold">PROJECT TYPE:</span> ${projectType.toUpperCase()}</div>`;
            
            visibleInputs.forEach(input => {
                if(input.type !== 'checkbox' && input.value.trim() !== '' && input.id !== 'projectScopeSelector') {
                    const label = input.placeholder || input.options?.[input.selectedIndex]?.text || input.id;
                    htmlContent += `<div class="mb-2"><span class="text-gray-500 text-xs uppercase">${label}:</span> <br> <span class="text-white">${input.value}</span></div>`;
                }
            });

            previewBox.innerHTML = htmlContent;
            document.getElementById('formPreviewModal').classList.remove('hidden');
            document.getElementById('formPreviewModal').classList.add('flex');
            
            // Print Button Action
            document.getElementById('printPreviewBtn').onclick = () => {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`<html><head><title>Architecture Blueprint</title><style>body{font-family:monospace; padding:40px; line-height:1.6; background:#fff; color:#000;} .text-accentPurple{color:purple;} .text-gray-500{color:#555; font-size:12px;}</style></head><body><h2>CoderKaushal Architecture Blueprint</h2>${htmlContent}</body></html>`);
                printWindow.document.close();
                printWindow.print();
            };

            // Confirm & Save Action
            document.getElementById('confirmSaveBtn').onclick = async () => {
                const btn = document.getElementById('confirmSaveBtn');
                btn.textContent = 'Encrypting...';
                
                let finalScopeData = {
                    project_type: projectType,
                    terms_agreed: true,
                    last_updated: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Gather Data exactly as before
                if (projectType === 'web' || projectType === 'both') {
                    finalScopeData.web_goal = document.getElementById('q_web_goal').value;
                    finalScopeData.web_audience = document.getElementById('q_web_audience').value;
                    finalScopeData.web_refs = document.getElementById('q_web_refs').value;
                    finalScopeData.web_theme = document.getElementById('q_web_theme').value;
                    finalScopeData.web_hosting = document.getElementById('q_web_hosting').value;
                    finalScopeData.web_features = document.getElementById('q_web_features').value;
                    finalScopeData.web_journey = document.getElementById('q_web_journey').value;
                }

                if (projectType === 'app' || projectType === 'both') {
                    finalScopeData.app_name = document.getElementById('q_app_name').value;
                    finalScopeData.app_platform = document.getElementById('q_app_platform').value;
                    finalScopeData.app_audience = document.getElementById('q_app_audience').value;
                    finalScopeData.app_purpose = document.getElementById('q_app_purpose').value;
                    finalScopeData.app_refs = document.getElementById('q_app_refs').value;
                    finalScopeData.app_auth = document.getElementById('q_app_auth').value;
                    finalScopeData.app_admin = document.getElementById('q_app_admin').value;
                    finalScopeData.app_features = document.getElementById('q_app_features').value;
                    finalScopeData.app_hardware = document.getElementById('q_app_hardware').value;
                    finalScopeData.app_monetization = document.getElementById('q_app_monetization').value;
                }

                try {
                    await db.collection('client_workspaces').doc(currentWorkspaceId).update(finalScopeData);
                    document.getElementById('formPreviewModal').classList.remove('flex');
                    document.getElementById('formPreviewModal').classList.add('hidden');
                    saveBtn.textContent = 'Blueprint Secured';
                    btn.textContent = 'Confirm & Lock Scope';
                    setTimeout(() => saveBtn.textContent = 'Save Architecture Blueprint', 3000);
                } catch (error) {
                    btn.textContent = 'Error!';
                }
            };
        };
    }
}

function disableForm(inputs, btn) {
    inputs.forEach(el => { el.disabled = true; el.classList.add('opacity-50', 'cursor-not-allowed'); });
    if(btn) { btn.disabled = true; btn.classList.add('hidden'); }
}
function enableForm(inputs, btn) {
    inputs.forEach(el => { el.disabled = false; el.classList.remove('opacity-50', 'cursor-not-allowed'); });
    if(btn) { btn.disabled = false; btn.classList.remove('hidden'); }
}

/* ==========================================
   5. Flexible Payment UPI Logic
========================================== */
const generateUPIBtn = document.getElementById('generateUPIBtn');

const MY_UPI_ID = "ashutoshkaushal@ptaxis"; // CHANGE THIS
const RECEIVER_NAME = "Coder Kaushal";

if (generateUPIBtn) {
    generateUPIBtn.addEventListener('click', async () => {
        if(!currentWorkspaceId) return;

        const customAmountInput = document.getElementById('customPayAmount');
        const amountToPay = parseFloat(customAmountInput.value);

        // NAYA: Strict Validation for Sender Name
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

        // NAYA: Auto WhatsApp Message for Proof
        const MY_WHATSAPP = "91XXXXXXXXXX"; // Yahan apna WhatsApp number daalein (Bina + ke)
        const whatsappProofBtn = document.getElementById('whatsappProofBtn');
        if (whatsappProofBtn) {
            const waMsg = `Hi, I am ${currentWorkspaceId}. I have paid ₹${amountToPay.toLocaleString('en-IN')} from the bank account of *${senderName}*. Here is my screenshot proof:`;
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
            } catch(e) {
                submitBtn.textContent = 'Error';
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

/* ==========================================
   8. Live Preview View Controllers
========================================== */
const iframeEl = document.getElementById('livePreviewIframe');

document.getElementById('viewDesktop')?.addEventListener('click', () => {
    const previewContainer = document.getElementById('previewContainer');
    if(previewContainer) previewContainer.className = "w-full aspect-video bg-black rounded-xl overflow-hidden relative border border-white/10 shadow-inner transition-all duration-500 mx-auto";
});

document.getElementById('viewMobile')?.addEventListener('click', () => {
    const previewContainer = document.getElementById('previewContainer');
    if(previewContainer) previewContainer.className = "w-[320px] h-[600px] bg-black rounded-[2rem] overflow-hidden relative border-8 border-gray-800 shadow-inner transition-all duration-500 mx-auto";
});

document.getElementById('viewFullscreen')?.addEventListener('click', () => {
    if (iframeEl.requestFullscreen) {
        iframeEl.requestFullscreen();
    } else if (iframeEl.webkitRequestFullscreen) {
        iframeEl.webkitRequestFullscreen();
    } else if (iframeEl.msRequestFullscreen) {
        iframeEl.msRequestFullscreen();
    }
});