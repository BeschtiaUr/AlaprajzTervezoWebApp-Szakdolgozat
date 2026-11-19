// 1. FIREBASE KONFIGURÁCIÓ
const firebaseConfig = {
  apiKey: "AIzaSyDHaYZpz2GhafrWh9mxac6bBae2t6cWV70",
  authDomain: "alaprajztervezo.firebaseapp.com",
  projectId: "alaprajztervezo",
  storageBucket: "alaprajztervezo.firebasestorage.app",
  messagingSenderId: "1068490270194",
  appId: "1:1068490270194:web:b5468082f3b1355ee6b76b",
  measurementId: "G-L4477L00VP"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM ELEMEK
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const mainApp = document.getElementById('main-app');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const registerNameInput = document.getElementById('registerNameInput');
const registerNameGroup = document.getElementById('registerNameGroup');
const authError = document.getElementById('authError');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const logoutBtn = document.getElementById('logoutBtn');
const createNewPlanBtn = document.getElementById('createNewPlanBtn');
const dashboardLogoutBtn = document.getElementById('dashboardLogoutBtn');

// --- BEÉPÍTETT SABLONOK ---
const BUILTIN_TEMPLATES = [
    {
        id: 'tpl-studio',
        title: 'Modern Garzonlakás (36 m²)',
        description: 'Egyterű amerikai konyhás nappali hálófülkével és fürdőszobával. Ideális kiindulási alap kisebb lakásokhoz.',
        badge: '1 Szint • Kezdő',
        wallHeight: 135,
        floorPlans: [{
            nodes: [
                { x: 200, y: 140 }, { x: 760, y: 140 },
                { x: 760, y: 540 }, { x: 200, y: 540 },
                { x: 520, y: 140 }, { x: 520, y: 340 },
                { x: 760, y: 340 }
            ],
            walls: [
                { startNode: 0, endNode: 1, thickness: 20 },
                { startNode: 1, endNode: 2, thickness: 20 },
                { startNode: 2, endNode: 3, thickness: 20 },
                { startNode: 3, endNode: 0, thickness: 20 },
                { startNode: 4, endNode: 5, thickness: 14 },
                { startNode: 5, endNode: 6, thickness: 14 }
            ],
            windows: [
                { wallIndex: 0, position: 0.3, length: 80 },
                { wallIndex: 2, position: 0.6, length: 100 }
            ],
            doors: [
                { wallIndex: 3, position: 0.5, length: 50, doorRotation: 0 },
                { wallIndex: 4, position: 0.65, length: 50, doorRotation: 2 }
            ],
            furnitures: [
                { type: 'bed', x: 300, y: 240, angle: 0, size: 100 },
                { type: 'sofa', x: 350, y: 460, angle: 0, size: 110 },
                { type: 'table', x: 620, y: 440, angle: Math.PI / 2, size: 100 }
            ],
            historyStack: []
        }]
    },
    {
        id: 'tpl-family-house',
        title: 'Családi Ház (2 Szintes)',
        description: 'Tágas földszinti nappali-étkező és különálló emeleti hálószobák. Kétszintes topológia.',
        badge: '2 Szint • Haladó',
        wallHeight: 140,
        floorPlans: [
            {
                nodes: [
                    { x: 160, y: 120 }, { x: 840, y: 120 },
                    { x: 840, y: 580 }, { x: 160, y: 580 },
                    { x: 480, y: 120 }, { x: 480, y: 380 },
                    { x: 160, y: 380 }
                ],
                walls: [
                    { startNode: 0, endNode: 1, thickness: 24 },
                    { startNode: 1, endNode: 2, thickness: 24 },
                    { startNode: 2, endNode: 3, thickness: 24 },
                    { startNode: 3, endNode: 0, thickness: 24 },
                    { startNode: 4, endNode: 5, thickness: 16 },
                    { startNode: 5, endNode: 6, thickness: 16 }
                ],
                windows: [
                    { wallIndex: 0, position: 0.75, length: 90 },
                    { wallIndex: 1, position: 0.5, length: 90 },
                    { wallIndex: 2, position: 0.35, length: 100 }
                ],
                doors: [
                    { wallIndex: 2, position: 0.8, length: 55, doorRotation: 1 },
                    { wallIndex: 4, position: 0.5, length: 50, doorRotation: 0 }
                ],
                furnitures: [
                    { type: 'sofa', x: 660, y: 240, angle: 0, size: 120 },
                    { type: 'table', x: 660, y: 440, angle: 0, size: 110 },
                    { type: 'bed', x: 300, y: 240, angle: 0, size: 100 }
                ],
                historyStack: []
            },
            {
                nodes: [
                    { x: 160, y: 120 }, { x: 840, y: 120 },
                    { x: 840, y: 580 }, { x: 160, y: 580 },
                    { x: 500, y: 120 }, { x: 500, y: 580 }
                ],
                walls: [
                    { startNode: 0, endNode: 1, thickness: 24 },
                    { startNode: 1, endNode: 2, thickness: 24 },
                    { startNode: 2, endNode: 3, thickness: 24 },
                    { startNode: 3, endNode: 0, thickness: 24 },
                    { startNode: 4, endNode: 5, thickness: 16 }
                ],
                windows: [
                    { wallIndex: 0, position: 0.25, length: 80 },
                    { wallIndex: 0, position: 0.75, length: 80 }
                ],
                doors: [
                    { wallIndex: 4, position: 0.5, length: 50, doorRotation: 2 }
                ],
                furnitures: [
                    { type: 'bed', x: 320, y: 320, angle: 0, size: 110 },
                    { type: 'bed', x: 680, y: 320, angle: 0, size: 110 }
                ],
                historyStack: []
            }
        ]
    },
    {
        id: 'tpl-office',
        title: 'Közösségi Irodatér és Tárgyaló',
        description: 'Open-office elrendezés leválasztott üvegfalú tárgyalóval és munkaállomásokkal.',
        badge: '1 Szint • Iroda',
        wallHeight: 150,
        floorPlans: [{
            nodes: [
                { x: 140, y: 120 }, { x: 860, y: 120 },
                { x: 860, y: 580 }, { x: 140, y: 580 },
                { x: 600, y: 120 }, { x: 600, y: 360 },
                { x: 860, y: 360 }
            ],
            walls: [
                { startNode: 0, endNode: 1, thickness: 22 },
                { startNode: 1, endNode: 2, thickness: 22 },
                { startNode: 2, endNode: 3, thickness: 22 },
                { startNode: 3, endNode: 0, thickness: 22 },
                { startNode: 4, endNode: 5, thickness: 12 },
                { startNode: 5, endNode: 6, thickness: 12 }
            ],
            windows: [
                { wallIndex: 0, position: 0.25, length: 100 },
                { wallIndex: 0, position: 0.5, length: 100 },
                { wallIndex: 4, position: 0.4, length: 70 }
            ],
            doors: [
                { wallIndex: 3, position: 0.5, length: 60, doorRotation: 0 },
                { wallIndex: 5, position: 0.5, length: 50, doorRotation: 1 }
            ],
            furnitures: [
                { type: 'table', x: 320, y: 260, angle: 0, size: 110 },
                { type: 'table', x: 450, y: 260, angle: 0, size: 110 },
                { type: 'table', x: 730, y: 240, angle: Math.PI / 2, size: 130 },
                { type: 'sofa', x: 360, y: 490, angle: 0, size: 110 }
            ],
            historyStack: []
        }]
    }
];

let cachedUserPlans = [];

function switchScreen(screenName) {
    AppStore.setState('navigation', { activeScreen: screenName }, 'ui');
    loginScreen.style.display = screenName === 'login' ? 'flex' : 'none';
    dashboardScreen.style.display = screenName === 'dashboard' ? 'flex' : 'none';
    mainApp.style.display = screenName === 'editor' ? 'flex' : 'none';

    if (screenName === 'dashboard') {
        checkLocalCacheBanner();
    }
    if (screenName === 'editor') {
        if (window.Viewer3D) Viewer3D.needsInitialFocus = true;
        if (typeof switchViewMode === 'function') switchViewMode('2d');
        if (typeof center2DViewOnPlan === 'function') center2DViewOnPlan();
        AppStore.updateCacheStatusUI('💾 Cache: Aktív', false);
    }
}

// ============================================================================
// 8. HÉT: BÖNGÉSZŐ CACHE ELLENŐRZÉSE ÉS VISSZAÁLLÍTÁSA
// ============================================================================
function checkLocalCacheBanner() {
    const banner = document.getElementById('localCacheRecoveryBanner');
    const details = document.getElementById('cacheRecoveryDetails');
    if (!banner) return;

    const cached = AppStore.getLocalCache();
    if (cached && cached.floorPlans) {
        const wallCount = cached.floorPlans.reduce((acc, f) => acc + (f.walls ? f.walls.length : 0), 0);
        if (wallCount > 0 || (cached.floorPlans[0] && cached.floorPlans[0].furnitures.length > 0)) {
            details.innerText = `Terv: „${cached.currentPlanName || 'Új alaprajz'}” • Mentve: ${cached.savedAtTime || 'nemrég'} (${wallCount} fal)`;
            banner.style.display = 'flex';
            return;
        }
    }
    banner.style.display = 'none';
}

const restoreCacheBtn = document.getElementById('restoreCacheBtn');
if (restoreCacheBtn) {
    restoreCacheBtn.addEventListener('click', () => {
        const cached = AppStore.getLocalCache();
        if (!cached) return;

        AppStore.resetEditorSession();
        currentPlanId = cached.currentPlanId || null;
        currentPlanName = cached.currentPlanName || "Visszaállított terv";
        floorPlans = cached.floorPlans;
        currentFloor = cached.currentFloor || 0;
        wallHeight = cached.wallHeight || 135;
        bgOpacity = cached.bgOpacity !== undefined ? cached.bgOpacity : 1.0;

        const active = floorPlans[currentFloor] || floorPlans[0];
        if (active.nodes) nodes.push(...active.nodes);
        if (active.walls) walls.push(...active.walls);
        if (active.windows) windows.push(...active.windows);
        if (active.doors) doors.push(...active.doors);
        if (active.furnitures) furnitures.push(...active.furnitures);

        syncWallHeightUI();
        switchScreen('editor');
        AppStore.updateCacheStatusUI(`💾 Helyi cache-ből visszaállítva (${cached.savedAtTime})`, false);
        if (typeof updateFloorIndicator === 'function') updateFloorIndicator();
        if (typeof draw === 'function') draw();
        if (typeof updateDataBar === 'function') updateDataBar();
    });
}

const discardCacheBtn = document.getElementById('discardCacheBtn');
if (discardCacheBtn) {
    discardCacheBtn.addEventListener('click', () => {
        AppStore.clearLocalCache();
        checkLocalCacheBanner();
    });
}

function syncWallHeightUI() {
    const hCm = Math.round((wallHeight || 135) * CM_PER_PX);
    const hInput = document.getElementById('wallHeightInputCm');
    const hSlider = document.getElementById('wallHeightSliderCm');
    if (hInput) hInput.value = hCm;
    if (hSlider) hSlider.value = hCm;
}

// Bejelentkezés / Regisztráció Fülváltás
if (tabLoginBtn && tabRegisterBtn) {
    tabLoginBtn.addEventListener('click', () => {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        registerNameGroup.style.display = 'none';
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'none';
        authError.style.display = 'none';
    });

    tabRegisterBtn.addEventListener('click', () => {
        tabRegisterBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        registerNameGroup.style.display = 'flex';
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'block';
        authError.style.display = 'none';
    });
}

// Dashboard Oldalsáv Navigáció
const dashNavBtns = document.querySelectorAll('.dash-nav-btn');
const sectionMeta = {
    'my-plans': { title: 'Saját tervek', subtitle: 'Kezeld a felhőbe mentett építészeti alaprajzaidat.', showSearch: true },
    'templates': { title: 'Sablonok', subtitle: 'Indulj előre felépített, szabványos alaprajzi modellekből.', showSearch: false },
    'trash': { title: 'Lomtár', subtitle: 'Átmenetileg törölt tervek visszaállítása vagy végleges megsemmisítése.', showSearch: true },
    'help': { title: 'Súgó és Irányítás', subtitle: 'Billentyűparancsok és tervezési segédlet a 2D/3D szerkesztőhöz.', showSearch: false },
    'settings': { title: 'Beállítások', subtitle: 'Személyre szabhatod a profilodat és a szerkesztő alapértelmezett paramétereit.', showSearch: false }
};

dashNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        AppStore.setState('navigation', { activeTab: targetTab }, 'ui');

        dashNavBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.dash-tab-content').forEach(sec => {
            sec.style.display = 'none';
        });
        const activeSection = document.getElementById(`tab-${targetTab}`);
        if (activeSection) activeSection.style.display = 'block';

        const meta = sectionMeta[targetTab];
        if (meta) {
            document.getElementById('dashboardSectionTitle').innerText = meta.title;
            document.getElementById('dashboardSectionSubtitle').innerText = meta.subtitle;
            document.getElementById('searchBarContainer').style.display = meta.showSearch ? 'block' : 'none';
        }

        if (targetTab === 'templates') renderTemplates();
        if (targetTab === 'my-plans' || targetTab === 'trash') renderPlanLists();
        if (targetTab === 'settings') populateSettingsForm();
    });
});

