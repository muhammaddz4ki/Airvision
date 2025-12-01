<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AirVision - Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="assets/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="dashboard-container">
        <div class="sidebar">
            <a href="index.php" class="logo">
                <div class="logo-icon"><img src="assets/images/logo.svg" style="height:32px"></div>
                AirVision
            </a>
            <div class="nav-links">
                <a href="#" class="nav-link active" onclick="showSection('dashboard')"><i class="fas fa-home"></i> Dashboard</a>
                <a href="#" class="nav-link" onclick="showSection('analysis')"><i class="fas fa-chart-pie"></i> Analisis Detail</a>
                <a href="#" class="nav-link" onclick="showSection('locations')"><i class="fas fa-map-location-dot"></i> Data Lokasi</a>
                <div style="height: 1px; background: var(--border); margin: 0.5rem 1rem;"></div>
                <a href="index.php#analisis" class="nav-link"><i class="fas fa-camera"></i> Analisis Baru</a>
                <a href="index.php" class="nav-link"><i class="fas fa-arrow-left"></i> Halaman Utama</a>
            </div>
            <div class="sidebar-footer">&copy; 2025 AirVision</div>
        </div>
        
        <div class="main-content">
            <div class="header">
                <div><h1>Dashboard Monitoring</h1><p style="color: var(--text-muted);">Pantau kualitas udara secara realtime.</p></div>
                <div class="header-actions"><button class="btn-refresh" onclick="loadDashboardData()"><i class="fas fa-sync-alt"></i> Refresh</button></div>
            </div>
            
            <div id="dashboard-section">
                <div class="stats-grid" id="statsGrid"></div>
                <div class="charts-grid">
                    <div class="chart-container"><h3>Tren 7 Hari</h3><canvas id="dailyChart"></canvas></div>
                    <div class="chart-container"><h3>Distribusi</h3><canvas id="qualityChart"></canvas></div>
                </div>
                <div class="recent-analysis">
                    <div class="recent-header"><h3>Riwayat Terbaru</h3></div>
                    <div class="table-container">
                        <table class="analysis-table">
                            <thead><tr><th>Gambar</th><th>Waktu</th><th>Lokasi</th><th>Status</th><th>Akurasi</th><th>Ket</th></tr></thead>
                            <tbody id="recentTableBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div id="analysis-section" style="display: none;">
                <div class="filter-section">
                    <h3>Filter Data</h3>
                    <div class="filter-grid">
                        <div class="filter-group"><label class="filter-label">Lokasi</label><input type="text" id="locationFilter" class="filter-input" placeholder="Cth: Bandung..."></div>
                        <div class="filter-group"><label class="filter-label">Kualitas</label>
                            <select id="qualityFilter" class="filter-select">
                                <option value="">Semua</option>
                                <option value="Baik">Baik</option>
                                <option value="Sedang">Sedang</option>
                                <option value="Tidak Sehat">Tidak Sehat</option>
                            </select>
                        </div>
                        <div class="filter-group"><button class="btn-primary" style="width:100%" onclick="applyFilters()">Terapkan</button></div>
                    </div>
                </div>
                <div class="recent-analysis">
                    <div class="table-container">
                        <table class="analysis-table">
                            <thead><tr><th>Gambar</th><th>Waktu</th><th>Lokasi</th><th>Status</th><th>Akurasi</th><th>Valid</th><th>Aksi</th></tr></thead>
                            <tbody id="detailTableBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div id="locations-section" style="display: none;">
                <div class="location-map"><h3 style="margin-bottom: 1rem;">Peta Sebaran</h3><div id="map"></div></div>
                <div class="recent-analysis">
                    <div class="recent-header"><h3>Statistik Wilayah</h3></div>
                    <div class="table-container">
                        <table class="analysis-table">
                            <thead><tr><th>Lokasi</th><th>Total</th><th>Baik</th><th>Buruk (Lainnya)</th><th>Buruk (TS)</th><th>Sensitif</th><th>Avg Conf</th><th>Trend</th></tr></thead>
                            <tbody id="locationsTableBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="image-modal" id="imageModal"></div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="assets/js/dashboard.js"></script>
</body>
</html>