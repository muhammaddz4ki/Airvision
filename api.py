from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import numpy as np
import cv2
import os
import mysql.connector
from datetime import datetime, date
import uuid
import json
import sys
# Library Wajib untuk Sanitasi Nama File
from werkzeug.utils import secure_filename

# --- 1. SETUP LIBRARY & CONFIG ---
try:
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
    from tensorflow import keras
    print("✓ TensorFlow/Keras berhasil diimport")
except ImportError as e:
    print("="*50)
    print("ERROR: tensorflow tidak terinstal.")
    print("Jalankan: pip install tensorflow")
    print("="*50)
    sys.exit(1)

print("--- MEMUAT SISTEM AIRVISION ---")

# Konfigurasi Folder & Model
MODEL_PATH = "airvision_model.keras"
IMG_WIDTH = 128
IMG_HEIGHT = 128
UPLOAD_FOLDER = 'uploads'

# KELAS SESUAI DATASET
CLASS_NAMES = ['Baik', 'Sedang', 'Tidak Sehat', 'Tidak Sehat Bagi Sebagian Orang']

# Konfigurasi Database MySQL
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',     
    'database': 'db_arvision' 
}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load Model
model = None
try:
    if os.path.exists(MODEL_PATH):
        model = keras.models.load_model(MODEL_PATH)
        print("✓ MODEL AI BERHASIL DIMUAT")
    else:
        print(f"❌ ERROR: File model '{MODEL_PATH}' tidak ditemukan!")
        sys.exit(1)
except Exception as e:
    print(f"❌ Error saat memuat model: {e}")
    sys.exit(1)

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- 2. DATABASE MANAGEMENT ---

def get_db_connection():
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except:
        return None

def init_database():
    print("⚙️ Memeriksa Database MySQL...")
    conn = get_db_connection()
    if not conn:
        print("❌ Gagal terhubung ke MySQL.")
        return

    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analysis_results (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                location VARCHAR(100),
                analysis_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                air_quality_class VARCHAR(100) NOT NULL,
                confidence FLOAT NOT NULL,
                image_path VARCHAR(255) NOT NULL,
                is_sky TINYINT(1) DEFAULT 1,
                probabilities JSON,
                notes TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_stats (
                date DATE PRIMARY KEY,
                total_analysis INT DEFAULT 0,
                good_count INT DEFAULT 0,
                medium_count INT DEFAULT 0,
                unhealthy_count INT DEFAULT 0,
                sensitive_count INT DEFAULT 0,
                non_sky_count INT DEFAULT 0
            )
        """)
        conn.commit()
        print("✓ Tabel Database Siap")
    except Exception as e:
        print(f"❌ Error init DB: {e}")
    finally:
        conn.close()

def save_analysis_to_db(filename, location, class_name, score, path, is_sky, details=None, notes=None):
    conn = get_db_connection()
    if not conn: return None

    try:
        cursor = conn.cursor()
        probs_json = json.dumps(details) if details else "{}"
        
        # Simpan path yang sudah dinormalisasi (slash biasa)
        clean_path = path.replace("\\", "/") 

        sql_insert = """
            INSERT INTO analysis_results 
            (filename, location, air_quality_class, confidence, image_path, is_sky, probabilities, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        vals = (filename, location, class_name, score, clean_path, 1 if is_sky else 0, probs_json, notes)
        cursor.execute(sql_insert, vals)
        last_id = cursor.lastrowid
        
        today = date.today()
        col_update = "non_sky_count"
        
        if is_sky:
            if class_name == 'Baik': col_update = "good_count"
            elif class_name == 'Sedang': col_update = "medium_count"
            elif class_name == 'Tidak Sehat': col_update = "unhealthy_count"
            elif class_name == 'Tidak Sehat Bagi Sebagian Orang': col_update = "sensitive_count"
            else: col_update = None 

        if col_update:
            sql_stats = f"""
                INSERT INTO daily_stats (date, total_analysis, {col_update}) 
                VALUES (%s, 1, 1)
                ON DUPLICATE KEY UPDATE 
                total_analysis = total_analysis + 1, 
                {col_update} = {col_update} + 1
            """
            cursor.execute(sql_stats, (today,))
        
        conn.commit()
        return last_id
    except:
        return None
    finally:
        conn.close()

# --- 3. SMART FEATURES ---

def analyze_smart_sky_features(image):
    try:
        h, w, _ = image.shape
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # 1. CEK WAJAH
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(50, 50))
        if len(faces) > 0:
            return False, "Ini bukan foto langit"

        # 2. CEK KECERAHAN
        v_channel = hsv[:,:,2]
        avg_brightness = np.mean(v_channel)
        if avg_brightness < 40:
            return False, "Ini bukan foto langit (Terlalu Gelap)"

        # 3. CEK TEKSTUR
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var > 800:
            return False, "Ini bukan foto langit (Terlalu Banyak Objek)"

        # 4. CEK WARNA
        lower_blue = np.array([85, 50, 50])
        upper_blue = np.array([135, 255, 255])
        mask_blue = cv2.inRange(hsv, lower_blue, upper_blue)
        lower_white = np.array([0, 0, 100])
        upper_white = np.array([180, 50, 255])
        mask_white = cv2.inRange(hsv, lower_white, upper_white)
        mask_sky = cv2.bitwise_or(mask_blue, mask_white)
        sky_ratio = np.sum(mask_sky > 0) / (h * w)

        if sky_ratio < 0.25:
             return False, "Ini bukan foto langit (Warna Tidak Sesuai)"

        return True, "Valid"
    except Exception as e:
        print(f"Smart Check Error: {e}")
        return False, "Gagal memproses gambar"

def preprocess_for_ai(image_rgb):
    try:
        lab = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        final = cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)
        return cv2.resize(final, (IMG_HEIGHT, IMG_WIDTH))
    except:
        return cv2.resize(image_rgb, (IMG_HEIGHT, IMG_WIDTH))

