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

# Tạo thư mục đầu vào và đầu ra
RUN mkdir -p /input /output

# Điểm vào
ENTRYPOINT ["node", "processor.js"] 