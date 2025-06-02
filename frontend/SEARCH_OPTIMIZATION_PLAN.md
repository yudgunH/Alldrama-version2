# Tối Ưu Hóa Hệ Thống Search Cho 2000 Người Dùng Đồng Thời

## 🔍 Phân Tích Hiện Trạng

### ✅ Điểm Mạnh Hiện Tại:
- Redis cache ở backend (5 phút TTL)
- Frontend memory cache với SWR
- Pagination hỗ trợ
- Basic debouncing

### ❌ Vấn Đề Cần Giải Quyết:
- Database performance chưa tối ưu
- Cache strategy chưa hiệu quả
- Thiếu request deduplication
- Chưa có rate limiting
- Không có monitoring

## 🚀 Giải Pháp Tối Ưu Hóa

### 1. Database Performance

#### a) Thêm Indexes cho Search
```sql
-- Full-text search index
CREATE INDEX idx_movies_search ON movies USING gin(to_tsvector('english', title || ' ' || summary));

-- Individual field indexes
CREATE INDEX idx_movies_title_gin ON movies USING gin(title gin_trgm_ops);
CREATE INDEX idx_movies_release_year ON movies(releaseYear);
CREATE INDEX idx_movies_views_desc ON movies(views DESC);
CREATE INDEX idx_movies_rating_desc ON movies(rating DESC);
CREATE INDEX idx_movies_created_at_desc ON movies(createdAt DESC);

-- Composite indexes for common queries
CREATE INDEX idx_movies_genre_year ON movies_genres(genreId, movieId) 
  INCLUDE (movieId) WHERE genreId IS NOT NULL;
```

#### b) Optimize Search Query
```typescript
// Backend: Sử dụng full-text search thay vì ILIKE
const searchMovies = async (params) => {
  const whereConditions: any = {};
  
  if (params.q) {
    // Sử dụng full-text search cho performance tốt hơn
    whereConditions[Op.and] = literal(
      `to_tsvector('english', title || ' ' || summary) @@ plainto_tsquery('english', '${params.q}')`
    );
  }
  
  // Sử dụng CTE cho complex queries
  const query = `
    WITH search_results AS (
      SELECT m.*, ts_rank(to_tsvector('english', m.title || ' ' || m.summary), 
                         plainto_tsquery('english', $1)) as rank
      FROM movies m
      WHERE ($1 = '' OR to_tsvector('english', m.title || ' ' || m.summary) @@ plainto_tsquery('english', $1))
        AND ($2::int IS NULL OR m.releaseYear = $2)
      ORDER BY rank DESC, ${sortField} ${sortOrder}
      LIMIT $3 OFFSET $4
    )
    SELECT sr.*, array_agg(g.name) as genre_names
    FROM search_results sr
    LEFT JOIN movies_genres mg ON sr.id = mg.movieId
    LEFT JOIN genres g ON mg.genreId = g.id
    GROUP BY sr.id, sr.title, sr.summary, sr.rating, sr.views, sr.releaseYear, sr.rank
    ORDER BY sr.rank DESC, sr.${sortField} ${sortOrder};
  `;
  
  return sequelize.query(query, {
    bind: [params.q || '', params.year, params.limit, offset],
    type: QueryTypes.SELECT
  });
};
```

### 2. Advanced Caching Strategy

#### a) Multi-Level Caching
```typescript
// 1. Browser Cache (1 giờ)
// 2. Frontend Memory Cache (30 phút)
// 3. Redis Cache (1 giờ)
// 4. Database

class SearchCacheManager {
  private static readonly CACHE_LEVELS = {
    BROWSER: 60 * 60 * 1000,     // 1 hour
    MEMORY: 30 * 60 * 1000,      // 30 minutes  
    REDIS: 60 * 60 * 1000,       // 1 hour
  };

  // Intelligent cache invalidation
  async invalidateSearch(pattern: string) {
    await Promise.all([
      this.invalidateRedis(`search:${pattern}*`),
      this.invalidateMemory(pattern),
    ]);
  }

  // Cache warming for popular searches
  async warmCache() {
    const popularSearches = [
      { q: '', sort: 'views', order: 'DESC' },
      { q: '', sort: 'rating', order: 'DESC' },
      { genre: 'Action' },
      { genre: 'Drama' },
      { year: new Date().getFullYear() }
    ];

    await Promise.allSettled(
      popularSearches.map(params => this.performSearch(params))
    );
  }
}
```

#### b) Smart Cache Keys
```typescript
// Tối ưu cache key để tăng hit rate
const generateCacheKey = (params: SearchParams) => {
  // Normalize để tăng cache hit
  const normalized = {
    q: params.q?.toLowerCase().trim() || '',
    genre: params.genre || '',
    year: params.year || '',
    sort: params.sort || 'createdAt',
    order: params.order || 'DESC',
    page: params.page || 1
  };

  // Group similar searches
  const pageGroup = Math.ceil(normalized.page / 5); // Cache theo group 5 trang
  
  return `search:v3:${hash(normalized)}:pg${pageGroup}`;
};
```

### 3. Request Optimization

#### a) Request Deduplication (ĐÃ IMPLEMENT)
```typescript
// Đã implement trong useSearchLogic.ts
const pendingRequests = new Map<string, Promise<any>>();
```

#### b) Request Cancellation (ĐÃ IMPLEMENT)
```typescript
// Đã implement AbortController trong useSearchLogic.ts
```

