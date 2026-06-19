import { animate } from "https://cdn.jsdelivr.net/npm/framer-motion@10.16.4/dist/es/index.mjs";

document.addEventListener('DOMContentLoaded', () => {
    const drop1 = document.getElementById('drop-1');
    const drop2 = document.getElementById('drop-2');
    const file1 = document.getElementById('file-1');
    const file2 = document.getElementById('file-2');
    const preview1 = document.getElementById('preview-1');
    const preview2 = document.getElementById('preview-2');
    const verifyBtn = document.getElementById('verify-btn');
    const resultSection = document.getElementById('result-section');
    const scoreVal = document.getElementById('score-val');
    const statusVal = document.getElementById('status-val');
    const distanceVal = document.getElementById('distance-val');
    const scoreBar = document.getElementById('score-bar');

    let file1Data = null;
    let file2Data = null;

    // Helper to handle file selection
    const handleFile = (file, previewEl, callback) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewEl.src = e.target.result;
                previewEl.classList.remove('hidden');
                callback(file);
                checkReady();
                
                // Animate pop
                animate(previewEl, { scale: [0.8, 1.05, 1] }, { duration: 0.3 });
            };
            reader.readAsDataURL(file);
        }
    };

    const checkReady = () => {
        if (file1Data && file2Data) {
            verifyBtn.disabled = false;
        }
    };

    // Click triggers
    drop1.addEventListener('click', () => file1.click());
    drop2.addEventListener('click', () => file2.click());

    // File input changes
    file1.addEventListener('change', (e) => {
        if(e.target.files.length > 0) handleFile(e.target.files[0], preview1, (f) => file1Data = f);
    });
    file2.addEventListener('change', (e) => {
        if(e.target.files.length > 0) handleFile(e.target.files[0], preview2, (f) => file2Data = f);
    });

    // Verify Button Click
    verifyBtn.addEventListener('click', async () => {
        if (!file1Data || !file2Data) return;

        verifyBtn.innerText = "Analyzing facial identity...";
        verifyBtn.disabled = true;

        const formData = new FormData();
        formData.append('files', file1Data);
        formData.append('files', file2Data);

        try {
            const response = await fetch('/verify/', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                showResult(data);
            } else {
                alert("Verification failed.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error during verification.");
        } finally {
            verifyBtn.innerText = "Verify Identity";
            verifyBtn.disabled = false;
        }
    });

    const showResult = (data) => {
        resultSection.classList.remove('hidden');
        
        // Animate result section appearance
        animate(resultSection, { opacity: [0, 1], y: [20, 0] }, { duration: 0.5 });
        
        // Update Values
        scoreVal.innerText = (data.similarity * 100).toFixed(1) + "%";
        statusVal.innerText = data.label;
        distanceVal.innerText = `${data.distance.toFixed(2)} / ${(data.confidence * 100).toFixed(0)}%`;
        
        // Color mapping for label
        if (data.label === "Tidak mirip sama sekali") {
            statusVal.className = "text-2xl font-bold text-danger";
        } else if (data.label === "Tidak mirip") {
            statusVal.className = "text-2xl font-bold text-warning";
        } else if (data.label === "Mirip") {
            statusVal.className = "text-2xl font-bold text-secondary";
        } else {
            statusVal.className = "text-2xl font-bold text-success glow-success";
        }

        // Animate score bar
        scoreBar.style.width = '0%';
        setTimeout(() => {
            scoreBar.style.width = (data.similarity * 100) + '%';
        }, 100);
    };
});
