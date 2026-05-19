// js/admin.js

// Global variables to hold client data for WhatsApp and Email notifications
let currentEditingEmail = "";
let currentEditingName = "";
let currentEditingWA = "";
let currentEditingId = null;

document.addEventListener("DOMContentLoaded", () => {
    const auth = firebase.auth();
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const loginForm = document.getElementById('adminLoginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const leadsContainer = document.getElementById('main-content-grid');
    const liveToast = document.getElementById('liveToast');
    const toastMsg = document.getElementById('toastMsg');

    let initialLoad = true;
    let currentTab = 'leads'; // tabs: 'leads', 'contacts', 'reports', 'workspaces', 'history'
    let unsubscribe = null; 

    // 1. AUTH OBSERVER
    auth.onAuthStateChanged((user) => {
        if (user) {
            loginScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            dashboardScreen.classList.add('flex', 'flex-col'); 
            initAdminSystem();
        } else {
            loginScreen.classList.remove('hidden');
            dashboardScreen.classList.add('hidden');
            dashboardScreen.classList.remove('flex', 'flex-col');
        }
    });

    // 2. LOGIN/LOGOUT
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;
            auth.signInWithEmailAndPassword(email, password).catch(err => alert("Access Denied: " + err.message));
        });
    }
    if(logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut());

    function initAdminSystem() {
        calculateStats();
        fetchData();
    }

    // 3. STATS CALCULATION
    function calculateStats() {
        db.collection('inquiries').onSnapshot(snap => {
            document.getElementById('stat-pending').textContent = snap.size;
        });

        db.collection('client_workspaces').onSnapshot(snap => {
            let totalIncome = 0;
            let activeProjects = 0;
            let completedProjects = 0;
            snap.forEach(doc => {
                const d = doc.data();
                totalIncome += (Number(d.paid_amount) || 0);
                if(d.status === 'Live' || d.status === 'Live / Handover') completedProjects++; else activeProjects++;
            });
            document.getElementById('stat-revenue').textContent = `₹${totalIncome.toLocaleString()}`;
            document.getElementById('stat-active').textContent = activeProjects;
            document.getElementById('stat-done').textContent = completedProjects;
        });
    }

    // 4. FETCH DATA (Support for all 5 tabs)
    function fetchData() {
        if (unsubscribe) unsubscribe();
        
        let col = 'inquiries';
        if(currentTab === 'workspaces') col = 'client_workspaces';
        if(currentTab === 'history') col = 'audit_logs';
        if(currentTab === 'contacts') col = 'contacts';
        if(currentTab === 'reports') col = 'reports';
        
        let orderField = currentTab === 'history' ? 'audit_timestamp' : 'timestamp';

        leadsContainer.innerHTML = '<div class="col-span-full text-center py-10 opacity-50">Syncing with Engine...</div>';

        unsubscribe = db.collection(col).orderBy(orderField, 'desc').onSnapshot((snapshot) => {
            leadsContainer.innerHTML = '';
            snapshot.forEach((doc) => {
                if(currentTab === 'leads') leadsContainer.innerHTML += renderLeadCard(doc);
                else if(currentTab === 'workspaces') leadsContainer.innerHTML += renderWorkspaceCard(doc);
                else if(currentTab === 'history') leadsContainer.innerHTML += renderHistoryCard(doc);
                else if(currentTab === 'contacts') leadsContainer.innerHTML += renderContactCard(doc);
                else if(currentTab === 'reports') leadsContainer.innerHTML += renderReportCard(doc);
            });
            initialLoad = false;
        });
    }

    // 5. CARD RENDERING
    function renderLeadCard(doc) {
        const lead = doc.data();
        return `
            <div onclick="viewLeadDetails('${doc.id}')" class="glass-card p-6 border-l-4 border-l-accentPurple flex flex-col justify-between cursor-pointer hover:bg-white/[0.05] transition-all group searchable-card">
                <div>
                    <div class="flex justify-between text-[10px] mb-2 text-gray-500 uppercase font-bold">
                        <span>${lead.projectType || 'General'}</span>
                        <span class="text-accentPurple group-hover:scale-110 transition-transform">View Form →</span>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2 searchable-text">${lead.name}</h3>
                    <p class="text-green-400 font-bold text-sm">${lead.budget || 'N/A'}</p>
                    <p class="text-gray-500 text-xs mt-2 searchable-text">${lead.email}</p>
                </div>
            </div>`;
    }

    function renderWorkspaceCard(doc) {
        const client = doc.data();
        return `
            <div class="glass-card p-6 border-l-4 border-l-green-500 searchable-card">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-lg font-bold searchable-text">${client.name}</h3>
                    <span class="text-[10px] font-bold bg-green-500/20 text-green-500 px-2 py-1 rounded">${client.status}</span>
                </div>
                <p class="text-xs text-gray-400 mb-4 font-mono">Portal ID: ${client.portalId || 'N/A'}</p>
                <button onclick="openMgmtModal('${doc.id}')" class="w-full bg-accentPurple py-2 rounded-lg text-xs font-bold hover:bg-purple-500 transition-all">Manage Project</button>
            </div>`;
    }

    function renderContactCard(doc) {
        const data = doc.data();
        return `
            <div onclick="viewMessageDetails('${doc.id}', 'CONTACT')" class="glass-card p-6 border-l-4 border-l-blue-500 flex flex-col justify-between cursor-pointer hover:bg-white/[0.05] transition-all group searchable-card">
                <div>
                    <div class="flex justify-between text-[10px] mb-2 text-gray-500 uppercase font-bold">
                        <span>${data.platform || 'General'}</span>
                        <span class="text-blue-500 group-hover:scale-110 transition-transform">Read →</span>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2 searchable-text">${data.name}</h3>
                    <p class="text-gray-500 text-xs mt-2 searchable-text">${data.email}</p>
                </div>
            </div>`;
    }

    function renderReportCard(doc) {
        const data = doc.data();
        return `
            <div onclick="viewMessageDetails('${doc.id}', 'REPORT')" class="glass-card p-6 border-l-4 border-l-red-500 flex flex-col justify-between cursor-pointer hover:bg-white/[0.05] transition-all group searchable-card">
                <div>
                    <div class="flex justify-between text-[10px] mb-2 text-gray-500 uppercase font-bold">
                        <span>${data.type || 'ISSUE'}</span>
                        <span class="text-red-500 group-hover:scale-110 transition-transform">View →</span>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2 searchable-text">${data.email}</h3>
                    <p class="text-gray-500 text-xs mt-2 line-clamp-2">${data.description}</p>
                </div>
            </div>`;
    }

    function renderHistoryCard(doc) {
        const log = doc.data();
        const actionColor = log.audit_action === 'Approved' ? 'text-green-400' : 'text-red-400';
        const dateStr = log.audit_timestamp ? log.audit_timestamp.toDate().toLocaleString() : 'N/A';
        return `
            <div class="glass-card p-6 border-l-4 border-l-gray-600 opacity-70 hover:opacity-100 transition-all searchable-card">
                <div class="flex justify-between text-[10px] mb-2 font-bold uppercase">
                    <span class="text-gray-400">${log.projectType || 'General'}</span>
                    <span class="${actionColor}">${log.audit_action}</span>
                </div>
                <h3 class="text-lg font-bold text-white mb-1 searchable-text">${log.name}</h3>
                <p class="text-xs text-gray-400 mb-1 searchable-text">📧 ${log.email} | 📱 ${log.whatsapp}</p>
                <p class="text-xs text-gray-400 mb-3">💰 ${log.budget} | ⏳ ${log.timeline}</p>
                <p class="text-[10px] text-gray-500 font-mono">Archived: ${dateStr}</p>
            </div>`;
    }

    // 6. VIEW FULL LEAD DETAILS LOGIC
    window.viewLeadDetails = async (id) => {
        const doc = await db.collection('inquiries').doc(id).get();
        if(!doc.exists) return;
        const data = doc.data();
        
        document.getElementById('currentLeadId').value = id;
        document.getElementById('ldName').textContent = data.name;
        document.getElementById('ldType').textContent = data.projectType || 'N/A';
        document.getElementById('ldEmail').textContent = data.email;
        document.getElementById('ldWhatsapp').textContent = data.whatsapp;
        document.getElementById('ldBudget').textContent = data.budget;
        document.getElementById('ldTimeline').textContent = data.timeline;
        document.getElementById('ldFeatures').textContent = data.features;
        
        const refLink = document.getElementById('ldRef');
        if(data.reference && data.reference !== "None") {
            refLink.href = data.reference;
            refLink.classList.remove('hidden');
        } else {
            refLink.classList.add('hidden');
        }

        const modal = document.getElementById('leadDetailsModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        document.getElementById('btnApproveMain').onclick = () => approveLead(id);
        document.getElementById('btnRejectMain').onclick = () => rejectLead(id); 
    };

    window.closeLeadModal = () => {
        const modal = document.getElementById('leadDetailsModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    // MESSAGE MODAL LOGIC (Contacts & Reports)
    window.viewMessageDetails = async (id, type) => {
        const col = type === 'CONTACT' ? 'contacts' : 'reports';
        const doc = await db.collection(col).doc(id).get();
        if(!doc.exists) return;
        const data = doc.data();

        document.getElementById('msgTag').textContent = type === 'CONTACT' ? 'Direct Message' : 'Issue Report';
        document.getElementById('msgSubject').textContent = data.name || data.email;
        document.getElementById('msgEmail').textContent = data.email;
        document.getElementById('msgEmail').href = `mailto:${data.email}`;
        
        const platform = document.getElementById('msgPlatform');
        if (data.platform_id) {
            platform.textContent = `📱 ${data.platform}: ${data.platform_id}`;
            platform.classList.remove('hidden');
        } else platform.classList.add('hidden');

        document.getElementById('msgBody').textContent = data.message || data.description;

        const modal = document.getElementById('messageViewModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        document.getElementById('btnResolveMsg').onclick = async () => {
            await db.collection(col).doc(id).delete();
            closeMessageModal();
            showToast("Message Resolved & Cleared");
        };
        document.getElementById('btnDeleteMsg').onclick = async () => {
            if(confirm("Delete permanently?")) {
                await db.collection(col).doc(id).delete();
                closeMessageModal();
                showToast("Entry Deleted");
            }
        };
    };

    window.closeMessageModal = () => {
        const modal = document.getElementById('messageViewModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    // 7. MANAGEMENT MODAL LOGIC (With Email & WA Globals)
    window.openMgmtModal = async (id) => {
        currentEditingId = id;
        const modal = document.getElementById('mgmtModal');
        const doc = await db.collection('client_workspaces').doc(id).get();
        const data = doc.data();

        // Store for WhatsApp/Email later
        currentEditingEmail = data.email || "";
        currentEditingName = data.name || "Client";
        currentEditingWA = data.whatsapp || "";

        document.getElementById('modalClientName').textContent = data.name;
        document.getElementById('modalProjectId').textContent = `PORTAL ID: ${data.portalId || 'N/A'} | SECURE PIN: ${data.portalPin || 'N/A'}`;
        
        document.getElementById('mTotal').value = data.total_price || 0;
        document.getElementById('mPaid').value = data.paid_amount || 0;
        document.getElementById('mStatus').value = data.status || "Architecture in Progress";
        document.getElementById('mUrl').value = data.tunnel_url || "";
        document.getElementById('mPreviewActive').checked = data.is_preview_active || false;
        document.getElementById('mAssets').value = data.asset_link || "";

        // Bargain Logic
        const bargainBox = document.getElementById('mBargainBox');
        if (data.bargain_requested) {
            bargainBox.classList.remove('hidden');
            document.getElementById('mBargainAmt').textContent = `₹${data.bargain_amount}`;
        } else bargainBox.classList.add('hidden');

        // Timer Logic
        const timerStatus = document.getElementById('mTimerStatus');
        if (data.admin_locked) {
            timerStatus.textContent = "Status: Locked";
        } else if (data.timer_started_at) {
            timerStatus.textContent = "Status: Timer Running";
        } else {
            timerStatus.textContent = "Status: Awaiting Action";
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    window.closeMgmtModal = () => {
        const modal = document.getElementById('mgmtModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    // 🚨 UPDATED: SAVE PROJECT CHANGES (WITH AUTO-EMAIL & WA PING)
    window.saveProjectChanges = async () => {
        const btn = event.target;
        btn.textContent = "Saving...";
        const newStatus = document.getElementById('mStatus').value;
        
        await db.collection('client_workspaces').doc(currentEditingId).update({
            total_price: Number(document.getElementById('mTotal').value),
            paid_amount: Number(document.getElementById('mPaid').value),
            status: newStatus,
            tunnel_url: document.getElementById('mUrl').value,
            is_preview_active: document.getElementById('mPreviewActive').checked,
            asset_link: document.getElementById('mAssets').value
        });
        
        // 1. Send Update Email
        await fetch('/.netlify/functions/notifyAdmin', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: 'WORKSPACE_UPDATED', email: currentEditingEmail, name: currentEditingName, status: newStatus })
        }).catch(e => console.log(e));

        closeMgmtModal();
        showToast("State Updated & Client Notified");
        btn.textContent = "Save System State";

        // 2. Optional WA Ping
        if(confirm("Do you want to send a WhatsApp update to the client?")) {
            const cleanWA = currentEditingWA.replace(/\D/g, '');
            const waMsg = encodeURIComponent(`Hi ${currentEditingName},\nYour project status has been updated to: *${newStatus}*.\nPlease check your portal for live updates.`);
            window.open(`https://wa.me/${cleanWA}?text=${waMsg}`, '_blank');
        }
    };

    // MGMT ACTIONS
    window.handleBargainAction = async (action) => {
        if (action === 'approve') {
            const amt = parseFloat(document.getElementById('mBargainAmt').textContent.replace('₹', ''));
            await db.collection('client_workspaces').doc(currentEditingId).update({
                total_price: amt,
                bargain_requested: false
            });
            document.getElementById('mTotal').value = amt;
        } else {
            await db.collection('client_workspaces').doc(currentEditingId).update({
                bargain_requested: false
            });
        }
        document.getElementById('mBargainBox').classList.add('hidden');
        showToast(`Bargain ${action}d`);
    };

    window.startScopeTimer = async () => {
        await db.collection('client_workspaces').doc(currentEditingId).update({
            timer_started_at: firebase.firestore.FieldValue.serverTimestamp(),
            timer_finished: false,
            admin_locked: false
        });
        document.getElementById('mTimerStatus').textContent = "Status: Timer Running";
        showToast("48h Timer Started");
    };

    window.forceLock = async () => {
        await db.collection('client_workspaces').doc(currentEditingId).update({
            admin_locked: true
        });
        document.getElementById('mTimerStatus').textContent = "Status: Locked";
        showToast("Scope Force Locked");
    };

    // 8. PROJECT CREATION LOGIC
    window.openCreateModal = (col) => {
        const modal = document.getElementById('createModal');
        document.getElementById('targetCollection').value = col;
        document.getElementById('createTitle').textContent = "Add New " + col.replace('_', ' ');
        
        const microBox = document.getElementById('microOnly');
        if(microBox) {
            if(col === 'micro_components') microBox.classList.remove('hidden');
            else microBox.classList.add('hidden');
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    window.closeCreateModal = () => {
        document.getElementById('createModal').classList.add('hidden');
        document.getElementById('createModal').classList.remove('flex');
    };

    const createForm = document.getElementById('createForm');
    if(createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const col = document.getElementById('targetCollection').value;
            const btn = e.target.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = "Publishing...";

            const newData = {
                title: document.getElementById('cTitle').value,
                image_url: document.getElementById('cImage').value,
                live_link: document.getElementById('cLive').value,
                tech_stack: document.getElementById('cTech').value,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            if(col === 'micro_components') {
                const repoInput = document.getElementById('cRepo');
                if(repoInput) newData.repo_link = repoInput.value;
            }

            try {
                await db.collection(col).add(newData);
                showToast("Published to " + col);
                closeCreateModal();
                e.target.reset();
            } catch (err) {
                alert("Error: " + err.message);
            } finally {
                btn.textContent = originalText;
            }
        });
    }

    // 9. TABS SWITCHING
    window.switchTab = (tab) => {
        currentTab = tab;
        const tabs = ['leads', 'contacts', 'reports', 'workspaces', 'history'];

        tabs.forEach(t => {
            const btn = document.getElementById(`tab-${t}`);
            if(btn) btn.className = "text-sm font-bold text-gray-500 pb-2 hover:text-white transition-all whitespace-nowrap";
        });
        
        const activeBtn = document.getElementById(`tab-${tab}`);
        if(activeBtn) activeBtn.className = "text-sm font-bold text-accentPurple border-b-2 border-accentPurple pb-2 transition-all whitespace-nowrap";
        
        fetchData();
    };

    // 🚨 10. APPROVE LEAD (WITH HISTORY, AUTO-EMAIL & WHATSAPP)
    window.approveLead = async (id) => {
        const agreedPrice = Number(document.getElementById('onboardPrice').value);
        if(!agreedPrice || agreedPrice <= 0) return alert("Please set final agreed price first.");

        if(!confirm("Onboard Client and Generate Portal?")) return;
        const btn = document.getElementById('btnApproveMain');
        btn.textContent = "Processing...";

        try {
            const leadRef = db.collection('inquiries').doc(id);
            const data = (await leadRef.get()).data();
            const portalId = "CK-" + Math.floor(10000 + Math.random() * 90000);
            const pin = Math.floor(1000 + Math.random() * 9000);
            
            // A. Move to Workspace
            await db.collection('client_workspaces').add({
                ...data,
                portalId: portalId,
                portalPin: pin,
                status: 'Architecture in Progress',
                total_price: agreedPrice,
                paid_amount: 0,
                is_preview_active: false,
                admin_locked: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // B. SAVE TO HISTORY LOG
            await db.collection('audit_logs').add({
                ...data,
                portalId: portalId,
                audit_action: 'Approved',
                audit_timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // C. Delete from Inquiries
            await leadRef.delete(); 

            // D. Send Auto Email via Backend
            await fetch('/.netlify/functions/notifyAdmin', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: 'WORKSPACE_APPROVED', email: data.email, name: data.name, portalId: portalId, pin: pin })
            }).catch(e => console.log(e));

            closeLeadModal();
            showToast("Client Onboarded & Email Sent.");

            // E. Open WhatsApp Automatically
            const cleanWA = data.whatsapp.replace(/\D/g, ''); // Remove non-numbers
            const waMsg = encodeURIComponent(`Hi ${data.name},\nYour CoderKaushal Project Portal is ready! 🚀\nI have sent the Secure ID and PIN to your email (${data.email}).\nLog in here: https://coderkaushal.netlify.app/portal`);
            window.open(`https://wa.me/${cleanWA}?text=${waMsg}`, '_blank');

        } catch (err) {
            console.error(err);
            alert("Error onboarding client.");
        } finally {
            btn.textContent = "Approve & Onboard";
        }
    };

    // 11. REJECT LEAD
    window.rejectLead = async (id) => {
        if(!confirm("Reject lead? It will be moved to History logs.")) return;
        try {
            const leadRef = db.collection('inquiries').doc(id);
            const data = (await leadRef.get()).data();

            await db.collection('audit_logs').add({
                ...data,
                audit_action: 'Rejected',
                audit_timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await leadRef.delete();
            closeLeadModal();
            showToast("Lead Rejected & Archived.");
        } catch (err) {
            console.error(err);
        }
    };

    // 12. SMART SEARCH FUNCTION
    window.searchDashboard = (query) => {
        const term = query.toLowerCase();
        const cards = document.querySelectorAll('.searchable-card');
        
        cards.forEach(card => {
            const textContent = card.innerText.toLowerCase();
            if (textContent.includes(term)) {
                card.style.display = 'flex'; 
            } else {
                card.style.display = 'none'; 
            }
        });
    };
    
    function showToast(msg) {
        toastMsg.textContent = msg;
        liveToast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => liveToast.classList.add('translate-y-20', 'opacity-0'), 4000);
    }
});