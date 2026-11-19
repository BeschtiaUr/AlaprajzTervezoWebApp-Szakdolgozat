const selectBtn = document.getElementById('selectBtn');
const wallsBtn = document.getElementById('wallsBtn');
const windowsBtn = document.getElementById('windowsBtn');
const doorsBtn = document.getElementById('doorsBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const switchToUpperFloorBtn = document.getElementById('switchToUpperFloorBtn');
const switchToLowerFloorBtn = document.getElementById('switchToLowerFloorBtn');
const saveToCloudBtn = document.getElementById('saveToCloudBtn');

// --- 8–9. HÉT: 2D / OSZTOTT / 3D NÉZETVÁLTÁS, ÁTMÉRETEZÉS ÉS 3D FALMAGASSÁG ---
const view2DBtn = document.getElementById('view2DBtn');
const viewSplitBtn = document.getElementById('viewSplitBtn');
const view3DBtn = document.getElementById('view3DBtn');
const reset3DCameraBtn = document.getElementById('reset3DCameraBtn');
const canvasContainer = document.getElementById('canvasContainer');
const pane2D = document.getElementById('pane-2d');
const pane3D = document.getElementById('pane-3d');
const splitResizer = document.getElementById('splitResizer');
const threeContainer = document.getElementById('three-container');
const wallHeightInputCm = document.getElementById('wallHeightInputCm');
const wallHeightSliderCm = document.getElementById('wallHeightSliderCm');
const showAllFloors3DCheckbox = document.getElementById('showAllFloors3DCheckbox');

function resize2DCanvas(preserveCenter = true) {
    if (!canvas || !pane2D) return;
    const newW = pane2D.clientWidth;
    const newH = pane2D.clientHeight;
    if (newW < 40 || newH < 40) return;

    if (canvas.width === newW && canvas.height === newH) return;

    if (preserveCenter && canvas.width > 0 && canvas.height > 0) {
        const worldCenterX = (canvas.width / 2 - cameraOffset.x) / zoomFactor;
        const worldCenterY = (canvas.height / 2 - cameraOffset.y) / zoomFactor;
        canvas.width = newW;
        canvas.height = newH;
        cameraOffset.x = newW / 2 - worldCenterX * zoomFactor;
        cameraOffset.y = newH / 2 - worldCenterY * zoomFactor;
    } else {
        canvas.width = newW;
        canvas.height = newH;
    }
    draw();
}

function center2DViewOnPlan() {
    if (!canvas || !pane2D) return;
    const w = pane2D.clientWidth;
    const h = pane2D.clientHeight;
    if (w >= 40 && h >= 40) {
        canvas.width = w;
        canvas.height = h;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let hasAny = false;
    nodes.forEach(n => {
        hasAny = true;
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
    });
    furnitures.forEach(f => {
        hasAny = true;
        if (f.x < minX) minX = f.x;
        if (f.x > maxX) maxX = f.x;
        if (f.y < minY) minY = f.y;
        if (f.y > maxY) maxY = f.y;
    });

    const targetX = hasAny ? (minX + maxX) / 2 : 500;
    const targetY = hasAny ? (minY + maxY) / 2 : 350;

    cameraOffset.x = canvas.width / 2 - targetX * zoomFactor;
    cameraOffset.y = canvas.height / 2 - targetY * zoomFactor;
    draw();
}

function applySplitLayout() {
    if (!pane2D || !pane3D) return;
    if (viewMode === 'split') {
        const ratio = Math.max(25, Math.min(75, splitRatio || 50));
        pane2D.style.flex = `0 0 calc(${ratio}% - 6px)`;
        pane3D.style.flex = '1 1 0%';
    } else {
        pane2D.style.flex = '1 1 100%';
        pane3D.style.flex = '1 1 100%';
    }
}

function switchViewMode(mode) {
    if (mode !== '2d' && mode !== 'split' && mode !== '3d') mode = '2d';
    viewMode = mode;

    const left2DToolsGroup = document.getElementById('left2DToolsGroup');
    const left3DInfoGroup = document.getElementById('left3DInfoGroup');
    const clearCanvasBtn = document.getElementById('clearBtn');

    const wall3DSettingsWidget = document.getElementById('wall3DSettingsWidget');
    const rightFurnitureCatalogWidget = document.getElementById('rightFurnitureCatalogWidget');
    const wallSettingsWidget = document.getElementById('wallSettingsWidget');
    const furnitureSettingsWidget = document.getElementById('furnitureSettingsWidget');
    const emptySelectionBox = document.getElementById('emptySelectionBox');
    const dynamicPropertyEditor = document.getElementById('dynamicPropertyEditor');
    const propertiesWidgetTitle = document.getElementById('propertiesWidgetTitle');

    // Felső nézetváltó gombok állapota
    if (view2DBtn) view2DBtn.classList.toggle('active', mode === '2d');
    if (viewSplitBtn) viewSplitBtn.classList.toggle('active', mode === 'split');
    if (view3DBtn) view3DBtn.classList.toggle('active', mode === '3d');
    if (reset3DCameraBtn) reset3DCameraBtn.style.display = (mode === '3d' || mode === 'split') ? 'inline-block' : 'none';

    if (canvasContainer) {
        canvasContainer.classList.remove('mode-2d', 'mode-split', 'mode-3d');
        canvasContainer.classList.add(`mode-${mode}`);
    }

    if (mode === '3d') {
        // Kizárólag 3D nézet
        if (pane2D) pane2D.style.display = 'none';
        if (splitResizer) splitResizer.style.display = 'none';
        if (pane3D) pane3D.style.display = 'flex';
        applySplitLayout();

        // Bal oldali sáv: 3D segédlet
        if (left2DToolsGroup) left2DToolsGroup.style.display = 'none';
        if (left3DInfoGroup) left3DInfoGroup.style.display = 'flex';
        if (clearCanvasBtn) clearCanvasBtn.style.display = 'none';

        // Jobb oldali sáv: 3D Falbeállítások + Mentés & Export
        if (wall3DSettingsWidget) wall3DSettingsWidget.style.display = 'flex';
        if (rightFurnitureCatalogWidget) rightFurnitureCatalogWidget.style.display = 'none';
        if (wallSettingsWidget) wallSettingsWidget.style.display = 'none';
        if (furnitureSettingsWidget) furnitureSettingsWidget.style.display = 'none';
        if (emptySelectionBox) emptySelectionBox.style.display = 'none';
        if (dynamicPropertyEditor) dynamicPropertyEditor.style.display = 'none';
        if (propertiesWidgetTitle) propertiesWidgetTitle.innerText = 'Mentés & Export';

        if (window.Viewer3D) {
            Viewer3D.init();
            Viewer3D.onResize();
            Viewer3D.rebuild3DScene();
            requestAnimationFrame(() => Viewer3D.onResize());
        }
    } else if (mode === 'split') {
        // Osztott 2D / 3D képernyő: bal oldalt 2D szerkesztő, jobb oldalt élő 3D nézet
        if (pane2D) pane2D.style.display = 'flex';
        if (splitResizer) splitResizer.style.display = 'flex';
        if (pane3D) pane3D.style.display = 'flex';
        applySplitLayout();

        // Bal oldali sáv: teljes 2D szerkesztő eszköztár elérhető marad
        if (left2DToolsGroup) left2DToolsGroup.style.display = 'flex';
        if (left3DInfoGroup) left3DInfoGroup.style.display = 'none';
        if (clearCanvasBtn) clearCanvasBtn.style.display = 'block';

        // Jobb oldali sáv: 3D Falbeállítások + Bútorkatalógus + Dinamikus Tulajdonságok
        if (wall3DSettingsWidget) wall3DSettingsWidget.style.display = 'flex';
        if (rightFurnitureCatalogWidget) rightFurnitureCatalogWidget.style.display = 'flex';
        if (wallSettingsWidget) wallSettingsWidget.style.display = (currentTool === 'walls') ? 'flex' : 'none';
        if (furnitureSettingsWidget) furnitureSettingsWidget.style.display = (currentTool === 'furniture') ? 'flex' : 'none';
        if (propertiesWidgetTitle) propertiesWidgetTitle.innerText = 'Tulajdonságok';

        updatePropertyPanelUI();
        resize2DCanvas(true);
        draw();

        if (window.Viewer3D) {
            Viewer3D.init();
            Viewer3D.onResize();
            Viewer3D.rebuild3DScene();
            requestAnimationFrame(() => {
                resize2DCanvas(true);
                Viewer3D.onResize();
            });
        }
    } else {
        // Kizárólag 2D tervrajz nézet
        if (pane2D) pane2D.style.display = 'flex';
        if (splitResizer) splitResizer.style.display = 'none';
        if (pane3D) pane3D.style.display = 'none';
        applySplitLayout();

        // Bal oldali sáv: 2D rajzeszközök
        if (left2DToolsGroup) left2DToolsGroup.style.display = 'flex';
        if (left3DInfoGroup) left3DInfoGroup.style.display = 'none';
        if (clearCanvasBtn) clearCanvasBtn.style.display = 'block';

        // Jobb oldali sáv: 2D panelek
        if (wall3DSettingsWidget) wall3DSettingsWidget.style.display = 'none';
        if (rightFurnitureCatalogWidget) rightFurnitureCatalogWidget.style.display = 'flex';
        if (wallSettingsWidget) wallSettingsWidget.style.display = (currentTool === 'walls') ? 'flex' : 'none';
        if (furnitureSettingsWidget) furnitureSettingsWidget.style.display = (currentTool === 'furniture') ? 'flex' : 'none';
        if (propertiesWidgetTitle) propertiesWidgetTitle.innerText = 'Tulajdonságok';

        updatePropertyPanelUI();
        resize2DCanvas(true);
        draw();
        requestAnimationFrame(() => resize2DCanvas(true));
    }
}

if (view2DBtn) view2DBtn.addEventListener('click', () => switchViewMode('2d'));
if (viewSplitBtn) viewSplitBtn.addEventListener('click', () => switchViewMode('split'));
if (view3DBtn) view3DBtn.addEventListener('click', () => switchViewMode('3d'));
if (reset3DCameraBtn) {
    reset3DCameraBtn.addEventListener('click', () => {
        if (window.Viewer3D) Viewer3D.resetCamera();
    });
}

// Osztott nézet elválasztó sávjának húzása (25% .. 75%)
let isResizingSplit = false;
if (splitResizer) {
    splitResizer.addEventListener('mousedown', (e) => {
        if (viewMode !== 'split') return;
        e.preventDefault();
        isResizingSplit = true;
        splitResizer.classList.add('dragging');
        document.body.classList.add('is-resizing-split');
    });
}

window.addEventListener('mousemove', (e) => {
    if (!isResizingSplit || !canvasContainer) return;
    const rect = canvasContainer.getBoundingClientRect();
    const usableW = rect.width - 28; // 14px bal + 14px jobb padding
    if (usableW <= 100) return;
    const relX = e.clientX - (rect.left + 14);
    const pct = Math.max(25, Math.min(75, (relX / usableW) * 100));
    splitRatio = pct;
    applySplitLayout();
    resize2DCanvas(true);
    if (window.Viewer3D) Viewer3D.onResize();
});

window.addEventListener('mouseup', () => {
    if (!isResizingSplit) return;
    isResizingSplit = false;
    if (splitResizer) splitResizer.classList.remove('dragging');
    document.body.classList.remove('is-resizing-split');
    resize2DCanvas(true);
    if (window.Viewer3D) Viewer3D.onResize();
});

window.addEventListener('resize', () => {
    if (viewMode === '2d' || viewMode === 'split') {
        resize2DCanvas(true);
    }
});

function updateWallHeightFromCm(cmValue) {
    const clampedCm = Math.max(100, Math.min(500, parseFloat(cmValue) || 270));
    wallHeight = clampedCm / CM_PER_PX;
    if (wallHeightInputCm) wallHeightInputCm.value = Math.round(clampedCm);
    if (wallHeightSliderCm) wallHeightSliderCm.value = Math.round(clampedCm);
    if (window.AppStore) AppStore.saveToLocalCache();
    notify3DSceneChanged();
}

if (wallHeightSliderCm) {
    wallHeightSliderCm.addEventListener('input', (e) => updateWallHeightFromCm(e.target.value));
}
if (wallHeightInputCm) {
    wallHeightInputCm.addEventListener('change', (e) => updateWallHeightFromCm(e.target.value));
}
if (showAllFloors3DCheckbox) {
    showAllFloors3DCheckbox.addEventListener('change', (e) => {
        showAllFloors3D = e.target.checked;
        notify3DSceneChanged(true);
    });
}

// --- 1. BÚTORKATEGÓRIÁK RENDERELÉSE ÉS KEZELÉSE ---
const categoryTabs = document.querySelectorAll('.cat-tab');
const furnitureCategoryItems = document.getElementById('furnitureCategoryItems');

function renderFurnitureCategory(categoryKey) {
    activeFurnitureCategory = categoryKey;
    if (!furnitureCategoryItems) return;
    furnitureCategoryItems.innerHTML = '';

    Object.entries(FURNITURE_CATALOG).forEach(([typeKey, item]) => {
        if (item.category === categoryKey) {
            const btn = document.createElement('button');
            btn.className = 'tool-btn furniture-btn';
            if (currentTool === 'furniture' && selectedFurnitureType === typeKey) {
                btn.classList.add('active');
            }
            const wCm = item.w * CM_PER_PX;
            const hCm = item.h * CM_PER_PX;
            btn.innerHTML = `<span>${item.label}</span> <small class="furn-dim-tag">${wCm}×${hCm} cm</small>`;
            btn.onclick = () => {
                setActiveTool('furniture', btn, typeKey);
            };
            furnitureCategoryItems.appendChild(btn);
        }
    });
}

categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderFurnitureCategory(tab.dataset.cat);
    });
});

