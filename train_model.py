import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, Input
import os
import matplotlib.pyplot as plt

print(f"TensorFlow Version: {tf._version_}")

# --- 1. TENTUKAN PATH & PARAMETER ---
# Sesuaikan path ini ke folder 'data' Anda
DATA_DIR = 'Dataset/AQI-Classification-In-Indonesia-main/data'
IMG_WIDTH = 128
IMG_HEIGHT = 128
BATCH_SIZE = 32

# --- 2. PERSIAPAN DATA (DATA GENERATORS) ---
print(f"Membaca data dari: {DATA_DIR}")

# Buat generator dengan augmentasi data & validasi split
# Kita akan pakai 20% data untuk validasi
datagen = ImageDataGenerator(
    rescale=1./255,          # Normalisasi
    rotation_range=20,
    width_shift_range=0.1,
    height_shift_range=0.1,
    shear_range=0.1,
    zoom_range=0.1,
    horizontal_flip=True,
    fill_mode='nearest',
    validation_split=0.2 # 20% data untuk validasi
)

# Generator untuk data Latihan (Training)
train_generator = datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='categorical', # Karena kita punya >2 kelas
    subset='training'         # Tandai ini sebagai data training
)

# Generator untuk data Validasi
validation_generator = datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'       # Tandai ini sebagai data validasi
)

# --- 3. DAPATKAN NAMA KELAS ---
# Ini SANGAT PENTING untuk 'api.py' nanti
num_classes = train_generator.num_classes
class_names = list(train_generator.class_indices.keys())
print(f"\nBerhasil ditemukan {num_classes} kelas:")
print(class_names)
print("\n")

# --- 4. BANGUN ARSITEKTUR CNN ---
# (Ini arsitektur yang Anda minta, disesuaikan untuk 4 kelas)
model = Sequential([
    Input(shape=(IMG_HEIGHT, IMG_WIDTH, 3)),
    
    Conv2D(32, (3, 3), activation='relu', padding='same'),
    MaxPooling2D(2, 2),
    
    Conv2D(64, (3, 3), activation='relu', padding='same'),
    MaxPooling2D(2, 2),
    
    Conv2D(128, (3, 3), activation='relu', padding='same'),
    MaxPooling2D(2, 2),
    
    Dropout(0.4),
    Flatten(),
    Dense(128, activation='relu'),
    Dropout(0.5),
    
    # Output layer: 'num_classes' (harus 4) dan 'softmax'
    Dense(num_classes, activation='softmax')
])

# Compile model
model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# --- 5. LATIH MODEL ---
print("\nMemulai pelatihan model...")
EPOCHS = 25 # Anda bisa naikkan (misal 50) untuk akurasi lebih baik

history = model.fit(
    train_generator,
    steps_per_epoch=train_generator.samples // BATCH_SIZE,
    epochs=EPOCHS,
    validation_data=validation_generator,
    validation_steps=validation_generator.samples // BATCH_SIZE
)

# --- 6. SIMPAN MODEL ---
model_filename = 'airvision_model.keras'
model.save(model_filename)
print(f"\nPelatihan Selesai! Model disimpan sebagai: {model_filename}")

# --- 7. TAMPILKAN GRAFIK AKURASI ---
print("Menampilkan grafik akurasi...")
acc = history.history['accuracy']
val_acc = history.history['val_accuracy']
loss = history.history['loss']
val_loss = history.history['val_loss']

epochs_range = range(EPOCHS)

plt.figure(figsize=(12, 6))
plt.subplot(1, 2, 1)
plt.plot(epochs_range, acc, label='Akurasi Training')
plt.plot(epochs_range, val_acc, label='Akurasi Validasi')
plt.legend(loc='lower right')
plt.title('Akurasi Training vs Validasi')

plt.subplot(1, 2, 2)
plt.plot(epochs_range, loss, label='Loss Training')
plt.plot(epochs_range, val_loss, label='Loss Validasi')
plt.legend(loc='upper right')
plt.title('Loss Training vs Validasi')
plt.show()