const planSearchInput = document.getElementById('planSearchInput');
if (planSearchInput) {
    planSearchInput.addEventListener('input', (e) => {
        AppStore.setState('navigation', { searchQuery: e.target.value.toLowerCase() }, 'ui');
        renderPlanLists();
    });
}

createNewPlanBtn.addEventListener('click', () => {
    AppStore.resetEditorSession();
    syncWallHeightUI();
    switchScreen('editor');

    const thicknessSlider = document.getElementById('thicknessSlider');
    const thicknessDisplay = document.getElementById('thicknessDisplay');
    if (thicknessSlider) thicknessSlider.value = wallThickness;
    if (thicknessDisplay) thicknessDisplay.innerText = wallThickness * CM_PER_PX;

    if (typeof updateFloorIndicator === 'function') updateFloorIndicator();
    if (typeof draw === 'function') draw();
    if (typeof updateDataBar === 'function') updateDataBar();
});

dashboardLogoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
        emailInput.value = '';
        passwordInput.value = '';
    });
});

// AUTH ÁLLAPOTFIGYELŐ
auth.onAuthStateChanged((user) => {
    if (user) {
        const resolvedName = user.displayName ? user.displayName : "User";
        AppStore.setState('auth', {
            user: { uid: user.uid, email: user.email },
            userName: resolvedName,
            isAuthenticated: true
        }, 'ui');

        const userNameInputEl = document.getElementById('userNameInput');
        if (userNameInputEl) userNameInputEl.value = resolvedName;

        const userEmailDisplay = document.getElementById('userEmailDisplay');
        if (userEmailDisplay) userEmailDisplay.innerText = user.email;

        const avatarEl = document.getElementById('userAvatarInitials');
        if (avatarEl) avatarEl.innerText = resolvedName.charAt(0).toUpperCase();

        switchScreen('dashboard');
        fetchUserPlans(user.uid);
        renderTemplates();
    } else {
        AppStore.setState('auth', { user: null, userName: "User", isAuthenticated: false }, 'ui');
        AppStore.resetEditorSession();
        switchScreen('login');
    }
});