// --- 2. ESZKÖZVÁLASZTÁS ---
function setActiveTool(toolId, btnElement, extraType = null) {
    if (viewMode === '3d') switchViewMode('2d');

    currentTool = toolId;
    selectedFurnitureType = extraType;

    if (selectBtn) selectBtn.classList.remove('active');
    wallsBtn.classList.remove('active');
    windowsBtn.classList.remove('active');
    doorsBtn.classList.remove('active');
    document.querySelectorAll('.furniture-btn').forEach(btn => btn.classList.remove('active'));

    if (btnElement) btnElement.classList.add('active');

    const wallSettingsWidget = document.getElementById('wallSettingsWidget');
    if (wallSettingsWidget) {
        wallSettingsWidget.style.display = (toolId === 'walls') ? 'flex' : 'none';
    }

    const furnitureSettingsWidget = document.getElementById('furnitureSettingsWidget');
    if (furnitureSettingsWidget) {
        furnitureSettingsWidget.style.display = (toolId === 'furniture') ? 'flex' : 'none';
    }

    isDrawing = false;
    currentStartNode = null;
    draggedWallIndex = null;
    draggedFurnitureIndex = null;
    draggedWindowIndex = null;
    draggedDoorIndex = null;
    cleanUpNodes();
    draw();
}

