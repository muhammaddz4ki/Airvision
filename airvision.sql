DROP TABLE IF EXISTS analysis_results;
DROP TABLE IF EXISTS daily_stats;

CREATE TABLE analysis_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    location VARCHAR(100) DEFAULT 'Tidak Diketahui',
    analysis_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    air_quality_class VARCHAR(50) NOT NULL,
    confidence FLOAT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    is_sky TINYINT(1) DEFAULT 1,
    sky_ratio FLOAT DEFAULT 0,
    edge_ratio FLOAT DEFAULT 0,
    probabilities TEXT,
    notes TEXT
);

CREATE TABLE daily_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE UNIQUE,
    total_analysis INT DEFAULT 0,
    good_count INT DEFAULT 0,
    medium_count INT DEFAULT 0,
    unhealthy_count INT DEFAULT 0,
    sensitive_count INT DEFAULT 0,
    non_sky_count INT DEFAULT 0
);