// Rácsháló rajzolása
function drawGrid() {
    ctx.lineWidth = 1 / zoomFactor;
    ctx.strokeStyle = '#05a9af';
    ctx.beginPath();

    const left = -cameraOffset.x / zoomFactor;
    const top = -cameraOffset.y / zoomFactor;
    const right = left + (canvas.width / zoomFactor);
    const bottom = top + (canvas.height / zoomFactor);

    const startX = Math.floor(left / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor(top / GRID_SIZE) * GRID_SIZE;

    for (let x = startX; x <= right; x += GRID_SIZE) {
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
    }
    for (let y = startY; y <= bottom; y += GRID_SIZE) {
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
    }
    ctx.stroke();
}

// ABLAK RAJZOLÁSA
function drawWindow(x, y, angle, length, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const halfT = t / 2;

    ctx.fillStyle = 'white';
    ctx.fillRect(-length / 2, -(halfT + 1), length, t + 2);

    ctx.strokeStyle = '#87CEEB';
    ctx.lineWidth = 4;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    const glassOffSet = Math.max(1, t / 5);
    ctx.moveTo(-length / 2, -glassOffSet); ctx.lineTo(length / 2, -glassOffSet);
    ctx.moveTo(-length / 2, glassOffSet);  ctx.lineTo(length / 2, glassOffSet);
    ctx.stroke();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-length / 2, -halfT); ctx.lineTo(-length / 2, halfT);
    ctx.moveTo(length / 2, -halfT);  ctx.lineTo(length / 2, halfT);
    ctx.stroke();

    ctx.restore();
}

// AJTÓ RAJZOLÁSA
function drawDoor(x, y, angle, length, t, isMirrored = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    if (isMirrored) {
        ctx.scale(-1, 1);
    }

    const halfT = t / 2;

    ctx.fillStyle = 'white';
    ctx.fillRect(-length / 2, -(halfT + 1), length, t + 2);

    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-length / 2, -halfT);
    ctx.lineTo(-length / 2, -halfT - length);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(51, 51, 51, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(-length / 2, -halfT, length, 0, -Math.PI / 2, true);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-length / 2, -halfT); ctx.lineTo(-length / 2, halfT);
    ctx.moveTo(length / 2, -halfT);  ctx.lineTo(length / 2, halfT);
    ctx.stroke();

    ctx.restore();
}

// Segédfüggvény egy bútor tényleges pixelbeli szélességének és magasságának lekérésére
function getFurnitureDimensions(fOrType, customSize = 100) {
    if (typeof fOrType === 'object' && fOrType !== null) {
        const meta = FURNITURE_CATALOG[fOrType.type] || { w: 50, h: 50 };
        const scale = (fOrType.size || 100) / 100;
        return {
            w: fOrType.w !== undefined ? fOrType.w : meta.w * scale,
            h: fOrType.h !== undefined ? fOrType.h : meta.h * scale
        };
    } else {
        const meta = FURNITURE_CATALOG[fOrType] || { w: 50, h: 50 };
        const scale = (customSize || 100) / 100;
        return { w: meta.w * scale, h: meta.h * scale };
    }
}

