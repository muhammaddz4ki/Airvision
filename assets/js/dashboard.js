// dashboard.js - Advanced Dashboard Logic

const API_BASE = 'http://127.0.0.1:5000';

// --- DATA NEGARA & KOTA (AUTO-MAPPING) ---
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

let dailyChart, qualityChart, mapInstance;
let cachedData = []; // Store fetched data locally for filtering

// --- NAVIGATION ---
function showSection(id) {
    document.querySelectorAll('[id$="-section"]').forEach(el => el.style.display = 'none');
    document.getElementById(id + '-section').style.display = 'block';
    
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (id === 'dashboard') {
        document.getElementById('pageTitle').innerText = 'Dashboard Overview';
        refreshAll();
    } else if (id === 'analysis') {
        document.getElementById('pageTitle').innerText = 'Data Analisis Detail';
        loadAnalysisDetail();
    } else if (id === 'locations') {
        document.getElementById('pageTitle').innerText = 'Peta Sebaran Kualitas Udara';
        loadLocationsData();
        setTimeout(() => initMap(), 300);
    }
}

function refreshAll() {
    const btn = document.querySelector('.btn-refresh');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    Promise.all([loadStats(), loadRecent(), loadCharts()]).then(() => {
        btn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data';
        document.getElementById('lastUpdate').innerText = 'Updated: ' + new Date().toLocaleTimeString();
    });
}

