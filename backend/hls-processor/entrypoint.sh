#!/bin/bash
set -e

echo "[Entrypoint] Bắt đầu kiểm tra thư mục input"
ls -la /input || true
echo "[Entrypoint] Kiểm tra file đầu vào"

INPUT_FILE="$1"
if [ -f "$INPUT_FILE" ]; then
  echo "[Entrypoint] ✅ File đầu vào tồn tại: $INPUT_FILE"
  echo "[Entrypoint] Kích thước file: $(stat -c%s "$INPUT_FILE") bytes"
  
  # Kiểm tra file có phải là MP4 không
  file_type=$(file -b "$INPUT_FILE" || echo "unknown")
  echo "[Entrypoint] Loại file: $file_type"
  
  # Kiểm tra file có đọc được không bằng ffprobe
  echo "[Entrypoint] Kiểm tra file với ffprobe..."
  ffprobe -v error -show_format -show_streams "$INPUT_FILE" > /tmp/probe_output 2>&1
  PROBE_STATUS=$?
  
  if [ $PROBE_STATUS -eq 0 ]; then
    echo "[Entrypoint] ✅ ffprobe kiểm tra thành công!"
    cat /tmp/probe_output
  else
    echo "[Entrypoint] ❌ ffprobe thất bại với mã lỗi $PROBE_STATUS"
    cat /tmp/probe_output
  fi
else
  echo "[Entrypoint] ❌ File đầu vào KHÔNG TỒN TẠI: $INPUT_FILE"
  echo "[Entrypoint] Hiển thị thư mục cấp cao hơn"
  ls -la $(dirname "$INPUT_FILE") || true
  echo "[Entrypoint] Kiểm tra quyền đọc"
  touch /input/test_write_permission.tmp && echo "[Entrypoint] ✅ Có quyền ghi vào thư mục input" || echo "[Entrypoint] ❌ Không có quyền ghi vào thư mục input"
fi

echo "[Entrypoint] Kiểm tra thư mục output"
ls -la /output || true
touch /output/test_write_permission.tmp && echo "[Entrypoint] ✅ Có quyền ghi vào thư mục output" || echo "[Entrypoint] ❌ Không có quyền ghi vào thư mục output"

echo "[Entrypoint] Kiểm tra kết nối đến callback URL"
CALLBACK_URL="${10}"
if [ -n "$CALLBACK_URL" ]; then
  echo "[Entrypoint] Thử kết nối đến $CALLBACK_URL"
  curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 -X GET "${CALLBACK_URL%/callback}/ping" || echo "Không thể kết nối đến callback URL"
fi

echo "[Entrypoint] Bắt đầu chạy processor.js với tham số: $@"
node /app/processor.js "$@" 