// TERVEK LEKÉRDEZÉSE ÉS RENDERELÉSE
function fetchUserPlans(userId) {
    const plansList = document.getElementById('saved-plans-list');
    if (plansList) plansList.innerHTML = '<p class="empty-state-text">Tervek betöltése a felhőből...</p>';

    db.collection("floorplans").where("userId", "==", userId).get()
        .then((querySnapshot) => {
            cachedUserPlans = [];
            querySnapshot.forEach((doc) => {
                cachedUserPlans.push({ id: doc.id, ...doc.data() });
            });
            cachedUserPlans.sort((a, b) => {
                const tA = a.updatedAt ? a.updatedAt.toMillis() : 0;
                const tB = b.updatedAt ? b.updatedAt.toMillis() : 0;
                return tB - tA;
            });
            renderPlanLists();
        })
        .catch((error) => console.error("Hiba a tervek betöltésekor:", error));
}

function renderPlanLists() {
    const myPlansContainer = document.getElementById('saved-plans-list');
    const trashContainer = document.getElementById('trash-plans-list');
    const query = AppStore.state.navigation.searchQuery || "";

    const activePlans = cachedUserPlans.filter(p => !p.isDeleted);
    const trashedPlans = cachedUserPlans.filter(p => p.isDeleted === true);

    const myBadge = document.getElementById('myPlansCountBadge');
    const trashBadge = document.getElementById('trashCountBadge');
    if (myBadge) myBadge.innerText = activePlans.length;
    if (trashBadge) trashBadge.innerText = trashedPlans.length;

    if (myPlansContainer) {
        myPlansContainer.innerHTML = '';
        const filteredActive = activePlans.filter(p => (p.planName || 'Névtelen terv').toLowerCase().includes(query));

        if (filteredActive.length === 0) {
            myPlansContainer.innerHTML = `
                <div class="empty-card">
                    <p>Még nincs megjeleníthető saját terved.</p>
                    <small>Kattints a „+ Új üres terv indítása” gombra, vagy válassz a Sablonok közül!</small>
                </div>`;
        } else {
            filteredActive.forEach(plan => {
                myPlansContainer.appendChild(createPlanCard(plan, false));
            });
        }
    }

    if (trashContainer) {
        trashContainer.innerHTML = '';
        const filteredTrash = trashedPlans.filter(p => (p.planName || 'Névtelen terv').toLowerCase().includes(query));

        if (filteredTrash.length === 0) {
            trashContainer.innerHTML = `
                <div class="empty-card">
                    <p>A lomtár jelenleg üres.</p>
                </div>`;
        } else {
            filteredTrash.forEach(plan => {
                trashContainer.appendChild(createPlanCard(plan, true));
            });
        }
    }
}