if (selectBtn) selectBtn.addEventListener('click', () => setActiveTool('select', selectBtn));
wallsBtn.addEventListener('click', () => setActiveTool('walls', wallsBtn));
windowsBtn.addEventListener('click', () => setActiveTool('windows', windowsBtn));
doorsBtn.addEventListener('click', () => setActiveTool('doors', doorsBtn));

// --- 3. KONTEXTUSFÜGGŐ NUMERIKUS TULAJDONSÁG-PANEL VEZÉRLÉSE ---
function selectElementOnCanvas(type, index) {
    selectedElement = { type, index };
    updatePropertyPanelUI();
    draw();
    notify3DSceneChanged();
}

function clearElementSelection() {
    selectedElement = { type: null, index: null };
    updatePropertyPanelUI();
    draw();
    notify3DSceneChanged();
}

function updatePropertyPanelUI() {
    const emptyBox = document.getElementById('emptySelectionBox');
    const editorBox = document.getElementById('dynamicPropertyEditor');
    const titleBadge = document.getElementById('propElementTitle');

    const wallFields = document.getElementById('propWallFields');
    const winFields = document.getElementById('propWindowFields');
    const doorFields = document.getElementById('propDoorFields');
    const furnFields = document.getElementById('propFurnitureFields');

    if (!emptyBox || !editorBox) return;

    wallFields.style.display = 'none';
    winFields.style.display = 'none';
    doorFields.style.display = 'none';
    furnFields.style.display = 'none';

    if (!selectedElement || selectedElement.type === null || selectedElement.index === null) {
        emptyBox.style.display = 'flex';
        editorBox.style.display = 'none';
        return;
    }

    const { type, index } = selectedElement;

    if (type === 'wall' && !walls[index]) return clearElementSelection();
    if (type === 'window' && !windows[index]) return clearElementSelection();
    if (type === 'door' && !doors[index]) return clearElementSelection();
    if (type === 'furniture' && !furnitures[index]) return clearElementSelection();

    emptyBox.style.display = 'none';
    editorBox.style.display = 'flex';

    if (type === 'wall') {
        const w = walls[index];
        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const lengthPx = Math.sqrt(dx * dx + dy * dy);
        const angleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);

        titleBadge.innerText = `🧱 Fal #${index + 1}`;
        wallFields.style.display = 'flex';

        document.getElementById('inputWallLengthCm').value = Math.round(lengthPx * CM_PER_PX);
        document.getElementById('inputWallThicknessCm').value = Math.round((w.thickness || 20) * CM_PER_PX);
        document.getElementById('inputWallAngleDeg').value = angleDeg;
    } else if (type === 'window') {
        const win = windows[index];
        titleBadge.innerText = `🪟 Ablak #${index + 1}`;
        winFields.style.display = 'flex';

        document.getElementById('inputWindowLengthCm').value = Math.round((win.length || 60) * CM_PER_PX);
        document.getElementById('inputWindowPosPct').value = Math.round((win.position || 0.5) * 100);
    } else if (type === 'door') {
        const door = doors[index];
        titleBadge.innerText = `🚪 Ajtó #${index + 1}`;
        doorFields.style.display = 'flex';

        document.getElementById('inputDoorLengthCm').value = Math.round((door.length || 50) * CM_PER_PX);
        document.getElementById('inputDoorPosPct').value = Math.round((door.position || 0.5) * 100);
        document.getElementById('inputDoorRotation').value = door.doorRotation || 0;
    } else if (type === 'furniture') {
        const f = furnitures[index];
        const meta = FURNITURE_CATALOG[f.type] || { label: 'Bútor', w: 50, h: 50 };
        const dims = getFurnitureDimensions(f);
        const deg = Math.round(((f.angle || 0) * 180) / Math.PI) % 360;

        titleBadge.innerText = `🛋️ ${meta.label}`;
        furnFields.style.display = 'flex';

        document.getElementById('inputFurnWidthCm').value = Math.round(dims.w * CM_PER_PX);
        document.getElementById('inputFurnHeightCm').value = Math.round(dims.h * CM_PER_PX);
        document.getElementById('inputFurnAngleDeg').value = deg;
    }
}

const closePropEditorBtn = document.getElementById('closePropEditorBtn');
if (closePropEditorBtn) {
    closePropEditorBtn.addEventListener('click', clearElementSelection);
}

