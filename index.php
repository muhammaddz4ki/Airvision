<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AirVision - Home</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

    <?php include 'includes/header.php'; ?>

    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <div class="hero-text">
                    <h1>Cek Kualitas Udara dengan <span class="highlight">Foto Langit</span></h1>
                    <p>Teknologi AI kami menganalisis polusi udara dari foto langit smartphone Anda dalam hitungan detik.</p>
                    <div class="hero-buttons">
                        <a href="#analisis" class="btn-primary"><i class="fas fa-camera"></i> Mulai Analisis</a>
                        <a href="#cara-kerja" class="btn-secondary">Pelajari Cara Kerja</a>
                    </div>
                </div>
                <div class="hero-visual">
                    <div class="phone-mockup">
                        <div class="phone-screen">
                            <i class="fas fa-cloud-sun"></i>
                            <h3>AirVision</h3>
                            <h2 style="font-size: 3rem; margin: 20px 0;">98%</h2>
                            <p>Akurasi Model</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="how-it-works" id="cara-kerja">
        <div class="container">
            <div class="section-header"><h2>Cara Kerja</h2><p>Mudah, Cepat, dan Akurat</p></div>
            <div class="steps-grid">
                <div class="step-card"><div class="step-number">1</div><div class="step-icon"><i class="fas fa-camera"></i></div><h3>Ambil Foto</h3><p>Potret langit biru atau berawan di sekitar Anda.</p></div>
                <div class="step-card"><div class="step-number">2</div><div class="step-icon"><i class="fas fa-upload"></i></div><h3>Upload</h3><p>Unggah foto ke sistem AirVision.</p></div>
                <div class="step-card"><div class="step-number">3</div><div class="step-icon"><i class="fas fa-chart-bar"></i></div><h3>Hasil</h3><p>Dapatkan analisis kualitas udara instan.</p></div>
            </div>
        </div>
    </section>

    <section class="upload-section" id="analisis">
        <div class="container">
            <div class="upload-container">
                <h2>Mulai Analisis</h2>
                <p>Pastikan foto langit terlihat jelas.</p>
                <form id="uploadForm" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="locationInput" style="display:block; margin-bottom:5px; color:white;">Lokasi Pengambilan:</label>
                        <div class="input-group">
                            <input type="text" id="locationInput" name="location" placeholder="Masukkan kota..." class="location-input">
                            <button type="button" id="btn-gps" onclick="getLocation()" class="btn-gps"><i class="fas fa-map-marker-alt"></i> GPS</button>
                        </div>
                    </div>
                    <div class="upload-box" id="uploadBox">
                        <div class="upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
                        <h3>Klik atau Drop Foto</h3>
                        <input type="file" id="fileInput" name="sky_image" accept="image/*" class="file-input">
                        <button type="button" class="btn-upload" onclick="document.getElementById('fileInput').click()">Pilih File</button>
                    </div>
                    <div class="file-preview" id="filePreview">
                        <div class="preview-info">
                            <span id="fileName" style="color:white;">file.jpg</span>
                            <button type="button" onclick="removeFile()" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fas fa-times"></i></button>
                        </div>
                        <button type="submit" class="btn-analyze">Analisis Sekarang</button>
                    </div>
                </form>
            </div>
        </div>
    </section>

    <?php include 'includes/footer.php'; ?>

    <div class="modal-overlay" id="resultModal">
        <div class="modal-content">
            <div id="modalIcon" class="modal-icon"></div>
            <h2 id="modalTitle" style="color:white; margin-bottom:10px;"></h2>
            <div class="modal-image-container" id="modalImageContainer">
                <img id="modalResultImage" src="" alt="Hasil">
                <div id="modalResultLabel" class="modal-result-label"></div>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 10px; margin: 15px 0;">
                <p id="modalResult" style="color: var(--text-main); font-weight: 600; margin: 5px 0;"></p>
                <p id="modalLocation" style="color: var(--accent); font-size: 0.9rem; margin-bottom: 5px;"></p>
                <p id="modalConfidence" style="color: var(--text-muted); font-size: 0.85rem; margin: 0;"></p>
            </div>
            <p id="modalDescription" style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5;"></p>
            <button id="modalCloseBtn" class="btn-modal-close">Tutup</button>
        </div>
    </div>

    <script src="assets/js/main.js"></script>
</body>
</html>