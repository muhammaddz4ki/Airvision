import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix
import os

print("--- Memuat Model dan Data ---")

# --- 1. TENTUKAN PATH & PARAMETER (HARUS SAMA DENGAN TRAINING) ---
DATA_DIR = 'Dataset/AQI-Classification-In-Indonesia-main/data'
IMG_WIDTH = 128
IMG_HEIGHT = 128
BATCH_SIZE = 32 # Gunakan batch size yang sama

# --- 2. MUAT MODEL YANG SUDAH DILATIH ---
MODEL_PATH = "airvision_model.keras"
try:
    model = keras.models.load_model(MODEL_PATH)
    print(f"Berhasil memuat model dari {MODEL_PATH}")
except Exception as e:
    print(f"ERROR: Gagal memuat model. {e}")
    print("Pastikan file 'airvision_model.keras' ada di folder ini.")
    exit()

# --- 3. SIAPKAN GENERATOR DATA VALIDASI ---
# Kita HANYA perlu rescale. Tidak perlu augmentasi.
# Kita pakai data 'validation' yang sudah kita pisah saat training.
datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2 # Harus sama dengan saat training
)

# Buat generator untuk data Validasi
# PENTING: shuffle=False agar urutan label dan prediksi cocok
validation_generator = datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation', # Gunakan data validasi
    shuffle=False      # JANGAN DIACAK
)

# --- 4. DAPATKAN NAMA KELAS & LABEL ---
class_names = list(validation_generator.class_indices.keys())
num_classes = validation_generator.num_classes
num_samples = validation_generator.samples

print(f"Mengevaluasi {num_samples} gambar validasi...")

# Ambil label yang sebenarnya (True Labels) dari generator
y_true = validation_generator.classes

# --- 5. BUAT PREDIKSI ---
# model.predict() akan memberikan probabilitas untuk setiap kelas
Y_pred_probs = model.predict(validation_generator, steps=num_samples // BATCH_SIZE + 1)

# Ambil kelas dengan probabilitas tertinggi
y_pred = np.argmax(Y_pred_probs, axis=1)

# Pastikan jumlah prediksi dan label sama
print(f"Total Label Sebenarnya: {len(y_true)}")
print(f"Total Prediksi: {len(y_pred)}")

# --- 6. TAMPILKAN HASIL PERSEN AKURASI (CLASSIFICATION REPORT) ---
print("\n\n--- HASIL PERSEN AKURASI (CLASSIFICATION REPORT) ---")
print(classification_report(y_true, y_pred, target_names=class_names))

# --- 7. TAMPILKAN CONFUSION MATRIX ---
print("\n--- Menampilkan Confusion Matrix ---")
try:
    # Buat confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    
    # Gambar heatmap menggunakan Seaborn
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=class_names, yticklabels=class_names)
    
    plt.title('Confusion Matrix')
    plt.ylabel('Kelas Sebenarnya (True Label)')
    plt.xlabel('Kelas Prediksi (Predicted Label)')
    plt.show()

except Exception as e:
    print(f"Gagal menampilkan plot: {e}")
    print("Pastikan Anda memiliki 'matplotlib' dan 'seaborn'.")