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
        history: JSON.parse(localStorage.getItem('salary_predict_history') || '[]')
    };

    // 3. Elemen DOM
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.getElementById('navbar');
    
    const predictForm = document.getElementById('predict-form');
    const expInput = document.getElementById('experience');
    const expValue = document.getElementById('experience-value');
    const ageInput = document.getElementById('age');
    const ageValue = document.getElementById('age-value');
    const eduCards = document.querySelectorAll('.edu-card');
    
    const resultPlaceholder = document.getElementById('result-placeholder');
    const resultContent = document.getElementById('result-content');
    const salaryResult = document.getElementById('salary-result');
    const salaryMonthly = document.getElementById('salary-monthly');
    const detailExp = document.getElementById('detail-exp');
    const detailEdu = document.getElementById('detail-edu');
    const detailAge = document.getElementById('detail-age');
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

    // ========== PREDICTION LOGIC ==========

    if(predictForm) {
        predictForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 1. Calculate Prediction
            const salary = MODEL.predict(state.experience, state.education, state.age);
            
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

            // 3. Render Comparison Chart
            renderComparisonChart(state.experience, state.age);

            // 4. Save to History
            addToHistory(salary);
        });
    }

    // ========== PRINT FUNCTIONALITY ==========
    const printBtn = document.getElementById('print-btn');
    if(printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
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

    // ========== CHARTS RENDERING ==========

    function renderComparisonChart(experience, age) {
        const canvaEl = document.getElementById('comparison-chart');
        if(!canvaEl) return;
        const ctx = canvaEl.getContext('2d');
        const data = MODEL.predictAll(experience, age);
        
        const labels = data.map(d => d.label);
        const values = data.map(d => d.salary);
        
        // Color arrays based on active education
        const bgColors = labels.map((l, i) => 
            i === state.education ? 'rgba(99, 102, 241, 0.7)' : 'rgba(255, 255, 255, 0.08)'
        );
        const borderColors = labels.map((l, i) => 
            i === state.education ? 'rgba(99, 102, 241, 1)' : 'rgba(255, 255, 255, 0.15)'
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
                        grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
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

    // ========== HISTORY ==========

    function addToHistory(salary) {
        const item = {
            id: Date.now(),
            salary: Math.round(salary),
            exp: state.experience,
            edu: MODEL.educationShort[state.education],
            age: state.age,
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
                        ${item.edu} &bull; ${item.exp} thn &bull; ${item.age} thn
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

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if(e.target === qrModal) {
            qrModal.classList.add('hidden');
        }
    });

    // ========== INIT ==========
    initVisualizationCharts();
    updateHistoryUI();
});
