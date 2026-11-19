// ============================================================================
// 9. HÉT: THREE.JS 3D MOTOR – NYÍLÁSZÁRÓ KIVÁGÁSOK, 3D BÚTOROK ÉS OSZTOTT NÉZET
// ============================================================================

const Viewer3D = {
    WORLD_ORIGIN_X: 500,
    WORLD_ORIGIN_Y: 350,

    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    buildingGroup: null,
    materials: null,
    resizeObserver: null,
    isInitialized: false,
    needsInitialFocus: true,
    animationFrameId: null,
    _rebuildPending: false,
    _lastBounds: null,

    // ------------------------------------------------------------------------
    // 1. INICIALIZÁLÁS ÉS ANYAGKÖNYVTÁR
    // ------------------------------------------------------------------------
    initMaterials() {
        if (this.materials) return;

        const std = (color, roughness = 0.65, metalness = 0.05, extra = {}) => {
            const mat = new THREE.MeshStandardMaterial({
                color,
                roughness,
                metalness,
                ...extra
            });
            mat.userData.shared = true;
            return mat;
        };

        const line = (color, opacity = 0.45) => {
            const mat = new THREE.LineBasicMaterial({
                color,
                transparent: opacity < 1,
                opacity
            });
            mat.userData.shared = true;
            return mat;
        };

        this.materials = {
            // Falak és födémek
            wallActive: std(0xf8f9fa, 0.65, 0.04),
            wallInactive: std(0xe2e8f0, 0.72, 0.04),
            wallSelected: std(0xfef3c7, 0.55, 0.05),
            wallEdge: line(0x94a3b8, 0.45),
            wallEdgeSelected: line(0xf39c12, 0.95),
            basePlate: std(0xf4f0e4, 0.88, 0.02),
            floorSlab: std(0xcbd5e1, 0.82, 0.03, { transparent: true, opacity: 0.9 }),

            // Nyílászárók
            windowFrame: std(0xffffff, 0.38, 0.05),
            windowFrameSelected: std(0xfde68a, 0.4, 0.05),
            windowSill: std(0xd6d3d1, 0.55, 0.05),
            windowGlass: std(0x87ceeb, 0.08, 0.18, {
                transparent: true,
                opacity: 0.34,
                side: THREE.DoubleSide,
                depthWrite: false
            }),
            doorFrame: std(0x6f4728, 0.65, 0.04),
            doorLeaf: std(0xc48a54, 0.52, 0.04),
            doorPanel: std(0xaa703c, 0.6, 0.04),
            doorThreshold: std(0x8d6e63, 0.7, 0.05),
            doorHandle: std(0xd4af37, 0.22, 0.88),
            selectionHighlight: line(0xf39c12, 1.0),

            // Bútor anyagok (4 kategória harmonizálva a 2D színpalettával)
            sofaMain: std(0xd9483b, 0.82, 0.02),
            sofaTrim: std(0xb53226, 0.85, 0.02),
            armchairMain: std(0xe67e22, 0.82, 0.02),
            armchairTrim: std(0xc4600c, 0.85, 0.02),

            woodDark: std(0x5c4033, 0.65, 0.05),
            woodMedium: std(0x8e6e53, 0.6, 0.05),
            woodOak: std(0xd2b48c, 0.55, 0.04),
            woodWalnut: std(0xa07855, 0.58, 0.05),
            woodLight: std(0xc89d7c, 0.58, 0.04),
            woodHoney: std(0xdba829, 0.52, 0.05),

            tableTopWhite: std(0xecf0f1, 0.42, 0.05),
            counterTop: std(0xbdc3c7, 0.4, 0.08),
            cabinetBody: std(0xe5e7eb, 0.5, 0.04),
            steel: std(0x95a5a6, 0.3, 0.62),
            chrome: std(0xe2e8f0, 0.16, 0.88),
            stoveBody: std(0xdfe6e9, 0.35, 0.25),
            fridgeBody: std(0xf5f6fa, 0.28, 0.22),
            darkMetal: std(0x2d3436, 0.42, 0.35),
            screenBlack: std(0x111827, 0.14, 0.22),
            chairFabric: std(0x353b48, 0.78, 0.05),

            bedDuvet: std(0xf1c40f, 0.82, 0.02),
            bedSheet: std(0xffffff, 0.85, 0.01),
            lampShade: std(0xfff8dc, 0.6, 0.02, { emissive: 0x3b2f12, emissiveIntensity: 0.45 }),

            porcelain: std(0xffffff, 0.16, 0.06),
            bathWater: std(0xdff9fb, 0.12, 0.08),

            terracotta: std(0xc06c47, 0.8, 0.02),
            soil: std(0x3e2723, 0.95, 0.01),
            foliageLight: std(0x2ecc71, 0.75, 0.02),
            foliageDark: std(0x27ae60, 0.8, 0.02)
        };
    },

    init() {
        const container = document.getElementById('three-container');
        if (!container || typeof THREE === 'undefined') return;
        if (this.isInitialized) return;

        this.initMaterials();

        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;

        // 1. Színtér
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xdbe4eb);
        this.scene.fog = new THREE.FogExp2(0xdbe4eb, 0.00022);

        // 2. Perspektivikus kamera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
        this.camera.position.set(0, 560, 680);

        // 3. WebGL Renderelő
        this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        container.innerHTML = '';
        container.appendChild(this.renderer.domElement);

        // 4. OrbitControls
        if (THREE.OrbitControls) {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.08;
            this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
            this.controls.minDistance = 80;
            this.controls.maxDistance = 4200;
            this.controls.target.set(0, 50, 0);
        }

        // 5. Hárompontos építészeti megvilágítás
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d99ae, 0.68);
        hemiLight.position.set(0, 1200, 0);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xfffcf2, 0.85);
        dirLight.position.set(500, 950, 600);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 100;
        dirLight.shadow.camera.far = 3200;
        dirLight.shadow.bias = -0.0005;
        const d = 1050;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        this.scene.add(dirLight);

        // Lágy ellenfény, hogy az árnyékos falak és bútorok részletei is jól látszódjanak
        const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.32);
        fillLight.position.set(-450, 500, -500);
        this.scene.add(fillLight);

        // 6. Talajsík és építészeti rács
        const groundGeo = new THREE.PlaneGeometry(5000, 5000);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0xe5e9ec, roughness: 0.92 });
        const groundMesh = new THREE.Mesh(groundGeo, groundMat);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = -1;
        groundMesh.receiveShadow = true;
        this.scene.add(groundMesh);

        const gridHelper = new THREE.GridHelper(2400, 120, 0x44A194, 0xb8c4cc);
        gridHelper.position.y = 0;
        this.scene.add(gridHelper);

        // 7. Fő épületcsoport
        this.buildingGroup = new THREE.Group();
        this.scene.add(this.buildingGroup);

        // Automatikus átméretezés követése (ablakméret és osztott sáv húzása esetén is)
        window.addEventListener('resize', () => this.onResize());
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.onResize());
            this.resizeObserver.observe(container);
        }

        this.isInitialized = true;
        this.animate();
    },

    onResize() {
        const container = document.getElementById('three-container');
        if (!container || !this.renderer || !this.camera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w < 10 || h < 10) return;

        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    },

    focusOnBuilding(resetAngle = true) {
        if (!this.camera || !this.controls) return;

        if (this._lastBounds && this._lastBounds.hasContent) {
            const b = this._lastBounds;
            const cx = (b.minX + b.maxX) / 2 - this.WORLD_ORIGIN_X;
            const cz = (b.minY + b.maxY) / 2 - this.WORLD_ORIGIN_Y;
            const spanX = Math.max(260, b.maxX - b.minX);
            const spanZ = Math.max(260, b.maxY - b.minY);
            const span = Math.sqrt(spanX * spanX + spanZ * spanZ);
            const dist = Math.max(520, Math.min(1800, span * 1.05));
            const targetY = Math.max(45, (b.totalHeight || 135) * 0.35);

            this.controls.target.set(cx, targetY, cz);
            if (resetAngle) {
                this.camera.position.set(cx + dist * 0.25, targetY + dist * 0.72, cz + dist * 0.85);
            }
        } else {
            this.controls.target.set(0, 50, 0);
            if (resetAngle) {
                this.camera.position.set(0, 560, 680);
            }
        }
        this.controls.update();
    },

    resetCamera() {
        this.focusOnBuilding(true);
    },

    // ------------------------------------------------------------------------
    // 2. MEMÓRIABIZTOS TAKARÍTÁS ÉS THROTTLE-ÖLT ÚJRAÉPÍTÉS
    // ------------------------------------------------------------------------
    disposeObject3D(obj) {
        if (!obj) return;
        if (obj.children) {
            while (obj.children.length > 0) {
                const child = obj.children[0];
                this.disposeObject3D(child);
                obj.remove(child);
            }
        }
        if (obj.geometry) {
            obj.geometry.dispose();
        }
        if (obj.material) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach(m => {
                if (m && !(m.userData && m.userData.shared)) {
                    m.dispose();
                }
            });
        }
    },

    scheduleRebuild() {
        if (this._rebuildPending) return;
        this._rebuildPending = true;
        requestAnimationFrame(() => {
            this._rebuildPending = false;
            if (viewMode === '3d' || viewMode === 'split') {
                this.rebuild3DScene();
            }
        });
    },

    // ------------------------------------------------------------------------
    // 3. GEOMETRIAI SEGÉDFÜGGVÉNYEK
    // ------------------------------------------------------------------------
    addBoxBottom(parent, w, h, d, material, x = 0, bottomY = 0, z = 0, castShadow = true, receiveShadow = true) {
        if (w <= 0.05 || h <= 0.05 || d <= 0.05) return null;
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(x, bottomY + h / 2, z);
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
        parent.add(mesh);
        return mesh;
    },

    addCylBottom(parent, rTop, rBot, h, segs, material, x = 0, bottomY = 0, z = 0, castShadow = true, receiveShadow = true) {
        if (h <= 0.05) return null;
        const geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(x, bottomY + h / 2, z);
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
        parent.add(mesh);
        return mesh;
    },

    // 1D függőleges intervallum kivonása (Boolean különbség fal-kivágásokhoz)
    subtractVerticalInterval(intervals, cutBot, cutTop) {
        const result = [];
        for (let i = 0; i < intervals.length; i++) {
            const [a, b] = intervals[i];
            if (cutTop <= a || cutBot >= b) {
                result.push([a, b]);
            } else {
                if (cutBot > a + 0.4) result.push([a, cutBot]);
                if (cutTop < b - 0.4) result.push([cutTop, b]);
            }
        }
        return result;
    },

    // ------------------------------------------------------------------------
    // 4. 3D ABLAK ÉS AJTÓ PARAMETRIKUS MODELLEK
    // ------------------------------------------------------------------------
    createWindow3D(w, winH, wallT, isSelected) {
        const group = new THREE.Group();
        const frameMat = isSelected ? this.materials.windowFrameSelected : this.materials.windowFrame;
        const frameThick = Math.min(4.2, w * 0.14, winH * 0.14);
        const frameDepth = wallT + 2.6;

        // Külső ablaktok (alsó, felső, bal, jobb keretlécek)
        this.addBoxBottom(group, w, frameThick, frameDepth, frameMat, 0, 0, 0, true, true);
        this.addBoxBottom(group, w, frameThick, frameDepth, frameMat, 0, winH - frameThick, 0, true, true);
        const innerH = Math.max(2, winH - 2 * frameThick);
        this.addBoxBottom(group, frameThick, innerH, frameDepth, frameMat, -w / 2 + frameThick / 2, frameThick, 0, true, true);
        this.addBoxBottom(group, frameThick, innerH, frameDepth, frameMat, w / 2 - frameThick / 2, frameThick, 0, true, true);

        // Belső-külső ablakpárkány
        const sillH = 3.2;
        this.addBoxBottom(group, w + 6, sillH, wallT + 8, this.materials.windowSill, 0, -sillH * 0.55, 0, true, true);

        // Osztóbordák (mullions) az ablak szélességétől függően
        const innerW = Math.max(2, w - 2 * frameThick);
        const mullionW = 2.6;
        const mullionD = Math.max(4, wallT * 0.45);
        if (w >= 105) {
            this.addBoxBottom(group, mullionW, innerH, mullionD, frameMat, -innerW / 6, frameThick, 0, true, false);
            this.addBoxBottom(group, mullionW, innerH, mullionD, frameMat, innerW / 6, frameThick, 0, true, false);
        } else if (w >= 46) {
            this.addBoxBottom(group, mullionW, innerH, mullionD, frameMat, 0, frameThick, 0, true, false);
        }

        // Átlátszó üvegtábla (nem vet sötét árnyékot, hogy bejöjjön a fény!)
        const glassGeo = new THREE.PlaneGeometry(innerW, innerH);
        const glassMesh = new THREE.Mesh(glassGeo, this.materials.windowGlass);
        glassMesh.position.set(0, frameThick + innerH / 2, 0);
        glassMesh.castShadow = false;
        glassMesh.receiveShadow = false;
        group.add(glassMesh);

        // Kijelölés kontúr
        if (isSelected) {
            const tmpBox = new THREE.BoxGeometry(w + 2, winH + 2, frameDepth + 2);
            const selGeo = new THREE.EdgesGeometry(tmpBox);
            tmpBox.dispose();
            const selLines = new THREE.LineSegments(selGeo, this.materials.selectionHighlight);
            selLines.position.set(0, winH / 2, 0);
            group.add(selLines);
        }

        return group;
    },

    createDoor3D(w, doorH, wallT, doorRotation, isSelected) {
        const group = new THREE.Group();
        const frameThick = Math.min(3.8, w * 0.12);
        const frameDepth = wallT + 3.2;
        const innerW = Math.max(8, w - 2 * frameThick);
        const innerH = Math.max(15, doorH - frameThick);

        // Ajtótok (bal, jobb, felső) és küszöb
        this.addBoxBottom(group, frameThick, doorH, frameDepth, this.materials.doorFrame, -w / 2 + frameThick / 2, 0, 0, true, true);
        this.addBoxBottom(group, frameThick, doorH, frameDepth, this.materials.doorFrame, w / 2 - frameThick / 2, 0, 0, true, true);
        this.addBoxBottom(group, w + 2, frameThick, frameDepth, this.materials.doorFrame, 0, doorH - frameThick, 0, true, true);
        this.addBoxBottom(group, innerW, 1.2, wallT + 2, this.materials.doorThreshold, 0, 0, 0, false, true);

        // Nyitásirány 100%-ban megegyezik a 2D drawDoor logikával (doorRotation: 0..3)
        const rot = doorRotation || 0;
        const isFlipped = (rot === 1 || rot === 3);
        const isMirrored = (rot === 2 || rot === 3);

        const swingContainer = new THREE.Group();
        if (isFlipped) {
            swingContainer.rotation.y = Math.PI;
        }
        group.add(swingContainer);

        const leafThickness = 3.2;
        const hingeZ = -wallT / 2 + leafThickness / 2;
        const hingeX = isMirrored ? (innerW / 2) : (-innerW / 2);
        const dirSign = isMirrored ? -1 : 1; // Ajtólap iránya a zsanértól zárt állapotban

        const hingePivot = new THREE.Group();
        hingePivot.position.set(hingeX, 0, hingeZ);
        // Nyitott szög (~48°), hogy látszódjon a nyitásirány és be is lehessen látni a helyiségbe
        hingePivot.rotation.y = dirSign * (Math.PI * 0.27);
        swingContainer.add(hingePivot);

        // Ajtólap fő test
        const leafMat = isSelected ? this.materials.windowFrameSelected : this.materials.doorLeaf;
        const leafCenterX = dirSign * (innerW / 2);
        this.addBoxBottom(hingePivot, innerW, innerH - 0.8, leafThickness, leafMat, leafCenterX, 0.8, 0, true, true);

        // Dekoratív kazettás betétek az ajtólap két oldalán
        const insetW = innerW * 0.64;
        const lowerPanelH = innerH * 0.32;
        const upperPanelH = innerH * 0.36;
        if (insetW > 6) {
            this.addBoxBottom(hingePivot, insetW, lowerPanelH, leafThickness + 0.8, this.materials.doorPanel, leafCenterX, innerH * 0.1, 0, false, true);
            this.addBoxBottom(hingePivot, insetW, upperPanelH, leafThickness + 0.8, this.materials.doorPanel, leafCenterX, innerH * 0.5, 0, false, true);
        }

        // Kilincs mindkét oldalon (szabvány ~105 cm = 52 px magasságban)
        const handleX = dirSign * (innerW - 6.5);
        const handleY = Math.min(52, innerH * 0.48);
        [-1, 1].forEach(side => {
            const zPlate = side * (leafThickness / 2 + 0.4);
            // Kilincs rozetta
            this.addBoxBottom(hingePivot, 2.4, 7, 0.8, this.materials.doorHandle, handleX, handleY - 3.5, zPlate, false, false);
            // Kilincs nyak
            this.addBoxBottom(hingePivot, 1.4, 1.4, 3.2, this.materials.doorHandle, handleX, handleY - 0.7, side * (leafThickness / 2 + 2.0), false, false);
            // Kilincs fogantyú (befelé mutat)
            this.addBoxBottom(hingePivot, 6.5, 1.3, 1.3, this.materials.doorHandle, handleX - dirSign * 2.5, handleY - 0.65, side * (leafThickness / 2 + 3.4), false, false);
        });

        // Kijelölés kontúr
        if (isSelected) {
            const tmpBox = new THREE.BoxGeometry(w + 3, doorH + 2, frameDepth + 3);
            const selGeo = new THREE.EdgesGeometry(tmpBox);
            tmpBox.dispose();
            const selLines = new THREE.LineSegments(selGeo, this.materials.selectionHighlight);
            selLines.position.set(0, doorH / 2, 0);
            group.add(selLines);
        }

        return group;
    },

    // ------------------------------------------------------------------------
    // 5. FAL FELHÚZÁSA VALÓS IDEJŰ NYÍLÁSZÁRÓ-KIVÁGÁSOKKAL
    // ------------------------------------------------------------------------
    buildWallWithOpenings(fp, wall, wallIndex, floorElevation, hPx, isCurrentActiveFloor) {
        const n1 = fp.nodes[wall.startNode];
        const n2 = fp.nodes[wall.endNode];
        if (!n1 || !n2) return;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length < 1) return;

        const thickness = wall.thickness || 20;
        const midX = (n1.x + n2.x) / 2 - this.WORLD_ORIGIN_X;
        const midZ = (n1.y + n2.y) / 2 - this.WORLD_ORIGIN_Y;
        const angle = Math.atan2(dy, dx);

        const isWallSelected = isCurrentActiveFloor &&
            selectedElement &&
            selectedElement.type === 'wall' &&
            selectedElement.index === wallIndex;

        const wallMat = isWallSelected
            ? this.materials.wallSelected
            : (isCurrentActiveFloor ? this.materials.wallActive : this.materials.wallInactive);

        const wallGroup = new THREE.Group();
        wallGroup.position.set(midX, floorElevation, midZ);
        wallGroup.rotation.y = -angle;

        // Szabványos nyílásmagasságok (1 px = 2 cm; ajtó: 210 cm, ablak: 90..210 cm)
        const doorTopY = Math.max(18, Math.min(105, hPx * 0.84));
        const winSillY = Math.min(45, hPx * 0.30);
        const winHeadY = Math.max(winSillY + 12, Math.min(105, hPx * 0.84));
        const endMargin = Math.min(thickness * 0.5, length * 0.08);

        const openings = [];

        // Ablakok összegyűjtése ehhez a falhoz
        if (fp.windows) {
            fp.windows.forEach((win, winIdx) => {
                if (win.wallIndex !== wallIndex) return;
                const rawW = win.length || 60;
                const centerS = (win.position !== undefined ? win.position : 0.5) * length;
                const xStart = Math.max(endMargin, centerS - rawW / 2);
                const xEnd = Math.min(length - endMargin, centerS + rawW / 2);
                if (xEnd - xStart < 4) return;
                openings.push({
                    kind: 'window',
                    index: winIdx,
                    data: win,
                    xStart,
                    xEnd,
                    centerS: (xStart + xEnd) / 2,
                    width: xEnd - xStart,
                    yBot: winSillY,
                    yTop: winHeadY
                });
            });
        }

        // Ajtók összegyűjtése ehhez a falhoz
        if (fp.doors) {
            fp.doors.forEach((door, doorIdx) => {
                if (door.wallIndex !== wallIndex) return;
                const rawW = door.length || 50;
                const centerS = (door.position !== undefined ? door.position : 0.5) * length;
                const xStart = Math.max(endMargin, centerS - rawW / 2);
                const xEnd = Math.min(length - endMargin, centerS + rawW / 2);
                if (xEnd - xStart < 4) return;
                openings.push({
                    kind: 'door',
                    index: doorIdx,
                    data: door,
                    xStart,
                    xEnd,
                    centerS: (xStart + xEnd) / 2,
                    width: xEnd - xStart,
                    yBot: 0,
                    yTop: doorTopY
                });
            });
        }

        // Vízszintes felosztási pontok gyűjtése és rendezése (1D Sweep CSG)
        const rawSplits = [0, length];
        openings.forEach(op => {
            rawSplits.push(op.xStart, op.xEnd);
        });
        rawSplits.sort((a, b) => a - b);

        const splits = [];
        rawSplits.forEach(x => {
            if (splits.length === 0 || x - splits[splits.length - 1] > 0.5) {
                splits.push(x);
            }
        });

        const bottomEdgeRuns = [];

        // Tömör falszakaszok, parapetek és szemöldökgerendák generálása
        for (let i = 0; i < splits.length - 1; i++) {
            const x0 = splits[i];
            const x1 = splits[i + 1];
            const stripW = x1 - x0;
            if (stripW < 0.5) continue;

            const stripMid = (x0 + x1) / 2;
            let solidYIntervals = [[0, hPx]];

            openings.forEach(op => {
                if (op.xStart <= stripMid && op.xEnd >= stripMid) {
                    solidYIntervals = this.subtractVerticalInterval(solidYIntervals, op.yBot, op.yTop);
                }
            });

            let touchesFloor = false;
            solidYIntervals.forEach(([y0, y1]) => {
                const segH = y1 - y0;
                if (segH < 0.5) return;
                if (y0 <= 0.5) touchesFloor = true;

                this.addBoxBottom(
                    wallGroup,
                    stripW,
                    segH,
                    thickness,
                    wallMat,
                    stripMid - length / 2,
                    y0,
                    0,
                    true,
                    true
                );
            });

            if (touchesFloor) {
                if (bottomEdgeRuns.length > 0 && Math.abs(bottomEdgeRuns[bottomEdgeRuns.length - 1][1] - x0) < 0.6) {
                    bottomEdgeRuns[bottomEdgeRuns.length - 1][1] = x1;
                } else {
                    bottomEdgeRuns.push([x0, x1]);
                }
            }
        }

        // Tiszta külső CAD kontúrvonalak (belső szegmens-varratok nélkül!)
        const halfL = length / 2;
        const halfT = thickness / 2;
        const edgeCoords = [];
        const pushSeg = (ax, ay, az, bx, by, bz) => {
            edgeCoords.push(ax, ay, az, bx, by, bz);
        };

        // Felső élek és végzárók
        pushSeg(-halfL, hPx, -halfT, halfL, hPx, -halfT);
        pushSeg(-halfL, hPx, halfT, halfL, hPx, halfT);
        pushSeg(-halfL, hPx, -halfT, -halfL, hPx, halfT);
        pushSeg(halfL, hPx, -halfT, halfL, hPx, halfT);

        // Függőleges végélek
        pushSeg(-halfL, 0, -halfT, -halfL, hPx, -halfT);
        pushSeg(-halfL, 0, halfT, -halfL, hPx, halfT);
        pushSeg(halfL, 0, -halfT, halfL, hPx, -halfT);
        pushSeg(halfL, 0, halfT, halfL, hPx, halfT);

        // Alsó élek (csak ott, ahol nincs ajtónyílás)
        bottomEdgeRuns.forEach(([rx0, rx1]) => {
            pushSeg(rx0 - halfL, 0, -halfT, rx1 - halfL, 0, -halfT);
            pushSeg(rx0 - halfL, 0, halfT, rx1 - halfL, 0, halfT);
        });

        const outlineGeo = new THREE.BufferGeometry();
        outlineGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgeCoords, 3));
        const outlineMat = isWallSelected ? this.materials.wallEdgeSelected : this.materials.wallEdge;
        wallGroup.add(new THREE.LineSegments(outlineGeo, outlineMat));

        // 3D Ablak és Ajtó modellek beillesztése a kivágott nyílásokba
        openings.forEach(op => {
            const isOpSelected = isCurrentActiveFloor &&
                selectedElement &&
                selectedElement.type === op.kind &&
                selectedElement.index === op.index;

            if (op.kind === 'window') {
                const winMesh = this.createWindow3D(op.width, op.yTop - op.yBot, thickness, isOpSelected);
                winMesh.position.set(op.centerS - halfL, op.yBot, 0);
                wallGroup.add(winMesh);
            } else if (op.kind === 'door') {
                const doorMesh = this.createDoor3D(
                    op.width,
                    op.yTop,
                    thickness,
                    op.data.doorRotation || 0,
                    isOpSelected
                );
                doorMesh.position.set(op.centerS - halfL, 0, 0);
                wallGroup.add(doorMesh);
            }
        });

        this.buildingGroup.add(wallGroup);
    },

    // ------------------------------------------------------------------------
    // 6. TÉRBEI BÚTORMODELLEK (MIND A 15 TÍPUS A 4 KATEGÓRIÁBÓL)
    // ------------------------------------------------------------------------
    createFurniture3D(f, floorElevation, isSelected) {
        const dims = (typeof getFurnitureDimensions === 'function')
            ? getFurnitureDimensions(f)
            : { w: f.w || 50, h: f.h || 50 };

        const w = Math.max(8, dims.w);
        const d = Math.max(8, dims.h); // 2D 'h' a 3D Z-mélység (előre/hátra)
        const hw = w / 2;
        const hd = d / 2;
        const M = this.materials;

        const group = new THREE.Group();
        group.position.set(
            f.x - this.WORLD_ORIGIN_X,
            floorElevation,
            f.y - this.WORLD_ORIGIN_Y
        );
        group.rotation.y = -(f.angle || 0);

        let approxHeight = 35;

        switch (f.type) {
            // ================= 1. NAPPALI =================
            case 'sofa': {
                approxHeight = 44;
                const legH = 4;
                const baseH = 12;
                const seatH = 8;
                const backD = d * 0.26;
                const armW = Math.min(w * 0.16, 15);
                const innerW = Math.max(10, w - 2 * armW);

                // 4 fa láb
                [[-hw + 4, -hd + 4], [hw - 4, -hd + 4], [-hw + 4, hd - 4], [hw - 4, hd - 4]].forEach(([lx, lz]) => {
                    this.addBoxBottom(group, 3, legH, 3, M.woodDark, lx, 0, lz);
                });
                // Alsó keret
                this.addBoxBottom(group, w, baseH, d, M.sofaTrim, 0, legH, 0);
                // Háttámla (-Z oldalon, a 2D rajzzal megegyezően)
                this.addBoxBottom(group, w, 28, backD, M.sofaTrim, 0, legH + baseH, -hd + backD / 2);
                // Bal és jobb karfa
                this.addBoxBottom(group, armW, 17, d - backD, M.sofaTrim, -hw + armW / 2, legH + baseH, backD / 2);
                this.addBoxBottom(group, armW, 17, d - backD, M.sofaTrim, hw - armW / 2, legH + baseH, backD / 2);
                // Ülőpárnák (2 vagy 3 részre osztva)
                const numCushions = w >= 85 ? 3 : 2;
                const cushW = (innerW - (numCushions + 1) * 1.2) / numCushions;
                for (let c = 0; c < numCushions; c++) {
                    const cx = -innerW / 2 + 1.2 + cushW / 2 + c * (cushW + 1.2);
                    this.addBoxBottom(group, cushW, seatH, d - backD - 2, M.sofaMain, cx, legH + baseH, backD / 2 + 0.5);
                    this.addBoxBottom(group, cushW, 16, 5, M.sofaMain, cx, legH + baseH + seatH - 1, -hd + backD + 2.5);
                }
                break;
            }

            case 'armchair': {
                approxHeight = 42;
                const legH = 4;
                const baseH = 11;
                const backD = d * 0.26;
                const armW = w * 0.2;
                const innerW = Math.max(6, w - 2 * armW);

                [[-hw + 3.5, -hd + 3.5], [hw - 3.5, -hd + 3.5], [-hw + 3.5, hd - 3.5], [hw - 3.5, hd - 3.5]].forEach(([lx, lz]) => {
                    this.addBoxBottom(group, 2.8, legH, 2.8, M.woodDark, lx, 0, lz);
                });
                this.addBoxBottom(group, w, baseH, d, M.armchairTrim, 0, legH, 0);
                this.addBoxBottom(group, w, 27, backD, M.armchairTrim, 0, legH + baseH, -hd + backD / 2);
                this.addBoxBottom(group, armW, 16, d - backD, M.armchairTrim, -hw + armW / 2, legH + baseH, backD / 2);
                this.addBoxBottom(group, armW, 16, d - backD, M.armchairTrim, hw - armW / 2, legH + baseH, backD / 2);
                this.addBoxBottom(group, innerW - 1.5, 8, d - backD - 2, M.armchairMain, 0, legH + baseH, backD / 2 + 0.5);
                this.addBoxBottom(group, innerW - 2, 16, 4.5, M.armchairMain, 0, legH + baseH + 7, -hd + backD + 2.4);
                break;
            }

            case 'tv_unit': {
                approxHeight = 62;
                const legH = 4;
                const cabH = 22;
                // Szekrény lábak
                [[-hw + 4, -hd + 3], [hw - 4, -hd + 3], [-hw + 4, hd - 3], [hw - 4, hd - 3]].forEach(([lx, lz]) => {
                    this.addBoxBottom(group, 2.5, legH, 2.5, M.darkMetal, lx, 0, lz);
                });
                // TV szekrény korpusz
                this.addBoxBottom(group, w, cabH, d, M.woodMedium, 0, legH, 0);
                // Sötét középső polcmélyedés + fiók fogantyúk (+Z front)
                this.addBoxBottom(group, w * 0.34, cabH * 0.45, 1.5, M.darkMetal, 0, legH + cabH * 0.45, hd - 0.5, false, false);
                this.addBoxBottom(group, w * 0.14, 1.2, 1.2, M.chrome, -w * 0.34, legH + cabH * 0.55, hd + 0.5, false, false);
                this.addBoxBottom(group, w * 0.14, 1.2, 1.2, M.chrome, w * 0.34, legH + cabH * 0.55, hd + 0.5, false, false);

                // TV talp és állvány
                const tvBaseY = legH + cabH;
                const tvW = w * 0.78;
                const tvH = Math.min(36, tvW * 0.54);
                this.addBoxBottom(group, tvW * 0.34, 1.8, d * 0.45, M.darkMetal, 0, tvBaseY, -d * 0.08);
                this.addBoxBottom(group, 4, 6, 2.5, M.darkMetal, 0, tvBaseY + 1.8, -d * 0.08);
                // TV kijelző
                this.addBoxBottom(group, tvW, tvH, 2.6, M.darkMetal, 0, tvBaseY + 6.5, -d * 0.08);
                this.addBoxBottom(group, tvW - 3, tvH - 3, 0.8, M.screenBlack, 0, tvBaseY + 8, -d * 0.08 + 1.2, false, false);
                approxHeight = tvBaseY + 6.5 + tvH;
                break;
            }

            case 'coffee_table': {
                approxHeight = 22;
                const topH = 3;
                const legH = 19;
                const legThick = 2.8;
                const lx = hw - legThick;
                const lz = hd - legThick;
                [[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]].forEach(([x, z]) => {
                    this.addBoxBottom(group, legThick, legH, legThick, M.woodDark, x, 0, z);
                });
                // Alsó polc
                this.addBoxBottom(group, w - 6, 1.8, d - 6, M.woodLight, 0, 6, 0);
                // Asztallap
                this.addBoxBottom(group, w, topH, d, M.woodOak, 0, legH, 0);
                break;
            }

            // ================= 2. KONYHA =================
            case 'table': {
                approxHeight = 38;
                const legH = 35;
                const topH = 3.2;
                const legThick = 3.4;
                const lx = hw - legThick;
                const lz = hd - legThick;
                // 4 fa láb és káva
                [[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]].forEach(([x, z]) => {
                    this.addBoxBottom(group, legThick, legH, legThick, M.woodOak, x, 0, z);
                });
                this.addBoxBottom(group, w - 6, 4, d - 6, M.woodOak, 0, legH - 4, 0);
                // Asztallap
                this.addBoxBottom(group, w, topH, d, M.tableTopWhite, 0, legH, 0);
                break;
            }

            case 'kitchen_counter': {
                approxHeight = 56;
                const plinthH = 5;
                const cabH = 37;
                const topH = 3;
                // Lábazat és korpusz
                this.addBoxBottom(group, w - 2, plinthH, d - 3, M.darkMetal, 0, 0, -0.5);
                this.addBoxBottom(group, w, cabH, d - 1, M.cabinetBody, 0, plinthH, -0.5);
                // Munkalap
                const topY = plinthH + cabH;
                this.addBoxBottom(group, w + 1, topH, d + 1, M.counterTop, 0, topY, 0);
                // Szekrényajtók elválasztói és fogantyúi (+Z front)
                const doorsCount = Math.max(2, Math.round(w / 32));
                const doorSpan = w / doorsCount;
                for (let i = 0; i < doorsCount; i++) {
                    const dxPos = -hw + doorSpan * (i + 0.5);
                    this.addBoxBottom(group, doorSpan * 0.45, 1.2, 1.2, M.steel, dxPos, plinthH + cabH - 6, hd, false, false);
                }
                // Mosogatómedence a bal oldalon (-X, a 2D rajzzal megegyezően)
                const sinkW = w * 0.28;
                const sinkD = d * 0.62;
                const sinkX = -hw * 0.32;
                this.addBoxBottom(group, sinkW + 2, 1.2, sinkD + 2, M.steel, sinkX, topY + topH, 0, false, true);
                this.addBoxBottom(group, sinkW - 2, 0.8, sinkD - 2, M.darkMetal, sinkX, topY + topH + 0.8, 0, false, false);
                // Csaptelep a mosogató mögött
                const faucetZ = -sinkD / 2 - 2.5;
                this.addCylBottom(group, 1.1, 1.4, 11, 10, M.chrome, sinkX, topY + topH, faucetZ);
                this.addBoxBottom(group, 1.6, 1.6, 7, M.chrome, sinkX, topY + topH + 10, faucetZ + 3);
                break;
            }

            case 'stove': {
                approxHeight = 46;
                const bodyH = 44;
                this.addBoxBottom(group, w, bodyH, d, M.stoveBody, 0, 0, 0);
                // Sütő üvegajtó és fogantyú (+Z front)
                this.addBoxBottom(group, w * 0.78, bodyH * 0.52, 1.4, M.screenBlack, 0, 8, hd + 0.2, false, false);
                this.addBoxBottom(group, w * 0.66, 1.5, 2.2, M.chrome, 0, 8 + bodyH * 0.52 + 2.5, hd + 1.1, false, false);
                // Vezérlőgombok (+Z előlapra forgatva)
                for (let k = -1.5; k <= 1.5; k += 1) {
                    const knob = this.addCylBottom(group, 1.3, 1.3, 1.4, 10, M.darkMetal, k * (w * 0.18), bodyH - 5.2, hd + 0.6, false, false);
                    if (knob) knob.rotation.x = Math.PI / 2;
                }
                // 4 főzőlap a tetején (2D pozíciókhoz illesztve)
                const burnerR = Math.min(w, d) * 0.15;
                [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].forEach(([ox, oz]) => {
                    this.addCylBottom(group, burnerR, burnerR, 1.4, 16, M.darkMetal, ox * hw, bodyH, oz * hd, false, true);
                });
                break;
            }

            case 'fridge': {
                approxHeight = 96;
                const totalH = 95;
                // Fő hűtőtest
                this.addBoxBottom(group, w, totalH, d * 0.84, M.fridgeBody, 0, 0, -d * 0.08);
                // Alsó fagyasztó ajtó és felső hűtőajtó (+Z front, 2D vonalnak megfelelően)
                const doorD = d * 0.16;
                const doorZ = hd - doorD / 2;
                this.addBoxBottom(group, w - 0.8, totalH * 0.34, doorD, M.fridgeBody, 0, 1, doorZ);
                this.addBoxBottom(group, w - 0.8, totalH * 0.63, doorD, M.fridgeBody, 0, totalH * 0.36, doorZ);
                // Ajtórés vonal
                this.addBoxBottom(group, w - 1, 1.2, doorD * 0.8, M.steel, 0, totalH * 0.348, doorZ, false, false);
                // Függőleges acél fogantyúk
                const handleX = -hw + 4.5;
                this.addBoxBottom(group, 1.6, 16, 2.4, M.chrome, handleX, totalH * 0.44, hd + 1.1);
                this.addBoxBottom(group, 1.6, 12, 2.4, M.chrome, handleX, totalH * 0.16, hd + 1.1);
                break;
            }

            // ================= 3. HÁLÓSZOBA =================
            case 'bed': {
                approxHeight = 52;
                const legH = 5;
                const frameH = 11;
                const mattH = 11;
                const headH = 52;
                const headD = Math.min(8, d * 0.1);

                // Ágylábak
                [[-hw + 4, -hd + 4], [hw - 4, -hd + 4], [-hw + 4, hd - 4], [hw - 4, hd - 4]].forEach(([lx, lz]) => {
                    this.addBoxBottom(group, 3.5, legH, 3.5, M.woodDark, lx, 0, lz);
                });
                // Fa ágykeret és fejtámla (-Z oldalon, a 2D párnák oldalán)
                this.addBoxBottom(group, w, frameH, d, M.woodMedium, 0, legH, 0);
                this.addBoxBottom(group, w + 2, headH, headD, M.woodDark, 0, 0, -hd + headD / 2);

                // Fehér matrac
                const mattY = legH + frameH;
                this.addBoxBottom(group, w - 4, mattH, d - headD - 3, M.bedSheet, 0, mattY, headD / 2);

                // Sárga takaró a matrac alsó ~68%-án (+Z rész, 2D-hez illesztve)
                const duvetD = (d - headD - 3) * 0.68;
                const duvetZ = hd - 1.5 - duvetD / 2;
                this.addBoxBottom(group, w - 2.2, mattH * 0.65, duvetD, M.bedDuvet, 0, mattY + mattH * 0.45, duvetZ);

                // Két fehér párna a fejtámlánál (-Z)
                const pillowW = w * 0.38;
                const pillowD = d * 0.18;
                const pillowZ = -hd + headD + pillowD / 2 + 2;
                this.addBoxBottom(group, pillowW, 6.5, pillowD, M.bedSheet, -w * 0.22, mattY + mattH, pillowZ);
                this.addBoxBottom(group, pillowW, 6.5, pillowD, M.bedSheet, w * 0.22, mattY + mattH, pillowZ);
                break;
            }

            case 'wardrobe': {
                approxHeight = 106;
                const totalH = 104;
                const plinthH = 4;
                // Lábazat és fő szekrénytest
                this.addBoxBottom(group, w - 1, plinthH, d - 2, M.woodDark, 0, 0, -0.5);
                this.addBoxBottom(group, w, totalH - plinthH - 2, d, M.woodWalnut, 0, plinthH, 0);
                // Felső párkányléc
                this.addBoxBottom(group, w + 2, 2.5, d + 2, M.woodDark, 0, totalH - 2, 0);
                // Középső ajtórés és két fogantyú (+Z front)
                this.addBoxBottom(group, 1.2, totalH - plinthH - 4, 0.8, M.woodDark, 0, plinthH + 1, hd + 0.2, false, false);
                this.addBoxBottom(group, 1.5, 16, 2.0, M.chrome, -4, totalH * 0.46, hd + 1.0);
                this.addBoxBottom(group, 1.5, 16, 2.0, M.chrome, 4, totalH * 0.46, hd + 1.0);
                break;
            }

            case 'nightstand': {
                approxHeight = 44;
                const legH = 3;
                const cabH = 24;
                // Lábak és korpusz
                [[-hw + 2.5, -hd + 2.5], [hw - 2.5, -hd + 2.5], [-hw + 2.5, hd - 2.5], [hw - 2.5, hd - 2.5]].forEach(([lx, lz]) => {
                    this.addBoxBottom(group, 2, legH, 2, M.woodDark, lx, 0, lz);
                });
                this.addBoxBottom(group, w, cabH, d, M.woodLight, 0, legH, 0);
                // 2 fiók előlap és gombok (+Z előlapra forgatva)
                this.addBoxBottom(group, w - 3, 0.8, 0.8, M.woodDark, 0, legH + cabH / 2, hd + 0.2, false, false);
                const knob1 = this.addCylBottom(group, 1.2, 1.2, 1.6, 10, M.chrome, 0, legH + cabH * 0.25 - 0.8, hd + 0.7, false, false);
                const knob2 = this.addCylBottom(group, 1.2, 1.2, 1.6, 10, M.chrome, 0, legH + cabH * 0.75 - 0.8, hd + 0.7, false, false);
                if (knob1) knob1.rotation.x = Math.PI / 2;
                if (knob2) knob2.rotation.x = Math.PI / 2;
                // Kis éjjeli lámpa a tetején
                const lampBaseY = legH + cabH;
                const lampR = Math.min(w, d) * 0.22;
                this.addCylBottom(group, lampR * 0.55, lampR * 0.75, 4, 14, M.woodDark, 0, lampBaseY, 0);
                this.addCylBottom(group, 0.8, 0.8, 6, 10, M.chrome, 0, lampBaseY + 4, 0);
                this.addCylBottom(group, lampR * 0.7, lampR * 1.15, 9, 16, M.lampShade, 0, lampBaseY + 8, 0);
                break;
            }

            // ================= 4. EGYÉB =================
            case 'bathtub': {
                approxHeight = 32;
                const tubH = 29;
                const rim = Math.min(4.5, w * 0.08, d * 0.14);
                const floorH = 6;
                const wallH = tubH - floorH;

                // Valóban üreges fürdőkád (alsó test + 4 peremfal + víztükör/belső fény)
                this.addBoxBottom(group, w, floorH, d, M.porcelain, 0, 0, 0);
                this.addBoxBottom(group, w, wallH, rim, M.porcelain, 0, floorH, -hd + rim / 2);
                this.addBoxBottom(group, w, wallH, rim, M.porcelain, 0, floorH, hd - rim / 2);
                this.addBoxBottom(group, rim, wallH, d - 2 * rim, M.porcelain, -hw + rim / 2, floorH, 0);
                this.addBoxBottom(group, rim, wallH, d - 2 * rim, M.porcelain, hw - rim / 2, floorH, 0);
                // Világoskék belső medencefenék
                this.addBoxBottom(group, w - 2 * rim - 0.5, 1, d - 2 * rim - 0.5, M.bathWater, 0, floorH, 0, false, true);
                // Króm csaptelep a kád egyik végén
                this.addCylBottom(group, 1.3, 1.5, 7, 10, M.chrome, -hw + rim / 2, tubH, 0);
                this.addBoxBottom(group, 6.5, 1.6, 1.6, M.chrome, -hw + rim / 2 + 3, tubH + 5.5, 0);
                break;
            }

            case 'toilet': {
                approxHeight = 40;
                const tankD = d * 0.32;
                const tankH = 38;
                const bowlH = 20;
                const bowlR = Math.min(w * 0.44, (d - tankD) * 0.52);

                // Tartály (-Z oldalon, 2D-hez igazítva)
                this.addBoxBottom(group, w, tankH, tankD, M.porcelain, 0, 0, -hd + tankD / 2);
                this.addCylBottom(group, 2, 2, 1.2, 12, M.chrome, 0, tankH, -hd + tankD / 2, false, false);

                // Porcelán csésze és talp (+Z)
                const bowlZ = -hd + tankD + bowlR * 0.85;
                this.addCylBottom(group, bowlR * 0.72, bowlR * 0.58, bowlH * 0.65, 18, M.porcelain, 0, 0, bowlZ);
                this.addCylBottom(group, bowlR, bowlR * 0.78, bowlH * 0.35, 20, M.porcelain, 0, bowlH * 0.65, bowlZ);
                // WC ülőke perem
                this.addCylBottom(group, bowlR * 0.96, bowlR * 0.96, 1.8, 20, M.tableTopWhite, 0, bowlH, bowlZ);
                break;
            }

            case 'desk': {
                approxHeight = 56;
                const deskH = 37;
                const topH = 2.8;
                const drawerW = Math.min(18, w * 0.28);

                // Fiókos konténer a jobb oldalon, lábak a bal oldalon
                this.addBoxBottom(group, drawerW, deskH, d - 2, M.woodMedium, hw - drawerW / 2 - 1, 0, 0);
                this.addBoxBottom(group, 2.8, deskH, 2.8, M.darkMetal, -hw + 3, 0, -hd + 3);
                this.addBoxBottom(group, 2.8, deskH, 2.8, M.darkMetal, -hw + 3, 0, hd - 3);
                // Asztallap
                this.addBoxBottom(group, w, topH, d, M.woodHoney, 0, deskH, 0);

                // Monitor + billentyűzet az asztalon
                const surfaceY = deskH + topH;
                const monW = Math.min(28, w * 0.45);
                this.addBoxBottom(group, 8, 1.2, 6, M.darkMetal, -w * 0.08, surfaceY, -hd + 6);
                this.addBoxBottom(group, 2.2, 7, 1.8, M.darkMetal, -w * 0.08, surfaceY + 1.2, -hd + 5);
                this.addBoxBottom(group, monW, 16, 1.6, M.screenBlack, -w * 0.08, surfaceY + 6.5, -hd + 5.5);
                this.addBoxBottom(group, monW * 0.65, 1.0, 5.5, M.darkMetal, -w * 0.08, surfaceY, 3, false, true);

                // Forgószék (+Z oldalon, a 2D rajzzal megegyezően: z = hd + 8)
                const chairZ = hd + 9;
                const chairR = Math.min(w, d) * 0.28;
                this.addCylBottom(group, chairR * 0.85, chairR * 0.95, 2, 12, M.darkMetal, 0, 0, chairZ);
                this.addCylBottom(group, 1.8, 1.8, 19, 10, M.chrome, 0, 2, chairZ);
                this.addBoxBottom(group, chairR * 2, 3.5, chairR * 1.9, M.chairFabric, 0, 21, chairZ);
                this.addBoxBottom(group, chairR * 1.9, 19, 3, M.chairFabric, 0, 24, chairZ + chairR * 0.85);
                break;
            }

            case 'plant': {
                approxHeight = 56;
                const r = Math.min(hw, hd);
                const potH = Math.max(12, Math.min(22, r * 1.45));
                // Terrakotta cserép és föld
                this.addCylBottom(group, r * 0.82, r * 0.56, potH, 16, M.terracotta, 0, 0, 0);
                this.addCylBottom(group, r * 0.74, r * 0.74, 1.2, 14, M.soil, 0, potH - 0.6, 0, false, true);
                // Törzs
                const stemH = potH * 0.95;
                this.addCylBottom(group, r * 0.14, r * 0.2, stemH, 10, M.woodDark, 0, potH, 0);
                // Többrétegű lombozat (gömbökből összeállított természetes bokor)
                const canopyBaseY = potH + stemH * 0.75;
                const blobs = [
                    { x: 0, y: canopyBaseY + r * 0.55, z: 0, rad: r * 0.72, mat: M.foliageLight },
                    { x: r * 0.38, y: canopyBaseY + r * 0.15, z: r * 0.25, rad: r * 0.52, mat: M.foliageDark },
                    { x: -r * 0.38, y: canopyBaseY + r * 0.2, z: -r * 0.2, rad: r * 0.54, mat: M.foliageDark },
                    { x: -r * 0.2, y: canopyBaseY + r * 0.12, z: r * 0.42, rad: r * 0.48, mat: M.foliageLight },
                    { x: r * 0.24, y: canopyBaseY + r * 0.24, z: -r * 0.36, rad: r * 0.46, mat: M.foliageLight }
                ];
                blobs.forEach(b => {
                    const sGeo = new THREE.SphereGeometry(b.rad, 12, 10);
                    const sMesh = new THREE.Mesh(sGeo, b.mat);
                    sMesh.position.set(b.x, b.y, b.z);
                    sMesh.castShadow = true;
                    sMesh.receiveShadow = true;
                    group.add(sMesh);
                });
                approxHeight = canopyBaseY + r * 1.3;
                break;
            }

            default: {
                approxHeight = 32;
                this.addBoxBottom(group, w, 32, d, M.counterTop, 0, 0, 0);
                break;
            }
        }

        // Kijelölés keret a 3D nézetben (Osztott nézetben vizuális visszajelzés)
        if (isSelected) {
            const tmpBox = new THREE.BoxGeometry(w + 4, approxHeight + 4, d + 4);
            const selGeo = new THREE.EdgesGeometry(tmpBox);
            tmpBox.dispose();
            const selLines = new THREE.LineSegments(selGeo, M.selectionHighlight);
            selLines.position.set(0, approxHeight / 2, 0);
            group.add(selLines);
        }

        this.buildingGroup.add(group);
    },

    // ------------------------------------------------------------------------
    // 7. TELJES 3D SZÍNTÉR ÚJRAÉPÍTÉSE (FALAK + NYÍLÁSZÁRÓK + BÚTOROK + SZINTEK)
    // ------------------------------------------------------------------------
    rebuild3DScene() {
        if (!this.isInitialized) this.init();
        if (!this.buildingGroup) return;

        // Memóriabiztos törlés
        this.disposeObject3D(this.buildingGroup);

        // Aktuális szint szinkronizálása a floorPlans tömbbe
        floorPlans[currentFloor] = {
            nodes: JSON.parse(JSON.stringify(nodes)),
            walls: JSON.parse(JSON.stringify(walls)),
            windows: JSON.parse(JSON.stringify(windows)),
            doors: JSON.parse(JSON.stringify(doors)),
            furnitures: JSON.parse(JSON.stringify(furnitures)),
            historyStack: [...historyStack]
        };

        const hPx = wallHeight || 135;
        const floorsToRender = showAllFloors3D
            ? floorPlans.map((fp, idx) => ({ fp, idx }))
            : [{ fp: floorPlans[currentFloor], idx: 0 }];

        // Épület befoglaló téglalapjának meghatározása (falak + bútorok)
        let minAllX = Infinity, maxAllX = -Infinity, minAllY = Infinity, maxAllY = -Infinity;
        let hasContent = false;
        let activeFloorCount = 0;

        floorsToRender.forEach(({ fp }) => {
            if (!fp) return;
            let floorHasAny = false;
            if (fp.nodes && fp.nodes.length > 0) {
                fp.nodes.forEach(n => {
                    hasContent = true;
                    floorHasAny = true;
                    if (n.x < minAllX) minAllX = n.x;
                    if (n.x > maxAllX) maxAllX = n.x;
                    if (n.y < minAllY) minAllY = n.y;
                    if (n.y > maxAllY) maxAllY = n.y;
                });
            }
            if (fp.furnitures && fp.furnitures.length > 0) {
                fp.furnitures.forEach(f => {
                    hasContent = true;
                    floorHasAny = true;
                    const dims = (typeof getFurnitureDimensions === 'function')
                        ? getFurnitureDimensions(f)
                        : { w: 50, h: 50 };
                    const pad = Math.max(dims.w, dims.h) / 2;
                    if (f.x - pad < minAllX) minAllX = f.x - pad;
                    if (f.x + pad > maxAllX) maxAllX = f.x + pad;
                    if (f.y - pad < minAllY) minAllY = f.y - pad;
                    if (f.y + pad > maxAllY) maxAllY = f.y + pad;
                });
            }
            if (floorHasAny) activeFloorCount++;
        });

        this._lastBounds = {
            hasContent,
            minX: minAllX,
            maxX: maxAllX,
            minY: minAllY,
            maxY: maxAllY,
            totalHeight: Math.max(1, activeFloorCount) * hPx
        };

        // Alaplemez a teljes terv alatt (stabil világkoordinátákon, így szerkesztéskor nem ugrik a modell!)
        const plateCenterX = hasContent ? ((minAllX + maxAllX) / 2 - this.WORLD_ORIGIN_X) : 0;
        const plateCenterZ = hasContent ? ((minAllY + maxAllY) / 2 - this.WORLD_ORIGIN_Y) : 0;
        const plateW = hasContent ? Math.max(600, (maxAllX - minAllX) + 180) : 1000;
        const plateD = hasContent ? Math.max(500, (maxAllY - minAllY) + 180) : 700;

        this.addBoxBottom(
            this.buildingGroup,
            plateW,
            4,
            plateD,
            this.materials.basePlate,
            plateCenterX,
            0,
            plateCenterZ,
            false,
            true
        );

        // Szintek feldolgozása
        floorsToRender.forEach(({ fp, idx }) => {
            if (!fp) return;

            const floorElevation = idx * hPx + 4;
            const isCurrentActiveFloor = (showAllFloors3D ? idx === currentFloor : true);
            const nodeWallMat = isCurrentActiveFloor ? this.materials.wallActive : this.materials.wallInactive;

            // 1. Emeleti födémlemez (felsőbb szintek alatt, pontosan a szint aljára igazítva)
            if (idx > 0 && ((fp.walls && fp.walls.length > 0) || (fp.furnitures && fp.furnitures.length > 0))) {
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                if (fp.nodes) {
                    fp.nodes.forEach(n => {
                        if (n.x < minX) minX = n.x;
                        if (n.x > maxX) maxX = n.x;
                        if (n.y < minY) minY = n.y;
                        if (n.y > maxY) maxY = n.y;
                    });
                }
                if (minX < maxX && minY < maxY) {
                    const slabW = (maxX - minX) + 26;
                    const slabD = (maxY - minY) + 26;
                    this.addBoxBottom(
                        this.buildingGroup,
                        slabW,
                        4,
                        slabD,
                        this.materials.floorSlab,
                        (minX + maxX) / 2 - this.WORLD_ORIGIN_X,
                        floorElevation - 4,
                        (minY + maxY) / 2 - this.WORLD_ORIGIN_Y,
                        false,
                        true
                    );
                }
            }

            // 2. Csomóponti illesztőhengerek (résmentes sarkok)
            if (fp.walls && fp.nodes) {
                const nodeMaxThickness = new Array(fp.nodes.length).fill(0);
                fp.walls.forEach(w => {
                    const t = w.thickness || 20;
                    if (w.startNode < nodeMaxThickness.length) {
                        nodeMaxThickness[w.startNode] = Math.max(nodeMaxThickness[w.startNode], t);
                    }
                    if (w.endNode < nodeMaxThickness.length) {
                        nodeMaxThickness[w.endNode] = Math.max(nodeMaxThickness[w.endNode], t);
                    }
                });

                fp.nodes.forEach((node, nIdx) => {
                    const maxT = nodeMaxThickness[nIdx];
                    if (maxT > 0) {
                        const radius = maxT / 2;
                        this.addCylBottom(
                            this.buildingGroup,
                            radius,
                            radius,
                            hPx,
                            20,
                            nodeWallMat,
                            node.x - this.WORLD_ORIGIN_X,
                            floorElevation,
                            node.y - this.WORLD_ORIGIN_Y,
                            true,
                            true
                        );
                    }
                });

                // 3. Falak felhúzása ajtó- és ablakkivágásokkal + 3D nyílászárókkal
                fp.walls.forEach((wall, wIdx) => {
                    this.buildWallWithOpenings(fp, wall, wIdx, floorElevation, hPx, isCurrentActiveFloor);
                });
            }

            // 4. Térbeli 3D bútormodellek beillesztése a 2D szimbólumok helyére
            if (fp.furnitures && fp.furnitures.length > 0) {
                fp.furnitures.forEach((f, fIdx) => {
                    const isFurnSelected = isCurrentActiveFloor &&
                        selectedElement &&
                        selectedElement.type === 'furniture' &&
                        selectedElement.index === fIdx;
                    this.createFurniture3D(f, floorElevation, isFurnSelected);
                });
            }
        });

        // Első megnyitáskor automatikusan az épületre fókuszálunk
        if (this.needsInitialFocus) {
            this.focusOnBuilding(true);
            this.needsInitialFocus = false;
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    },

    // ------------------------------------------------------------------------
    // 8. ANIMÁCIÓS CIKLUS (3D ÉS OSZTOTT NÉZETBEN AKTÍV)
    // ------------------------------------------------------------------------
    animate() {
        this.animationFrameId = requestAnimationFrame(() => this.animate());
        if (viewMode !== '3d' && viewMode !== 'split') return;
        if (this.controls) this.controls.update();
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
};

window.Viewer3D = Viewer3D;
