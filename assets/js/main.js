// main.js - AirVision Core Logic

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initScrollEffects();
    initCounter();
    initFAQ();
    initFileUpload();
});

// --- 1. THEME SWITCHER (DARK/LIGHT) ---
function initTheme() {
    const themeBtn = document.getElementById('themeToggle'); // Sesuaikan ID dgn HTML
    const htmlTag = document.documentElement;
    const icon = themeBtn ? themeBtn.querySelector('i') : null;

    // Cek Local Storage
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlTag.setAttribute('data-theme', savedTheme);
    if(icon) updateThemeIcon(savedTheme, icon);

    if(themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = htmlTag.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            htmlTag.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            if(icon) updateThemeIcon(newTheme, icon);
        });
    }
}

function updateThemeIcon(theme, icon) {
    if (theme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// --- 2. HEADER SCROLL & MOBILE MENU ---
function initScrollEffects() {
    window.addEventListener('scroll', () => {
        const header = document.getElementById('mainHeader'); // Sesuaikan ID dgn HTML
        if(header) {
            if (window.scrollY > 50) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        }
    });
    
    // Mobile Menu
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav');
    if(mobileBtn && nav) {
        mobileBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            const icon = mobileBtn.querySelector('i');
            if(nav.classList.contains('active')) icon.classList.replace('fa-bars', 'fa-times');
            else icon.classList.replace('fa-times', 'fa-bars');
        });
    }
}

// --- 3. STATS COUNTER ---
function initCounter() {
    const counters = document.querySelectorAll('.counter');
    const statsSection = document.querySelector('.stats-section');
    let started = false;

    if (!statsSection) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY >= statsSection.offsetTop - 500 && !started) {
            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                const inc = target / 50; 
                let count = 0;
                
                const updateCount = () => {
                    count += inc;
                    if (count < target) {
                        counter.innerText = Math.ceil(count);
                        setTimeout(updateCount, 30);
                    } else {
                        counter.innerText = target;
                    }
                };
                updateCount();
            });
            started = true;
        }
    });
}

// --- 4. FAQ LOGIC ---
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if(question) {
            question.addEventListener('click', () => {
                faqItems.forEach(i => { if(i !== item) i.classList.remove('active'); });
                item.classList.toggle('active');
            });
        }
    });
}

// --- 5. GPS LOCATION ---
function getLocation() {
    const btn = document.getElementById('btn-gps');
    const input = document.getElementById('locationInput');
    
    if (navigator.geolocation) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(4);
                const lon = position.coords.longitude.toFixed(4);
                input.value = `${lat}, ${lon}`;
                btn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => { btn.innerHTML = '<i class="fas fa-crosshairs"></i>'; }, 3000);
            }, 
            () => {
                alert("Gagal mengambil lokasi. Pastikan GPS aktif.");
                btn.innerHTML = '<i class="fas fa-crosshairs"></i>';
            }
        );
    } else {
        alert("Browser tidak mendukung Geolocation.");
    }
}

// --- 6. FILE UPLOAD & PREDICTION ---
let currentFileUrl = null;

function initFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadBox = document.getElementById('uploadBox');
    const uploadForm = document.getElementById('uploadForm');

    if (uploadBox && fileInput) {
        uploadBox.addEventListener('click', () => fileInput.click());
        
        // Drag & Drop
        uploadBox.addEventListener('dragover', (e) => { e.preventDefault(); uploadBox.style.borderColor = 'var(--primary)'; uploadBox.style.background = 'rgba(59,130,246,0.05)'; });
        uploadBox.addEventListener('dragleave', (e) => { e.preventDefault(); uploadBox.style.borderColor = 'var(--border-color)'; uploadBox.style.background = 'var(--input-bg)'; });
        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadBox.style.borderColor = 'var(--border-color)';
            uploadBox.style.background = 'var(--input-bg)';
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', function() {
            if (this.files.length) handleFile(this.files[0]);
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!fileInput.files[0]) { alert('Pilih foto terlebih dahulu!'); return; }
            
            const btn = document.querySelector('.btn-analyze');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menganalisis...';
            btn.disabled = true;

            const formData = new FormData(this);
            
            fetch('http://127.0.0.1:5000/predict', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                // --- PERBAIKAN PENTING DI SINI ---
                // Selalu kirim currentFileUrl agar gambar preview tetap muncul meski error
                // API mengembalikan image_url, tapi untuk preview cepat kita pakai blob lokal (currentFileUrl)
                // Jika API sukses mengembalikan image_url, kita bisa pakai itu juga.
                // Prioritas: Blob Lokal (Lebih Cepat & Pasti Jalan)
                
                showModal(data, currentFileUrl);
            })
            .catch(err => {
                console.error(err);
                alert("Gagal terhubung ke Server API. Pastikan api.py berjalan.");
            })
            .finally(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            });
        });
    }
}

