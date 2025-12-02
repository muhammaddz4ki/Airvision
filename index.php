<!DOCTYPE html>
<html lang="id" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="AirVision - Solusi AI Terdepan untuk Analisis Kualitas Udara Real-time Berbasis Computer Vision.">
    <title>AirVision - Intelligent Air Quality Monitoring</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

    <?php include 'includes/header.php'; ?>

    <section id="beranda" class="hero">
        <div class="hero-bg-glow"></div>
        <div class="container">
            <div class="hero-grid">
                <div class="hero-text">
                    <div class="badge-pill"><i class="fas fa-sparkles"></i> AI-Powered Technology 2.0</div>
                    <h1>Pemantauan Udara <br>Berbasis <span class="gradient-text">Computer Vision</span></h1>
                    <p class="hero-desc">
                        Platform analisis lingkungan cerdas yang mengubah citra langit menjadi data kualitas udara akurat (AQI) menggunakan algoritma Convolutional Neural Network (CNN).
                    </p>
                    <div class="hero-actions">
                        <a href="#analisis" class="btn-primary"><i class="fas fa-rocket"></i> Mulai Analisis</a>
                        <a href="dashboard.php" class="btn-outline"><i class="fas fa-chart-line"></i> Lihat Dashboard</a>
                    </div>
                    
                    <div class="trust-badges">
                        <span>Didukung oleh:</span>
                        <div class="logos">
                            <i class="fab fa-python" title="Python"></i>
                            <i class="fab fa-google" title="TensorFlow"></i>
                            <i class="fas fa-database" title="MySQL"></i>
                        </div>
                    </div>
                </div>
                
                <div class="hero-visual">
                    <div class="scan-card glass-effect">
                        <div class="scan-header">
                            <span class="dot-red"></span><span class="dot-yellow"></span><span class="dot-green"></span>
                        </div>
                        <div class="scan-body">
                            <div class="scanning-line"></div>
                            <img src="https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1000&auto=format&fit=crop" alt="AI Scan Simulation" class="scan-img">
                            <div class="scan-overlay-info">
                                <div class="info-item">
                                    <small>Deteksi</small>
                                    <strong>Langit Cerah</strong>
                                </div>
                                <div class="info-item">
                                    <small>Status</small>
                                    <strong style="color: #10b981;">Baik</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="stats-section">
        <div class="container">
            <div class="stats-grid">
                <div class="stat-box">
                    <h3 class="counter" data-target="98">0</h3><span>%</span>
                    <p>Akurasi Model</p>
                </div>
                <div class="stat-box">
                    <h3 class="counter" data-target="1500">0</h3><span>+</span>
                    <p>Analisis Harian</p>
                </div>
                <div class="stat-box">
                    <h3 class="counter" data-target="4">0</h3><span>Kelas</span>
                    <p>Klasifikasi AQI</p>
                </div>
                <div class="stat-box">
                    <h3 class="counter" data-target="24">0</h3><span>/7</span>
                    <p>Sistem Online</p>
                </div>
            </div>
        </div>
    </section>

    <section id="teknologi" class="technology">
        <div class="container">
            <div class="section-title">
                <span class="subtitle">Arsitektur Sistem</span>
                <h2>Kecerdasan Buatan di Balik Layar</h2>
                <p>Menggabungkan pengolahan citra digital dengan Deep Learning untuk hasil presisi.</p>
            </div>
            
            <div class="tech-grid">
                <div class="tech-card">
                    <div class="tech-icon"><i class="fas fa-eye"></i></div>
                    <h3>1. Pre-Processing Citra</h3>
                    <p>Sistem melakukan <i>CLAHE Enhancement</i> untuk memperjelas detail polutan mikroskopis dan partikel kabut pada foto langit.</p>
                </div>
                <div class="tech-card">
                    <div class="tech-icon"><i class="fas fa-brain"></i></div>
                    <h3>2. Smart Detection</h3>
                    <p>Algoritma memvalidasi tekstur, kecerahan, dan komposisi warna untuk memastikan objek adalah langit yang valid.</p>
                </div>
                <div class="tech-card">
                    <div class="tech-icon"><i class="fas fa-network-wired"></i></div>
                    <h3>3. Klasifikasi CNN</h3>
                    <p>Model Neural Network membandingkan pola visual dengan ribuan dataset untuk menentukan 1 dari 4 kelas kualitas udara.</p>
                </div>
            </div>
        </div>
    </section>

    <section id="analisis" class="upload-section">
        <div class="container">
            <div class="upload-wrapper">
                <div class="upload-header">
                    <h2>Live Analysis Demo</h2>
                    <p>Unggah foto langit Anda untuk pengujian sistem secara real-time.</p>
                </div>
                
                <form id="uploadForm" enctype="multipart/form-data">
                    <div class="form-row">
                        <div class="form-group location-group">
                            <label><i class="fas fa-map-pin"></i> Lokasi Pengambilan</label>
                            <div class="input-with-btn">
                                <input type="text" id="locationInput" name="location" placeholder="Otomatis atau ketik manual..." class="form-input">
                                <button type="button" id="btn-gps" onclick="getLocation()" class="btn-icon" title="Ambil Lokasi GPS"><i class="fas fa-crosshairs"></i></button>
                            </div>
                        </div>
                    </div>

                    <div class="upload-area" id="uploadBox">
                        <div class="upload-content">
                            <div class="icon-pulse"><i class="fas fa-cloud-upload-alt"></i></div>
                            <h3>Drag & Drop atau Klik</h3>
                            <p>Format: JPG/PNG (Max 5MB)</p>
                        </div>
                        <input type="file" id="fileInput" name="sky_image" accept="image/*" hidden>
                    </div>

                    <div class="file-preview" id="filePreview">
                        <div class="preview-left">
                            <i class="fas fa-file-image"></i>
                            <div class="file-info">
                                <span id="fileName" class="fname">filename.jpg</span>
                                <span class="fstatus">Siap dianalisis</span>
                            </div>
                        </div>
                        <button type="button" onclick="removeFile()" class="btn-remove"><i class="fas fa-times"></i></button>
                    </div>

                    <div class="form-actions">
                        <div class="disclaimer">
                            <i class="fas fa-shield-alt"></i> Privasi aman. Foto tidak disebarkan.
                        </div>
                        <button type="submit" class="btn-analyze">
                            <span>Jalankan Analisis AI</span>
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </section>

    <section id="edukasi" class="insights">
        <div class="container">
            <div class="grid-2-col">
                <div class="insight-content">
                    <span class="subtitle">Dampak Kesehatan</span>
                    <h2>Standar Kualitas Udara</h2>
                    <p>Sistem kami mengklasifikasikan kondisi udara menjadi 4 tingkat risiko berdasarkan konsentrasi partikel visual.</p>
                    
                    <ul class="check-list">
                        <li><i class="fas fa-check-circle"></i> <strong>Analisis Real-time:</strong> Hasil instan dalam detik.</li>
                        <li><i class="fas fa-check-circle"></i> <strong>Peringatan Dini:</strong> Lindungi kelompok rentan.</li>
                        <li><i class="fas fa-check-circle"></i> <strong>Akurasi Tinggi:</strong> Validasi multi-layer.</li>
                    </ul>
                    <a href="#" class="link-arrow">Baca Dokumentasi Lengkap <i class="fas fa-arrow-right"></i></a>
                </div>
                
                <div class="insight-cards-grid">
                    <div class="card-info good">
                        <div class="icon"><i class="fas fa-smile"></i></div>
                        <div><h4>Baik</h4><p>Aman untuk semua aktivitas outdoor.</p></div>
                    </div>
                    <div class="card-info medium">
                        <div class="icon"><i class="fas fa-meh"></i></div>
                        <div><h4>Sedang</h4><p>Aman bagi sebagian besar orang.</p></div>
                    </div>
                    <div class="card-info sensitive">
                        <div class="icon"><i class="fas fa-head-side-mask"></i></div>
                        <div>
                            <h4 style="font-size: 0.95rem;">Tidak Sehat Bagi Sebagian Orang</h4>
                            <p>Risiko bagi lansia & pengidap asma.</p>
                        </div>
                    </div>
                    <div class="card-info bad">
                        <div class="icon"><i class="fas fa-biohazard"></i></div>
                        <div><h4>Tidak Sehat</h4><p>Wajib masker & hindari luar ruangan.</p></div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="faq-section">
        <div class="container">
            <div class="section-title">
                <h2>Pertanyaan Umum</h2>
            </div>
            <div class="faq-grid">
                <div class="faq-item">
                    <div class="faq-question">
                        <span>Bagaimana cara kerja teknologi ini?</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Kami menggunakan Computer Vision untuk menganalisis kekeruhan, warna, dan tekstur langit, lalu membandingkannya dengan model AI yang telah dilatih dengan ribuan data polusi terverifikasi.</p>
                    </div>
                </div>
                <div class="faq-item">
                    <div class="faq-question">
                        <span>Apakah bisa digunakan saat mendung?</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Ya, model kami dilatih untuk membedakan antara awan mendung alami dan kabut polusi (smog). Namun, cahaya yang cukup tetap diperlukan untuk hasil optimal.</p>
                    </div>
                </div>
                <div class="faq-item">
                    <div class="faq-question">
                        <span>Apa maksud 'Tidak Sehat Bagi Sebagian Orang'?</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Kategori ini berarti udara mulai tidak sehat bagi kelompok rentan seperti anak-anak, lansia, atau penderita penyakit pernapasan, meskipun orang sehat mungkin belum merasakan dampaknya.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <?php include 'includes/footer.php'; ?>

    <div class="modal-overlay" id="resultModal">
        <div class="modal-content">
            <button id="modalCloseBtnTop" class="modal-close-icon" onclick="closeModal()"><i class="fas fa-times"></i></button>
            <div class="modal-image-wrapper">
                <img id="modalResultImage" src="" alt="Hasil Analisis">
                <div class="scan-line" id="scanLine"></div>
            </div>
            <div class="modal-body">
                <div id="modalIcon" class="modal-status-icon"></div>
                <h2 id="modalTitle" class="modal-title">Menganalisis...</h2>
                
                <div class="confidence-meter">
                    <div class="meter-bar"><div id="confidenceFill" class="meter-fill" style="width: 0%"></div></div>
                    <div class="meter-labels">
                        <span>Tingkat Keyakinan AI</span>
                        <span id="modalConfidence">0%</span>
                    </div>
                </div>

                <p id="modalDescription" class="modal-desc"></p>
                <div class="modal-meta">
                    <span id="modalLocation"></span>
                    <span id="modalDate"><i class="far fa-clock"></i> Baru saja</span>
                </div>
                <button onclick="closeModal()" class="btn-primary full-width">Tutup</button>
            </div>
        </div>
    </div>

    <script src="assets/js/main.js"></script>
</body>
</html>