function createPlanCard(plan, isTrashCard) {
    const card = document.createElement('div');
    card.className = 'plan-card';

    const dateText = plan.updatedAt ? new Date(plan.updatedAt.toDate()).toLocaleDateString('hu-HU') : "Ismeretlen dátum";
    const displayName = plan.planName ? plan.planName : `Terv (${dateText})`;
    const floorCount = plan.floorPlans ? plan.floorPlans.length : 1;
    const wallCount = (plan.floorPlans && plan.floorPlans[0] && plan.floorPlans[0].walls) ? plan.floorPlans[0].walls.length : 0;

    card.innerHTML = `
        <div class="plan-card-preview">
            <span class="preview-icon">🏠</span>
            <span class="floor-pill">${floorCount} szint • ${wallCount} fal</span>
        </div>
        <div class="plan-card-body">
            <h3 class="plan-title">${displayName}</h3>
            <input type="text" class="plan-rename-input" value="${displayName}" style="display: none;">
            <p class="plan-date">Utoljára módosítva: ${dateText}</p>
        </div>
        <div class="plan-card-actions"></div>
    `;

    const actionsDiv = card.querySelector('.plan-card-actions');
    const titleEl = card.querySelector('.plan-title');
    const renameInput = card.querySelector('.plan-rename-input');

    if (!isTrashCard) {
        const openBtn = document.createElement('button');
        openBtn.className = 'card-btn primary';
        openBtn.innerText = 'Megnyitás';
        openBtn.onclick = () => {
            currentPlanId = plan.id;
            currentPlanName = displayName;
            loadSpecificPlan(plan.id, plan);
        };

        const renameBtn = document.createElement('button');
        renameBtn.className = 'card-btn secondary';
        renameBtn.innerText = '✎';
        renameBtn.title = 'Átnevezés';
        let isEditing = false;

        renameBtn.onclick = () => {
            if (!isEditing) {
                isEditing = true;
                titleEl.style.display = 'none';
                renameInput.style.display = 'block';
                renameBtn.innerText = '✔';
                renameInput.focus();
            } else {
                const newName = renameInput.value.trim();
                if (newName && newName !== displayName) {
                    db.collection("floorplans").doc(plan.id).update({ planName: newName })
                        .then(() => fetchUserPlans(auth.currentUser.uid));
                } else {
                    isEditing = false;
                    titleEl.style.display = 'block';
                    renameInput.style.display = 'none';
                    renameBtn.innerText = '✎';
                }
            }
        };

        renameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') renameBtn.click();
        });

        const trashBtn = document.createElement('button');
        trashBtn.className = 'card-btn danger';
        trashBtn.innerText = '🗑️';
        trashBtn.title = 'Lomtárba helyezés';
        trashBtn.onclick = () => {
            db.collection("floorplans").doc(plan.id).update({
                isDeleted: true,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => fetchUserPlans(auth.currentUser.uid));
        };

        actionsDiv.appendChild(openBtn);
        actionsDiv.appendChild(renameBtn);
        actionsDiv.appendChild(trashBtn);
    } else {
        const restoreBtn = document.createElement('button');
        restoreBtn.className = 'card-btn primary';
        restoreBtn.innerText = '♻️ Visszaállítás';
        restoreBtn.onclick = () => {
            db.collection("floorplans").doc(plan.id).update({
                isDeleted: false
            }).then(() => fetchUserPlans(auth.currentUser.uid));
        };

        const hardDeleteBtn = document.createElement('button');
        hardDeleteBtn.className = 'card-btn danger';
        hardDeleteBtn.innerText = 'Végleges törlés';
        hardDeleteBtn.onclick = () => {
            if (!AppStore.state.settings.confirmDelete || confirm("Biztosan véglegesen törlöd ezt a tervet? Ez a művelet nem vonható vissza.")) {
                db.collection("floorplans").doc(plan.id).delete()
                    .then(() => fetchUserPlans(auth.currentUser.uid));
            }
        };

        actionsDiv.appendChild(restoreBtn);
        actionsDiv.appendChild(hardDeleteBtn);
    }

    return card;
}

