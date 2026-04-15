// js/admin.js
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
    let currentTab = 'leads'; // tabs: 'leads', 'workspaces', 'history'
    let unsubscribe = null; 
    let currentEditingId = null;

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

    // 4. FETCH DATA (Tabs Support Leads, Workspaces, and History)
    function fetchData() {
        if (unsubscribe) unsubscribe();
        
        let col = 'inquiries';
        if(currentTab === 'workspaces') col = 'client_workspaces';
        if(currentTab === 'history') col = 'audit_logs'; // Naya History Collection
        
        // History ko audit_timestamp se sort karenge
        let orderField = currentTab === 'history' ? 'audit_timestamp' : 'timestamp';

        unsubscribe = db.collection(col).orderBy(orderField, 'desc').onSnapshot((snapshot) => {
            leadsContainer.innerHTML = '';
            snapshot.forEach((doc) => {
                if(currentTab === 'leads') leadsContainer.innerHTML += renderLeadCard(doc);
                else if(currentTab === 'workspaces') leadsContainer.innerHTML += renderWorkspaceCard(doc);
                else if(currentTab === 'history') leadsContainer.innerHTML += renderHistoryCard(doc);
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

    // 🚨 NAYA: HISTORY CARD
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
        document.getElementById('btnRejectMain').onclick = () => rejectLead(id); // Using new Reject Logic
    };

    window.closeLeadModal = () => {
        const modal = document.getElementById('leadDetailsModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    // 7. MANAGEMENT MODAL LOGIC
    window.openMgmtModal = async (id) => {
        currentEditingId = id;
        const modal = document.getElementById('mgmtModal');
        const doc = await db.collection('client_workspaces').doc(id).get();
        const data = doc.data();

        document.getElementById('modalClientName').textContent = data.name;
        document.getElementById('modalProjectId').textContent = `PORTAL ID: ${data.portalId || 'N/A'} | SECURE PIN: ${data.portalPin || 'N/A'}`;
        
        document.getElementById('mTotal').value = data.total_price || 0;
        document.getElementById('mPaid').value = data.paid_amount || 0;
        document.getElementById('mStatus').value = data.status || "Architecture in Progress";
        document.getElementById('mUrl').value = data.tunnel_url || "";
        document.getElementById('mPreviewActive').checked = data.is_preview_active || false;
        document.getElementById('mAssets').value = data.asset_link || "";

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    window.closeMgmtModal = () => {
        const modal = document.getElementById('mgmtModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    window.saveProjectChanges = async () => {
        const btn = event.target;
        btn.textContent = "Saving...";
        await db.collection('client_workspaces').doc(currentEditingId).update({
            total_price: Number(document.getElementById('mTotal').value),
            paid_amount: Number(document.getElementById('mPaid').value),
            status: document.getElementById('mStatus').value,
            tunnel_url: document.getElementById('mUrl').value,
            is_preview_active: document.getElementById('mPreviewActive').checked,
            asset_link: document.getElementById('mAssets').value
        });
        closeMgmtModal();
        btn.textContent = "Save System State";
        showToast("System State Updated");
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
        const lBtn = document.getElementById('tab-leads');
        const wBtn = document.getElementById('tab-workspaces');
        const hBtn = document.getElementById('tab-history'); // Naya History Tab
        
        // Reset all
        [lBtn, wBtn, hBtn].forEach(btn => {
            if(btn) btn.className = "text-sm font-bold text-gray-500 pb-4 hover:text-white transition-all";
        });
        
        // Active Style
        const activeBtn = document.getElementById(`tab-${tab}`);
        if(activeBtn) activeBtn.className = "text-sm font-bold text-accentPurple border-b-2 border-accentPurple pb-4 transition-all";
        
        fetchData();
    };

    // 🚨 10. APPROVE LEAD (WITH HISTORY & AUTO EMAIL)
    window.approveLead = async (id) => {
        if(!confirm("Onboard Client and Generate Portal?")) return;
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
                total_price: 0,
                paid_amount: 0,
                is_preview_active: false,
                admin_locked: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // B. SAVE TO HISTORY LOG (Never Delete)
            await db.collection('audit_logs').add({
                ...data,
                portalId: portalId,
                audit_action: 'Approved',
                audit_timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // C. Delete from Inquiries (Queue)
            await leadRef.delete(); 
            closeLeadModal();
            showToast("Client Onboarded & Logged.");

            // D. AUTO EMAIL GENERATOR
            const emailSubject = encodeURIComponent(`Your Project Portal is Ready | CoderKaushal`);
            const emailBody = encodeURIComponent(`Hello ${data.name},\n\nYour architecture request has been approved. Here are your secure portal credentials:\n\n🔗 Portal Link: https://coderkaushal.com/portal\n🆔 Portal ID: ${portalId}\n🔑 Secure PIN: ${pin}\n\nYou can track live progress, review architecture, and manage milestones directly from your portal.\n\nBest Regards,\nAshutosh Kaushal\nLead Architect`);
            window.location.href = `mailto:${data.email}?subject=${emailSubject}&body=${emailBody}`;

        } catch (err) {
            console.error(err);
            alert("Error onboarding client.");
        }
    };

    // 🚨 11. REJECT LEAD (SAVE TO HISTORY INSTEAD OF JUST DELETING)
    window.rejectLead = async (id) => {
        if(!confirm("Reject lead? It will be moved to History logs.")) return;
        try {
            const leadRef = db.collection('inquiries').doc(id);
            const data = (await leadRef.get()).data();

            // Save to History Log
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

    // 🚨 12. SMART SEARCH FUNCTION (Instant Filter)
    window.searchDashboard = (query) => {
        const term = query.toLowerCase();
        const cards = document.querySelectorAll('.searchable-card');
        
        cards.forEach(card => {
            const textContent = card.innerText.toLowerCase();
            if (textContent.includes(term)) {
                card.style.display = 'flex'; // Restore flex behavior
            } else {
                card.style.display = 'none'; // Hide
            }
        });
    };
    
    function showToast(msg) {
        toastMsg.textContent = msg;
        liveToast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => liveToast.classList.add('translate-y-20', 'opacity-0'), 4000);
    }
});