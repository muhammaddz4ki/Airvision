// dashboard.js - Logic for Dashboard Page

const API_BASE = 'http://127.0.0.1:5000';
let dailyChart = null;
let qualityChart = null;
let mapInstance = null;

// Koordinat Kota-Kota Besar di Indonesia untuk Marker
const CITY_COORDS = {
    "jakarta": [-6.2088, 106.8456],
    "bandung": [-6.9175, 107.6191],
    "surabaya": [-7.2575, 112.7521],
    "yogyakarta": [-7.7956, 110.3695],
    "semarang": [-6.9667, 110.4167],
    "medan": [3.5952, 98.6722],
    "makassar": [-5.1477, 119.4328],
    "bali": [-8.4095, 115.1889],
    "denpasar": [-8.6705, 115.2126],
    "palembang": [-2.9761, 104.7754],
    "balikpapan": [-1.2379, 116.8529],
    "malang": [-7.9666, 112.6326],
    "bogor": [-6.5971, 106.8060],
    "tangerang": [-6.1731, 106.6300],
    "bekasi": [-6.2383, 106.9756]
};

// --- NAVIGATION ---
function showSection(sectionId) {
    document.querySelectorAll('[id$="-section"]').forEach(el => el.style.display = 'none');
    const activeEl = document.getElementById(sectionId + '-section');
    if(activeEl) activeEl.style.display = 'block';
    
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if(event && event.currentTarget) event.currentTarget.classList.add('active');

    if (sectionId === 'dashboard') loadDashboardData();
    else if (sectionId === 'analysis') loadAnalysisDetail();
    else if (sectionId === 'locations') {
        loadLocationsData();
        setTimeout(() => initMap(), 300);
    }
}