const emptyTrashBtn = document.getElementById('emptyTrashBtn');
if (emptyTrashBtn) {
    emptyTrashBtn.addEventListener('click', () => {
        const trashed = cachedUserPlans.filter(p => p.isDeleted === true);
        if (trashed.length === 0) return;
        if (confirm(`Biztosan véglegesen törölni szeretnéd a lomtárban lévő ${trashed.length} db tervet?`)) {
            Promise.all(trashed.map(p => db.collection("floorplans").doc(p.id).delete()))
                .then(() => fetchUserPlans(auth.currentUser.uid));
        }
    });
}

// SABLONOK RENDERELÉSE ÉS BETÖLTÉSE
function renderTemplates() {
    const container = document.getElementById('templates-list');
    if (!container) return;
    container.innerHTML = '';

    BUILTIN_TEMPLATES.forEach(tpl => {
        const card = document.createElement('div');
        card.className = 'plan-card template-card';
        card.innerHTML = `
            <div class="plan-card-preview template-preview">
                <span class="preview-icon">🏛️</span>
                <span class="floor-pill">${tpl.badge}</span>
            </div>
            <div class="plan-card-body">
                <h3 class="plan-title">${tpl.title}</h3>
                <p class="plan-date">${tpl.description}</p>
            </div>
            <div class="plan-card-actions">
                <button class="card-btn primary" style="width: 100%;">Sablon megnyitása szerkesztésre</button>
            </div>
        `;

        card.querySelector('button').onclick = () => {
            AppStore.resetEditorSession();
            currentPlanId = null;
            currentPlanName = tpl.title;
            floorPlans = JSON.parse(JSON.stringify(tpl.floorPlans));
            currentFloor = 0;
            wallHeight = tpl.wallHeight || 135;

            const active = floorPlans[0];
            nodes.push(...active.nodes);
            walls.push(...active.walls);
            windows.push(...active.windows);
            doors.push(...active.doors);
            furnitures.push(...active.furnitures);

            syncWallHeightUI();
            switchScreen('editor');
            AppStore.saveToLocalCache();
            if (typeof updateFloorIndicator === 'function') updateFloorIndicator();
            if (typeof draw === 'function') draw();
            if (typeof updateDataBar === 'function') updateDataBar();
        };

        container.appendChild(card);
    });
}