// --- 1. DASHBOARD STATS & CHARTS (6 CARDS LAYOUT) ---
async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/api/stats/overall`);
        const data = await res.json();
        
        const qs = data.quality_stats || {};
        const countBaik = qs['Baik'] || 0;
        const countSedang = qs['Sedang'] || 0;
        const countSensitif = qs['Tidak Sehat Bagi Sebagian Orang'] || 0;
        const countBuruk = qs['Tidak Sehat'] || 0;
        const countBukanLangit = data.non_sky_count || 0; // Data baru dari API

        // Render 6 Kartu Statistik
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
                    <div class="stat-label" style="font-size:0.8rem;">Tidak Sehat (Sebagian)</div>
                </div>
            </div>

            <div class="stat-card bad">
                <div class="stat-icon"><i class="fas fa-biohazard"></i></div>
                <div>
                    <div class="stat-number">${countBuruk}</div>
                    <div class="stat-label">Tidak Sehat</div>
                </div>
            </div>

            <div class="stat-card" style="border-color: #94a3b8;">
                <div class="stat-icon" style="background:rgba(148, 163, 184, 0.1); color:#94a3b8;"><i class="fas fa-eye-slash"></i></div>
                <div>
                    <div class="stat-number">${countBukanLangit}</div>
                    <div class="stat-label">Bukan Langit</div>
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
        const d_nonsky = data.map(d => d.non_sky_count).reverse(); // Data baru

        // LINE CHART (Include 'Bukan Langit' as gray line)
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
                    { label: 'Tidak Sehat', data: d_buruk, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension:0.4, fill:true },
                    { label: 'Bukan Langit', data: d_nonsky, borderColor: '#94a3b8', borderDash: [5, 5], tension:0.4, fill:false }
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

        // DOUGHNUT CHART (Include 5 Categories)
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
                labels: ['Baik', 'Sedang', 'Sensitif', 'Tidak Sehat', 'Bukan Langit'],
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
            
            tbody.innerHTML += `
                <tr>
                    <td><img src="${API_BASE}/uploads/${item.filename}" class="table-image" onclick='openModal(${JSON.stringify(item)})'></td>
                    <td>${date}</td>
                    <td>${item.location || 'Unknown'}</td>
                    <td><span class="${badge}">${item.air_quality_class}</span></td>
                    <td>${(item.confidence * 100).toFixed(1)}%</td>
                    <td>${item.is_sky ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>'}</td>
                    <td><button class="btn-refresh sm" onclick='openModal(${JSON.stringify(item)})'><i class="fas fa-eye"></i></button></td>
                </tr>
            `;
        });
    } catch (e) { console.error(e); }
}

// --- 2. ANALYSIS TABLE, FILTER, & EXPORT ---
async function loadAnalysisDetail() {
    const tbody = document.getElementById('detailTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading data...</td></tr>';
    
    try {
        const res = await fetch(`${API_BASE}/api/analysis/recent?limit=200`);
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
        
        // Pemendekan string hanya untuk tampilan tabel (agar rapi)
        let displayClass = item.air_quality_class;
        if (displayClass === 'Tidak Sehat Bagi Sebagian Orang') {
            displayClass = 'Sensitif (Sebagian)';
        }

        tbody.innerHTML += `
            <tr>
                <td>#${item.id}</td>
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

// --- EXPORT FEATURES (CSV & PDF) ---
function exportToCSV() {
    if (!cachedData || cachedData.length === 0) {
        alert("Tidak ada data untuk diekspor!");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Waktu,Lokasi,Klasifikasi,Confidence,Validitas,Notes\n";

    cachedData.forEach(item => {
        const date = new Date(item.analysis_time).toLocaleString().replace(/,/g, ''); 
        const notes = (item.notes || '').replace(/,/g, ';'); 
        
        let row = [
            item.id,
            date,
            item.location || 'Unknown',
            item.air_quality_class, // Menggunakan string lengkap sesuai dataset
            (item.confidence * 100).toFixed(2) + '%',
            item.is_sky ? 'Valid' : 'Invalid',
            notes
        ];
        csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "AirVision_Analysis_Data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToPDF() {
    if (!cachedData || cachedData.length === 0) {
        alert("Tidak ada data untuk diekspor!");
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Laporan Analisis Kualitas Udara - AirVision", 14, 22);
    doc.setFontSize(11);
    doc.text(`Tanggal Ekspor: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Data: ${cachedData.length}`, 14, 36);

    const tableColumn = ["ID", "Waktu", "Lokasi", "Klasifikasi", "Akurasi", "Status"];
    const tableRows = [];

    cachedData.forEach(item => {
        const dataRow = [
            item.id,
            new Date(item.analysis_time).toLocaleString(),
            item.location || '-',
            item.air_quality_class, // jsPDF akan auto-wrap text panjang
            (item.confidence * 100).toFixed(1) + '%',
            item.is_sky ? 'Valid' : 'Invalid'
        ];
        tableRows.push(dataRow);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 3: { cellWidth: 40 } }
    });

    doc.save("AirVision_Report.pdf");
}

// --- 3. MAP LOGIC & HELPERS ---
async function loadLocationsData() {
    const tbody = document.getElementById('locationsTableBody');
    tbody.innerHTML = '';

    if(cachedData.length === 0) {
        const res = await fetch(`${API_BASE}/api/analysis/recent?limit=200`);
        cachedData = await res.json();
    }

    const cityStats = {};
    cachedData.forEach(item => {
        let locRaw = (item.location || 'Unknown').toLowerCase();
        let cityName = 'Lainnya';
        
        for (const [key, val] of Object.entries(CITY_DB)) {
            if (locRaw.includes(key)) {
                cityName = key.charAt(0).toUpperCase() + key.slice(1);
                break;
            }
        }
        if(cityName === 'Lainnya' && locRaw !== 'unknown') cityName = locRaw.split(',')[0];

        if(!cityStats[cityName]) cityStats[cityName] = { total:0, baik:0, sedang:0, sensitif:0, buruk:0 };
        
        cityStats[cityName].total++;
        if(item.air_quality_class === 'Baik') cityStats[cityName].baik++;
        else if(item.air_quality_class === 'Sedang') cityStats[cityName].sedang++;
        else if(item.air_quality_class === 'Tidak Sehat Bagi Sebagian Orang') cityStats[cityName].sensitif++;
        else cityStats[cityName].buruk++;
    });

    for (const [city, s] of Object.entries(cityStats)) {
        let dominant = 'Baik';
        let maxVal = s.baik;
        let badge = 'badge-good';
        
        if(s.sedang > maxVal) { maxVal = s.sedang; dominant = 'Sedang'; badge = 'badge-medium'; }
        if(s.sensitif > maxVal) { maxVal = s.sensitif; dominant = 'Sensitif'; badge = 'badge-sensitive'; }
        if(s.buruk > maxVal) { maxVal = s.buruk; dominant = 'Tidak Sehat'; badge = 'badge-bad'; }

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

async function initMap() {
    if (mapInstance) { mapInstance.invalidateSize(); return; }
    
    mapInstance = L.map('map').setView([-2.5, 118], 5);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(mapInstance);

    if(cachedData.length === 0) {
        const res = await fetch(`${API_BASE}/api/analysis/recent?limit=200`);
        cachedData = await res.json();
    }

    const cityMarkers = {}; 

    cachedData.forEach(item => {
        let locRaw = (item.location || '').toLowerCase();
        for (const [key, coords] of Object.entries(CITY_DB)) {
            if (locRaw.includes(key)) {
                if(!cityMarkers[key]) cityMarkers[key] = { coords: coords, count: 0, badScore: 0 };
                
                cityMarkers[key].count++;
                if(item.air_quality_class === 'Sedang') cityMarkers[key].badScore += 1;
                if(item.air_quality_class === 'Tidak Sehat Bagi Sebagian Orang') cityMarkers[key].badScore += 2;
                if(item.air_quality_class === 'Tidak Sehat') cityMarkers[key].badScore += 3;
            }
        }
    });

    for (const [key, data] of Object.entries(cityMarkers)) {
        const severity = data.badScore / data.count;
        let color = '#10b981'; 
        let radius = 10 + (data.count * 2); 

        if (severity > 0.5) color = '#facc15'; 
        if (severity > 1.5) color = '#f97316'; 
        if (severity > 2.0) color = '#ef4444'; 

        L.circleMarker(data.coords, {
            color: color,
            fillColor: color,
            fillOpacity: 0.6,
            radius: Math.min(radius, 30) 
        }).addTo(mapInstance)
        .bindPopup(`
            <div style="color:#333; text-align:center;">
                <h4 style="margin:0; text-transform:capitalize;">${key}</h4>
                <div style="font-size:0.8rem; margin-top:5px;">Total Scan: ${data.count}</div>
                <div style="font-weight:bold; color:${color};">Level: ${severity.toFixed(2)}</div>
            </div>
        `);
    }
}

function getBadgeClass(cls, isSky) {
    if (!isSky) return 'badge-nonsky';
    
    // Normalisasi string aman
    const c = cls.trim();
    if (c === 'Baik') return 'badge-good';
    if (c === 'Sedang') return 'badge-medium';
    if (c === 'Tidak Sehat') return 'badge-bad';
    if (c === 'Tidak Sehat Bagi Sebagian Orang') return 'badge-sensitive';
    
    return 'badge-nonsky';
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
            else if(k==='Tidak Sehat Bagi Sebagian Orang') color='var(--sensitive)';
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
            <button class="modal-close" onclick="document.getElementById('imageModal').classList.remove('active')"><i class="fas fa-times"></i></button>
            <h2 style="margin-bottom:20px; border-bottom:1px solid var(--border-color); padding-bottom:10px;">Detail Analisis #${item.id}</h2>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                <div>
                    <img src="${API_BASE}/uploads/${item.filename}" style="width:100%; border-radius:10px; border:1px solid var(--border-color);">
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
                    </ul>
                </div>
            </div>
        </div>
    `;
    modal.classList.add('active');
}

document.addEventListener('DOMContentLoaded', refreshAll);