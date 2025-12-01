from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import numpy as np
import cv2
import os
import mysql.connector
from datetime import datetime, date
import uuid
import json

# --- SETUP AWAL ---
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
MODEL_PATH = "airvision_model.keras"
IMG_SIZE = (128, 128)
CLASS_NAMES = ['Baik', 'Sedang', 'Tidak Sehat', 'Tidak Sehat Bagi Sebagian Orang']

# Konfigurasi Database (Sesuaikan dengan XAMPP)
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '', 
    'database': 'db_arvision'
}

# Load TensorFlow & Model
model = None
try:
    from tensorflow import keras
    from tensorflow.keras.preprocessing.image import img_to_array
    if os.path.exists(MODEL_PATH):
        model = keras.models.load_model(MODEL_PATH)
        print("✓ Model AI Berhasil Dimuat")
    else:
        print("❌ File model 'airvision_model.keras' tidak ditemukan!")
except ImportError:
    print("❌ Library TensorFlow belum diinstall. Jalankan: pip install tensorflow")

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- DATABASE CONNECTION ---
def get_db():
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except Exception as e:
        print(f"❌ Database Error: {e}")
        return None

# --- IMAGE ANALYSIS LOGIC ---
def analyze_image_properties(image):
    """
    Menganalisis properti fisik gambar untuk menentukan apakah itu langit.
    Mengembalikan: is_sky (bool), sky_ratio (float), edge_ratio (float)
    """
    try:
        # 1. Konversi Warna
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # 2. Deteksi Warna Langit (Range Biru, Putih, Abu-abu)
        lower_blue = np.array([90, 40, 40])
        upper_blue = np.array([140, 255, 255])
        mask_blue = cv2.inRange(hsv, lower_blue, upper_blue)
        
        lower_white = np.array([0, 0, 180])
        upper_white = np.array([180, 40, 255])
        mask_white = cv2.inRange(hsv, lower_white, upper_white)
        
        # Gabungkan mask
        mask_total = cv2.bitwise_or(mask_blue, mask_white)
        sky_ratio = np.sum(mask_total > 0) / (image.shape[0] * image.shape[1])
        
        # 3. Deteksi Tepi (Langit biasanya halus, gedung/pohon kasar)
        edges = cv2.Canny(gray, 50, 150)
        edge_ratio = np.sum(edges > 0) / (image.shape[0] * image.shape[1])
        
        # 4. Logika Penolakan
        is_sky = True
        # Jika warna langit sedikit DAN banyak tekstur kasar (edge) -> Bukan Langit
        if sky_ratio < 0.15 and edge_ratio > 0.15:
            is_sky = False
            
        return is_sky, float(sky_ratio), float(edge_ratio)
        
    except Exception as e:
        print(f"Analysis Error: {e}")
        return False, 0.0, 0.0

def update_stats(class_name, is_sky):
    """Update tabel daily_stats"""
    conn = get_db()
    if not conn: return
    try:
        cursor = conn.cursor()
        col = "non_sky_count"
        if is_sky:
            if class_name == 'Baik': col = "good_count"
            elif class_name == 'Sedang': col = "medium_count"
            elif class_name == 'Tidak Sehat': col = "unhealthy_count"
            else: col = "sensitive_count"
            
        sql = f"""
            INSERT INTO daily_stats (date, total_analysis, {col}) VALUES (CURDATE(), 1, 1)
            ON DUPLICATE KEY UPDATE total_analysis = total_analysis + 1, {col} = {col} + 1
        """
        cursor.execute(sql)
        conn.commit()
    except Exception as e:
        print(f"Stats Error: {e}")
    finally:
        conn.close()