function handleFile(file) {
    const fileNameSpan = document.getElementById('fileName');
    const filePreview = document.getElementById('filePreview');
    const uploadBox = document.getElementById('uploadBox');
    
    if (file.size > 5 * 1024 * 1024) { alert('Maksimal 5MB'); return; }
    if (!file.type.match('image.*')) { alert('Harus format gambar (JPG/PNG)'); return; }
    
    fileNameSpan.textContent = file.name;
    filePreview.classList.add('active');
    filePreview.style.display = 'flex'; // Paksa display flex
    uploadBox.style.display = 'none';
    
    if (currentFileUrl) URL.revokeObjectURL(currentFileUrl);
    currentFileUrl = URL.createObjectURL(file);
}

// Global function agar bisa dipanggil onclick di HTML
window.removeFile = function() {
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    const uploadBox = document.getElementById('uploadBox');
    
    if(fileInput) fileInput.value = '';
    if(filePreview) {
        filePreview.classList.remove('active');
        filePreview.style.display = 'none';
    }
    if(uploadBox) uploadBox.style.display = 'flex';
}

// --- 7. MODAL RESULT ---
const modalOverlay = document.getElementById('resultModal');

function showModal(result, imgUrl) {
    const iconDiv = document.getElementById('modalIcon');
    const title = document.getElementById('modalTitle');
    const desc = document.getElementById('modalDescription');
    const fill = document.getElementById('confidenceFill');
    const scoreTxt = document.getElementById('modalConfidence');
    const modalImg = document.getElementById('modalResultImage');
    
    // --- FIX GAMBAR: Pakai Blob URL lokal jika ada, fallback ke API ---
    if (imgUrl) {
        modalImg.src = imgUrl;
        modalImg.style.display = 'block';
    } else if (result.image_url) {
        modalImg.src = `http://127.0.0.1:5000/${result.image_url}`;
        modalImg.style.display = 'block';
    }

    // Reset Style
    iconDiv.className = 'modal-status-icon';
    const scanLine = document.getElementById('scanLine');
    if(scanLine) {
        scanLine.classList.add('active');
        setTimeout(() => scanLine.classList.remove('active'), 2000);
    }

    // --- LOGIC HANDLING ---
    if (result.is_sky === false) {
        // ERROR / BUKAN LANGIT
        iconDiv.innerHTML = '<i class="fas fa-times"></i>';
        iconDiv.classList.add('error');
        title.innerText = "Analisis Ditolak";
        desc.innerText = result.error || "Objek dalam foto bukan langit.";
        fill.style.width = '0%'; 
        fill.style.background = 'var(--danger)';
        scoreTxt.innerText = '0%';
    } else {
        // SUCCESS PREDICTION
        const score = (result.score * 100).toFixed(1) + '%';
        fill.style.width = score;
        scoreTxt.innerText = score;
        const locEl = document.getElementById('modalLocation');
        if(locEl) locEl.innerText = result.location || 'Lokasi tidak diketahui';

        if (result.class_name === 'Baik') {
            iconDiv.innerHTML = '<i class="fas fa-smile-beam"></i>';
            iconDiv.classList.add('good');
            fill.style.background = 'var(--success)';
            title.innerText = "Udara Bersih (Baik)";
            desc.innerText = "Kualitas udara sangat baik. Aman untuk beraktivitas.";
        } else if (result.class_name === 'Sedang') {
            iconDiv.innerHTML = '<i class="fas fa-meh"></i>';
            iconDiv.classList.add('medium');
            fill.style.background = 'var(--warning)';
            title.innerText = "Udara Sedang";
            desc.innerText = "Kualitas udara cukup baik, ada sedikit polusi.";
        } else if (result.class_name && result.class_name.includes('Sebagian')) {
            iconDiv.innerHTML = '<i class="fas fa-head-side-mask"></i>';
            iconDiv.classList.add('sensitive');
            fill.style.background = 'var(--sensitive)';
            title.innerText = "Tidak Sehat (Sensitif)";
            desc.innerText = "Beresiko bagi kelompok rentan (anak/lansia).";
        } else {
            iconDiv.innerHTML = '<i class="fas fa-biohazard"></i>';
            iconDiv.classList.add('bad');
            fill.style.background = 'var(--danger)';
            title.innerText = "Udara Tidak Sehat";
            desc.innerText = "Tingkat polusi tinggi. Gunakan masker!";
        }
    }
    
    if(modalOverlay) modalOverlay.classList.add('active');
}

// Global function
window.closeModal = function() {
    if(modalOverlay) modalOverlay.classList.remove('active');
    window.removeFile();
}