// --- DATA FETCHING ---
async function loadDashboardData() {
    try {
        const res = await fetch(`${API_BASE}/api/stats/overall`);
        if(!res.ok) throw new Error("API Error");
        const stats = await res.json();
        
        document.getElementById('statsGrid').innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${stats.total_analysis || 0}</div>
                <div class="stat-label">Total Analisis</div>
            </div>
            <div class="stat-card good">
                <div class="stat-number">${stats.quality_stats?.Baik || 0}</div>
                <div class="stat-label">Baik</div>
            </div>
            <div class="stat-card bad">
                <div class="stat-number">${(stats.quality_stats?.['Tidak Sehat'] || 0)}</div>
                <div class="stat-label">Tidak Sehat</div>
            </div>
        `;
        loadDailyStats();
        loadRecentAnalysis();
    } catch (e) {
        console.error(e);
        document.getElementById('statsGrid').innerHTML = `<div style="grid-column:1/-1; color:#ef4444; text-align:center; padding:2rem; background:rgba(239,68,68,0.1); border-radius:10px;">Gagal terhubung ke API (Port 5000). Pastikan api.py berjalan.</div>`;
    }
}

async function loadRecentAnalysis() {
    const tbody = document.getElementById('recentTableBody');
    if(!tbody) return;
    
    try {
        const res = await fetch(`${API_BASE}/api/analysis/recent?limit=5`);
        const data = await res.json();
        
        tbody.innerHTML = '';
        if(!data.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#94a3b8;">Belum ada data.</td></tr>';
            return;
        }

        data.forEach(item => {
            const date = new Date(item.analysis_time).toLocaleString();
            let badgeClass = 'badge-nonsky';
            if(item.air_quality_class === 'Baik') badgeClass = 'badge-good';
            else if(item.air_quality_class.includes('Tidak Sehat')) badgeClass = 'badge-bad';
            else if(item.air_quality_class === 'Sedang') badgeClass = 'badge-medium';

            const imgUrl = `${API_BASE}/uploads/${item.filename}`;
            
            tbody.innerHTML += `
                <tr>
                    <td><img src="${imgUrl}" class="table-image" onclick="showDetailModal(${JSON.stringify(item).replace(/"/g, '&quot;')})"></td>
                    <td>${date}</td>
                    <td>${item.location}</td>
                    <td><span class="quality-badge ${badgeClass}">${item.air_quality_class}</span></td>
                    <td>${(item.confidence * 100).toFixed(1)}%</td>
                    <td><button class="btn-refresh" onclick="showDetailModal(${JSON.stringify(item).replace(/"/g, '&quot;')})" style="padding:5px 10px"><i class="fas fa-eye"></i></button></td>
                </tr>
            `;
        });
    } catch(e) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#ef4444;">Gagal memuat data.</td></tr>';
    }
}

async function loadDailyStats() {
    const ctxDaily = document.getElementById('dailyChart');
    const ctxPie = document.getElementById('qualityChart');
    if(!ctxDaily || !ctxPie) return;

    try {
        const res = await fetch(`${API_BASE}/api/stats/daily?days=7`);
        const data = await res.json();
        
        const labels = data.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        }).reverse();
        
        const good = data.map(d => d.good_count).reverse();
        const medium = data.map(d => d.medium_count).reverse();
        const bad = data.map(d => d.unhealthy_count + d.sensitive_count).reverse();

        if (dailyChart) dailyChart.destroy();
        dailyChart = new Chart(ctxDaily, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Baik', data: good, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension:0.4, fill: true },
                    { label: 'Sedang', data: medium, borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', tension:0.4, fill: true },
                    { label: 'Buruk', data: bad, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', tension:0.4, fill: true }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: { y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }, x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } } } }
        });

        const sumGood = good.reduce((a,b)=>a+b,0);
        const sumMedium = medium.reduce((a,b)=>a+b,0);
        const sumBad = bad.reduce((a,b)=>a+b,0);

        if (qualityChart) qualityChart.destroy();
        qualityChart = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: ['Baik', 'Sedang', 'Buruk'],
                datasets: [{
                    data: [sumGood, sumMedium, sumBad],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 20 } } } }
        });

    } catch (e) { console.log("Chart error", e); }
}

async function loadAnalysisDetail() {
    const tbody = document.getElementById('detailTableBody');
    if (!tbody) return;
    
    try {
        const res = await fetch(`${API_BASE}/api/analysis/recent?limit=100`);
        const data = await res.json();
        
        tbody.innerHTML = '';
        if(!data.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#94a3b8;">Tidak ada data.</td></tr>';
            return;
        }

        data.forEach(item => {
            const imgUrl = `${API_BASE}/uploads/${item.filename}`;
            const row = `
                <tr>
                    <td><img src="${imgUrl}" class="table-image" onclick="showDetailModal(${JSON.stringify(item).replace(/"/g, '&quot;')})"></td>
                    <td>${new Date(item.analysis_time).toLocaleString()}</td>
                    <td>${item.location || '-'}</td>
                    <td>${item.air_quality_class}</td>
                    <td>${(item.confidence * 100).toFixed(1)}%</td>
                    <td><span class="quality-badge ${item.is_sky ? 'badge-good' : 'badge-nonsky'}">${item.is_sky ? 'Valid' : 'Invalid'}</span></td>
                    <td><button class="btn-refresh" onclick="showDetailModal(${JSON.stringify(item).replace(/"/g, '&quot;')})" style="padding:5px 10px"><i class="fas fa-eye"></i></button></td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch(e) {
        tbody.innerHTML = '<tr><td colspan="8" style="color:var(--danger); text-align:center">Gagal memuat data.</td></tr>';
    }
}

