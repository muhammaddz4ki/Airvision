// dashboard.js - Real-time Map & Analytics

const API_BASE = 'http://127.0.0.1:5000'; // Pastikan sesuai port API Python

let dailyChart, qualityChart, mapInstance;
let cachedData = [];
let mapMarkers = []; // Array untuk menyimpan marker agar bisa di-refresh

// --- DATABASE KOORDINAT KOTA (FALLBACK) ---
const CITY_DB = {
    "jakarta": [-6.2088, 106.8456],
    "bandung": [-6.9175, 107.6191],
    "surabaya": [-7.2575, 112.7521],
    "medan": [3.5952, 98.6722],
    "semarang": [-6.9667, 110.4167],
    "makassar": [-5.1477, 119.4328],
    "palembang": [-2.9761, 104.7754],
    "denpasar": [-8.6705, 115.2126],
    "bali": [-8.4095, 115.1889],
    "yogyakarta": [-7.7956, 110.3695],
    "malang": [-7.9666, 112.6326],
    "bogor": [-6.5971, 106.8060],
    "depok": [-6.4025, 106.7942],
    "tangerang": [-6.1731, 106.6300],
    "bekasi": [-6.2383, 106.9756],
    "samarinda": [-0.5022, 117.1536],
    "balikpapan": [-1.2379, 116.8529],
    "padang": [-0.9471, 100.4172],
    "pontianak": [-0.0263, 109.3425]
};

// --- NAVIGATION SYSTEM ---
function showSection(id) {
    document.querySelectorAll('[id$="-section"]').forEach(el => el.style.display = 'none');
    document.getElementById(id + '-section').style.display = 'block';
    
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[onclick="showSection('${id}')"]`);
    if(activeLink) activeLink.classList.add('active');

    if (id === 'dashboard') {
        document.getElementById('pageTitle').innerText = 'Dashboard Overview';
        refreshAll();
    } else if (id === 'analysis') {
        document.getElementById('pageTitle').innerText = 'Data Analisis Detail';
        loadAnalysisDetail();
    } else if (id === 'locations') {
        document.getElementById('pageTitle').innerText = 'Peta Sebaran Kualitas Udara';
        setTimeout(() => {
            initMap();
            loadLocationsData();
        }, 300);
    }
}

function refreshAll() {
    const btn = document.querySelector('.btn-refresh');
    if(btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    Promise.all([loadStats(), loadRecent(), loadCharts()]).then(() => {
        if(btn) btn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data';
        const timeEl = document.getElementById('lastUpdate');
        if(timeEl) timeEl.innerText = 'Updated: ' + new Date().toLocaleTimeString();
    });
}

// --- 1. DASHBOARD STATS & CHARTS ---
async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/api/stats/overall`);
        const data = await res.json();
        
        const qs = data.quality_stats || {};
        const countBaik = qs['Baik'] || 0;
        const countSedang = qs['Sedang'] || 0;
        const countSensitif = qs['Tidak Sehat Bagi Sebagian Orang'] || 0;
        const countBuruk = qs['Tidak Sehat'] || 0;
        const countBukanLangit = data.non_sky_count || 0;

        document.getElementById('statsGrid').innerHTML = `
            <div class="stat-card">
                <div class="stat-icon" style="background:rgba(59,130,246,0.1); color:#3b82f6;"><i class="fas fa-camera"></i></div>
                <div>
                    <div class="stat-number">${data.total_analysis}</div>
                    <div class="stat-label">Total Scan</div>
                </div>
            </div>
            <div class="stat-card good">
                <div class="stat-icon"><i class="fas fa-smile"></i></div>
                <div>
                    <div class="stat-number">${countBaik}</div>
                    <div class="stat-label">Baik</div>
                </div>
            </div>
            <div class="stat-card medium" style="border-color: #facc15;">
                <div class="stat-icon" style="background:rgba(250, 204, 21, 0.1); color:#facc15;"><i class="fas fa-meh"></i></div>
                <div>
                    <div class="stat-number">${countSedang}</div>
                    <div class="stat-label">Sedang</div>
                </div>
            </div>
            <div class="stat-card sensitive">
                <div class="stat-icon"><i class="fas fa-head-side-mask"></i></div>
                <div>
                    <div class="stat-number">${countSensitif}</div>
                    <div class="stat-label" style="font-size:0.8rem;">Sensitif</div>
                </div>
            </div>
            <div class="stat-card bad">
                <div class="stat-icon"><i class="fas fa-biohazard"></i></div>
                <div>
                    <div class="stat-number">${countBuruk}</div>
                    <div class="stat-label">Bahaya</div>
                </div>
            </div>
            <div class="stat-card" style="border-color: #94a3b8;">
                <div class="stat-icon" style="background:rgba(148, 163, 184, 0.1); color:#94a3b8;"><i class="fas fa-eye-slash"></i></div>
                <div>
                    <div class="stat-number">${countBukanLangit}</div>
                    <div class="stat-label">Invalid</div>
                </div>
            </div>
        `;
    } catch (e) { console.error("Stats Error", e); }
}