const inputWallLengthCm = document.getElementById('inputWallLengthCm');
if (inputWallLengthCm) {
    inputWallLengthCm.addEventListener('change', (e) => {
        if (selectedElement.type !== 'wall') return;
        const w = walls[selectedElement.index];
        if (!w) return;
        const newLenCm = Math.max(10, parseFloat(e.target.value) || 100);
        const newLenPx = newLenCm / CM_PER_PX;

        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const currentLen = Math.sqrt(dx * dx + dy * dy) || 1;

        saveStateToHistory();
        n2.x = n1.x + (dx / currentLen) * newLenPx;
        n2.y = n1.y + (dy / currentLen) * newLenPx;
        draw();
        notify3DSceneChanged();
        updateDataBar();
    });
}

const inputWallThicknessCm = document.getElementById('inputWallThicknessCm');
if (inputWallThicknessCm) {
    inputWallThicknessCm.addEventListener('input', (e) => {
        if (selectedElement.type !== 'wall') return;
        const w = walls[selectedElement.index];
        if (!w) return;
        const newThickCm = Math.max(6, parseFloat(e.target.value) || 20);
        w.thickness = newThickCm / CM_PER_PX;
        draw();
        if (window.AppStore) AppStore.saveToLocalCache();
        notify3DSceneChanged();
    });
}

const inputWallAngleDeg = document.getElementById('inputWallAngleDeg');
if (inputWallAngleDeg) {
    inputWallAngleDeg.addEventListener('change', (e) => {
        if (selectedElement.type !== 'wall') return;
        const w = walls[selectedElement.index];
        if (!w) return;
        const deg = parseFloat(e.target.value) || 0;
        const rad = (deg * Math.PI) / 180;

        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        const len = Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2)) || 50;

        saveStateToHistory();
        n2.x = n1.x + Math.cos(rad) * len;
        n2.y = n1.y + Math.sin(rad) * len;
        draw();
        notify3DSceneChanged();
    });
}

const inputWindowLengthCm = document.getElementById('inputWindowLengthCm');
if (inputWindowLengthCm) {
    inputWindowLengthCm.addEventListener('input', (e) => {
        if (selectedElement.type !== 'window') return;
        const win = windows[selectedElement.index];
        if (!win) return;
        const cm = Math.max(20, parseFloat(e.target.value) || 120);
        win.length = cm / CM_PER_PX;
        draw();
        if (window.AppStore) AppStore.saveToLocalCache();
        notify3DSceneChanged();
    });
}

const inputWindowPosPct = document.getElementById('inputWindowPosPct');
if (inputWindowPosPct) {
    inputWindowPosPct.addEventListener('input', (e) => {
        if (selectedElement.type !== 'window') return;
        const win = windows[selectedElement.index];
        if (!win) return;
        const pct = Math.max(5, Math.min(95, parseFloat(e.target.value) || 50));
        win.position = pct / 100;
        draw();
        if (window.AppStore) AppStore.saveToLocalCache();
        notify3DSceneChanged();
    });
}

const inputDoorLengthCm = document.getElementById('inputDoorLengthCm');
if (inputDoorLengthCm) {
    inputDoorLengthCm.addEventListener('input', (e) => {
        if (selectedElement.type !== 'door') return;
        const door = doors[selectedElement.index];
        if (!door) return;
        const cm = Math.max(30, parseFloat(e.target.value) || 100);
        door.length = cm / CM_PER_PX;
        draw();
        if (window.AppStore) AppStore.saveToLocalCache();
        notify3DSceneChanged();
    });
}

const inputDoorPosPct = document.getElementById('inputDoorPosPct');
if (inputDoorPosPct) {
    inputDoorPosPct.addEventListener('input', (e) => {
        if (selectedElement.type !== 'door') return;
        const door = doors[selectedElement.index];
        if (!door) return;
        const pct = Math.max(5, Math.min(95, parseFloat(e.target.value) || 50));
        door.position = pct / 100;
        draw();
        if (window.AppStore) AppStore.saveToLocalCache();
        notify3DSceneChanged();
    });
}

const inputDoorRotation = document.getElementById('inputDoorRotation');
if (inputDoorRotation) {
    inputDoorRotation.addEventListener('change', (e) => {
        if (selectedElement.type !== 'door') return;
        const door = doors[selectedElement.index];
        if (!door) return;
        door.doorRotation = parseInt(e.target.value, 10) || 0;
        draw();
        if (window.AppStore) AppStore.saveToLocalCache();
        notify3DSceneChanged();
    });
}

const inputFurnWidthCm = document.getElementById('inputFurnWidthCm');
if (inputFurnWidthCm) {
    inputFurnWidthCm.addEventListener('input', (e) => {
        if (selectedElement.type !== 'furniture') return;
        const f = furnitures[selectedElement.index];
        if (!f) return;
        const dims = getFurnitureDimensions(f);
        const newWCm = Math.max(20, parseFloat(e.target.value) || 100);
        f.w = newWCm / CM_PER_PX;
        if (f.h === undefined) f.h = dims.h;
        draw();
        if (window.AppStore) AppStore.saveToLocalCache();
        notify3DSceneChanged();
    });
}

const inputFurnHeightCm = document.getElementById('inputFurnHeightCm');
if (inputFurnHeightCm) {
    inputFurnHeightCm.addEventListener('input', (e) => {
        if (selectedElement.type !== 'furniture') return;
        const f = furnitures[selectedElement.index];
        if (!f) return;
        const dims = getFurnitureDimensions(f);
        const newHCm = Math.max(20, parseFloat(e.target.value) || 100);
        f.h = newHCm / CM_PER_PX;
        if (f.w === undefined) f.w = dims.w;
        draw();
        if (window.AppStore) AppStore.saveToLocalCache();
        notify3DSceneChanged();
    });
}

const inputFurnAngleDeg = document.getElementById('inputFurnAngleDeg');
if (inputFurnAngleDeg) {
    inputFurnAngleDeg.addEventListener('input', (e) => {
        if (selectedElement.type !== 'furniture') return;
        const f = furnitures[selectedElement.index];
        if (!f) return;
        const deg = parseFloat(e.target.value) || 0;
        f.angle = (deg * Math.PI) / 180;
        draw();
        if (window.AppStore) AppStore.saveToLocalCache();
        notify3DSceneChanged();
    });
}

