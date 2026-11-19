// ============================================================================
// KÖZPONTI ÁLLAPOTTÉR (APPSTORE) + BÖNGÉSZŐ CACHE + 3D PARAMÉTEREK (8. HÉT)
// ============================================================================

const canvas = document.getElementById('floorplan');
const ctx = canvas ? canvas.getContext('2d') : null;

const SNAP_DISTANCE = 15;
let GRID_SIZE = 20;
const CM_PER_PX = 2; // Lépték: 1 pixel = 2 cm (pl. 135 px = 270 cm falmagasság)
const LOCAL_CACHE_KEY = 'floorplanner_active_work_cache_v1';

// Négy fő bútorkategória és alapértelmezett méreteik (pixelben, 1 px = 2 cm)
const FURNITURE_CATALOG = {
    // 1. NAPPALI
    sofa:            { category: 'living',  label: 'Kanapé',          w: 100, h: 50 },
    tv_unit:         { category: 'living',  label: 'TV szekrény',     w: 80,  h: 24 },
    coffee_table:    { category: 'living',  label: 'Dohányzóasztal',  w: 50,  h: 30 },
    armchair:        { category: 'living',  label: 'Fotel',           w: 42,  h: 42 },

    // 2. KONYHA
    table:           { category: 'kitchen', label: 'Étkezőasztal',    w: 45,  h: 80 },
    kitchen_counter: { category: 'kitchen', label: 'Konyhapult',      w: 100, h: 30 },
    stove:           { category: 'kitchen', label: 'Tűzhely',         w: 30,  h: 30 },
    fridge:          { category: 'kitchen', label: 'Hűtőszekrény',    w: 35,  h: 35 },

    // 3. HÁLÓSZOBA
    bed:             { category: 'bedroom', label: 'Franciaágy',      w: 80,  h: 100 },
    wardrobe:        { category: 'bedroom', label: 'Gardróbszekrény', w: 90,  h: 30 },
    nightstand:      { category: 'bedroom', label: 'Éjjeliszekrény',  w: 24,  h: 22 },

    // 4. EGYÉB
    bathtub:         { category: 'other',   label: 'Fürdőkád',        w: 85,  h: 38 },
    toilet:          { category: 'other',   label: 'WC csésze',       w: 22,  h: 32 },
    desk:            { category: 'other',   label: 'Íróasztal',       w: 70,  h: 35 },
    plant:           { category: 'other',   label: 'Szobanövény',     w: 25,  h: 25 }
};

