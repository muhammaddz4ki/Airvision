// main.js - Landing Page Logic

let currentFileUrl = null;

// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.getElementById('header');
    if (header) {
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    }
});

// Mobile menu
function toggleMenu() {
    const nav = document.getElementById('nav');
    if (nav) nav.classList.toggle('active');
}

// --- GPS LOCATION LOGIC (AUTO CITY DETECT) ---
function getLocation() {
    const btn = document.getElementById('btn-gps');
    
    if (navigator.geolocation) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mencari...';
        navigator.geolocation.getCurrentPosition(showPosition, showErrorGPS);
    } else {
        alert("Browser Anda tidak mendukung Geolocation.");
    }
}

function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const btn = document.getElementById('btn-gps');

    // Reverse Geocoding (Gratis via OpenStreetMap)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(response => response.json())
        .then(data => {
            const city = data.address.city || data.address.town || data.address.village || data.address.county || "Lokasi Terdeteksi";
            const input = document.getElementById('locationInput');
            if(input) input.value = city;
            
            btn.innerHTML = '<i class="fas fa-check"></i> Berhasil';
            btn.classList.add('success');
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Gunakan GPS';
                btn.classList.remove('success');
            }, 3000);
        })
        .catch(error => {
            console.error(error);
            const input = document.getElementById('locationInput');
            if(input) input.value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            btn.innerHTML = '<i class="fas fa-check"></i> Koordinat';
        });
}

function showErrorGPS(error) {
    let msg = "Gagal mengambil lokasi.";
    switch(error.code) {
        case error.PERMISSION_DENIED: msg = "Izin GPS ditolak."; break;
        case error.POSITION_UNAVAILABLE: msg = "Info lokasi tidak tersedia."; break;
        case error.TIMEOUT: msg = "Waktu permintaan habis."; break;
    }
    alert(msg);
    document.getElementById('btn-gps').innerHTML = '<i class="fas fa-map-marker-alt"></i> Gunakan GPS';
}

// --- FILE UPLOAD LOGIC ---
const fileInput = document.getElementById('fileInput');
const uploadBox = document.getElementById('uploadBox');
const filePreview = document.getElementById('filePreview');
const fileName = document.getElementById('fileName');

if (fileInput) {
    fileInput.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert('Ukuran file terlalu besar! Maksimal 5MB.');
                this.value = ''; return;
            }
            if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
                alert('Format file harus JPG atau PNG.');
                this.value = ''; return;
            }
            if (currentFileUrl) URL.revokeObjectURL(currentFileUrl);
            currentFileUrl = URL.createObjectURL(file);
            fileName.textContent = file.name;
            filePreview.classList.add('active');
            uploadBox.style.display = 'none';
        }
    });
}

if (uploadBox) {
    // Drag & Drop
    uploadBox.addEventListener('dragover', (e) => { e.preventDefault(); uploadBox.classList.add('dragover'); });
    uploadBox.addEventListener('dragleave', (e) => { e.preventDefault(); uploadBox.classList.remove('dragover'); });
    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault(); uploadBox.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            fileInput.dispatchEvent(new Event('change'));
        }
    });
}

function removeFile() {
    if(fileInput) fileInput.value = '';
    if(filePreview) filePreview.classList.remove('active');
    if(uploadBox) uploadBox.style.display = 'block';
    if (currentFileUrl) { URL.revokeObjectURL(currentFileUrl); currentFileUrl = null; }
}

// --- MODAL DISPLAY LOGIC ---
const modalOverlay = document.getElementById('resultModal');

function showModal(result, imageUrl) {
    const iconDiv = document.getElementById('modalIcon');
    const title = document.getElementById('modalTitle');
    const desc = document.getElementById('modalDescription');
    const label = document.getElementById('modalResultLabel');
    
    // Reset classes
    iconDiv.className = 'modal-icon';
    label.className = 'modal-result-label';

    // Image
    if (imageUrl) {
        document.getElementById('modalResultImage').src = imageUrl;
        document.getElementById('modalImageContainer').style.display = 'block';
    }

    // Error handling inside modal
    if (result.is_sky === false) {
        iconDiv.innerHTML = '<i class="fas fa-times"></i>';
        iconDiv.classList.add('error');
        title.innerText = 'Bukan Langit';
        document.getElementById('modalResult').innerText = 'Analisis Gagal';
        desc.innerText = result.error || 'Gambar tidak terdeteksi sebagai foto langit.';
        modalOverlay.classList.add('active');
        return;
    }

    // Success Logic
    label.innerText = result.class_name;
    document.getElementById('modalResult').innerText = `Status: ${result.class_name}`;
    document.getElementById('modalLocation').innerText = `📍 ${result.location || 'Tidak Diketahui'}`;
    document.getElementById('modalConfidence').innerText = `Akurasi AI: ${(result.score * 100).toFixed(1)}%`;

    if (result.class_name === 'Baik') {
        iconDiv.innerHTML = '<i class="fas fa-sun"></i>';
        iconDiv.classList.add('good');
        label.classList.add('good');
        title.innerText = 'Udara Bersih';
        desc.innerText = 'Langit cerah. Polusi sangat rendah. Waktu terbaik untuk olahraga outdoor.';
    } else if (result.class_name === 'Sedang') {
        iconDiv.innerHTML = '<i class="fas fa-cloud"></i>';
        iconDiv.classList.add('medium');
        label.classList.add('medium');
        title.innerText = 'Udara Standar';
        desc.innerText = 'Langit agak keruh. Aman bagi sebagian besar orang, kurangi aktivitas berat bagi yang sensitif.';
    } else {
        iconDiv.innerHTML = '<i class="fas fa-smog"></i>';
        iconDiv.classList.add('bad');
        label.classList.add('bad');
        title.innerText = 'Udara Kotor';
        desc.innerText = 'Polusi tinggi. Langit keruh/berkabut. Gunakan masker jika keluar ruangan.';
    }

    modalOverlay.classList.add('active');
}

function showModalError(msg) {
    alert(msg);
}

function closeModal() {
    modalOverlay.classList.remove('active');
    removeFile();
}

const closeModalBtn = document.getElementById('modalCloseBtn');
if(closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

// --- FORM SUBMISSION ---
const uploadForm = document.getElementById('uploadForm');
if(uploadForm) {
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!fileInput.files[0]) { alert('Pilih file dulu!'); return; }

        const btn = document.querySelector('.btn-analyze');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menganalisis...';
        btn.disabled = true;

        const formData = new FormData(this);
        
        // POINT TO YOUR PYTHON API
        fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if(data.error) {
                // Handle logic error from API
                showModal({ is_sky: false, error: data.error }, currentFileUrl);
            } else {
                showModal(data, currentFileUrl);
            }
        })
        .catch(err => {
            console.error(err);
            showModalError("Gagal terhubung ke Server AI. Pastikan 'api.py' berjalan di terminal.");
        })
        .finally(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    });
}