const deleteSelectedElementBtn = document.getElementById('deleteSelectedElementBtn');
if (deleteSelectedElementBtn) {
    deleteSelectedElementBtn.addEventListener('click', () => {
        if (!selectedElement || selectedElement.type === null) return;
        saveStateToHistory();
        const { type, index } = selectedElement;

        if (type === 'wall') {
            walls.splice(index, 1);
            cleanUpNodes();
            windows = windows.filter(w => w.wallIndex !== index);
            doors = doors.filter(d => d.wallIndex !== index);
            windows.forEach(w => { if (w.wallIndex > index) w.wallIndex--; });
            doors.forEach(d => { if (d.wallIndex > index) d.wallIndex--; });
        } else if (type === 'window') {
            windows.splice(index, 1);
        } else if (type === 'door') {
            doors.splice(index, 1);
        } else if (type === 'furniture') {
            furnitures.splice(index, 1);
        }

        clearElementSelection();
        notify3DSceneChanged(true);
        updateDataBar();
    });
}

// --- 4. EGÉR LENYOMÁSA A VÁSZNON ---
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1) {
        e.preventDefault();
        isPanning = true;
        lastPanPos = { x: e.clientX, y: e.clientY };
        return;
    }

    if (e.button !== 0) return;

    let clickPos = getMousePos(e);

    if (hoveredFurnitureIndex !== null) {
        saveStateToHistory();
        draggedFurnitureIndex = hoveredFurnitureIndex;
        lastMousePos = { x: clickPos.x, y: clickPos.y };
        selectElementOnCanvas('furniture', hoveredFurnitureIndex);
        return;
    }
    if (hoveredWindowIndex !== null) {
        saveStateToHistory();
        draggedWindowIndex = hoveredWindowIndex;
        lastMousePos = { x: clickPos.x, y: clickPos.y };
        selectElementOnCanvas('window', hoveredWindowIndex);
        return;
    }
    if (hoveredDoorIndex !== null) {
        saveStateToHistory();
        draggedDoorIndex = hoveredDoorIndex;
        lastMousePos = { x: clickPos.x, y: clickPos.y };
        selectElementOnCanvas('door', hoveredDoorIndex);
        return;
    }

    if (currentTool === 'select') {
        if (hoveredWallIndex !== null) {
            saveStateToHistory();
            draggedWallIndex = hoveredWallIndex;
            lastMousePos = { x: clickPos.x, y: clickPos.y };
            selectElementOnCanvas('wall', hoveredWallIndex);
        } else {
            clearElementSelection();
        }
        return;
    }

    if (currentTool === 'furniture' && selectedFurnitureType) {
        saveStateToHistory();
        const dims = getFurnitureDimensions(selectedFurnitureType, furnitureSize);
        furnitures.push({
            type: selectedFurnitureType,
            x: clickPos.x,
            y: clickPos.y,
            w: dims.w,
            h: dims.h,
            angle: currentFurnitureAngle,
            size: furnitureSize
        });
        selectElementOnCanvas('furniture', furnitures.length - 1);
        updateDataBar();
        return;
    }

    if (currentTool === 'windows' || currentTool === 'doors') {
        if (hoveredWallIndex !== null) {
            const w = walls[hoveredWallIndex];
            const n1 = nodes[w.startNode];
            const n2 = nodes[w.endNode];

            let len_sq = Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2);
            let t = ((clickPos.x - n1.x) * (n2.x - n1.x) + (clickPos.y - n1.y) * (n2.y - n1.y)) / len_sq;
            t = Math.max(0.05, Math.min(0.95, t));

            saveStateToHistory();
            if (currentTool === 'windows') {
                windows.push({ wallIndex: hoveredWallIndex, position: t, length: 60 });
                selectElementOnCanvas('window', windows.length - 1);
            } else {
                doors.push({ wallIndex: hoveredWallIndex, position: t, length: 50, doorRotation: 0 });
                selectElementOnCanvas('door', doors.length - 1);
            }
        }
        return;
    }

    if (isNinetyDegreeMode && isDrawing && currentStartNode !== null) {
        const start = nodes[currentStartNode];
        clickPos = applyNinetyDegrees(start.x, start.y, clickPos.x, clickPos.y);
    }

    const snappedNodeIndex = findClosestNode(clickPos.x, clickPos.y);

    if (!isDrawing) {
        if (snappedNodeIndex !== null) {
            isDrawing = true;
            currentStartNode = snappedNodeIndex;
            return;
        }

        if (hoveredWallIndex !== null) {
            selectElementOnCanvas('wall', hoveredWallIndex);
            maybeDraggingWallIndex = hoveredWallIndex;
            mouseDownPos = { x: clickPos.x, y: clickPos.y };
            return;
        }

        clearElementSelection();
        isDrawing = true;
        nodes.push({ x: clickPos.x, y: clickPos.y });
        currentStartNode = nodes.length - 1;
    } else {
        let endNodeIndex;
        if (snappedNodeIndex !== null) {
            endNodeIndex = snappedNodeIndex;
        } else {
            let finalX = clickPos.x;
            let finalY = clickPos.y;
            if (hoveredWallIndex !== null) {
                const w = walls[hoveredWallIndex];
                const n1 = nodes[w.startNode];
                const n2 = nodes[w.endNode];
                let len_sq = Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2);
                let t = ((clickPos.x - n1.x) * (n2.x - n1.x) + (clickPos.y - n1.y) * (n2.y - n1.y)) / len_sq;
                t = Math.max(0, Math.min(1, t));
                finalX = n1.x + t * (n2.x - n1.x);
                finalY = n1.y + t * (n2.y - n1.y);
            }
            nodes.push({ x: finalX, y: finalY });
            endNodeIndex = nodes.length - 1;
        }
        saveStateToHistory();
        walls.push({ startNode: currentStartNode, endNode: endNodeIndex, thickness: wallThickness });
        selectElementOnCanvas('wall', walls.length - 1);
        currentStartNode = endNodeIndex;
    }
    draw();
});

