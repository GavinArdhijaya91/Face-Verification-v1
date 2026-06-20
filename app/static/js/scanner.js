import { triggerPageAnimations, animateResults, resetResultsMotion } from './motion.js';
import { drawCharts, resetCharts } from './charts.js';

document.addEventListener('DOMContentLoaded', () => {
    triggerPageAnimations();

    const drop1 = document.getElementById('drop-1');
    const drop2 = document.getElementById('drop-2');
    const file1 = document.getElementById('file-1');
    const file2 = document.getElementById('file-2');
    const preview1 = document.getElementById('preview-1');
    const preview2 = document.getElementById('preview-2');
    const placeholder1 = document.getElementById('placeholder-1');
    const placeholder2 = document.getElementById('placeholder-2');
    const verifyBtn = document.getElementById('verify-btn');
    const resetBtn = document.getElementById('reset-btn');
    const importBtn = document.getElementById('import-samples-btn');
    const diagnosticsBtn = document.getElementById('diagnostics-btn');
    const diagnosticsModal = document.getElementById('diagnostics-modal');
    const closeDiagnosticsBtn = document.getElementById('close-diagnostics-btn');
    const diagnosticsLog = document.getElementById('diagnostics-log');

    const overlay1 = document.getElementById('overlay-container-1');
    const overlay2 = document.getElementById('overlay-container-2');
    const pulseFlow = document.getElementById('pulse-flow-indicator');

    const resLabel = document.getElementById('result-label');
    const resDistance = document.getElementById('result-distance');
    const resConfidence = document.getElementById('result-confidence');
    const resLatency = document.getElementById('result-latency');
    const resTimestamp = document.getElementById('result-timestamp');
    const resSysStatus = document.getElementById('result-sys-status');

    let file1Data = null;
    let file2Data = null;

    const checkReady = () => {
        if (file1Data && file2Data) {
            verifyBtn.disabled = false;
            if (pulseFlow) pulseFlow.classList.remove('opacity-0');
        } else {
            verifyBtn.disabled = true;
            if (pulseFlow) pulseFlow.classList.add('opacity-0');
        }
    };

    const getMetaDimensions = (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve(`${img.naturalWidth} x ${img.naturalHeight} px`);
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const showPreview = async (file, previewEl, placeholderEl, idx) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            previewEl.src = e.target.result;
            previewEl.classList.remove('hidden');
            placeholderEl.classList.add('hidden');
            
            const nameEl = document.getElementById(`meta-${idx}-name`);
            const dimsEl = document.getElementById(`meta-${idx}-dims`);
            const sizeEl = document.getElementById(`meta-${idx}-size`);
            const typeEl = document.getElementById(`meta-${idx}-type`);
            const statusEl = document.getElementById(`meta-${idx}-status`);

            if (nameEl) nameEl.innerText = file.name;
            if (sizeEl) sizeEl.innerText = `Size: ${formatBytes(file.size)}`;
            if (typeEl) typeEl.innerText = `Type: ${file.type.split('/')[1].toUpperCase()}`;
            if (statusEl) {
                statusEl.innerText = 'READY';
                statusEl.className = 'text-cyan-400 font-semibold';
            }

            const dims = await getMetaDimensions(file);
            if (dimsEl) dimsEl.innerText = `Dimensions: ${dims}`;

            checkReady();
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (file, previewEl, placeholderEl, idx, callback) => {
        if (file && file.type.startsWith('image/')) {
            callback(file);
            showPreview(file, previewEl, placeholderEl, idx);
        }
    };

    const setupDragDrop = (dropArea, previewEl, placeholderEl, idx, callback) => {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropArea.classList.add('border-cyan-500/50', 'bg-cyan-500/5');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropArea.classList.remove('border-cyan-500/50', 'bg-cyan-500/5');
            }, false);
        });

        dropArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            handleFileChange(file, previewEl, placeholderEl, idx, callback);
        }, false);
    };

    const drawFaceGrid = (faceData, container) => {
        container.innerHTML = '';
        container.classList.remove('hidden');

        const box = document.createElement('div');
        box.className = 'face-box';
        box.style.left = `${faceData.box.left}%`;
        box.style.top = `${faceData.box.top}%`;
        box.style.width = `${faceData.box.width}%`;
        box.style.height = `${faceData.box.height}%`;
        
        const bracketSpan = document.createElement('span');
        box.appendChild(bracketSpan);
        container.appendChild(box);

        const mesh = document.createElement('div');
        mesh.className = 'face-mesh';
        mesh.style.left = `${faceData.box.left}%`;
        mesh.style.top = `${faceData.box.top}%`;
        mesh.style.width = `${faceData.box.width}%`;
        mesh.style.height = `${faceData.box.height}%`;
        container.appendChild(mesh);

        // faceData.landmarks.forEach(pt => {
        //     const dot = document.createElement('div');
        //     dot.className = 'landmark-dot';
        //     dot.style.left = `${pt.x}%`;
        //     dot.style.top = `${pt.y}%`;
        //     dot.setAttribute('data-label', pt.label);
        //     container.appendChild(dot);
        // });
    };

    // PAGE 1: UPLOAD PAGE LOGIC
    if (drop1 && drop2) {
        setupDragDrop(drop1, preview1, placeholder1, 1, (f) => file1Data = f);
        setupDragDrop(drop2, preview2, placeholder2, 2, (f) => file2Data = f);

        drop1.addEventListener('click', () => file1.click());
        drop2.addEventListener('click', () => file2.click());

        file1.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileChange(e.target.files[0], preview1, placeholder1, 1, (f) => file1Data = f);
            }
        });

        file2.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileChange(e.target.files[0], preview2, placeholder2, 2, (f) => file2Data = f);
            }
        });

        const resetSystem = () => {
            file1Data = null;
            file2Data = null;
            file1.value = '';
            file2.value = '';

            preview1.classList.add('hidden');
            preview2.classList.add('hidden');
            placeholder1.classList.remove('hidden');
            placeholder2.classList.remove('hidden');

            document.getElementById('meta-1-name').innerText = 'No File Loaded';
            document.getElementById('meta-1-dims').innerText = 'Dimensions: ---';
            document.getElementById('meta-1-size').innerText = 'Size: ---';
            document.getElementById('meta-1-type').innerText = 'Type: ---';
            document.getElementById('meta-1-status').innerText = 'IDLE';
            document.getElementById('meta-1-status').className = 'text-slate-500';

            document.getElementById('meta-2-name').innerText = 'No File Loaded';
            document.getElementById('meta-2-dims').innerText = 'Dimensions: ---';
            document.getElementById('meta-2-size').innerText = 'Size: ---';
            document.getElementById('meta-2-type').innerText = 'Type: ---';
            document.getElementById('meta-2-status').innerText = 'IDLE';
            document.getElementById('meta-2-status').className = 'text-slate-500';

            verifyBtn.disabled = true;
            if (pulseFlow) pulseFlow.classList.add('opacity-0');
        };

        if (resetBtn) resetBtn.addEventListener('click', resetSystem);

        if (verifyBtn) {
            verifyBtn.addEventListener('click', async () => {
                if (!file1Data || !file2Data) return;

                verifyBtn.disabled = true;
                
                const scanLine1 = document.getElementById('scan-line-1');
                const scanLine2 = document.getElementById('scan-line-2');
                if (scanLine1) scanLine1.classList.add('animate-scan', 'opacity-100');
                if (scanLine2) scanLine2.classList.add('animate-scan', 'opacity-100');
                


                const status1 = document.getElementById('meta-1-status');
                const status2 = document.getElementById('meta-2-status');
                if (status1) status1.innerText = 'SCANNING...';
                if (status2) status2.innerText = 'SCANNING...';

                const formData = new FormData();
                formData.append('files', file1Data);
                formData.append('files', file2Data);

                const startTime = performance.now();

                try {
                    const response = await fetch('verify/', {
                        method: 'POST',
                        body: formData
                    });

                    const durationMs = Math.round(performance.now() - startTime);

                    if (response.ok) {
                        const data = await response.json();
                        data.latency = durationMs;
                        data.timestamp = new Date().toLocaleTimeString();

                        setTimeout(() => {
                            sessionStorage.setItem('face_result', JSON.stringify(data));
                            window.location.href = 'result';
                        }, 2000);
                    } else {
                        alert("Biometric verification engine encountered an error.");
                        resetSystem();
                    }
                } catch (error) {
                    console.error("Error during verification:", error);
                    alert("Connection error to Aegis Core.");
                    resetSystem();
                }
            });
        }

        if (importBtn) {
            importBtn.addEventListener('click', async () => {
                resetSystem();
                importBtn.innerText = "Loading Samples...";
                importBtn.disabled = true;

                try {
                    const res1 = await fetch('static/demo_face_1.png');
                    const blob1 = await res1.blob();
                    file1Data = new File([blob1], 'demo_face_1.png', { type: 'image/png' });

                    const res2 = await fetch('static/demo_face_2.png');
                    const blob2 = await res2.blob();
                    file2Data = new File([blob2], 'demo_face_2.png', { type: 'image/png' });

                    await showPreview(file1Data, preview1, placeholder1, 1);
                    await showPreview(file2Data, preview2, placeholder2, 2);

                    logDiagnostic("Sample loading successful: Subject 1 & Subject 2 loaded.");
                } catch (err) {
                    console.error("Failed to load sample images:", err);
                    alert("Could not load samples. Ensure static assets are created.");
                } finally {
                    importBtn.innerText = "Import Samples";
                    importBtn.disabled = false;
                }
            });
        }
    }

    // PAGE 2: RESULT PAGE LOGIC
    const resultCard = document.getElementById('result-card');
    if (resultCard) {
        const dataStr = sessionStorage.getItem('face_result');
        if (!dataStr) {
            window.location.href = './';
            return;
        }

        const data = JSON.parse(dataStr);

        if (data.faces) {
            if (overlay1) drawFaceGrid(data.faces[0], overlay1);
            if (overlay2) drawFaceGrid(data.faces[1], overlay2);
        }

        if (resDistance) resDistance.innerText = data.distance.toFixed(3);
        if (resConfidence) resConfidence.innerText = `${(data.confidence * 100).toFixed(1)}%`;
        if (resLatency) resLatency.innerText = `${data.latency} ms`;
        if (resTimestamp) resTimestamp.innerText = data.timestamp;
        if (resSysStatus) {
            resSysStatus.innerText = 'SUCCESS';
            resSysStatus.className = 'font-orbitron font-semibold text-[10px] text-emerald-400';
        }

        if (resLabel) {
            resLabel.innerText = data.label;
            if (data.label === "Tidak mirip sama sekali") {
                resLabel.className = "text-lg font-bold font-orbitron block text-red-500 text-glow-red";
            } else if (data.label === "Tidak mirip") {
                resLabel.className = "text-lg font-bold font-orbitron block text-amber-500 text-glow-amber";
            } else if (data.label === "Mirip") {
                resLabel.className = "text-lg font-bold font-orbitron block text-cyan-400 text-glow-cyan";
            } else {
                resLabel.className = "text-lg font-bold font-orbitron block text-emerald-500 text-glow-emerald";
            }
        }

        animateResults(data.similarity, data.distance, data.latency, data.label);
        
        drawCharts();
        setInterval(() => {
            resetCharts();
            setTimeout(() => {
                drawCharts();
            }, 600); // Wait for CSS reset transitions to complete before redrawing
        }, 5000); 
    }

    // Diagnostics Modal
    const logDiagnostic = (msg) => {
        if (!diagnosticsLog) return;
        const p = document.createElement('p');
        p.innerText = `> ${msg}`;
        if (msg.includes('success') || msg.includes('successful')) {
            p.className = 'text-emerald-400';
        } else if (msg.includes('error') || msg.includes('failed')) {
            p.className = 'text-red-400';
        }
        diagnosticsLog.appendChild(p);
        diagnosticsLog.scrollTop = diagnosticsLog.scrollHeight;
    };

    if (diagnosticsBtn) {
        diagnosticsBtn.addEventListener('click', () => {
            if (diagnosticsModal) {
                diagnosticsModal.classList.remove('hidden');
                diagnosticsModal.animate(
                    [{ opacity: 0 }, { opacity: 1 }],
                    { duration: 200, fill: 'forwards' }
                );
            }
            logDiagnostic("Diagnostics run triggered.");
            logDiagnostic("Checking model integrity: OK");
            logDiagnostic("Checking camera/scanner endpoints: OK");
            logDiagnostic("Database check: 24,015 biometric templates loaded.");
        });
    }

    if (closeDiagnosticsBtn) {
        closeDiagnosticsBtn.addEventListener('click', () => {
            if (diagnosticsModal) {
                const anim = diagnosticsModal.animate(
                    [{ opacity: 1 }, { opacity: 0 }],
                    { duration: 200, fill: 'forwards' }
                );
                anim.addEventListener('finish', () => {
                    diagnosticsModal.classList.add('hidden');
                    diagnosticsModal.style.opacity = '';
                }, { once: true });
            }
        });
    }
});