async function loadCharts() {
    try {
        const res = await fetch(`${API_BASE}/api/stats/daily?days=7`);
        const data = await res.json();
        
        const labels = data.map(d => new Date(d.date).toLocaleDateString('id-ID', {day:'numeric', month:'short'})).reverse();
        const d_baik = data.map(d => d.good_count).reverse();
        const d_sedang = data.map(d => d.medium_count).reverse();
        const d_sensitif = data.map(d => d.sensitive_count).reverse();
        const d_buruk = data.map(d => d.unhealthy_count).reverse();
        const d_nonsky = data.map(d => d.non_sky_count).reverse();

        if (dailyChart) dailyChart.destroy();
        const ctx1 = document.getElementById('dailyChart').getContext('2d');
        dailyChart = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Baik', data: d_baik, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension:0.4, fill:true },
                    { label: 'Sedang', data: d_sedang, borderColor: '#facc15', backgroundColor: 'rgba(250,204,21,0.1)', tension:0.4, fill:true },
                    { label: 'Sensitif', data: d_sensitif, borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.1)', tension:0.4, fill:true },
                    { label: 'Bahaya', data: d_buruk, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension:0.4, fill:true },
                    { label: 'Invalid', data: d_nonsky, borderColor: '#94a3b8', borderDash:[5,5], tension:0.4, fill:false }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color:'#94a3b8' } } },
                scales: { 
                    y: { grid: { color:'#334155' }, ticks: { color:'#94a3b8' } }, 
                    x: { grid: { display:false }, ticks: { color:'#94a3b8' } } 
                }
            }
        });

        // DOUGHNUT CHART
        const sum = arr => arr.reduce((a,b)=>a+b,0);
        const totalBaik = sum(d_baik);
        const totalSedang = sum(d_sedang);
        const totalSensitif = sum(d_sensitif);
        const totalBuruk = sum(d_buruk);
        const totalNonSky = sum(d_nonsky);

        if (qualityChart) qualityChart.destroy();
        const ctx2 = document.getElementById('qualityChart').getContext('2d');
        qualityChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Baik', 'Sedang', 'Sensitif', 'Bahaya', 'Invalid'],
                datasets: [{
                    data: [totalBaik, totalSedang, totalSensitif, totalBuruk, totalNonSky],
                    backgroundColor: ['#10b981', '#facc15', '#f97316', '#ef4444', '#94a3b8'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position:'right', labels: { color:'#94a3b8', padding:15 } } }
            }
        });

    } catch (e) { console.error("Chart Error", e); }
}

async function loadRecent() {
    const tbody = document.getElementById('recentTableBody');
    try {
        const res = await fetch(`${API_BASE}/api/analysis/recent?limit=5`);
        const data = await res.json();
        
        tbody.innerHTML = '';
        if(!data.length) { tbody.innerHTML = '<tr><td colspan="7" class="text-center">Belum ada data.</td></tr>'; return; }

        data.forEach(item => {
            const date = new Date(item.analysis_time).toLocaleString();
            let badge = getBadgeClass(item.air_quality_class, item.is_sky);
            let displayClass = item.air_quality_class === 'Tidak Sehat Bagi Sebagian Orang' ? 'Sensitif' : item.air_quality_class;

            tbody.innerHTML += `
                <tr>
                    <td><img src="${API_BASE}/uploads/${item.filename}" class="table-image" onclick='openModal(${JSON.stringify(item)})' onerror="this.src='assets/images/placeholder.jpg'"></td>
                    <td>${date}</td>
                    <td>${item.location || 'Unknown'}</td>
                    <td><span class="${badge}">${displayClass}</span></td>
                    <td>${(item.confidence * 100).toFixed(1)}%</td>
                    <td>${item.is_sky ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>'}</td>
                    <td><button class="btn-refresh sm" onclick='openModal(${JSON.stringify(item)})'><i class="fas fa-eye"></i></button></td>
                </tr>
            `;
        });
    } catch (e) { console.error(e); }
}

