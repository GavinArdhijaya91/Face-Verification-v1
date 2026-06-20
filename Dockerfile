# Gunakan image Python yang ringan
FROM python:3.10-slim

# Set working directory di dalam container
WORKDIR /app

# Install system dependencies yang dibutuhkan oleh OpenCV dan InsightFace
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Salin file requirements.txt
COPY requirements.txt .

# Install dependensi Python
# Kita tambahkan parameter --no-cache-dir agar image tidak membengkak
# Untuk PyTorch, disarankan install versi CPU-only agar size image lebih kecil
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Salin seluruh kode proyek ke dalam container
COPY . .

# Ekspos port yang digunakan oleh FastAPI
EXPOSE 8000

# Jalankan aplikasi menggunakan Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