# --- 4. API ENDPOINTS ---

@app.route('/predict', methods=['POST'])
def predict():
    if 'sky_image' not in request.files:
        return jsonify({'error': 'Tidak ada file gambar'}), 400
    
    file = request.files['sky_image']
    location = request.form.get('location', 'Tidak Diketahui')
    
    if file.filename == '':
        return jsonify({'error': 'Nama file kosong'}), 400

    clean_name = secure_filename(file.filename)
    analysis_id = str(uuid.uuid4())[:8]
    filename = f"{analysis_id}_{clean_name}"
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        img_raw = cv2.imread(filepath)
        if img_raw is None:
            return jsonify({'error': 'File gambar rusak'}), 400
        
        img_rgb = cv2.cvtColor(img_raw, cv2.COLOR_BGR2RGB)
        
        # --- SMART CHECK ---
        is_sky, reason = analyze_smart_sky_features(img_rgb)

        if not is_sky:
            save_analysis_to_db(filename, location, "Bukan Langit", 0.0, filepath, False, {}, reason)
            
            return jsonify({
                'class_name': 'Bukan Langit',
                'is_sky': False,
                'score': 0.0,
                'error': reason,
                'image_url': f"uploads/{filename}" # Pastikan path ini benar (relative ke root web)
            })

        # --- AI PREDICTION ---
        img_processed = preprocess_for_ai(img_rgb)
        img_array = np.array(img_processed, dtype=np.float32) / 255.0
        img_batch = np.expand_dims(img_array, axis=0)

        preds = model.predict(img_batch, verbose=0)[0]
        score = float(np.max(preds))
        class_idx = int(np.argmax(preds))
        class_name = CLASS_NAMES[class_idx]
        
        details = {CLASS_NAMES[i]: float(preds[i]) for i in range(len(CLASS_NAMES))}
        
        save_analysis_to_db(filename, location, class_name, score, filepath, True, details, "Analisis Berhasil")

        return jsonify({
            'class_name': class_name,
            'score': score,
            'is_sky': True,
            'location': location,
            'details': details,
            'image_url': f"uploads/{filename}"
        })

    except Exception as e:
        print(f"Server Error: {e}")
        return jsonify({'error': str(e)}), 500

# --- DASHBOARD ENDPOINTS ---

@app.route('/api/stats/overall', methods=['GET'])
def get_overall_stats():
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB Error'}), 500
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT COUNT(*) as t FROM analysis_results")
        total = cur.fetchone()['t']
        cur.execute("SELECT air_quality_class as cls, COUNT(*) as c FROM analysis_results WHERE is_sky=1 GROUP BY cls")
        quality = {row['cls']: row['c'] for row in cur.fetchall()}
        cur.execute("SELECT COUNT(*) as c FROM analysis_results WHERE is_sky=0")
        non_sky = cur.fetchone()['c']
        return jsonify({'total_analysis': total, 'quality_stats': quality, 'non_sky_count': non_sky})
    finally:
        conn.close()

@app.route('/api/stats/daily', methods=['GET'])
def get_daily_stats():
    conn = get_db_connection()
    if not conn: return jsonify([]), 500
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM daily_stats ORDER BY date DESC LIMIT 7")
        res = cur.fetchall()
        for r in res: r['date'] = r['date'].isoformat()
        return jsonify(res)
    finally:
        conn.close()

@app.route('/api/analysis/recent', methods=['GET'])
def get_recent_analysis():
    conn = get_db_connection()
    if not conn: return jsonify([]), 500
    try:
        limit = request.args.get('limit', 10)
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM analysis_results ORDER BY analysis_time DESC LIMIT %s", (int(limit),))
        res = cur.fetchall()
        for r in res:
            r['analysis_time'] = r['analysis_time'].isoformat()
            if r['probabilities']:
                try: r['probabilities'] = json.loads(r['probabilities'])
                except: r['probabilities'] = {}
        return jsonify(res)
    finally:
        conn.close()

@app.route('/uploads/<path:filename>')
def serve_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'database': 'MySQL Connected' if get_db_connection() else 'Error'})

if __name__ == '__main__':
    init_database()
    print("\n" + "="*50)
    print("🚀 AIRVISION API SERVER (Image Path Fix)")
    print("="*50)
    app.run(host='0.0.0.0', port=5000, debug=True)