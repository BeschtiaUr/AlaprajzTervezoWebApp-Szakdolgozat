// Árva csomópontok takarítása
function cleanUpNodes() {
    for (let i = nodes.length - 1; i >= 0; i--) {
        const isUsed = walls.some(wall => wall.startNode === i || wall.endNode === i);
        if (!isUsed) {
            nodes.splice(i, 1);
            walls.forEach(wall => {
                if (wall.startNode > i) wall.startNode--;
                if (wall.endNode > i) wall.endNode--;
            });
        }
    }
}

// Egér pontos helyzete a belső világkoordináta-rendszerben
function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? (canvas.width / rect.width) : 1;
    const scaleY = rect.height ? (canvas.height / rect.height) : 1;
    return {
        x: (((evt.clientX - rect.left) * scaleX) - cameraOffset.x) / zoomFactor,
        y: (((evt.clientY - rect.top) * scaleY) - cameraOffset.y) / zoomFactor
    };
}

// 9. HÉT: Segédfüggvények a 3D / Osztott nézet valós idejű szinkronizációjához
function is3DViewVisible() {
    return viewMode === '3d' || viewMode === 'split';
}

function notify3DSceneChanged(immediate = false) {
    if (!is3DViewVisible() || !window.Viewer3D) return;
    if (immediate) {
        Viewer3D.rebuild3DScene();
    } else {
        Viewer3D.scheduleRebuild();
    }
}

// Legközelebbi csomópont keresése (Snapping)
function findClosestNode(x, y) {
    for (let i = 0; i < nodes.length; i++) {
        const dx = nodes[i].x - x;
        const dy = nodes[i].y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < SNAP_DISTANCE) {
            return i;
        }
    }
    return null;
}

// Pont-szakasz ortogonális távolság
function getDistanceToLine(px, py, x1, y1, x2, y2) {
    let A = px - x1; let B = py - y1; let C = x2 - x1; let D = y2 - y1;
    let dot = A * C + B * D; let len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    let dx = px - xx; let dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// 90 fokos ortogonális kényszerítés
function applyNinetyDegrees(startX, startY, currentX, currentY) {
    const dx = Math.abs(currentX - startX);
    const dy = Math.abs(currentY - startY);
    if (dx > dy) {
        return { x: currentX, y: startY };
    } else {
        return { x: startX, y: currentY };
    }
}

// Memento állapotmentés + Böngésző Cache szinkronizáció
function saveStateToHistory() {
    const stateCopy = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        walls: JSON.parse(JSON.stringify(walls)),
        windows: JSON.parse(JSON.stringify(windows)),
        doors: JSON.parse(JSON.stringify(doors)),
        furnitures: JSON.parse(JSON.stringify(furnitures))
    };
    historyStack.push(stateCopy);
    if (historyStack.length > 20) historyStack.shift();

    // Automatikus helyi mentés a böngésző memóriájába
    setTimeout(() => {
        if (window.AppStore) AppStore.saveToLocalCache();
    }, 0);
}

function undo() {
    if (historyStack.length === 0) return;
    const lastState = historyStack.pop();

    nodes.length = 0; nodes.push(...lastState.nodes);
    walls.length = 0; walls.push(...lastState.walls);
    windows.length = 0; windows.push(...lastState.windows);
    doors.length = 0; doors.push(...lastState.doors);
    furnitures.length = 0; furnitures.push(...lastState.furnitures);

    isDrawing = false;
    currentStartNode = null;
    maybeDraggingWallIndex = null;
    draggedWallIndex = null;
    draggedFurnitureIndex = null;
    draggedWindowIndex = null;
    draggedDoorIndex = null;

    cleanUpNodes();
    draw();
    if (window.AppStore) AppStore.saveToLocalCache();
    notify3DSceneChanged();
    if (typeof updateDataBar === "function") updateDataBar();
}

function switchFloor(targetIndex) {
    if (targetIndex < 0) return;
    if (targetIndex === currentFloor) return;

    floorPlans[currentFloor] = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        walls: JSON.parse(JSON.stringify(walls)),
        windows: JSON.parse(JSON.stringify(windows)),
        doors: JSON.parse(JSON.stringify(doors)),
        furnitures: JSON.parse(JSON.stringify(furnitures)),
        historyStack: [...historyStack]
    };

    while (targetIndex >= floorPlans.length) {
        floorPlans.push({
            nodes: [], walls: [], windows: [], doors: [], furnitures: [], historyStack: []
        });
    }

    currentFloor = targetIndex;
    const data = floorPlans[currentFloor];

    nodes.length = 0; nodes.push(...data.nodes);
    walls.length = 0; walls.push(...data.walls);
    windows.length = 0; windows.push(...data.windows);
    doors.length = 0; doors.push(...data.doors);
    furnitures.length = 0; furnitures.push(...data.furnitures);
    historyStack.length = 0; historyStack.push(...data.historyStack);

    isDrawing = false;
    currentStartNode = null;
    hoveredWallIndex = null;
    draggedWallIndex = null;
    cleanUpNodes();

    updateFloorIndicator();
    draw();
    if (window.AppStore) AppStore.saveToLocalCache();
    notify3DSceneChanged(true);
}