// BEÁLLÍTÁSOK FÜL LOGIKA
function populateSettingsForm() {
    const s = AppStore.state.settings;
    const nameInput = document.getElementById('settingsNameInput');
    const thickInput = document.getElementById('settingDefaultThickness');
    const thickVal = document.getElementById('settingThicknessVal');
    const gridInput = document.getElementById('settingGridSize');
    const gridVal = document.getElementById('settingGridVal');
    const unitSelect = document.getElementById('settingUnitSystem');

    if (nameInput) nameInput.value = AppStore.state.auth.userName || "User";
    if (thickInput) thickInput.value = s.defaultWallThickness;
    if (thickVal) thickVal.innerText = s.defaultWallThickness;
    if (gridInput) gridInput.value = s.gridSize;
    if (gridVal) gridVal.innerText = s.gridSize;
    if (unitSelect) unitSelect.value = s.unitSystem;
}

const settingDefaultThickness = document.getElementById('settingDefaultThickness');
if (settingDefaultThickness) {
    settingDefaultThickness.addEventListener('input', (e) => {
        document.getElementById('settingThicknessVal').innerText = e.target.value;
    });
}

const settingGridSize = document.getElementById('settingGridSize');
if (settingGridSize) {
    settingGridSize.addEventListener('input', (e) => {
        document.getElementById('settingGridVal').innerText = e.target.value;
    });
}