def save_to_db(fname, loc, cls, conf, path, sky, s_ratio, e_ratio, probs):
    """Simpan hasil analisis ke database"""
    conn = get_db()
    if conn:
        try:
            cur = conn.cursor()
            sql = """
                INSERT INTO analysis_results 
                (filename, location, air_quality_class, confidence, image_path, is_sky, sky_ratio, edge_ratio, probabilities)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cur.execute(sql, (fname, loc, cls, conf, path, sky, s_ratio, e_ratio, probs))
            conn.commit()
        except Exception as e:
            print(f"DB Save Error: {e}")
        finally:
            conn.close()

# --- API ENDPOINTS ---

@app.route('/predict', methods=['POST'])
def predict():
    if not model: return jsonify({'error': 'Server Error: Model AI belum dimuat'}), 500
    if 'sky_image' not in request.files: return jsonify({'error': 'Tidak ada file'}), 400
    
    file = request.files['sky_image']
    location = request.form.get('location', 'Tidak Diketahui')
    
    # 1. Simpan File
    ext = os.path.splitext(file.filename)[1]
    filename = f"{str(uuid.uuid4())[:8]}{ext}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    try:
        # 2. Baca Gambar dengan OpenCV
        img_raw = cv2.imread(filepath)
        if img_raw is None: return jsonify({'error': 'File gambar rusak atau tidak terbaca'}), 400
        
        img_rgb = cv2.cvtColor(img_raw, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(img_rgb, IMG_SIZE)
        
        # 3. Analisis Fisik (Langit vs Bukan)
        is_sky, sky_ratio, edge_ratio = analyze_image_properties(img_resized)
        
        if not is_sky:
            probs_json = json.dumps({"Bukan Langit": 1.0})
            save_to_db(filename, location, "Bukan Langit", 0.0, filepath, 0, sky_ratio, edge_ratio, probs_json)
            # Tetap return JSON sukses tapi dengan flag is_sky=False agar modal frontend bisa nani
            return jsonify({
                'class_name': 'Bukan Langit',
                'is_sky': False,
                'error': 'Gambar terlalu rumit atau tidak terdeteksi sebagai langit.'
            })

        # 4. Prediksi AI (Klasifikasi)
        img_array = img_to_array(img_resized) / 255.0
        img_batch = np.expand_dims(img_array, axis=0)
        
        preds = model.predict(img_batch, verbose=0)[0] # Array probabilitas
        score = float(np.max(preds))
        class_idx = int(np.argmax(preds))
        class_name = CLASS_NAMES[class_idx]
        
        # Buat detail probabilitas
        prob_dict = {CLASS_NAMES[i]: float(preds[i]) for i in range(len(CLASS_NAMES))}
        probs_json = json.dumps(prob_dict)
        
        # 5. Simpan & Return
        save_to_db(filename, location, class_name, score, filepath, 1, sky_ratio, edge_ratio, probs_json)
        update_stats(class_name, True)
        
        return jsonify({
            'class_name': class_name,
            'score': score,
            'is_sky': True,
            'location': location,
            'details': prob_dict,
            'metrics': {'sky_ratio': sky_ratio, 'edge_ratio': edge_ratio}
        })

    except Exception as e:
        print(f"Predict Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analysis/recent', methods=['GET'])
def get_recent():
    conn = get_db()
    if not conn: return jsonify([])
    try:
        limit = request.args.get('limit', 20)
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM analysis_results ORDER BY analysis_time DESC LIMIT %s", (int(limit),))
        res = cur.fetchall()
        
        # Format JSON string kembali ke object
        for r in res:
            if r['probabilities']:
                try:
                    r['probabilities'] = json.loads(r['probabilities'])
                except:
                    r['probabilities'] = {}
        return jsonify(res)
    finally:
        conn.close()

@app.route('/api/stats/overall', methods=['GET'])
def get_overall():
    conn = get_db()
    if not conn: return jsonify({})
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT COUNT(*) as t FROM analysis_results")
        total = cur.fetchone()['t']
        
        cur.execute("SELECT air_quality_class as cls, COUNT(*) as c FROM analysis_results WHERE is_sky=1 GROUP BY cls")
        quality = {row['cls']: row['c'] for row in cur.fetchall()}
        
        return jsonify({'total_analysis': total, 'quality_stats': quality})
    finally:
        conn.close()

@app.route('/api/stats/daily', methods=['GET'])
def get_daily():
    conn = get_db()
    if not conn: return jsonify([])
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM daily_stats ORDER BY date DESC LIMIT 7")
        res = cur.fetchall()
        for r in res: r['date'] = r['date'].isoformat()
        return jsonify(res)
    finally:
        conn.close()

@app.route('/uploads/<path:filename>')
def serve_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("🚀 API SIAP - http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)