#!/bin/bash
set -e

# Cấp quyền Docker socket cho tất cả người dùng
if [ -e /var/run/docker.sock ]; then
  echo "Cấp quyền cho Docker socket..."
  chmod 666 /var/run/docker.sock
  ls -la /var/run/docker.sock
fi

# Chuẩn bị thư mục hls-processor
if [ -d /app/hls-processor ]; then
  echo "Cài đặt quyền cho thư mục hls-processor..."
  mkdir -p /app/hls-processor/temp
  mkdir -p /app/hls-processor/output
  chmod -R 777 /app/hls-processor
fi

# Kiểm tra kết nối với Docker daemon
echo "Kiểm tra kết nối với Docker daemon..."
docker ps || echo "Cảnh báo: Không thể kết nối với Docker daemon. Có thể cần thêm quyền."

# Thử build image hls-processor
if [ -d /app/hls-processor ] && [ -f /app/hls-processor/Dockerfile ]; then
  echo "Thử build image hls-processor..."
  cd /app/hls-processor && docker build -t alldrama-hls-processor . || echo "Cảnh báo: Không thể build image hls-processor."
  cd /app
fi

# Chuyển quyền sở hữu của các thư mục quan trọng cho node user
echo "Cấp quyền sở hữu cho user node..."
chown -R node:node /app/uploads
chown -R node:node /app/logs
chown -R node:node /app/dist

# Chạy ứng dụng với user node nếu NODE_ENV là production
if [ "$NODE_ENV" = "production" ]; then
  echo "Khởi động ứng dụng với user node..."
  exec su -s /bin/bash node -c "node dist/index.js"
else
  echo "Khởi động ứng dụng với user hiện tại..."
  exec "$@"
fi 