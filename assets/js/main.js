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
    const themeBtn = document.getElementById('theme-toggle');
    const htmlTag = document.documentElement;
    const icon = themeBtn.querySelector('i');

    // Cek Local Storage
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlTag.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme, icon);

    themeBtn.addEventListener('click', () => {
        const currentTheme = htmlTag.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlTag.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme, icon);
    });
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
        const header = document.getElementById('header');
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    });
}

function toggleMenu() {
    const nav = document.getElementById('nav');
    nav.classList.toggle('active');
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
                const inc = target / 50; // Speed
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
        question.addEventListener('click', () => {
            // Tutup yang lain dulu
            faqItems.forEach(i => { 
                if(i !== item) i.classList.remove('active'); 
            });
            item.classList.toggle('active');
        });
    });
}

// --- 5. GPS LOCATION ---
function getLocation() {
    const btn = document.getElementById('btn-gps');
    if (navigator.geolocation) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        navigator.geolocation.getCurrentPosition(showPosition, showErrorGPS);
    } else {
        alert("Browser Anda tidak mendukung Geolocation.");
    }
}

function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const btn = document.getElementById('btn-gps');

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(response => response.json())
        .then(data => {
            const city = data.address.city || data.address.town || data.address.county || "Lokasi Terdeteksi";
            document.getElementById('locationInput').value = city;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => { btn.innerHTML = '<i class="fas fa-crosshairs"></i>'; }, 3000);
        })
        .catch(() => {
            document.getElementById('locationInput').value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            btn.innerHTML = '<i class="fas fa-check"></i>';
        });
}

function showErrorGPS(error) {
    alert("Gagal mengambil lokasi. Pastikan GPS aktif.");
    document.getElementById('btn-gps').innerHTML = '<i class="fas fa-crosshairs"></i>';
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
        uploadBox.addEventListener('dragover', (e) => { e.preventDefault(); uploadBox.style.borderColor = 'var(--primary)'; });
        uploadBox.addEventListener('dragleave', (e) => { e.preventDefault(); uploadBox.style.borderColor = 'var(--border-color)'; });
        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadBox.style.borderColor = 'var(--border-color)';
            if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
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
            
            // Fetch ke Python API
            fetch('http://127.0.0.1:5000/predict', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) showModal({ is_sky: false, error: data.error });
                else showModal(data, currentFileUrl);
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
    uploadBox.style.display = 'none';
    
    if (currentFileUrl) URL.revokeObjectURL(currentFileUrl);
    currentFileUrl = URL.createObjectURL(file);
}

function removeFile() {
    document.getElementById('fileInput').value = '';
    document.getElementById('filePreview').classList.remove('active');
    document.getElementById('uploadBox').style.display = 'flex';
}

// --- 7. MODAL RESULT (4 KATEGORI LENGKAP) ---
const modalOverlay = document.getElementById('resultModal');

function showModal(result, imgUrl) {
    const iconDiv = document.getElementById('modalIcon');
    const title = document.getElementById('modalTitle');
    const desc = document.getElementById('modalDescription');
    const fill = document.getElementById('confidenceFill');
    const scoreTxt = document.getElementById('modalConfidence');
    
    if (imgUrl) document.getElementById('modalResultImage').src = imgUrl;
    
    // Reset Style
    iconDiv.className = 'modal-status-icon';
    document.getElementById('scanLine').classList.add('active');
    setTimeout(() => document.getElementById('scanLine').classList.remove('active'), 2000);

    // --- LOGIC HANDLING ---
    if (result.is_sky === false) {
        // ERROR / BUKAN LANGIT
        iconDiv.innerHTML = '<i class="fas fa-times"></i>';
        iconDiv.classList.add('error');
        title.innerText = "Analisis Ditolak";
        desc.innerText = result.error || "Objek dalam foto bukan langit.";
        fill.style.width = '0%'; fill.style.background = 'var(--danger)';
        scoreTxt.innerText = '0%';
    } else {
        // SUCCESS PREDICTION
        const score = (result.score * 100).toFixed(1) + '%';
        fill.style.width = score;
        scoreTxt.innerText = score;
        document.getElementById('modalLocation').innerText = result.location || '-';

        // 1. BAIK
        if (result.class_name === 'Baik') {
            iconDiv.innerHTML = '<i class="fas fa-smile-beam"></i>';
            iconDiv.classList.add('good');
            fill.style.background = 'var(--success)';
            title.innerText = "Udara Bersih (Baik)";
            desc.innerText = "Kualitas udara sangat baik. Aman untuk beraktivitas di luar ruangan.";
        } 
        // 2. SEDANG
        else if (result.class_name === 'Sedang') {
            iconDiv.innerHTML = '<i class="fas fa-meh"></i>';
            iconDiv.classList.add('medium');
            fill.style.background = 'var(--warning)';
            title.innerText = "Udara Sedang";
            desc.innerText = "Kualitas udara cukup baik, namun terdapat sedikit polusi. Aman bagi mayoritas orang.";
        } 
        // 3. TIDAK SEHAT BAGI SEBAGIAN ORANG (FULL TEXT)
        else if (result.class_name === 'Tidak Sehat Bagi Sebagian Orang') {
            iconDiv.innerHTML = '<i class="fas fa-head-side-mask"></i>';
            iconDiv.classList.add('sensitive');
            fill.style.background = 'var(--sensitive)';
            title.innerText = "Tidak Sehat Bagi Sebagian Orang";
            desc.innerText = "Udara ini beresiko bagi kelompok rentan seperti lansia, anak-anak, dan penderita penyakit pernapasan. Kurangi aktivitas berat.";
        } 
        // 4. TIDAK SEHAT
        else {
            iconDiv.innerHTML = '<i class="fas fa-biohazard"></i>';
            iconDiv.classList.add('bad');
            fill.style.background = 'var(--danger)';
            title.innerText = "Udara Tidak Sehat";
            desc.innerText = "Tingkat polusi tinggi. Berbahaya bagi kesehatan. Wajib gunakan masker jika keluar ruangan.";
        }
    }
    
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
    removeFile();
}