const saveProfileBtn = document.getElementById('saveProfileBtn');
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
        const newName = document.getElementById('settingsNameInput').value.trim();
        if (newName && auth.currentUser) {
            auth.currentUser.updateProfile({ displayName: newName }).then(() => {
                userName = newName;
                const sideName = document.getElementById('userNameInput');
                if (sideName) sideName.value = newName;
                const avatarEl = document.getElementById('userAvatarInitials');
                if (avatarEl) avatarEl.innerText = newName.charAt(0).toUpperCase();

                const fb = document.getElementById('profileSaveFeedback');
                if (fb) {
                    fb.style.display = 'block';
                    setTimeout(() => fb.style.display = 'none', 2500);
                }
            });
        }
    });
}

const saveEditorSettingsBtn = document.getElementById('saveEditorSettingsBtn');
if (saveEditorSettingsBtn) {
    saveEditorSettingsBtn.addEventListener('click', () => {
        const newThickness = parseInt(document.getElementById('settingDefaultThickness').value, 10);
        const newGrid = parseInt(document.getElementById('settingGridSize').value, 10);
        const newUnit = document.getElementById('settingUnitSystem').value;

        AppStore.saveSettings({
            defaultWallThickness: newThickness,
            gridSize: newGrid,
            unitSystem: newUnit
        });

        wallThickness = newThickness;
        const fb = document.getElementById('settingsSaveFeedback');
        if (fb) {
            fb.style.display = 'block';
            setTimeout(() => fb.style.display = 'none', 2500);
        }
    });
}

// ============================================================================
// FELHŐ MENTÉS ÉS BETÖLTÉS (FIRESTORE + WALLHEIGHT + CACHE SZINKRON)
// ============================================================================
function loadSpecificPlan(planID, planData) {
    switchScreen('editor');

    nodes.length = 0;
    walls.length = 0;
    windows.length = 0;
    doors.length = 0;
    furnitures.length = 0;

    if (planData.nodes) nodes.push(...planData.nodes);
    if (planData.walls) walls.push(...planData.walls);
    if (planData.windows) windows.push(...planData.windows);
    if (planData.doors) doors.push(...planData.doors);
    if (planData.furnitures) furnitures.push(...planData.furnitures);

    loadFloorplan(planID);
}