// --- 2. ANALYSIS TABLE FULL ---
async function loadAnalysisDetail() {
    const tbody = document.getElementById('detailTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading data...</td></tr>';
    
    try {
        const res = await fetch(`${API_BASE}/api/analysis/recent?limit=500`);
        cachedData = await res.json();
        renderTable(cachedData);
    } catch (e) { console.error(e); }
}

function renderTable(data) {
    const tbody = document.getElementById('detailTableBody');
    tbody.innerHTML = '';
    
    if(!data.length) { tbody.innerHTML = '<tr><td colspan="8" class="text-center">Data tidak ditemukan.</td></tr>'; return; }

    data.forEach(item => {
        const date = new Date(item.analysis_time).toLocaleString();
        let badge = getBadgeClass(item.air_quality_class, item.is_sky);
        let displayClass = item.air_quality_class === 'Tidak Sehat Bagi Sebagian Orang' ? 'Sensitif' : item.air_quality_class;

        tbody.innerHTML += `
            <tr>
                <td>#${item.id}</td>
                <td><img src="${API_BASE}/uploads/${item.filename}" class="table-image sm" onclick='openModal(${JSON.stringify(item)})' onerror="this.style.display='none'"></td>
                <td>${date}</td>
                <td>${item.location || '-'}</td>
                <td><span class="${badge}">${displayClass}</span></td>
                <td><div class="progress-bar"><div class="fill" style="width:${item.confidence*100}%"></div></div></td>
                <td>${item.is_sky ? 'Valid' : 'Invalid'}</td>
                <td><button class="btn-primary sm" onclick='openModal(${JSON.stringify(item)})'>Detail</button></td>
            </tr>
        `;
    });
}

function applyFilters() {
    const loc = document.getElementById('locationFilter').value.toLowerCase();
    const cat = document.getElementById('qualityFilter').value;
    
    const filtered = cachedData.filter(item => {
        const matchLoc = (item.location || '').toLowerCase().includes(loc);
        const matchCat = cat === '' ? true : (item.air_quality_class === cat);
        return matchLoc && matchCat;
    });
    
    renderTable(filtered);
}

// --- 3. MAP LOGIC & POPUP DETAIL ---
async function initMap() {
    if (!mapInstance) {
        mapInstance = L.map('map').setView([-2.5, 118], 5);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(mapInstance);
    }
}

async function loadLocationsData() {
    mapMarkers.forEach(marker => mapInstance.removeLayer(marker));
    mapMarkers = [];

    try {
        const res = await fetch(`${API_BASE}/api/analysis/recent?limit=500`);
        const data = await res.json();
        
        const locationStats = {};

        data.forEach(item => {
            if (!item.location) return;

            const coords = item.location.split(',');
            
            if (coords.length === 2 && !isNaN(parseFloat(coords[0]))) {
                const lat = parseFloat(coords[0]);
                const lng = parseFloat(coords[1]);
                addMarkerToMap(lat, lng, item);
                updateLocStats(locationStats, "Titik GPS", item);
            } else {
                updateLocStats(locationStats, item.location, item);
            }
        });

        renderLocationTable(locationStats);

    } catch (e) { console.error("Map Data Error", e); }
}

// --- POPUP MAP DETAIL ---
function addMarkerToMap(lat, lng, item) {
    let color = '#10b981'; // Default Hijau (Baik)
    let label = item.air_quality_class;

    // Logic Warna Marker & Label
    if (label === 'Sedang') {
        color = '#facc15'; // Kuning
    } else if (label.includes('Sebagian')) {
        color = '#f97316'; // Oranye
        label = 'Sensitif';
    } else if (label === 'Tidak Sehat') {
        color = '#ef4444'; // Merah
    } else if (!item.is_sky) {
        color = '#94a3b8'; // Abu-abu
        label = 'Invalid';
    }

    const marker = L.circleMarker([lat, lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
        radius: 8
    }).addTo(mapInstance);

    // ISI POPUP LENGKAP (Gambar + Info)
    marker.bindPopup(`
        <div style="text-align:center; min-width: 160px; font-family: 'Plus Jakarta Sans', sans-serif;">
            <div style="margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:5px;">
                <strong style="color:${color}; font-size:1rem;">${label}</strong>
            </div>
            
            <div style="width:100%; height:100px; background:#f1f5f9; border-radius:8px; overflow:hidden; display:flex; align-items:center; justify-content:center; margin-bottom:8px;">
                <img src="${API_BASE}/uploads/${item.filename}" 
                     style="width:100%; height:100%; object-fit:cover;"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=\'font-size:0.7rem; color:#94a3b8\'>No Image</span>'">
            </div>
            
            <div style="font-size:0.8rem; color:#333; text-align:left;">
                <div><i class="far fa-clock"></i> ${new Date(item.analysis_time).toLocaleTimeString()}</div>
                <div><i class="fas fa-check-circle"></i> Akurasi: ${(item.confidence * 100).toFixed(1)}%</div>
            </div>
        </div>
    `);

    mapMarkers.push(marker);
}

function updateLocStats(stats, locName, item) {
    let cleanName = locName.split(',')[0].trim();
    if (!stats[cleanName]) {
        stats[cleanName] = { total: 0, baik: 0, sedang: 0, sensitif: 0, buruk: 0 };
    }
    
    stats[cleanName].total++;
    if (item.air_quality_class === 'Baik') stats[cleanName].baik++;
    else if (item.air_quality_class === 'Sedang') stats[cleanName].sedang++;
    else if (item.air_quality_class.includes('Sebagian')) stats[cleanName].sensitif++;
    else stats[cleanName].buruk++;
}

function renderLocationTable(stats) {
    const tbody = document.getElementById('locationsTableBody');
    tbody.innerHTML = '';

    for (const [city, s] of Object.entries(stats)) {
        let dominant = 'Baik';
        let maxVal = s.baik;
        let badge = 'badge-good';
        
        if(s.sedang > maxVal) { maxVal = s.sedang; dominant = 'Sedang'; badge = 'badge-medium'; }
        if(s.sensitif > maxVal) { maxVal = s.sensitif; dominant = 'Sensitif'; badge = 'badge-sensitive'; }
        if(s.buruk > maxVal) { maxVal = s.buruk; dominant = 'Bahaya'; badge = 'badge-bad'; }

        tbody.innerHTML += `
            <tr>
                <td><strong>${city}</strong></td>
                <td>${s.total}</td>
                <td>${s.baik}</td>
                <td>${s.sedang}</td>
                <td>${s.sensitif}</td>
                <td>${s.buruk}</td>
                <td><span class="${badge}">${dominant}</span></td>
            </tr>
        `;
    }
}

// --- HELPER FUNCTIONS ---
function getBadgeClass(cls, isSky) {
    if (!isSky) return 'badge-nonsky';
    if (cls === 'Baik') return 'badge-good';
    if (cls === 'Sedang') return 'badge-medium';
    if (cls === 'Tidak Sehat') return 'badge-bad';
    return 'badge-sensitive';
}

function openModal(item) {
    const modal = document.getElementById('imageModal');
    let probs = item.probabilities;
    if(typeof probs === 'string') probs = JSON.parse(probs);

    let bars = '';
    if(probs) {
        for(const [k, v] of Object.entries(probs)) {
            const pct = (v * 100).toFixed(1);
            let color = '#64748b';
            if(k==='Baik') color='var(--success)';
            else if(k==='Sedang') color='var(--warning)';
            else if(k.includes('Sebagian')) color='var(--sensitive)';
            else if(k==='Tidak Sehat') color='var(--danger)';
            
            bars += `
                <div style="margin-bottom:8px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:2px; color:var(--text-muted);">
                        <span>${k}</span><span>${pct}%</span>
                    </div>
                    <div style="background:var(--bg-main); height:6px; border-radius:3px; overflow:hidden;">
                        <div style="width:${pct}%; background:${color}; height:100%;"></div>
                    </div>
                </div>
            `;
        }
    }

    modal.innerHTML = `
        <div class="modal-content" style="max-width:700px;">
            <button class="modal-close-icon" onclick="document.getElementById('imageModal').classList.remove('active')"><i class="fas fa-times"></i></button>
            <h2 style="margin-bottom:20px; border-bottom:1px solid var(--border-color); padding-bottom:10px;">Detail Analisis #${item.id}</h2>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                <div>
                    <div class="modal-image-wrapper">
                        <img src="${API_BASE}/uploads/${item.filename}" onerror="this.parentElement.innerHTML='<div style=\'color:white; text-align:center\'>Gambar Tidak Ditemukan</div>'">
                    </div>
                    <div style="margin-top:15px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        <div class="stat-card" style="padding:10px;">
                            <small>Validitas Langit</small>
                            <div style="font-weight:bold; color:${item.is_sky ? 'var(--success)' : 'var(--danger)'}">${item.is_sky ? 'VALID' : 'INVALID'}</div>
                        </div>
                        <div class="stat-card" style="padding:10px;">
                            <small>Confidence</small>
                            <div style="font-weight:bold;">${(item.confidence*100).toFixed(1)}%</div>
                        </div>
                    </div>
                </div>
                <div>
                    <h4 style="margin-bottom:15px; color:var(--primary);">Probabilitas Kelas</h4>
                    <div style="background:var(--bg-card); padding:15px; border-radius:10px; border:1px solid var(--border-color);">
                        ${bars}
                    </div>
                    
                    <h4 style="margin:20px 0 10px; color:var(--primary);">Metadata</h4>
                    <ul style="list-style:none; padding:0; font-size:0.9rem; color:var(--text-muted);">
                        <li style="margin-bottom:5px;"><i class="fas fa-map-marker-alt" style="width:20px;"></i> ${item.location || '-'}</li>
                        <li style="margin-bottom:5px;"><i class="fas fa-clock" style="width:20px;"></i> ${new Date(item.analysis_time).toLocaleString()}</li>
                        <li><i class="fas fa-file-image" style="width:20px;"></i> ${item.filename}</li>
                        ${!item.is_sky ? `<li style="color:var(--danger); margin-top:10px;">Reason: ${item.notes || 'Unknown'}</li>` : ''}
                    </ul>
                </div>
            </div>
        </div>
    `;
    modal.classList.add('active');
}

// Global Export Functions
window.exportToCSV = function() {
    if (!cachedData || cachedData.length === 0) { alert("Tidak ada data!"); return; }
    let csvContent = "data:text/csv;charset=utf-8,ID,Waktu,Lokasi,Klasifikasi,Confidence,Validitas,Notes\n";
    cachedData.forEach(item => {
        const date = new Date(item.analysis_time).toLocaleString().replace(/,/g, ''); 
        const notes = (item.notes || '').replace(/,/g, ';'); 
        let row = [item.id, date, item.location || 'Unknown', item.air_quality_class, (item.confidence * 100).toFixed(2) + '%', item.is_sky ? 'Valid' : 'Invalid', notes];
        csvContent += row.join(",") + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "AirVision_Data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.exportToPDF = function() {
    if (!cachedData || cachedData.length === 0) { alert("Tidak ada data!"); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Laporan AirVision", 14, 22);
    doc.setFontSize(11); doc.text(`Tanggal: ${new Date().toLocaleString()}`, 14, 30);
    const tableColumn = ["ID", "Waktu", "Lokasi", "Klasifikasi", "Akurasi", "Status"];
    const tableRows = cachedData.map(item => [item.id, new Date(item.analysis_time).toLocaleString(), item.location || '-', item.air_quality_class, (item.confidence * 100).toFixed(1) + '%', item.is_sky ? 'Valid' : 'Invalid']);
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 45, theme: 'grid', styles: { fontSize: 8 } });
    doc.save("AirVision_Report.pdf");
}

document.addEventListener('DOMContentLoaded', refreshAll);