function showDetailModal(item) {
    const modal = document.getElementById('imageModal');
    const imgUrl = `${API_BASE}/uploads/${item.filename}`;
    
    // Parse probabilities
    let probs = item.probabilities;
    if (typeof probs === 'string') probs = JSON.parse(probs);
    
    let barsHtml = '';
    if(probs) {
        for (const [cls, score] of Object.entries(probs)) {
            const pct = (score * 100).toFixed(1);
            let color = '#64748b';
            if(cls === 'Baik') color = '#10b981';
            if(cls.includes('Tidak Sehat')) color = '#ef4444';
            if(cls === 'Sedang') color = '#f59e0b';
            
            barsHtml += `
                <div style="margin-bottom:8px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:2px; color:#cbd5e1;"><span>${cls}</span><span>${pct}%</span></div>
                    <div style="width:100%; background:#334155; height:6px; border-radius:3px;"><div style="width:${pct}%; background:${color}; height:100%; border-radius:3px;"></div></div>
                </div>
            `;
        }
    }

    const metricsHtml = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:15px; font-size:0.9rem;">
            <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;">
                <div style="color:#94a3b8; font-size:0.8rem;">Rasio Warna Langit</div>
                <div style="font-weight:bold; color:#fff;">${(item.sky_ratio * 100).toFixed(1)}%</div>
            </div>
            <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;">
                <div style="color:#94a3b8; font-size:0.8rem;">Kepadatan Tepi</div>
                <div style="font-weight:bold; color:#fff;">${(item.edge_ratio * 100).toFixed(1)}%</div>
            </div>
        </div>
    `;

    modal.innerHTML = `
        <div class="modal-content" style="text-align:left; max-width:600px;">
            <button class="modal-close" onclick="closeImageModal()" style="top:15px; right:15px;"><i class="fas fa-times"></i></button>
            <h2 style="color:white; margin-bottom:20px; border-bottom:1px solid #334155; padding-bottom:10px;">Detail Analisis AI</h2>
            <div style="display:flex; gap:20px; flex-wrap:wrap;">
                <div style="flex:1; min-width:200px;">
                    <img src="${imgUrl}" style="width:100%; border-radius:10px; border:1px solid #334155;">
                    <div style="margin-top:10px; color:#94a3b8; font-size:0.9rem;"><i class="fas fa-map-marker-alt"></i> ${item.location}<br><i class="fas fa-clock"></i> ${new Date(item.analysis_time).toLocaleString()}</div>
                </div>
                <div style="flex:1; min-width:200px;">
                    <h4 style="color:#f8fafc; margin-bottom:10px;">Probabilitas Kelas</h4>
                    ${barsHtml}
                    <h4 style="color:#f8fafc; margin-top:20px; margin-bottom:5px;">Metrik Citra</h4>
                    ${metricsHtml}
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeImageModal() {
    document.getElementById('imageModal').classList.remove('active');
}

async function loadLocationsData() {
    const tbody = document.getElementById('locationsTableBody');
    if (!tbody) return;
    
    try {
        const res = await fetch(`${API_BASE}/api/analysis/recent?limit=200`);
        const data = await res.json();
        
        const locStats = {};
        data.forEach(item => {
            const loc = (item.location || 'Tidak Diketahui').split(',')[0].trim();
            if (!locStats[loc]) locStats[loc] = { total: 0, good: 0, bad: 0, conf_sum: 0, count_valid: 0 };
            
            locStats[loc].total++;
            if (item.is_sky) {
                locStats[loc].count_valid++;
                locStats[loc].conf_sum += item.confidence;
                if (item.air_quality_class === 'Baik') locStats[loc].good++;
                else locStats[loc].bad++;
            }
        });

        tbody.innerHTML = '';
        Object.keys(locStats).forEach(loc => {
            const s = locStats[loc];
            const avgConf = s.count_valid > 0 ? ((s.conf_sum / s.count_valid) * 100).toFixed(1) : 0;
            tbody.innerHTML += `
                <tr>
                    <td><strong>${loc}</strong></td>
                    <td>${s.total}</td>
                    <td>${s.good}</td>
                    <td>${s.total - s.good - s.bad}</td>
                    <td>${s.bad}</td>
                    <td>0</td>
                    <td>${avgConf}%</td>
                    <td>${s.good > s.bad ? '<i class="fas fa-arrow-up" style="color:var(--success)"></i>' : '<i class="fas fa-arrow-down" style="color:var(--danger)"></i>'}</td>
                </tr>
            `;
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="8">Gagal memuat lokasi.</td></tr>';
    }
}

async function initMap() {
    if (mapInstance) { mapInstance.invalidateSize(); return; }
    mapInstance = L.map('map').setView([-2.5489, 118.0149], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(mapInstance);

    try {
        const res = await fetch(`${API_BASE}/api/analysis/recent?limit=200`);
        const data = await res.json();
        const locGroups = {};
        data.forEach(item => {
            let loc = (item.location || '').toLowerCase();
            let coordKey = Object.keys(CITY_COORDS).find(k => loc.includes(k));
            if (coordKey) {
                if (!locGroups[coordKey]) locGroups[coordKey] = { count: 0, bad: 0, lat: CITY_COORDS[coordKey] };
                locGroups[coordKey].count++;
                if (item.air_quality_class !== 'Baik') locGroups[coordKey].bad++;
            }
        });

        Object.keys(locGroups).forEach(city => {
            const d = locGroups[city];
            const color = (d.bad / d.count) > 0.5 ? '#ef4444' : '#10b981';
            L.circleMarker(d.lat, { color: color, fillColor: color, fillOpacity: 0.6, radius: 10 + Math.min(d.count, 20) }).addTo(mapInstance)
            .bindPopup(`<div style="color:black"><b>${city.toUpperCase()}</b><br>Total: ${d.count}<br>Buruk: ${d.bad}</div>`);
        });
    } catch (e) { console.error("Map Error", e); }
}

document.addEventListener('DOMContentLoaded', () => { loadDashboardData(); });