// --- 5. EGÉR MOZGATÁSA ---
canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        const dx = e.clientX - lastPanPos.x;
        const dy = e.clientY - lastPanPos.y;
        cameraOffset.x += dx;
        cameraOffset.y += dy;
        lastPanPos = { x: e.clientX, y: e.clientY };
        draw();
        return;
    }

    mousePosition = getMousePos(e);

    let foundHover = null;
    for (let i = 0; i < walls.length; i++) {
        const w = walls[i];
        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        if (n1 && n2 && getDistanceToLine(mousePosition.x, mousePosition.y, n1.x, n1.y, n2.x, n2.y) < 12) {
            foundHover = i; break;
        }
    }

    let foundFurnitureHover = null;
    for (let i = 0; i < furnitures.length; i++) {
        const f = furnitures[i];
        const dims = getFurnitureDimensions(f);
        const hitRadius = Math.max(dims.w, dims.h) / 2;
        const dist = Math.sqrt(Math.pow(mousePosition.x - f.x, 2) + Math.pow(mousePosition.y - f.y, 2));
        if (dist < hitRadius) {
            foundFurnitureHover = i; break;
        }
    }

    let foundWindowHover = null;
    for (let i = 0; i < windows.length; i++) {
        const win = windows[i];
        const w = walls[win.wallIndex];
        if (!w) continue;
        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        const x = n1.x + (n2.x - n1.x) * win.position;
        const y = n1.y + (n2.y - n1.y) * win.position;
        const dist = Math.sqrt(Math.pow(mousePosition.x - x, 2) + Math.pow(mousePosition.y - y, 2));
        if (dist < 30) { foundWindowHover = i; break; }
    }

    let foundDoorHover = null;
    for (let i = 0; i < doors.length; i++) {
        const door = doors[i];
        const w = walls[door.wallIndex];
        if (!w) continue;
        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        const x = n1.x + (n2.x - n1.x) * door.position;
        const y = n1.y + (n2.y - n1.y) * door.position;
        const dist = Math.sqrt(Math.pow(mousePosition.x - x, 2) + Math.pow(mousePosition.y - y, 2));
        if (dist < 25) { foundDoorHover = i; break; }
    }

    if (hoveredWallIndex !== foundHover || hoveredFurnitureIndex !== foundFurnitureHover ||
        hoveredWindowIndex !== foundWindowHover || hoveredDoorIndex !== foundDoorHover) {
        hoveredWallIndex = foundHover;
        hoveredFurnitureIndex = foundFurnitureHover;
        hoveredWindowIndex = foundWindowHover;
        hoveredDoorIndex = foundDoorHover;
        draw();
    }

    if (hoveredWindowIndex !== null || hoveredDoorIndex !== null) {
        hoveredWallIndex = null;
    }

    if (maybeDraggingWallIndex !== null) {
        const dx = mousePosition.x - mouseDownPos.x;
        const dy = mousePosition.y - mouseDownPos.y;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            saveStateToHistory();
            draggedWallIndex = maybeDraggingWallIndex;
            lastMousePos = { x: mouseDownPos.x, y: mouseDownPos.y };
            maybeDraggingWallIndex = null;
        }
    }

    if (draggedFurnitureIndex !== null) {
        const dx = mousePosition.x - lastMousePos.x;
        const dy = mousePosition.y - lastMousePos.y;
        furnitures[draggedFurnitureIndex].x += dx;
        furnitures[draggedFurnitureIndex].y += dy;
        lastMousePos = { x: mousePosition.x, y: mousePosition.y };
        draw();
        notify3DSceneChanged();
        updateDataBar();
        return;
    }

    if (draggedWindowIndex !== null || draggedDoorIndex !== null) {
        let parentWall;
        if (draggedWindowIndex !== null) {
            if (foundHover !== null) {
                parentWall = walls[foundHover];
                windows[draggedWindowIndex].wallIndex = foundHover;
            } else {
                parentWall = walls[windows[draggedWindowIndex].wallIndex];
            }
        } else if (draggedDoorIndex !== null) {
            if (foundHover !== null) {
                parentWall = walls[foundHover];
                doors[draggedDoorIndex].wallIndex = foundHover;
            } else {
                parentWall = walls[doors[draggedDoorIndex].wallIndex];
            }
        }

        const n1 = nodes[parentWall.startNode];
        const n2 = nodes[parentWall.endNode];
        let len_sq = Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2);
        let t = ((mousePosition.x - n1.x) * (n2.x - n1.x) + (mousePosition.y - n1.y) * (n2.y - n1.y)) / len_sq;
        t = Math.max(0.05, Math.min(0.95, t));

        if (draggedWindowIndex !== null) windows[draggedWindowIndex].position = t;
        else if (draggedDoorIndex !== null) doors[draggedDoorIndex].position = t;

        lastMousePos = { x: mousePosition.x, y: mousePosition.y };
        updatePropertyPanelUI();
        draw();
        notify3DSceneChanged();
        updateDataBar();
        return;
    }

    if (currentTool === 'walls' || currentTool === 'select') {
        if (isNinetyDegreeMode && isDrawing && currentStartNode !== null) {
            const start = nodes[currentStartNode];
            mousePosition = applyNinetyDegrees(start.x, start.y, mousePosition.x, mousePosition.y);
        }

        if (draggedWallIndex !== null) {
            const dx = mousePosition.x - lastMousePos.x;
            const dy = mousePosition.y - lastMousePos.y;
            const wall = walls[draggedWallIndex];
            nodes[wall.startNode].x += dx;
            nodes[wall.startNode].y += dy;
            nodes[wall.endNode].x += dx;
            nodes[wall.endNode].y += dy;
            lastMousePos = { x: mousePosition.x, y: mousePosition.y };
            draw();
            notify3DSceneChanged();
        } else if (isDrawing) {
            draw();
        }
    } else {
        draw();
    }
    updateDataBar();
});

// --- 6. EGÉR ELENGEDÉSE ---
window.addEventListener('mouseup', () => {
    if (isPanning) {
        isPanning = false;
        return;
    }

    if (maybeDraggingWallIndex !== null) {
        selectElementOnCanvas('wall', maybeDraggingWallIndex);
        maybeDraggingWallIndex = null;
    }

    const hadActiveDrag = (
        draggedWallIndex !== null ||
        draggedFurnitureIndex !== null ||
        draggedWindowIndex !== null ||
        draggedDoorIndex !== null
    );

    draggedWallIndex = null;
    draggedFurnitureIndex = null;
    draggedWindowIndex = null;
    draggedDoorIndex = null;

    if (hadActiveDrag) {
        if (window.AppStore) AppStore.saveToLocalCache();
        notify3DSceneChanged(true);
    }
    draw();
});

// --- 7. JOBB KLIKK MEGSZAKÍTÁS ---
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    isDrawing = false;
    currentStartNode = null;
    maybeDraggingWallIndex = null;
    cleanUpNodes();
    draw();
});