#### c) Batch Requests
```typescript
class SearchBatchManager {
  private batch: SearchRequest[] = [];
  private timeout: NodeJS.Timeout | null = null;

  addRequest(request: SearchRequest) {
    this.batch.push(request);
    
    if (!this.timeout) {
      this.timeout = setTimeout(() => this.processBatch(), 50);
    }
  }

  private async processBatch() {
    const batch = [...this.batch];
    this.batch = [];
    this.timeout = null;

    // Group similar requests
    const groups = this.groupSimilarRequests(batch);
    
    await Promise.allSettled(
      groups.map(group => this.processGroup(group))
    );
  }
}
```

### 4. Backend Performance

#### a) Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  message: 'Quá nhiều yêu cầu tìm kiếm, vui lòng thử lại sau',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to search endpoints
app.use('/api/movies/search', searchRateLimit);
```

#### b) Connection Pooling
```typescript
// Sequelize connection optimization
const sequelize = new Sequelize(database, username, password, {
  host: host,
  dialect: 'postgres',
  pool: {
    max: 20,        // Tăng pool size
    min: 5,
    acquire: 30000,
    idle: 10000
  },
  logging: false,
  benchmark: true, // Enable query timing
});
```

#### c) Read Replicas
```typescript
// Sử dụng read replicas cho search
const searchSequelize = new Sequelize(readOnlyDbUrl, {
  // Read-only connection for search queries
  pool: { max: 15, min: 3 }
});

const masterSequelize = new Sequelize(masterDbUrl, {
  // Write operations
  pool: { max: 5, min: 1 }
});
```

### 5. Monitoring & Analytics

#### a) Performance Monitoring
```typescript
class SearchMonitor {
  static trackSearch(params: SearchParams, responseTime: number, resultCount: number) {
    // Log slow queries
    if (responseTime > 1000) {
      logger.warn('Slow search query', {
        params,
        responseTime,
        resultCount,
        timestamp: new Date()
      });
    }

    // Track popular searches
    this.updateSearchStats(params);
  }

  static async getSearchAnalytics() {
    return {
      slowQueries: await this.getSlowQueries(),
      popularSearches: await this.getPopularSearches(),
      cacheHitRate: await this.getCacheHitRate(),
      avgResponseTime: await this.getAvgResponseTime()
    };
  }
}
```

#### b) Load Testing
```bash
# Artillery load test
artillery run search-load-test.yml

# search-load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 50  # 50 users per second
scenarios:
  - name: "Search movies"
    requests:
      - get:
          url: "/api/movies/search?q={{ $randomString() }}"
```

### 6. CDN & Edge Caching

#### a) CDN Configuration
```nginx
# Nginx configuration for search API
location /api/movies/search {
    proxy_cache search_cache;
    proxy_cache_valid 200 10m;
    proxy_cache_key "$request_uri";
    proxy_pass http://backend;
    
    # Add cache headers
    add_header X-Cache-Status $upstream_cache_status;
}
```

#### b) Edge Caching with Vercel/Cloudflare
```typescript
// Next.js API route caching
export async function GET(request: Request) {
  const response = await searchMovies(params);
  
  return new Response(JSON.stringify(response), {
    headers: {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
      'Content-Type': 'application/json',
    },
  });
}
```

### 7. Frontend Optimizations (ĐÃ IMPLEMENT)

#### a) Debouncing (✅ Done)
#### b) Request Cancellation (✅ Done) 
#### c) Smart Caching (✅ Done)
#### d) Request Deduplication (✅ Done)

### 8. Auto-complete & Suggestions

```typescript
// Implement search suggestions để giảm tải
class SearchSuggestions {
  private trie = new Trie();
  
  async loadSuggestions() {
    // Load từ cache hoặc database
    const popularTerms = await this.getPopularSearchTerms();
    popularTerms.forEach(term => this.trie.insert(term));
  }

  getSuggestions(query: string, limit = 5): string[] {
    return this.trie.search(query).slice(0, limit);
  }
}
```

## 📊 Kết Quả Mong Đợi

### Performance Metrics:
- **Search Response Time**: < 500ms (hiện tại: ~1000ms)
- **Cache Hit Rate**: > 80% (hiện tại: ~50%)
- **Concurrent Users**: 2000+ (mục tiêu)
- **Database Load**: Giảm 70%

### Scalability:
- Hỗ trợ horizontal scaling
- Auto-scaling dựa trên load
- Circuit breaker cho fault tolerance

## 🔄 Implementation Timeline

### Phase 1 (Week 1): Frontend Optimization ✅
- [x] Debouncing & request optimization
- [x] Advanced caching strategy
- [x] Request deduplication

### Phase 2 (Week 2): Database Optimization
- [ ] Add database indexes
- [ ] Optimize search queries
- [ ] Setup read replicas

### Phase 3 (Week 3): Backend Enhancement
- [ ] Rate limiting
- [ ] Connection pooling
- [ ] Redis cluster setup

### Phase 4 (Week 4): Monitoring & Testing
- [ ] Performance monitoring
- [ ] Load testing
- [ ] CDN setup

## 🚨 Cảnh Báo & Lưu Ý

1. **Database Migration**: Cần schedule downtime cho việc thêm indexes
2. **Memory Usage**: Frontend cache có thể tăng memory usage
3. **Rate Limiting**: Cần fine-tune để không ảnh hưởng UX
4. **Monitoring**: Setup alerts cho các metrics quan trọng

## 🎯 Kết Luận

Với các optimizations đã implement ở frontend và kế hoạch tối ưu hóa toàn diện này, hệ thống search của bạn sẽ có thể xử lý 2000+ người dùng đồng thời một cách mượt mà và hiệu quả.

**Priority cao nhất**: Database indexes và Redis optimization sẽ mang lại impact lớn nhất. 