function saveFloorplan() {
    const user = auth.currentUser;
    if (!user) return;

    floorPlans[currentFloor] = {
        nodes: nodes, walls: walls, windows: windows, doors: doors, furnitures: furnitures, historyStack: []
    };

    const dataToSave = {
        userId: user.uid,
        floorPlans: floorPlans,
        currentFloor: currentFloor,
        wallHeight: wallHeight || 135,
        bgImageData: bgImage ? bgImage.src : null,
        bgOpacity: bgOpacity,
        isDeleted: false,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const nowTime = new Date().toLocaleTimeString('hu-HU');

    if (currentPlanId === null) {
        const promptedName = prompt("Add meg az új alaprajz nevét:", currentPlanName || "Új alaprajz");
        if (promptedName === null) return; // Mégse gomb
        dataToSave.planName = promptedName.trim() || "Új alaprajz";
        currentPlanName = dataToSave.planName;

        db.collection("floorplans").add(dataToSave)
            .then((docRef) => {
                currentPlanId = docRef.id;
                AppStore.saveToLocalCache();
                AppStore.updateCacheStatusUI(`☁️ Felhőbe mentve (${nowTime})`, true);
                alert("Az új terv sikeresen elmentve a felhőbe!");
            });
    } else {
        db.collection("floorplans").doc(currentPlanId).set(dataToSave, { merge: true })
            .then(() => {
                AppStore.saveToLocalCache();
                AppStore.updateCacheStatusUI(`☁️ Felhőbe mentve (${nowTime})`, true);
                alert("A terv sikeresen frissítve a felhőben!");
            });
    }
}

function loadFloorplan(planID) {
    db.collection("floorplans").doc(planID).get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                currentPlanName = data.planName || "Mentett terv";
                wallHeight = data.wallHeight || 135;
                syncWallHeightUI();

                if (data.floorPlans) {
                    floorPlans = data.floorPlans;
                    currentFloor = data.currentFloor || 0;
                } else {
                    floorPlans = [{
                        nodes: data.nodes || [],
                        walls: data.walls || [],
                        windows: data.windows || [],
                        doors: data.doors || [],
                        furnitures: data.furnitures || [],
                        historyStack: []
                    }];
                    currentFloor = 0;
                }
                const activeFloor = floorPlans[currentFloor];

                nodes.length = 0; if (activeFloor.nodes) nodes.push(...activeFloor.nodes);
                walls.length = 0; if (activeFloor.walls) walls.push(...activeFloor.walls);
                windows.length = 0; if (activeFloor.windows) windows.push(...activeFloor.windows);
                doors.length = 0; if (activeFloor.doors) doors.push(...activeFloor.doors);
                furnitures.length = 0; if (activeFloor.furnitures) furnitures.push(...activeFloor.furnitures);
                historyStack.length = 0;

                bgImage = null;
                bgOpacity = data.bgOpacity !== undefined ? data.bgOpacity : 1.0;

                const opacitySlider = document.getElementById('opacitySlider');
                const opacityDisplay = document.getElementById('opacityDisplay');
                if (opacitySlider) opacitySlider.value = bgOpacity;
                if (opacityDisplay) opacityDisplay.innerText = bgOpacity.toFixed(2);

                if (data.bgImageData) {
                    const img = new Image();
                    img.onload = () => {
                        bgImage = img;
                        if (typeof draw === "function") draw();
                    };
                    img.src = data.bgImageData;
                }

                AppStore.updateCacheStatusUI('☁️ Felhőből betöltve', true);
                if (window.Viewer3D) Viewer3D.needsInitialFocus = true;

                setTimeout(() => {
                    if (typeof updateFloorIndicator === "function") updateFloorIndicator();
                    if (typeof center2DViewOnPlan === "function") center2DViewOnPlan();
                    else if (typeof draw === "function") draw();
                    if (typeof notify3DSceneChanged === "function") notify3DSceneChanged(true);
                    if (typeof updateDataBar === "function") updateDataBar();
                }, 100);
            }
        })
        .catch((error) => console.error("Hiba a betöltés során:", error));
}

// LOGIN / REGISTER / LOGOUT
loginBtn.addEventListener('click', () => {
    authError.style.display = 'none';
    auth.signInWithEmailAndPassword(emailInput.value.trim(), passwordInput.value)
        .catch(error => {
            authError.innerText = "Sikertelen belépés: " + error.message;
            authError.style.display = 'block';
        });
});

registerBtn.addEventListener('click', () => {
    authError.style.display = 'none';
    const customName = registerNameInput ? registerNameInput.value.trim() : "";
    auth.createUserWithEmailAndPassword(emailInput.value.trim(), passwordInput.value)
        .then((cred) => {
            if (customName && cred.user) {
                return cred.user.updateProfile({ displayName: customName });
            }
        })
        .catch(error => {
            authError.innerText = "Sikertelen regisztráció: " + error.message;
            authError.style.display = 'block';
        });
});

logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
        emailInput.value = '';
        passwordInput.value = '';
    });
});