// --- 8. GÖRGŐVEL ZOOM ÉS FORGATÁS ---
window.addEventListener('wheel', (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    } else {
        return;
    }

    if (e.ctrlKey || e.metaKey) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldX = (mouseX - cameraOffset.x) / zoomFactor;
        const worldY = (mouseY - cameraOffset.y) / zoomFactor;

        const zoomAmount = 1.1;
        if (e.deltaY < 0) zoomFactor *= zoomAmount;
        else zoomFactor /= zoomAmount;
        zoomFactor = Math.max(0.2, Math.min(zoomFactor, 5.0));

        cameraOffset.x = mouseX - (worldX * zoomFactor);
        cameraOffset.y = mouseY - (worldY * zoomFactor);

        draw();
        return;
    } else {
        const angleChange = (Math.PI / 12) * Math.sign(e.deltaY);
        let mutated3D = false;
        if (draggedFurnitureIndex !== null) {
            furnitures[draggedFurnitureIndex].angle += angleChange;
            updatePropertyPanelUI();
            if (window.AppStore) AppStore.saveToLocalCache();
            mutated3D = true;
        } else if (hoveredFurnitureIndex !== null) {
            furnitures[hoveredFurnitureIndex].angle += angleChange;
            updatePropertyPanelUI();
            if (window.AppStore) AppStore.saveToLocalCache();
            mutated3D = true;
        } else if (selectedElement && selectedElement.type === 'furniture' && furnitures[selectedElement.index]) {
            furnitures[selectedElement.index].angle += angleChange;
            updatePropertyPanelUI();
            if (window.AppStore) AppStore.saveToLocalCache();
            mutated3D = true;
        } else if (currentTool === 'furniture') {
            currentFurnitureAngle += angleChange;
        }
        draw();
        if (mutated3D) notify3DSceneChanged();
    }
}, { passive: false });

// --- 9. BILLENTYŰZET: TÖRLÉS, FORGATÁS ÉS UNDO ---
window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        if (e.key === 'Escape') document.activeElement.blur();
        return;
    }

    if (e.key === 'Escape') {
        isDrawing = false;
        currentStartNode = null;
        cleanUpNodes();
        clearElementSelection();
        return;
    }

    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undo();
        updatePropertyPanelUI();
        return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (hoveredWallIndex !== null && (currentTool === 'walls' || currentTool === 'select')) {
            saveStateToHistory();
            const deletedIndex = hoveredWallIndex;
            walls.splice(deletedIndex, 1);
            hoveredWallIndex = null;
            cleanUpNodes();

            windows = windows.filter(w => w.wallIndex !== deletedIndex);
            doors = doors.filter(d => d.wallIndex !== deletedIndex);
            windows.forEach(w => { if (w.wallIndex > deletedIndex) w.wallIndex--; });
            doors.forEach(d => { if (d.wallIndex > deletedIndex) d.wallIndex--; });
            clearElementSelection();
        } else if (hoveredFurnitureIndex !== null) {
            saveStateToHistory();
            furnitures.splice(hoveredFurnitureIndex, 1);
            hoveredFurnitureIndex = null;
            clearElementSelection();
        } else if (hoveredWindowIndex !== null) {
            saveStateToHistory();
            windows.splice(hoveredWindowIndex, 1);
            hoveredWindowIndex = null;
            clearElementSelection();
        } else if (hoveredDoorIndex !== null) {
            saveStateToHistory();
            doors.splice(hoveredDoorIndex, 1);
            hoveredDoorIndex = null;
            clearElementSelection();
        } else if (selectedElement && selectedElement.type !== null) {
            deleteSelectedElementBtn.click();
        }
        notify3DSceneChanged(true);
    }

    if (e.key === 'r' || e.key === 'R') {
        const angleChange = Math.PI / 4;
        let mutated3D = false;
        if (draggedFurnitureIndex !== null) {
            furnitures[draggedFurnitureIndex].angle += angleChange;
            mutated3D = true;
        } else if (hoveredFurnitureIndex !== null) {
            furnitures[hoveredFurnitureIndex].angle += angleChange;
            mutated3D = true;
        } else if (hoveredDoorIndex !== null) {
            doors[hoveredDoorIndex].doorRotation = ((doors[hoveredDoorIndex].doorRotation || 0) + 1) % 4;
            mutated3D = true;
        } else if (selectedElement && selectedElement.type === 'furniture' && furnitures[selectedElement.index]) {
            furnitures[selectedElement.index].angle += angleChange;
            mutated3D = true;
        } else if (selectedElement && selectedElement.type === 'door' && doors[selectedElement.index]) {
            doors[selectedElement.index].doorRotation = ((doors[selectedElement.index].doorRotation || 0) + 1) % 4;
            mutated3D = true;
        } else if (currentTool === 'furniture') {
            currentFurnitureAngle += angleChange;
        }
        if (window.AppStore) AppStore.saveToLocalCache();
        updatePropertyPanelUI();
        draw();
        if (mutated3D) notify3DSceneChanged();
    }
});

// --- 10. OLDALSÁV GOMBOK ÉS CSÚSZKÁK ---
if (saveToCloudBtn) {
    saveToCloudBtn.addEventListener('click', () => {
        if (typeof saveFloorplan === "function") saveFloorplan();
    });
}

if (backToMenuBtn) {
    backToMenuBtn.addEventListener('click', () => {
        if (typeof switchScreen === 'function') {
            switchScreen('dashboard');
        } else {
            document.getElementById('main-app').style.display = 'none';
            document.getElementById('dashboard-screen').style.display = 'flex';
        }
        if (auth.currentUser) fetchUserPlans(auth.currentUser.uid);
    });
}

if (switchToUpperFloorBtn) {
    switchToUpperFloorBtn.addEventListener('click', () => {
        clearElementSelection();
        switchFloor(currentFloor + 1);
    });
}

if (switchToLowerFloorBtn) {
    switchToLowerFloorBtn.addEventListener('click', () => {
        clearElementSelection();
        switchFloor(currentFloor - 1);
    });
}

const clearBtn = document.getElementById('clearBtn');
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        saveStateToHistory();
        nodes.length = 0;
        walls.length = 0;
        windows.length = 0;
        doors.length = 0;
        furnitures.length = 0;
        clearElementSelection();
        draw();
        notify3DSceneChanged(true);
        updateDataBar();
    });
}

const ninetyDegreeBtn = document.getElementById('ninetyDegreeBtn');
if (ninetyDegreeBtn) {
    ninetyDegreeBtn.addEventListener('click', () => {
        isNinetyDegreeMode = !isNinetyDegreeMode;
        if (isNinetyDegreeMode) {
            ninetyDegreeBtn.classList.add('active');
            ninetyDegreeBtn.innerText = "90° mode ON";
        } else {
            ninetyDegreeBtn.classList.remove('active');
            ninetyDegreeBtn.innerText = "90° mode OFF";
        }
    });
}