// --- 4 BÚTORKATEGÓRIA PROCEDURÁLIS RAJZOLÁSA ---
function drawFurnitureItem(x, y, type, angle, customSize, isHover = false, customW = null, customH = null) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const dims = getFurnitureDimensions(type, customSize);
    const w = customW !== null ? customW : dims.w;
    const h = customH !== null ? customH : dims.h;
    const hw = w / 2;
    const hh = h / 2;

    ctx.globalAlpha = isHover ? 0.55 : 1.0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2c3e50';

    switch (type) {
        case 'sofa': {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-hw, -hh, w, h);
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(-hw, -hh, w, h * 0.28);
            ctx.fillRect(-hw, -hh + h * 0.28, w * 0.18, h * 0.72);
            ctx.fillRect(hw - w * 0.18, -hh + h * 0.28, w * 0.18, h * 0.72);
            ctx.strokeRect(-hw, -hh, w, h);
            break;
        }
        case 'armchair': {
            ctx.fillStyle = '#e67e22';
            ctx.fillRect(-hw, -hh, w, h);
            ctx.fillStyle = '#d35400';
            ctx.fillRect(-hw, -hh, w, h * 0.28);
            ctx.fillRect(-hw, -hh, w * 0.22, h);
            ctx.fillRect(hw - w * 0.22, -hh, w * 0.22, h);
            ctx.strokeRect(-hw, -hh, w, h);
            break;
        }
        case 'tv_unit': {
            ctx.fillStyle = '#8e6e53';
            ctx.fillRect(-hw, -hh, w, h);
            ctx.strokeRect(-hw, -hh, w, h);
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(-hw * 0.8, -hh * 0.25, w * 0.8, h * 0.25);
            break;
        }
        case 'coffee_table': {
            ctx.fillStyle = '#d2b48c';
            ctx.fillRect(-hw, -hh, w, h);
            ctx.strokeRect(-hw, -hh, w, h);
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.strokeRect(-hw * 0.75, -hh * 0.7, w * 0.75, h * 0.7);
            break;
        }
        case 'table': {
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(-hw, -hh, w, h);
            ctx.strokeRect(-hw, -hh, w, h);
            break;
        }
        case 'kitchen_counter': {
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(-hw, -hh, w, h);
            ctx.strokeRect(-hw, -hh, w, h);
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(-hw * 0.6, -hh * 0.6, w * 0.28, h * 0.6);
            ctx.strokeRect(-hw * 0.6, -hh * 0.6, w * 0.28, h * 0.6);
            break;
        }
        case 'stove': {
            ctx.fillStyle = '#dfe6e9';
            ctx.fillRect(-hw, -hh, w, h);
            ctx.strokeRect(-hw, -hh, w, h);
            ctx.fillStyle = '#2d3436';
            const r = Math.min(w, h) * 0.16;
            [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].forEach(([ox, oy]) => {
                ctx.beginPath();
                ctx.arc(ox * hw, oy * hh, r, 0, Math.PI * 2);
                ctx.fill();
            });
            break;
        }
        case 'fridge': {
            ctx.fillStyle = '#f5f6fa';
            ctx.fillRect(-hw, -hh, w, h);
            ctx.strokeRect(-hw, -hh, w, h);
            ctx.beginPath();
            ctx.moveTo(-hw, hh * 0.65);
            ctx.lineTo(hw, hh * 0.65);
            ctx.stroke();
            break;
        }
        case 'bed': {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(-hw, -hh, w, h);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-hw * 0.85, -hh * 0.88, w * 0.36, h * 0.2);
            ctx.fillRect(hw * 0.12, -hh * 0.88, w * 0.36, h * 0.2);
            ctx.strokeRect(-hw, -hh, w, h);
            break;
        }
        case 'wardrobe': {
            ctx.fillStyle = '#a07855';
            ctx.fillRect(-hw, -hh, w, h);
            ctx.strokeRect(-hw, -hh, w, h);
            ctx.beginPath();
            ctx.moveTo(0, -hh);
            ctx.lineTo(0, hh);
            ctx.stroke();
            break;
        }
        case 'nightstand': {
            ctx.fillStyle = '#c89d7c';
            ctx.fillRect(-hw, -hh, w, h);
            ctx.strokeRect(-hw, -hh, w, h);
            break;
        }
        case 'bathtub': {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-hw, -hh, w, h);
            ctx.strokeRect(-hw, -hh, w, h);
            ctx.fillStyle = '#dff9fb';
            ctx.fillRect(-hw * 0.85, -hh * 0.78, w * 0.85, h * 0.78);
            ctx.strokeRect(-hw * 0.85, -hh * 0.78, w * 0.85, h * 0.78);
            break;
        }
        case 'toilet': {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-hw, -hh, w, h * 0.32);
            ctx.strokeRect(-hw, -hh, w, h * 0.32);
            ctx.beginPath();
            ctx.ellipse(0, hh * 0.2, hw * 0.85, hh * 0.65, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
        }
        case 'desk': {
            ctx.fillStyle = '#e1b12c';
            ctx.fillRect(-hw, -hh, w, h);
            ctx.strokeRect(-hw, -hh, w, h);
            ctx.fillStyle = '#353b48';
            ctx.beginPath();
            ctx.arc(0, hh + 8, Math.min(w, h) * 0.28, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case 'plant': {
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(0, 0, Math.min(hw, hh), 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#27ae60';
            ctx.beginPath();
            ctx.arc(0, 0, Math.min(hw, hh) * 0.55, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        default: {
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(-hw, -hh, w, h);
            ctx.strokeRect(-hw, -hh, w, h);
        }
    }

    ctx.restore();
}

function drawBackgroundImage() {
    if (bgImage) {
        const refW = 1000;
        const refH = 700;
        const scale = Math.min(refW / bgImage.width, refH / bgImage.height);
        const drawWidth = bgImage.width * scale;
        const drawHeight = bgImage.height * scale;
        const x = (refW / 2) - (drawWidth / 2);
        const y = (refH / 2) - (drawHeight / 2);

        ctx.globalAlpha = bgOpacity;
        ctx.drawImage(bgImage, x, y, drawWidth, drawHeight);
        ctx.globalAlpha = 1.0;
    }
}

// FŐ 2D RAJZOLÓ FÜGGVÉNY
function draw() {
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f4f0e4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(cameraOffset.x, cameraOffset.y);
    ctx.scale(zoomFactor, zoomFactor);

    drawBackgroundImage();
    drawGrid();

    ctx.lineCap = 'round';
    if (isShowingPlans) {
        // 1. KÉSZ FALAK
        walls.forEach((wall, index) => {
            const start = nodes[wall.startNode];
            const end = nodes[wall.endNode];
            if (!start || !end) return;
            const currentT = wall.thickness || 20;

            const isSelected = selectedElement && selectedElement.type === 'wall' && selectedElement.index === index;

            ctx.beginPath();
            if (isSelected) {
                ctx.strokeStyle = '#f39c12';
                ctx.lineWidth = currentT + 2;
            } else if (index === draggedWallIndex) {
                ctx.strokeStyle = '#05a9af';
                ctx.lineWidth = currentT;
            } else if (index === hoveredWallIndex) {
                ctx.strokeStyle = '#ff4444';
                ctx.lineWidth = currentT;
            } else {
                ctx.strokeStyle = '#333';
                ctx.lineWidth = currentT;
            }
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        });

        // 2. KÉSZ ABLAKOK
        windows.forEach((win, index) => {
            const w = walls[win.wallIndex];
            if (!w) return;
            const currentT = w.thickness || 20;
            const n1 = nodes[w.startNode];
            const n2 = nodes[w.endNode];
            const x = n1.x + (n2.x - n1.x) * win.position;
            const y = n1.y + (n2.y - n1.y) * win.position;
            const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);

            const isSelected = selectedElement && selectedElement.type === 'window' && selectedElement.index === index;
            if (isSelected) {
                ctx.shadowColor = '#f39c12';
                ctx.shadowBlur = 18;
            } else if (index === hoveredWindowIndex || index === draggedWindowIndex) {
                ctx.shadowColor = '#ff4444';
                ctx.shadowBlur = 15;
            } else {
                ctx.shadowBlur = 0;
            }
            drawWindow(x, y, angle, win.length, currentT);
            ctx.shadowBlur = 0;
        });

        // 3. KÉSZ AJTÓK
        doors.forEach((door, index) => {
            const w = walls[door.wallIndex];
            if (!w) return;
            const currentT = w.thickness || 20;
            const n1 = nodes[w.startNode];
            const n2 = nodes[w.endNode];

            const x = n1.x + (n2.x - n1.x) * door.position;
            const y = n1.y + (n2.y - n1.y) * door.position;
            const rotation = door.doorRotation || 0;
            const isFlipped = (rotation === 1 || rotation === 3);
            const isMirrored = (rotation === 2 || rotation === 3);

            const baseAngle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
            const angle = isFlipped ? baseAngle + Math.PI : baseAngle;

            const isSelected = selectedElement && selectedElement.type === 'door' && selectedElement.index === index;
            if (isSelected) {
                ctx.shadowColor = '#f39c12';
                ctx.shadowBlur = 18;
            } else if (index === hoveredDoorIndex || index === draggedDoorIndex) {
                ctx.shadowColor = '#ff4444';
                ctx.shadowBlur = 15;
            } else {
                ctx.shadowBlur = 0;
            }
            drawDoor(x, y, angle, door.length, currentT, isMirrored);
            ctx.shadowBlur = 0;
        });

        // 4. NYÍLÁSZÁRÓ ELŐNÉZET
        if ((currentTool === 'windows' || currentTool === 'doors') && hoveredWallIndex !== null && walls[hoveredWallIndex]) {
            const w = walls[hoveredWallIndex];
            const currentT = w.thickness || 20;
            const n1 = nodes[w.startNode];
            const n2 = nodes[w.endNode];
            const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);

            ctx.globalAlpha = 0.5;
            if (currentTool === 'windows') drawWindow(mousePosition.x, mousePosition.y, angle, 60, currentT);
            if (currentTool === 'doors') drawDoor(mousePosition.x, mousePosition.y, angle, 50, currentT);
            ctx.globalAlpha = 1.0;
        }

        // 5. ÉPPEN HÚZOTT FAL
        if (currentTool === 'walls' && isDrawing && currentStartNode !== null && nodes[currentStartNode]) {
            const start = nodes[currentStartNode];
            ctx.lineWidth = wallThickness;
            ctx.strokeStyle = 'rgba(51, 51, 51, 0.4)';
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);

            const snappedNodeIndex = findClosestNode(mousePosition.x, mousePosition.y);
            if (snappedNodeIndex !== null) {
                ctx.lineTo(nodes[snappedNodeIndex].x, nodes[snappedNodeIndex].y);
            } else {
                ctx.lineTo(mousePosition.x, mousePosition.y);
            }
            ctx.stroke();
        }

        // 6. ELHELYEZETT BÚTOROK
        furnitures.forEach((f, index) => {
            const isSelected = selectedElement && selectedElement.type === 'furniture' && selectedElement.index === index;
            if (isSelected) {
                ctx.shadowColor = '#f39c12';
                ctx.shadowBlur = 18;
            } else if (index === hoveredFurnitureIndex || index === draggedFurnitureIndex) {
                ctx.shadowColor = '#ff4444';
                ctx.shadowBlur = 15;
            } else {
                ctx.shadowBlur = 0;
            }
            const dims = getFurnitureDimensions(f);
            drawFurnitureItem(f.x, f.y, f.type, f.angle, f.size || 100, false, dims.w, dims.h);
            ctx.shadowBlur = 0;
        });

        // 7. BÚTOR ELŐNÉZET
        if (currentTool === 'furniture' && selectedFurnitureType) {
            drawFurnitureItem(mousePosition.x, mousePosition.y, selectedFurnitureType, currentFurnitureAngle, furnitureSize, true);
        }

        // 8. PIROS CSOMÓPONTOK
        if (currentTool === 'walls' || currentTool === 'select') {
            ctx.fillStyle = '#ff0000';
            nodes.forEach(node => {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    ctx.restore();
}