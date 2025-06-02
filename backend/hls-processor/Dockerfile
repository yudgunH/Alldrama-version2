FROM node:18-slim

# Cài đặt ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Cài đặt curl cho việc gửi callback
RUN apt-get update && apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Tạo thư mục làm việc
WORKDIR /app

# Sao chép mã nguồn
COPY package.json .
COPY processor.js .

# Cài đặt dependencies
RUN npm install

# Tạo thư mục đầu vào và đầu ra với quyền đầy đủ
RUN mkdir -p /input /output && chmod 777 /input /output

# Sử dụng user root để tránh vấn đề quyền truy cập
USER root

# Điểm vào với shell script để kiểm tra file trước khi xử lý
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"] 