const isDrawingBtn = document.getElementById('isDrawingBtn');
if (isDrawingBtn) {
    isDrawingBtn.addEventListener('click', () => {
        isShowingPlans = !isShowingPlans;
        if (isShowingPlans) {
            isDrawingBtn.classList.add('active');
            isDrawingBtn.innerText = "Show Plans: On";
        } else {
            isDrawingBtn.classList.remove('active');
            isDrawingBtn.innerText = "Show Plans: Off";
        }
        draw();
    });
}

function updateFloorIndicator() {
    const floorIndicator = document.getElementById('currentFloorDisplay');
    if (floorIndicator) floorIndicator.innerText = currentFloor + 1;
}

function updateDataBar() {
    const infoType = document.getElementById('infoType');
    const infoSize = document.getElementById('infoSize');
    if (!infoType || !infoSize) return;

    const unit = (window.AppStore && AppStore.state.settings.unitSystem) || 'cm';
    const factor = unit === 'cm' ? CM_PER_PX : 1;

    if (hoveredWallIndex !== null && walls[hoveredWallIndex]) {
        const wall = walls[hoveredWallIndex];
        const n1 = nodes[wall.startNode];
        const n2 = nodes[wall.endNode];
        const length = (Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2)) * factor).toFixed(0);
        infoType.innerText = "Fal";
        infoSize.innerText = `${length} ${unit}`;
    } else if (hoveredFurnitureIndex !== null && furnitures[hoveredFurnitureIndex]) {
        const f = furnitures[hoveredFurnitureIndex];
        const meta = FURNITURE_CATALOG[f.type] || { label: f.type };
        const dims = getFurnitureDimensions(f);
        infoType.innerText = meta.label;
        infoSize.innerText = `${Math.round(dims.w * factor)} × ${Math.round(dims.h * factor)} ${unit}`;
    } else if (hoveredDoorIndex !== null && doors[hoveredDoorIndex]) {
        const d = doors[hoveredDoorIndex];
        infoType.innerText = "Ajtó";
        infoSize.innerText = `${Math.round(d.length * factor)} ${unit}`;
    } else if (hoveredWindowIndex !== null && windows[hoveredWindowIndex]) {
        const w = windows[hoveredWindowIndex];
        infoType.innerText = "Ablak";
        infoSize.innerText = `${Math.round(w.length * factor)} ${unit}`;
    } else {
        infoType.innerText = "-";
        infoSize.innerText = "-";
    }
}

const userNameInputEl = document.getElementById('userNameInput');
if (userNameInputEl) {
    userNameInputEl.addEventListener('input', (e) => { userName = e.target.value; });
    userNameInputEl.addEventListener('change', () => {
        if (auth.currentUser) {
            auth.currentUser.updateProfile({ displayName: userName });
        }
    });
}

const bgUpload = document.getElementById('bgUpload');
if (bgUpload) {
    bgUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => { bgImage = img; draw(); };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

const opacitySlider = document.getElementById('opacitySlider');
const opacityDisplay = document.getElementById('opacityDisplay');
if (opacitySlider) {
    opacitySlider.addEventListener('input', (e) => {
        bgOpacity = parseFloat(e.target.value);
        if (opacityDisplay) opacityDisplay.innerText = bgOpacity.toFixed(2);
        draw();
    });
}

const thicknessSlider = document.getElementById('thicknessSlider');
const thicknessDisplay = document.getElementById('thicknessDisplay');
if (thicknessSlider) {
    thicknessSlider.addEventListener('input', (e) => {
        wallThickness = parseInt(e.target.value, 10);
        if (thicknessDisplay) thicknessDisplay.innerText = wallThickness * CM_PER_PX;
        draw();
    });
}

const sizeSlider = document.getElementById('sizeSlider');
const sizeDisplay = document.getElementById('sizeDisplay');
if (sizeSlider) {
    sizeSlider.addEventListener('input', (e) => {
        furnitureSize = parseInt(e.target.value, 10);
        if (sizeDisplay) sizeDisplay.innerText = furnitureSize;
        draw();
    });
}

// PNG és PDF Export (2D, Osztott 2D/3D és 3D nézetből egyaránt működik!)
function getActiveExportCanvas() {
    if (viewMode === '3d' && window.Viewer3D && Viewer3D.renderer) {
        Viewer3D.renderer.render(Viewer3D.scene, Viewer3D.camera);
        return Viewer3D.renderer.domElement;
    }
    if (viewMode === 'split' && window.Viewer3D && Viewer3D.renderer) {
        Viewer3D.renderer.render(Viewer3D.scene, Viewer3D.camera);
        const canvas3D = Viewer3D.renderer.domElement;
        const gap = 12;
        const outH = Math.max(canvas.height, canvas3D.height);
        const outW = canvas.width + gap + canvas3D.width;
        const composite = document.createElement('canvas');
        composite.width = outW;
        composite.height = outH;
        const cctx = composite.getContext('2d');
        cctx.fillStyle = '#44A194';
        cctx.fillRect(0, 0, outW, outH);
        cctx.drawImage(canvas, 0, 0, canvas.width, outH);
        cctx.drawImage(canvas3D, canvas.width + gap, 0, canvas3D.width, outH);
        return composite;
    }
    return canvas;
}

const saveAsPngBtn = document.getElementById('saveAsPNGBtn');
if (saveAsPngBtn) {
    saveAsPngBtn.addEventListener('click', () => {
        const activeCanvas = getActiveExportCanvas();
        const imageData = activeCanvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.download = `floorplan_${viewMode}.png`;
        link.href = imageData;
        link.click();
    });
}

const saveAsPDFBtn = document.getElementById('saveAsPDFBtn');
if (saveAsPDFBtn) {
    saveAsPDFBtn.addEventListener('click', () => {
        if (!window.jspdf) {
            alert("Hiba a PDF modul betöltésekor!");
            return;
        }
        const activeCanvas = getActiveExportCanvas();
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('l', 'px', [activeCanvas.width, activeCanvas.height]);
        const imageData = activeCanvas.toDataURL("image/jpeg", 1.0);
        pdf.addImage(imageData, 'JPEG', 0, 0, activeCanvas.width, activeCanvas.height);
        pdf.save(`floorplan_${viewMode}.pdf`);
    });
}

renderFurnitureCategory('living');
draw();