#!/bin/bash

echo "=== ALLDRAMA QUEUE SYSTEM TEST ==="
echo "Testing queue system before production deployment..."

# 1. Check environment variables
echo "1. Checking environment variables..."
required_vars=("NODE_ENV" "PUBLIC_DOMAIN" "REDIS_HOST" "R2_ACCOUNT_ID" "CLOUDFLARE_WORKER_DOMAIN")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing environment variable: $var"
        exit 1
    else
        echo "✅ $var is set"
    fi
done

# 2. Check Redis connectivity
echo "2. Checking Redis connectivity..."
if docker exec -it redis redis-cli -a "$REDIS_PASSWORD" ping | grep -q "PONG"; then
    echo "✅ Redis is responsive"
else
    echo "❌ Redis connection failed"
    exit 1
fi

# 3. Check Docker socket
echo "3. Checking Docker socket permissions..."
if docker ps > /dev/null 2>&1; then
    echo "✅ Docker socket accessible"
else
    echo "❌ Docker socket not accessible"
    exit 1
fi

# 4. Check HLS processor image
echo "4. Checking HLS processor image..."
if docker image inspect alldrama-hls-processor > /dev/null 2>&1; then
    echo "✅ HLS processor image exists"
else
    echo "⚠️  Building HLS processor image..."
    cd hls-processor && docker build -t alldrama-hls-processor .
    if [ $? -eq 0 ]; then
        echo "✅ HLS processor image built successfully"
    else
        echo "❌ Failed to build HLS processor image"
        exit 1
    fi
fi

# 5. Test queue endpoints
echo "5. Testing queue API endpoints..."
APP_URL="http://localhost:${PORT:-5000}"

# Test queue status
if curl -s -f "$APP_URL/api/queue/status" > /dev/null; then
    echo "✅ Queue status endpoint responsive"
else
    echo "❌ Queue status endpoint failed"
    exit 1
fi

# 6. Test volume operations
echo "6. Testing Docker volume operations..."
TEST_VOLUME="test-hls-volume-$(date +%s)"
if docker volume create "$TEST_VOLUME" > /dev/null; then
    echo "✅ Can create Docker volumes"
    docker volume rm "$TEST_VOLUME" > /dev/null
    echo "✅ Can remove Docker volumes"
else
    echo "❌ Docker volume operations failed"
    exit 1
fi

# 7. Check disk space
echo "7. Checking disk space..."
AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
MIN_SPACE=10485760  # 10GB in KB
if [ "$AVAILABLE_SPACE" -gt "$MIN_SPACE" ]; then
    echo "✅ Sufficient disk space available"
else
    echo "⚠️  Low disk space: $(($AVAILABLE_SPACE/1024/1024))GB available"
fi

# 8. Check memory usage
echo "8. Checking memory usage..."
AVAILABLE_MEMORY=$(free -m | awk 'NR==2{printf "%.1f", $7/1024}')
if (( $(echo "$AVAILABLE_MEMORY > 2.0" | bc -l) )); then
    echo "✅ Sufficient memory available: ${AVAILABLE_MEMORY}GB"
else
    echo "⚠️  Low memory: ${AVAILABLE_MEMORY}GB available"
fi

echo ""
echo "=== TEST RESULTS ==="
echo "✅ Queue system is ready for production deployment!"
echo ""
echo "Next steps:"
echo "1. Set PUBLIC_DOMAIN environment variable to your production domain"
echo "2. Update CLOUDFLARE_WORKER_DOMAIN to your CDN domain"
echo "3. Set NODE_ENV=production"
echo "4. Deploy with: docker-compose up -d"
echo "5. Monitor queue dashboard at: https://yourdomain.com/api/queue/dashboard"
echo ""
echo "Happy deployment! 🚀" 