const AppStore = {
    state: {
        auth: {
            user: null,
            userName: "User",
            isAuthenticated: false
        },

        navigation: {
            activeScreen: "login",
            activeTab: "my-plans",
            searchQuery: ""
        },

        settings: {
            defaultWallThickness: 20, // 40 cm
            defaultWallHeight: 135,   // 270 cm
            defaultFurnitureSize: 100,
            gridSize: 20,
            unitSystem: "cm",
            confirmDelete: true
        },

        project: {
            currentPlanId: null,
            currentPlanName: "Új alaprajz",
            currentFloor: 0,
            floorPlans: [
                { nodes: [], walls: [], windows: [], doors: [], furnitures: [], historyStack: [] },
                { nodes: [], walls: [], windows: [], doors: [], furnitures: [], historyStack: [] }
            ],
            bgImage: null,
            bgOpacity: 1.0,
            lastCacheSavedAt: null,
            isCloudSynced: false
        },

        editor: {
            viewMode: "2d", // '2d' | 'split' | '3d'
            splitRatio: 50, // Osztott nézet bal (2D) panel aránya (%)
            showAllFloors3D: true,
            nodes: [],
            walls: [],
            windows: [],
            doors: [],
            furnitures: [],
            historyStack: [],
            currentTool: "walls",
            activeFurnitureCategory: "living",
            wallThickness: 20,
            wallHeight: 135, // 135 px = 270 cm
            furnitureSize: 100,
            selectedFurnitureType: null,
            currentFurnitureAngle: 0,
            isNinetyDegreeMode: false,
            isShowingPlans: true
        },

        viewport: {
            zoomFactor: 1.0,
            cameraOffset: { x: 0, y: 0 },
            isPanning: false,
            lastPanPos: { x: 0, y: 0 }
        },

        interaction: {
            isDrawing: false,
            currentStartNode: null,
            mousePosition: { x: 0, y: 0 },
            selectedElement: { type: null, index: null },
            draggedWallIndex: null,
            hoveredWallIndex: null,
            maybeDraggingWallIndex: null,
            mouseDownPos: { x: 0, y: 0 },
            lastMousePos: { x: 0, y: 0 },
            hoveredFurnitureIndex: null,
            draggedFurnitureIndex: null,
            hoveredDoorIndex: null,
            draggedDoorIndex: null,
            hoveredWindowIndex: null,
            draggedWindowIndex: null
        }
    },

    listeners: {
        ui: [],
        canvas: [],
        all: []
    },

    subscribe(channel, callback) {
        if (!this.listeners[channel]) this.listeners[channel] = [];
        this.listeners[channel].push(callback);
        return () => {
            this.listeners[channel] = this.listeners[channel].filter(cb => cb !== callback);
        };
    },

    notify(channel = 'all') {
        if (channel === 'ui' || channel === 'all') {
            this.listeners.ui.forEach(cb => cb(this.state));
        }
        if (channel === 'canvas' || channel === 'all') {
            this.listeners.canvas.forEach(cb => cb(this.state));
        }
        this.listeners.all.forEach(cb => cb(this.state));
    },

    setState(sliceName, partialState, notifyChannel = 'all') {
        if (this.state[sliceName]) {
            Object.assign(this.state[sliceName], partialState);
            this.notify(notifyChannel);
        }
    },

    resetEditorSession() {
        const defThickness = this.state.settings.defaultWallThickness || 20;
        const defHeight = this.state.settings.defaultWallHeight || 135;
        const defFurnSize = this.state.settings.defaultFurnitureSize || 100;

        this.state.project.currentPlanId = null;
        this.state.project.currentPlanName = "Új alaprajz";
        this.state.project.currentFloor = 0;
        this.state.project.floorPlans = [
            { nodes: [], walls: [], windows: [], doors: [], furnitures: [], historyStack: [] }
        ];
        this.state.project.bgImage = null;
        this.state.project.bgOpacity = 1.0;
        this.state.project.isCloudSynced = false;

        this.state.editor.viewMode = "2d";
        this.state.editor.nodes.length = 0;
        this.state.editor.walls.length = 0;
        this.state.editor.windows.length = 0;
        this.state.editor.doors.length = 0;
        this.state.editor.furnitures.length = 0;
        this.state.editor.historyStack.length = 0;
        this.state.editor.wallThickness = defThickness;
        this.state.editor.wallHeight = defHeight;
        this.state.editor.furnitureSize = defFurnSize;

        this.state.viewport.zoomFactor = 1.0;
        this.state.viewport.cameraOffset = { x: 0, y: 0 };
        this.state.viewport.isPanning = false;

        this.resetInteractions();
        this.notify('all');
    },

    resetInteractions() {
        Object.assign(this.state.interaction, {
            isDrawing: false,
            currentStartNode: null,
            selectedElement: { type: null, index: null },
            draggedWallIndex: null,
            hoveredWallIndex: null,
            maybeDraggingWallIndex: null,
            hoveredFurnitureIndex: null,
            draggedFurnitureIndex: null,
            hoveredDoorIndex: null,
            draggedDoorIndex: null,
            hoveredWindowIndex: null,
            draggedWindowIndex: null
        });
    },

    // ========================================================================
    // 8. HÉT: BÖNGÉSZŐ CACHE (AUTOMATIKUS HELYI MENTÉS ÉS VISSZAÁLLÍTÁS)
    // ========================================================================
    saveToLocalCache() {
        try {
            // Csak akkor mentünk, ha a szerkesztő aktív
            if (this.state.navigation.activeScreen !== 'editor') return;

            const currentFloorIdx = this.state.project.currentFloor || 0;
            const syncedFloors = JSON.parse(JSON.stringify(this.state.project.floorPlans || []));
            syncedFloors[currentFloorIdx] = {
                nodes: JSON.parse(JSON.stringify(this.state.editor.nodes)),
                walls: JSON.parse(JSON.stringify(this.state.editor.walls)),
                windows: JSON.parse(JSON.stringify(this.state.editor.windows)),
                doors: JSON.parse(JSON.stringify(this.state.editor.doors)),
                furnitures: JSON.parse(JSON.stringify(this.state.editor.furnitures)),
                historyStack: []
            };

            const hasAnyContent = syncedFloors.some(
                f => (f.walls && f.walls.length > 0) || (f.furnitures && f.furnitures.length > 0)
            );
            if (!hasAnyContent && !this.state.project.currentPlanId) return;

            const nowStr = new Date().toLocaleTimeString('hu-HU');
            const payload = {
                userId: this.state.auth.user ? this.state.auth.user.uid : null,
                currentPlanId: this.state.project.currentPlanId,
                currentPlanName: this.state.project.currentPlanName || "Új alaprajz",
                currentFloor: currentFloorIdx,
                floorPlans: syncedFloors,
                wallHeight: this.state.editor.wallHeight || 135,
                bgOpacity: this.state.project.bgOpacity,
                savedAt: Date.now(),
                savedAtTime: nowStr
            };

            localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(payload));
            this.state.project.lastCacheSavedAt = nowStr;
            this.state.project.isCloudSynced = false;
            this.updateCacheStatusUI(`💾 Helyi cache mentve (${nowStr})`, false);
        } catch (err) {
            console.warn("Nem sikerült a böngésző cache mentése:", err);
        }
    },

    getLocalCache() {
        try {
            const raw = localStorage.getItem(LOCAL_CACHE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    },

    clearLocalCache() {
        localStorage.removeItem(LOCAL_CACHE_KEY);
    },

    updateCacheStatusUI(text, isCloud = false) {
        const badge = document.getElementById('cacheStatusBadge');
        if (badge) {
            badge.innerText = text;
            badge.className = isCloud ? 'cache-status-badge synced' : 'cache-status-badge local';
        }
        const planTitleHeader = document.getElementById('activePlanTitleDisplay');
        if (planTitleHeader) {
            planTitleHeader.innerText = this.state.project.currentPlanName || "Új alaprajz";
        }
    },

    loadSettings() {
        try {
            const saved = localStorage.getItem('floorplanner_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(this.state.settings, parsed);
                GRID_SIZE = this.state.settings.gridSize || 20;
                this.state.editor.wallThickness = this.state.settings.defaultWallThickness || 20;
                this.state.editor.wallHeight = this.state.settings.defaultWallHeight || 135;
                this.state.editor.furnitureSize = this.state.settings.defaultFurnitureSize || 100;
            }
        } catch (e) {
            console.warn("Nem sikerült betölteni a helyi beállításokat:", e);
        }
    },

    saveSettings(newSettings) {
        Object.assign(this.state.settings, newSettings);
        GRID_SIZE = this.state.settings.gridSize;
        localStorage.setItem('floorplanner_settings', JSON.stringify(this.state.settings));
        this.notify('all');
    }
};

// PROXY RÉTEG A GLOBÁLIS VÁLTOZÓKHOZ
const stateMappings = {
    userName: ['auth', 'userName'],
    currentPlanId: ['project', 'currentPlanId'],
    currentPlanName: ['project', 'currentPlanName'],
    currentFloor: ['project', 'currentFloor'],
    floorPlans: ['project', 'floorPlans'],
    bgImage: ['project', 'bgImage'],
    bgOpacity: ['project', 'bgOpacity'],
    viewMode: ['editor', 'viewMode'],
    splitRatio: ['editor', 'splitRatio'],
    showAllFloors3D: ['editor', 'showAllFloors3D'],
    nodes: ['editor', 'nodes'],
    walls: ['editor', 'walls'],
    windows: ['editor', 'windows'],
    doors: ['editor', 'doors'],
    furnitures: ['editor', 'furnitures'],
    historyStack: ['editor', 'historyStack'],
    currentTool: ['editor', 'currentTool'],
    activeFurnitureCategory: ['editor', 'activeFurnitureCategory'],
    wallThickness: ['editor', 'wallThickness'],
    wallHeight: ['editor', 'wallHeight'],
    furnitureSize: ['editor', 'furnitureSize'],
    selectedFurnitureType: ['editor', 'selectedFurnitureType'],
    currentFurnitureAngle: ['editor', 'currentFurnitureAngle'],
    isNinetyDegreeMode: ['editor', 'isNinetyDegreeMode'],
    isShowingPlans: ['editor', 'isShowingPlans'],
    zoomFactor: ['viewport', 'zoomFactor'],
    cameraOffset: ['viewport', 'cameraOffset'],
    isPanning: ['viewport', 'isPanning'],
    lastPanPos: ['viewport', 'lastPanPos'],
    isDrawing: ['interaction', 'isDrawing'],
    currentStartNode: ['interaction', 'currentStartNode'],
    mousePosition: ['interaction', 'mousePosition'],
    selectedElement: ['interaction', 'selectedElement'],
    draggedWallIndex: ['interaction', 'draggedWallIndex'],
    hoveredWallIndex: ['interaction', 'hoveredWallIndex'],
    maybeDraggingWallIndex: ['interaction', 'maybeDraggingWallIndex'],
    mouseDownPos: ['interaction', 'mouseDownPos'],
    lastMousePos: ['interaction', 'lastMousePos'],
    hoveredFurnitureIndex: ['interaction', 'hoveredFurnitureIndex'],
    draggedFurnitureIndex: ['interaction', 'draggedFurnitureIndex'],
    hoveredDoorIndex: ['interaction', 'hoveredDoorIndex'],
    draggedDoorIndex: ['interaction', 'draggedDoorIndex'],
    hoveredWindowIndex: ['interaction', 'hoveredWindowIndex'],
    draggedWindowIndex: ['interaction', 'draggedWindowIndex']
};

Object.keys(stateMappings).forEach(globalVarName => {
    const [slice, key] = stateMappings[globalVarName];
    Object.defineProperty(window, globalVarName, {
        get() { return AppStore.state[slice][key]; },
        set(val) { AppStore.state[slice][key] = val; },
        configurable: true
    });
});

AppStore.loadSettings();