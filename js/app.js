/**
 * SalaryPredict — Main Application Logic
 * Menangani interaksi UI, kalkulasi prediksi, visualisasi, dan riwayat.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inisialisasi Icons
    lucide.createIcons();

    // 2. State Aplikasi
    const state = {
        experience: 5,
        education: 1, // Default S1
        age: 25,
        gender: 0, // Default Pria
        jobTitle: 'Software Developer', // Default
        techBonus: 0, // Bonus from Scanner
        history: JSON.parse(localStorage.getItem('salary_predict_history') || '[]')
    };

    // 3. Elemen DOM
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.getElementById('navbar');
    
    const predictForm = document.getElementById('predict-form');
    const expInput = document.getElementById('experience');
    const expValue = document.getElementById('experience-value');
    const ageInput = document.getElementById('age');
    const ageValue = document.getElementById('age-value');
    const eduCards = document.querySelectorAll('#education-cards .edu-card');
    const genderCards = document.querySelectorAll('#gender-cards .edu-card');
    const jobDropdown = document.getElementById('job-dropdown');
    const jobSelected = document.getElementById('job-selected');
    const jobSelectedText = document.getElementById('job-selected-text');
    const jobOptions = document.querySelectorAll('#job-options .dropdown-option');
    
    const resultPlaceholder = document.getElementById('result-placeholder');
    const resultContent = document.getElementById('result-content');
    const salaryResult = document.getElementById('salary-result');
    const salaryMonthly = document.getElementById('salary-monthly');
    const detailExp = document.getElementById('detail-exp');
    const detailEdu = document.getElementById('detail-edu');
    const detailAge = document.getElementById('detail-age');
    const detailJob = document.getElementById('detail-job');
    const detailGender = document.getElementById('detail-gender');
    const modelFormula = document.getElementById('model-formula');
    
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');

    // QR Code Modal
    const qrBtn = document.getElementById('qr-btn');
    const qrModal = document.getElementById('qr-modal');
    const closeModal = document.getElementById('close-modal');
    const qrContainer = document.getElementById('qrcode-container');
    const modalUrlDisplay = document.getElementById('modal-url-display');
    let qrGenerated = false;

    // Scanner DOM
    const openScannerBtn = document.getElementById('open-scanner-btn');
    const scannerModal = document.getElementById('scanner-modal');
    const closeScannerBtn = document.getElementById('close-scanner');
    const scannerVideo = document.getElementById('scanner-video');
    const scannerCanvas = document.getElementById('scanner-canvas');
    const scannerLoading = document.getElementById('scanner-loading');
    const detectedItemsContainer = document.getElementById('detected-items');
    const finishScanBtn = document.getElementById('finish-scan-btn');
    const scannerStatus = document.getElementById('scanner-status');
    const detailBonus = document.getElementById('detail-bonus');
    const uploadSetupInput = document.getElementById('upload-setup');
    
    let objectDetectorModel = null;
    let scannerStream = null;
    let detectionFrameId = null;
    let detectedObjects = new Set();
    const objectBonuses = {
        'laptop': 2000,     // Laptop
        'tv': 2000,         // Monitor (terdeteksi sebagai tv oleh COCO-SSD)
        'mouse': 500,       // Mouse
        'keyboard': 500,    // Keyboard
        'cell phone': 500   // Handphone
    };

    // 4. Inisialisasi Chart.js
    let comparisonChart = null;
    let eduSalaryChart = null;
    let eduDistChart = null;
    let expSalaryChart = null;

    // Set Formula Text
    if (modelFormula) {
        modelFormula.innerHTML = `Rumus: <code style="font-family: var(--font-mono); color: var(--primary-light);">${MODEL.formula}</code>`;
    }

    // ========== NAVIGATION & SCROLLING ==========
    
    // Smooth scroll for nav links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            if (navMenu) navMenu.classList.remove('active');
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Update active nav based on scroll position
        const sections = ['home', 'predict', 'visualize', 'about'];
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const rect = el.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
                navLinks.forEach(l => {
                    l.classList.remove('active');
                    if (l.getAttribute('href') === `#${id}`) l.classList.add('active');
                });
            }
        });
    });

    // ========== FORM INTERACTORS ==========

    // Range Sliders
    if(expInput) {
        expInput.addEventListener('input', (e) => {
            state.experience = parseInt(e.target.value);
            expValue.textContent = state.experience;
        });
    }

    if(ageInput) {
        ageInput.addEventListener('input', (e) => {
            state.age = parseInt(e.target.value);
            ageValue.textContent = state.age;
        });
    }

    // Education Cards Selection
    if(eduCards) {
        eduCards.forEach(card => {
            card.addEventListener('click', () => {
                eduCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                state.education = parseInt(card.dataset.value);
            });
        });
    }

    // Gender Cards Selection
    if(genderCards) {
        genderCards.forEach(card => {
            card.addEventListener('click', () => {
                genderCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                state.gender = parseInt(card.dataset.value);
            });
        });
    }

    // Custom Job Title Dropdown
    if (jobSelected && jobDropdown) {
        jobSelected.addEventListener('click', (e) => {
            e.stopPropagation();
            jobDropdown.classList.toggle('open');
            jobSelected.classList.toggle('open');
        });
    }

    if (jobOptions) {
        jobOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                // Update active class on option elements
                jobOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Update selected text and state
                const value = option.dataset.value;
                state.jobTitle = value;
                if (jobSelectedText) {
                    jobSelectedText.textContent = value;
                }
                
                // Close dropdown
                if (jobDropdown) jobDropdown.classList.remove('open');
                if (jobSelected) jobSelected.classList.remove('open');
            });
        });
    }

    // ========== PREDICTION LOGIC ==========

    if(predictForm) {
        predictForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 1. Calculate Prediction
            const salary = MODEL.predict(state.experience, state.education, state.age, state.gender, state.jobTitle, state.techBonus);
            
            // 2. Update UI Result
            resultPlaceholder.classList.add('hidden');
            resultContent.classList.remove('hidden');
            
            // Tampilkan tombol cetak
            const printBtn = document.getElementById('print-btn');
            if(printBtn) printBtn.classList.remove('hidden');
            
            // Animate count up
            animateValue(salaryResult, 0, Math.round(salary), 1000);
            
            // Update monthly info
            const monthly = salary / 12;
            salaryMonthly.textContent = `$${monthly.toLocaleString('en-US', {maximumFractionDigits: 2})}`;
            
            // Update details
            detailExp.textContent = `${state.experience} tahun`;
            detailEdu.textContent = MODEL.educationShort[state.education];
            detailAge.textContent = `${state.age} tahun`;
            detailJob.textContent = state.jobTitle;
            detailGender.textContent = state.gender === 0 ? "Pria" : "Wanita";
            if(detailBonus) detailBonus.textContent = `+$${state.techBonus}`;

            // 3. Render Comparison Chart
            renderComparisonChart(state.experience, state.age, state.gender, state.jobTitle);

            // 4. Save to History
            addToHistory(salary);
        });
    }

    // ========== PRINT FUNCTIONALITY ==========
    const printBtn = document.getElementById('print-btn');
    if(printBtn) {
        printBtn.addEventListener('click', async () => {
            // Deteksi perangkat mobile atau layar kecil
            const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
                try {
                    // Simpan state asli
                    const originalHtml = printBtn.innerHTML;
                    printBtn.innerHTML = 'Memproses...';
                    
                    const resultCard = document.getElementById('result-card');
                    
                    // Sembunyikan tombol cetak saat mengambil gambar
                    printBtn.style.visibility = 'hidden';
                    
                    // Render elemen menjadi canvas
                    const canvas = await html2canvas(resultCard, {
                        scale: 2, // Resolusi tinggi
                        backgroundColor: '#121217', // var(--bg-dark-800)
                        useCORS: true,
                        logging: false
                    });
                    
                    // Kembalikan tombol cetak
                    printBtn.style.visibility = 'visible';
                    printBtn.innerHTML = originalHtml;
                    
                    // Unduh sebagai PNG
                    const link = document.createElement('a');
                    link.download = `Prediksi-Gaji-SalaryVision-${Date.now()}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                } catch (error) {
                    console.error('Gagal mencetak data:', error);
                    alert('Gagal memproses gambar. Silakan coba fitur Share QR.');
                    printBtn.style.visibility = 'visible';
                }
            } else {
                // Di Desktop, gunakan dialog print bawaan browser
                window.print();
            }
        });
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString('en-US');
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function initStatCounters() {
        document.querySelectorAll('.stat-value[data-count]').forEach(stat => {
            const count = parseInt(stat.dataset.count, 10);
            if (!Number.isNaN(count)) {
                stat.textContent = count.toLocaleString('en-US');
            }
        });
    }

    // ========== CHARTS RENDERING ==========

    function renderComparisonChart(experience, age, gender = 0, jobTitle = "Software Developer") {
        const canvaEl = document.getElementById('comparison-chart');
        if(!canvaEl) return;
        const ctx = canvaEl.getContext('2d');
        const data = MODEL.predictAll(experience, age, gender, jobTitle);
        
        const labels = data.map(d => d.label);
        const values = data.map(d => d.salary);
        
        // Color arrays based on active education
        const bgColors = labels.map((l, i) => 
            i === state.education ? 'rgba(99, 102, 241, 0.7)' : 'rgba(107, 114, 128, 0.2)'
        );
        const borderColors = labels.map((l, i) => 
            i === state.education ? 'rgba(99, 102, 241, 1)' : 'rgba(107, 114, 128, 0.4)'
        );

        if (comparisonChart) comparisonChart.destroy();
        
        comparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Prediksi Gaji ($)',
                    data: values,
                    backgroundColor: bgColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                    borderRadius: 8,
                    barPercentage: 0.6,
                    categoryPercentage: 0.7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return '$ ' + context.parsed.y.toLocaleString('en-US', { maximumFractionDigits: 0 });
                            }
                        },
                        backgroundColor: 'rgba(18, 18, 23, 0.95)',
                        borderColor: 'rgba(99, 102, 241, 0.3)',
                        borderWidth: 1,
                        titleColor: '#f3f4f6',
                        bodyColor: '#818cf8',
                        bodyFont: { weight: '700', size: 14 },
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: 'rgba(107, 114, 128, 0.1)', drawBorder: false },
                        ticks: { 
                            color: '#6b7280',
                            font: { size: 11 },
                            callback: function(value) {
                                return '$' + (value / 1000).toFixed(0) + 'k';
                            },
                            maxTicksLimit: 5
                        },
                        border: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { 
                            color: '#9ca3af',
                            font: { size: 12, weight: '600' }
                        },
                        border: { display: false }
                    }
                }
            }
        });
    }

    function initVisualizationCharts() {
        if (!document.getElementById('chart-edu-salary')) return;

        // 1. Avg Salary by Education
        const eduSalCtx = document.getElementById('chart-edu-salary').getContext('2d');
        eduSalaryChart = new Chart(eduSalCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(MODEL.stats.avgSalaryByEdu),
                datasets: [{
                    data: Object.values(MODEL.stats.avgSalaryByEdu),
                    backgroundColor: 'rgba(139, 92, 246, 0.6)',
                    borderRadius: 8
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { 
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });

        // 2. Education Distribution
        const eduDistCtx = document.getElementById('chart-edu-dist').getContext('2d');
        eduDistChart = new Chart(eduDistCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(MODEL.stats.educationDist),
                datasets: [{
                    data: Object.values(MODEL.stats.educationDist),
                    backgroundColor: [
                        '#6366f1', '#ec4899', '#8b5cf6', '#10b981'
                    ],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#9ca3af' } }
                }
            }
        });

        // 3. Exp vs Salary Trend for S1
        const expSalCtx = document.getElementById('chart-exp-salary').getContext('2d');
        const curve = MODEL.generateCurve(1, 35); // Predicted curve for Bachelor's
        expSalaryChart = new Chart(expSalCtx, {
            type: 'line',
            data: {
                labels: curve.map(c => c.experience),
                datasets: [{
                    label: 'Prediksi Gaji S1 (Trend)',
                    data: curve.map(c => c.salary),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                scales: { 
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // ========== SCANNER LOGIC ==========
    
    async function startScanner() {
        if (!scannerModal) return;
        scannerModal.classList.remove('hidden');
        scannerLoading.classList.remove('hidden');
        
        const loadingText = document.getElementById('scanner-loading-text');
        if (loadingText) loadingText.textContent = "Meminta izin kamera...";
        
        detectedObjects.clear();
        state.techBonus = 0;
        updateDetectedItemsUI();
        
        try {
            // Pastikan video tampil jika sebelumnya disembunyikan
            scannerVideo.style.display = 'block';

            // Get webcam
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Browser Anda tidak mendukung akses Kamera.");
            }
            scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            scannerVideo.srcObject = scannerStream;
            
            if (loadingText) loadingText.textContent = "Menyalakan kamera...";
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                if (scannerVideo.readyState >= 1) {
                    resolve();
                } else {
                    scannerVideo.onloadedmetadata = () => {
                        resolve();
                    };
                }
            });
            
            await scannerVideo.play();
            
            // Set canvas dimensions
            scannerCanvas.width = scannerVideo.videoWidth || 640;
            scannerCanvas.height = scannerVideo.videoHeight || 480;
            
            if (loadingText) loadingText.textContent = "Mengunduh AI Model (Sekitar 5MB)... Mohon tunggu.";
            
            // Load model if not loaded
            if (!objectDetectorModel) {
                objectDetectorModel = await cocoSsd.load();
            }
            
            scannerLoading.classList.add('hidden');
            detectFrame();
            
        } catch (err) {
            console.error('Error accessing webcam or loading model:', err);
            scannerLoading.innerHTML = `<p style="color:var(--danger); text-align:center; padding: 0 20px;">Gagal: ${err.message || 'Pastikan izin kamera diberikan dan koneksi internet stabil.'}</p>`;
        }
    }
    
    function stopScanner() {
        if (detectionFrameId) cancelAnimationFrame(detectionFrameId);
        if (scannerStream) {
            scannerStream.getTracks().forEach(track => track.stop());
        }
        scannerVideo.srcObject = null;
        if(scannerModal) scannerModal.classList.add('hidden');
    }
    
    async function detectFrame() {
        if (!objectDetectorModel || !scannerVideo.videoWidth) return;
        
        // Parameter: gambar, max objek (20), threshold akurasi (0.25) - diturunkan agar lebih sensitif
        const predictions = await objectDetectorModel.detect(scannerVideo, 20, 0.25);
        const ctx = scannerCanvas.getContext('2d');
        ctx.clearRect(0, 0, scannerCanvas.width, scannerCanvas.height);
        
        let newDetection = false;
        
        predictions.forEach(prediction => {
            // Draw bounding box
            const [x, y, width, height] = prediction.bbox;
            const text = prediction.class;
            
            // Only highlight tech objects we care about
            if (objectBonuses[text]) {
                ctx.strokeStyle = '#10b981'; // Success green
                ctx.fillStyle = '#10b981';
                
                if (!detectedObjects.has(text)) {
                    detectedObjects.add(text);
                    state.techBonus += objectBonuses[text];
                    newDetection = true;
                }
            } else {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            }
            
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
            
            ctx.font = '16px "JetBrains Mono"';
            const textWidth = ctx.measureText(text).width;
            ctx.fillRect(x, y, textWidth + 10, 24);
            ctx.fillStyle = '#000000';
            ctx.fillText(text, x + 5, y + 16);
        });
        
        if (newDetection) {
            updateDetectedItemsUI();
        }
        
        detectionFrameId = requestAnimationFrame(detectFrame);
    }
    
    function updateDetectedItemsUI() {
        if (detectedObjects.size === 0) {
            detectedItemsContainer.innerHTML = '<span style="color: var(--text-gray-500); font-size: 0.85rem;">Belum ada objek terdeteksi...</span>';
            return;
        }
        
        detectedItemsContainer.innerHTML = Array.from(detectedObjects).map(obj => 
            `<span class="detected-badge"><i data-lucide="check-circle" style="width: 14px;"></i> ${obj} (+$${objectBonuses[obj]})</span>`
        ).join('');
        lucide.createIcons();
    }
    
    if (openScannerBtn) openScannerBtn.addEventListener('click', startScanner);
    if (closeScannerBtn) closeScannerBtn.addEventListener('click', stopScanner);
    if (finishScanBtn) finishScanBtn.addEventListener('click', () => {
        stopScanner();
        if (state.techBonus > 0) {
            if(scannerStatus) scannerStatus.style.display = 'block';
            document.getElementById('scanner-status-text').textContent = `Bonus Aktif: +$${state.techBonus} dari ${detectedObjects.size} alat`;
            openScannerBtn.style.borderColor = 'var(--success)';
            openScannerBtn.style.color = 'var(--success)';
            openScannerBtn.innerHTML = `<i data-lucide="check-circle"></i> Setup Discan (${detectedObjects.size} alat)`;
            lucide.createIcons();
        }
    });

    // Fitur Unggah Foto Setup (Fallback)
    if (uploadSetupInput) {
        uploadSetupInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (scannerModal) scannerModal.classList.remove('hidden');
            if (scannerLoading) scannerLoading.classList.remove('hidden');
            
            const loadingText = document.getElementById('scanner-loading-text');
            if (loadingText) loadingText.textContent = "Memproses Gambar...";
            
            detectedObjects.clear();
            state.techBonus = 0;
            updateDetectedItemsUI();
            
            // Matikan stream video yang sedang aktif (jika ada)
            if (scannerStream) {
                scannerStream.getTracks().forEach(track => track.stop());
            }
            scannerVideo.srcObject = null;
            scannerVideo.style.display = 'none'; // Sembunyikan video
            
            try {
                // Buat elemen gambar statis
                const img = new Image();
                img.src = URL.createObjectURL(file);
                await new Promise(resolve => img.onload = resolve);
                
                // Set ukuran canvas sama dengan gambar
                scannerCanvas.width = img.width;
                scannerCanvas.height = img.height;
                const ctx = scannerCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Pastikan AI termuat
                if (!objectDetectorModel) {
                    if (loadingText) loadingText.textContent = "Mengunduh AI Model (Sekitar 5MB)...";
                    objectDetectorModel = await cocoSsd.load();
                }
                
                if (scannerLoading) scannerLoading.classList.add('hidden');
                
                // Deteksi AI pada canvas (max 20 objek, threshold 0.25) - diturunkan agar lebih sensitif
                const predictions = await objectDetectorModel.detect(scannerCanvas, 20, 0.25);
                
                let newDetection = false;
                predictions.forEach(prediction => {
                    const [x, y, width, height] = prediction.bbox;
                    const text = prediction.class;
                    
                    if (objectBonuses[text]) {
                        ctx.strokeStyle = '#10b981';
                        ctx.fillStyle = '#10b981';
                        if (!detectedObjects.has(text)) {
                            detectedObjects.add(text);
                            state.techBonus += objectBonuses[text];
                            newDetection = true;
                        }
                    } else {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    }
                    
                    ctx.lineWidth = 3;
                    ctx.strokeRect(x, y, width, height);
                    ctx.font = '16px "JetBrains Mono"';
                    const textWidth = ctx.measureText(text).width;
                    ctx.fillRect(x, y, textWidth + 10, 24);
                    ctx.fillStyle = '#000000';
                    ctx.fillText(text, x + 5, y + 16);
                });
                
                if (newDetection) {
                    updateDetectedItemsUI();
                } else {
                    detectedItemsContainer.innerHTML = '<span style="color: var(--danger); font-size: 0.85rem;">Tidak ada barang tech terdeteksi di foto.</span>';
                }
            } catch (err) {
                console.error("Gagal memproses gambar:", err);
                if (scannerLoading) {
                    scannerLoading.innerHTML = '<p style="color:var(--danger)">Gagal memproses gambar.</p>';
                }
            }
            
            // Reset input agar bisa pilih file yang sama lagi
            e.target.value = '';
        });
    }

    // ========== HISTORY ==========

    function addToHistory(salary) {
        const item = {
            id: Date.now(),
            salary: Math.round(salary),
            exp: state.experience,
            edu: MODEL.educationShort[state.education],
            age: state.age,
            job: state.jobTitle,
            gender: state.gender === 0 ? "Pria" : "Wanita",
            date: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        };
        
        state.history.unshift(item);
        if (state.history.length > 5) state.history.pop();
        
        localStorage.setItem('salary_predict_history', JSON.stringify(state.history));
        updateHistoryUI();
    }

    function updateHistoryUI() {
        if (!historyList) return;
        
        if (state.history.length === 0) {
            historyList.innerHTML = '<p class="history-empty">Belum ada riwayat prediksi</p>';
            return;
        }

        historyList.innerHTML = state.history.map(item => `
            <div class="history-item">
                <div class="history-info">
                    <strong>$${item.salary.toLocaleString()}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-gray-500); margin-left: 10px;">
                        ${item.job} &bull; ${item.edu} &bull; ${item.exp} thn &bull; ${item.age} thn
                    </span>
                </div>
                <span style="font-size: 0.75rem; color: var(--text-gray-500);">${item.date}</span>
            </div>
        `).join('');
    }

    if(clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            state.history = [];
            localStorage.removeItem('salary_predict_history');
            updateHistoryUI();
        });
    }

    // ========== QR CODE MODAL ==========
    if(qrBtn) {
        qrBtn.addEventListener('click', () => {
            qrModal.classList.remove('hidden');
            const currentUrl = window.location.href.split('#')[0];
            modalUrlDisplay.textContent = currentUrl;
            
            if(!qrGenerated && typeof QRCode !== 'undefined') {
                qrContainer.innerHTML = '';
                new QRCode(qrContainer, {
                    text: currentUrl,
                    width: 180,
                    height: 180,
                    colorDark : "#0a0a0c",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
                qrGenerated = true;
            }
        });
    }

    if(closeModal) {
        closeModal.addEventListener('click', () => {
            qrModal.classList.add('hidden');
        });
    }

    // Close modal and custom dropdown on outside click
    window.addEventListener('click', (e) => {
        if(qrModal && e.target === qrModal) {
            qrModal.classList.add('hidden');
        }
        
        // Close job dropdown if clicked outside
        if (jobDropdown && jobSelected && !jobDropdown.contains(e.target)) {
            jobDropdown.classList.remove('open');
            jobSelected.classList.remove('open');
        }
    });

    // ========== INIT ==========
    initStatCounters();
    initVisualizationCharts();
    updateHistoryUI();
});
