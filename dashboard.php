<!DOCTYPE html>
<html lang="id" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AirVision - Executive Dashboard</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    
    <link rel="stylesheet" href="assets/css/dashboard.css">
    
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>
</head>
<body>
    <div class="dashboard-container">
        <div class="sidebar">
            <a href="index.php" class="logo">
                <img src="assets/images/logo.svg" alt="Logo" style="height: 32px; filter: brightness(0) invert(1);">
                <span>AirVision</span>
            </a>
            
            <div class="nav-links">
                <div class="nav-label">MENU UTAMA</div>
                <a href="#" class="nav-link active" onclick="showSection('dashboard')">
                    <i class="fas fa-th-large"></i> Dashboard
                </a>
                <a href="#" class="nav-link" onclick="showSection('analysis')">
                    <i class="fas fa-table"></i> Data Analisis
                </a>
                <a href="#" class="nav-link" onclick="showSection('locations')">
                    <i class="fas fa-map-marked-alt"></i> Peta Sebaran
                </a>
                
                <div class="nav-label" style="margin-top: 20px;">AKSI</div>
                <a href="index.php#analisis" class="nav-link">
                    <i class="fas fa-plus-circle"></i> Scan Baru
                </a>
                <a href="index.php" class="nav-link">
                    <i class="fas fa-external-link-alt"></i> Landing Page
                </a>
            </div>
            
            <div class="sidebar-footer">
                <p>&copy; 2025 AirVision AI<br>v2.0.1 Stable</p>
            </div>
        </div>
        
        <div class="main-content">
            <div class="header">
                <div>
                    <h1 id="pageTitle">Dashboard Overview</h1>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Real-time Air Quality Monitoring System</p>
                </div>
                <div class="header-actions">
                    <span id="lastUpdate" style="font-size: 0.8rem; color: var(--text-muted); margin-right: 10px;">Updated: Just now</span>
                    <button class="btn-refresh" onclick="refreshAll()"><i class="fas fa-sync-alt"></i> Refresh Data</button>
                </div>
            </div>
            
            <div id="dashboard-section">
                <div class="stats-grid" id="statsGrid">
                    <div class="stat-card skeleton"></div>
                    <div class="stat-card skeleton"></div>
                    <div class="stat-card skeleton"></div>
                    <div class="stat-card skeleton"></div>
                </div>

                <div class="charts-grid">
                    <div class="chart-container">
                        <h3>Tren Kualitas Udara (7 Hari)</h3>
                        <div style="height: 300px;"><canvas id="dailyChart"></canvas></div>
                    </div>
                    <div class="chart-container">
                        <h3>Distribusi Kategori</h3>
                        <div style="height: 300px; position: relative;">
                            <canvas id="qualityChart"></canvas>
                        </div>
                    </div>
                </div>

                <div class="recent-analysis">
                    <div class="recent-header">
                        <h3><i class="fas fa-history"></i> Aktivitas Terbaru</h3>
                        <a href="#" onclick="showSection('analysis')" style="font-size:0.85rem; color:var(--primary); text-decoration:none;">Lihat Semua <i class="fas fa-arrow-right"></i></a>
                    </div>
                    <div class="table-container">
                        <table class="analysis-table">
                            <thead>
                                <tr>
                                    <th>Pratinjau</th>
                                    <th>Waktu</th>
                                    <th>Lokasi</th>
                                    <th>Kualitas Udara</th>
                                    <th>Confidence</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="recentTableBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div id="analysis-section" style="display: none;">
                <div class="filter-section">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-filter"></i> Data Lengkap & Export</h3>
                        <div class="export-buttons" style="display: flex; gap: 10px;">
                            <button onclick="exportToCSV()" class="btn-primary" style="background: #10b981; font-size: 0.85rem;">
                                <i class="fas fa-file-csv"></i> CSV
                            </button>
                            <button onclick="exportToPDF()" class="btn-primary" style="background: #ef4444; font-size: 0.85rem;">
                                <i class="fas fa-file-pdf"></i> PDF
                            </button>
                        </div>
                    </div>
                    <div class="filter-grid">
                        <div class="filter-group">
                            <label class="filter-label">Cari Lokasi</label>
                            <div style="position:relative;">
                                <i class="fas fa-search" style="position:absolute; left:10px; top:10px; color:var(--text-muted);"></i>
                                <input type="text" id="locationFilter" class="filter-input" style="padding-left: 35px;" placeholder="Ketik nama kota...">
                            </div>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Kategori AQI</label>
                            <select id="qualityFilter" class="filter-select">
                                <option value="">Semua Kategori</option>
                                <option value="Baik">Baik</option>
                                <option value="Sedang">Sedang</option>
                                <option value="Tidak Sehat Bagi Sebagian Orang">Sensitif</option>
                                <option value="Tidak Sehat">Tidak Sehat</option>
                                <option value="Bukan Langit">Invalid</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label" style="opacity:0">Aksi</label>
                            <button class="btn-primary" style="width:100%" onclick="applyFilters()">
                                <i class="fas fa-check"></i> Filter
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="recent-analysis">
                    <div class="table-container" style="max-height: 600px; overflow-y: auto;">
                        <table class="analysis-table" id="dataTable">
                            <thead style="position: sticky; top: 0; z-index: 10;">
                                <tr>
                                    <th>ID</th>
                                    <th>Gambar</th>
                                    <th>Waktu</th>
                                    <th>Lokasi</th>
                                    <th>Klasifikasi</th>
                                    <th>Skor AI</th>
                                    <th>Validitas</th>
                                    <th>Detail</th>
                                </tr>
                            </thead>
                            <tbody id="detailTableBody"></tbody>
                        </table>
                    </div>
                    <div id="pagination" style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
                        Menampilkan 100 data terakhir
                    </div>
                </div>
            </div>

            <div id="locations-section" style="display: none;">
                <div class="location-map">
                    <div class="map-header-container">
                        <h3><i class="fas fa-globe-asia"></i> Peta Sebaran Kualitas Udara</h3>
                        
                        <div class="map-legend-bar">
                            <div class="legend-item">
                                <span class="dot good"></span> Baik
                            </div>
                            <div class="legend-item">
                                <span class="dot medium"></span> Sedang
                            </div>
                            <div class="legend-item">
                                <span class="dot sensitive"></span> Sensitif
                            </div>
                            <div class="legend-item">
                                <span class="dot bad"></span> Bahaya
                            </div>
                            <div class="legend-item">
                                <span class="dot invalid"></span> Invalid
                            </div>
                        </div>
                    </div>
                    <div id="map"></div>
                </div>
                
                <div class="recent-analysis">
                    <div class="recent-header"><h3>Statistik Per Wilayah</h3></div>
                    <div class="table-container">
                        <table class="analysis-table">
                            <thead>
                                <tr>
                                    <th>Wilayah / Kota</th>
                                    <th>Total Scan</th>
                                    <th>Baik</th>
                                    <th>Sedang</th>
                                    <th>Sensitif</th>
                                    <th>Bahaya</th>
                                    <th>Dominasi</th>
                                </tr>
                            </thead>
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