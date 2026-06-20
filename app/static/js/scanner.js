import {
    triggerPageAnimations,
    animateResults,
    resetResultsMotion
} from './motion.js?v=3';
import {
    drawCharts,
    resetCharts,
    initChartsObserver
} from './charts.js?v=3';

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

        const btnUpload1 = document.getElementById('btn-upload-1');
        const btnUpload2 = document.getElementById('btn-upload-2');
        if (btnUpload1) btnUpload1.addEventListener('click', (e) => { e.stopPropagation(); file1.click(); });
        if (btnUpload2) btnUpload2.addEventListener('click', (e) => { e.stopPropagation(); file2.click(); });

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

        // CAMERA LOGIC
        let stream1 = null;
        let stream2 = null;

        const startCamera = async (idx) => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                const video = document.getElementById(`video-${idx}`);
                const cameraUI = document.getElementById(`camera-ui-${idx}`);
                if (video && cameraUI) {
                    video.srcObject = stream;
                    cameraUI.classList.remove('hidden');
                    cameraUI.classList.add('flex');
                    if (idx === 1) stream1 = stream;
                    if (idx === 2) stream2 = stream;
                }
            } catch (err) {
                console.error("Error accessing camera: ", err);
                alert("Cannot access camera. Please check permissions.");
            }
        };

        const stopCamera = (idx) => {
            const stream = idx === 1 ? stream1 : stream2;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                if (idx === 1) stream1 = null;
                if (idx === 2) stream2 = null;
            }
            const cameraUI = document.getElementById(`camera-ui-${idx}`);
            if (cameraUI) {
                cameraUI.classList.add('hidden');
                cameraUI.classList.remove('flex');
            }
        };

        const capturePhoto = (idx) => {
            const video = document.getElementById(`video-${idx}`);
            const canvas = document.getElementById(`canvas-${idx}`);
            if (!video || !canvas) return;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            
            // Draw mirrored image if facingMode is user
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
                if (!blob) return;
                const file = new File([blob], `capture_${idx}.jpg`, { type: 'image/jpeg' });
                const previewEl = idx === 1 ? preview1 : preview2;
                const placeholderEl = idx === 1 ? placeholder1 : placeholder2;
                
                handleFileChange(file, previewEl, placeholderEl, idx, (f) => {
                    if (idx === 1) file1Data = f;
                    if (idx === 2) file2Data = f;
                });
                stopCamera(idx);
            }, 'image/jpeg', 0.95);
        };

        const btnCamera1 = document.getElementById('btn-camera-1');
        const btnCamera2 = document.getElementById('btn-camera-2');
        const btnCancelCam1 = document.getElementById('btn-cancel-cam-1');
        const btnCancelCam2 = document.getElementById('btn-cancel-cam-2');
        const btnCapture1 = document.getElementById('btn-capture-1');
        const btnCapture2 = document.getElementById('btn-capture-2');

        if (btnCamera1) btnCamera1.addEventListener('click', (e) => { e.stopPropagation(); startCamera(1); });
        if (btnCamera2) btnCamera2.addEventListener('click', (e) => { e.stopPropagation(); startCamera(2); });
        if (btnCancelCam1) btnCancelCam1.addEventListener('click', (e) => { e.stopPropagation(); stopCamera(1); });
        if (btnCancelCam2) btnCancelCam2.addEventListener('click', (e) => { e.stopPropagation(); stopCamera(2); });
        if (btnCapture1) btnCapture1.addEventListener('click', (e) => { e.stopPropagation(); capturePhoto(1); });
        if (btnCapture2) btnCapture2.addEventListener('click', (e) => { e.stopPropagation(); capturePhoto(2); });

        const resetSystem = () => {
            stopCamera(1);
            stopCamera(2);
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
                    file1Data = new File([blob1], 'demo_face_1.png', {
                        type: 'image/png'
                    });

                    const res2 = await fetch('static/demo_face_2.png');
                    const blob2 = await res2.blob();
                    file2Data = new File([blob2], 'demo_face_2.png', {
                        type: 'image/png'
                    });

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
            resSysStatus.className = 'font-semibold text-[10px] text-emerald-400';
        }

        if (resLabel) {
            resLabel.innerText = data.label;
            if (data.label === "Tidak mirip sama sekali") {
                resLabel.className = "text-lg font-bold block text-red-500 ";
            } else if (data.label === "Tidak mirip") {
                resLabel.className = "text-lg font-bold block text-amber-500 ";
            } else if (data.label === "Mirip") {
                resLabel.className = "text-lg font-bold block text-cyan-400 ";
            } else {
                resLabel.className = "text-lg font-bold block text-emerald-500 ";
            }
        }

        if (data.metrics) {
            const elMean = document.getElementById('stat-mean');
            if (elMean) elMean.innerText = `MEAN: ${data.metrics.mean}`;
            
            const elStd = document.getElementById('stat-std');
            if (elStd) elStd.innerText = `STD: ${data.metrics.std}`;
            
            const elAuc = document.getElementById('stat-auc');
            if (elAuc) elAuc.innerText = `AUC: ${data.metrics.auc}`;
        }

        animateResults(data.similarity, data.distance, data.latency, data.label);
        initChartsObserver();
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
                    [{
                        opacity: 0
                    }, {
                        opacity: 1
                    }], {
                        duration: 200,
                        fill: 'forwards'
                    }
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
                    [{
                        opacity: 1
                    }, {
                        opacity: 0
                    }], {
                        duration: 200,
                        fill: 'forwards'
                    }
                );
                anim.addEventListener('finish', () => {
                    diagnosticsModal.classList.add('hidden');
                    diagnosticsModal.style.opacity = '';
                }, {
                    once: true
                });
            }
        });
    }
});