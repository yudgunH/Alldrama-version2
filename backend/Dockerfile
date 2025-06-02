FROM node:18-slim AS builder

WORKDIR /app

# Cài đặt các dependencies cần thiết
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-slim

WORKDIR /app

# Cài đặt ffmpeg cho xử lý video và docker CLI để chạy container con
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg curl apt-transport-https ca-certificates gnupg lsb-release \
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update && apt-get install -y docker-ce-cli \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt dependencies production-only
COPY package*.json ./
RUN npm ci --only=production

# Copy build artifacts từ builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts

# Copy tệp cấu hình
COPY .env.production ./.env
COPY tsconfig.json ./

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Tạo thư mục uploads và đảm bảo quyền truy cập đúng
RUN mkdir -p uploads/temp && chmod -R 777 uploads
RUN mkdir -p logs && chmod -R 777 logs
RUN chmod -R 777 /app/logs

# Mở cổng ứng dụng
EXPOSE 5000

# Thêm các biến môi trường cần thiết
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096 --enable-source-maps"

# Sử dụng entrypoint script thay vì chạy trực tiếp node
ENTRYPOINT ["/app/entrypoint.sh"]

# Xóa dòng USER node vì entrypoint sẽ xử lý việc này
# Lệnh mặc định nếu không có lệnh nào được cung cấp
CMD ["node", "dist/index.js"]

# Đảm bảo docker logs hiển thị đầy đủ
ENV NODE_OPTIONS="--enable-source-maps --unhandled-rejections=strict --trace-warnings"
