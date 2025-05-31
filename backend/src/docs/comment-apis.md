# API Bình Luận - Hướng Dẫn Sử Dụng

Tài liệu này mô tả các API mới được thêm vào hệ thống để quản lý bình luận hiệu quả hơn.

## 🎯 Tính Năng Mới

### 1. Lấy Tất Cả Bình Luận (Admin)

- ✅ Phân trang và sắp xếp linh hoạt
- ✅ Filter theo phim, người dùng, ngày tháng
- ✅ Tìm kiếm trong nội dung và tên người dùng
- ✅ Chỉ admin mới có quyền truy cập

### 2. Bình Luận Mới Nhất

- ✅ Lấy bình luận mới nhất trên toàn hệ thống
- ✅ Có thể điều chỉnh số lượng
- ✅ Bao gồm thông tin phim và người dùng

### 3. Bình Luận Theo Người Dùng

- ✅ Xem bình luận của một người dùng cụ thể
- ✅ Xem bình luận của chính mình
- ✅ Phân trang và sắp xếp

### 4. Thống Kê Bình Luận

- ✅ Tổng số bình luận
- ✅ Bình luận theo thời gian (hôm nay, tuần này, tháng này)
- ✅ Top phim có nhiều bình luận nhất

## 📚 API Endpoints

### 1. Lấy Tất Cả Bình Luận (Admin Only)

```http
GET /api/comments/all
Authorization: Bearer {adminToken}
```

**Query Parameters**:

- `page` (number): Số trang (mặc định: 1)
- `limit` (number): Số lượng mỗi trang (mặc định: 10)
- `sort` (string): Trường sắp xếp (createdAt, updatedAt, userName, comment)
- `order` (ASC|DESC): Thứ tự sắp xếp (mặc định: DESC)
- `movieId` (number): Lọc theo ID phim
- `userId` (number): Lọc theo ID người dùng
- `search` (string): Tìm kiếm trong nội dung và tên người dùng
- `dateFrom` (date): Lọc từ ngày (format: YYYY-MM-DD)
- `dateTo` (date): Lọc đến ngày (format: YYYY-MM-DD)

**Response**:

```json
{
  "comments": [
    {
      "id": 1,
      "movieId": 123,
      "userId": 456,
      "userName": "user123",
      "comment": "Phim hay quá!",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "user": {
        "id": 456,
        "full_name": "Nguyễn Văn A",
        "email": "user@example.com"
      },
      "movie": {
        "id": 123,
        "title": "Tên Phim",
        "posterUrl": "https://cdn.example.com/poster.jpg"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "totalPages": 15,
    "currentPage": 1,
    "limit": 10
  }
}
```

**Ví dụ sử dụng**:

```javascript
// Lấy tất cả bình luận với filter
const getAllComments = async () => {
  const response = await fetch(
    "/api/comments/all?page=1&limit=20&search=hay&dateFrom=2024-01-01",
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );

  const data = await response.json();
  console.log(`Tìm thấy ${data.pagination.total} bình luận`);
};

// Lọc bình luận theo phim
const getMovieComments = async (movieId) => {
  const response = await fetch(`/api/comments/all?movieId=${movieId}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  return response.json();
};
```

### 2. Lấy Bình Luận Mới Nhất

```http
GET /api/comments/latest?limit=20
```

**Query Parameters**:

- `limit` (number): Số lượng bình luận muốn lấy (mặc định: 20)

**Response**:

```json
[
  {
    "id": 1,
    "movieId": 123,
    "userId": 456,
    "userName": "user123",
    "comment": "Bình luận mới nhất",
    "createdAt": "2024-01-15T12:00:00Z",
    "user": {
      "id": 456,
      "full_name": "Nguyễn Văn A"
    },
    "movie": {
      "id": 123,
      "title": "Tên Phim",
      "posterUrl": "https://cdn.example.com/poster.jpg"
    }
  }
]
```

**Ví dụ sử dụng**:

```javascript
// Lấy 10 bình luận mới nhất để hiển thị ở trang chủ
const getLatestComments = async () => {
  const response = await fetch("/api/comments/latest?limit=10");
  const comments = await response.json();

  // Hiển thị trong UI
  comments.forEach((comment) => {
    console.log(`${comment.userName}: ${comment.comment}`);
  });
};
```

### 3. Lấy Bình Luận Của Chính Mình

```http
GET /api/comments/my
Authorization: Bearer {token}
```

**Query Parameters**: Giống như API phân trang cơ bản

**Response**:

```json
{
  "comments": [...],
  "pagination": {...}
}
```

**Ví dụ sử dụng**:

```javascript
// Xem bình luận của chính mình
const getMyComments = async () => {
  const response = await fetch("/api/comments/my?page=1&limit=10", {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  const data = await response.json();
  console.log(`Bạn có ${data.pagination.total} bình luận`);
};
```

### 4. Lấy Bình Luận Theo Người Dùng

```http
GET /api/comments/user/:userId
```

**Params**:

- `userId` (number): ID của người dùng

**Query Parameters**: Giống như API phân trang cơ bản

**Ví dụ sử dụng**:

```javascript
// Xem bình luận của người dùng khác
const getUserComments = async (userId) => {
  const response = await fetch(`/api/comments/user/${userId}?page=1&limit=10`);
  const data = await response.json();

  return data;
};
```

### 5. Thống Kê Bình Luận (Admin Only)

```http
GET /api/comments/stats
Authorization: Bearer {adminToken}
```

**Response**:

```json
{
  "totalComments": 1250,
  "commentsToday": 45,
  "commentsThisWeek": 320,
  "commentsThisMonth": 890,
  "topCommentedMovies": [
    {
      "movieId": 123,
      "movieTitle": "Phim Hot Nhất",
      "commentCount": 156
    },
    {
      "movieId": 456,
      "movieTitle": "Phim Thứ 2",
      "commentCount": 134
    }
  ]
}
```

**Ví dụ sử dụng**:

```javascript
// Hiển thị dashboard thống kê cho admin
const getCommentsStats = async () => {
  const response = await fetch("/api/comments/stats", {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  const stats = await response.json();

  console.log(`Tổng bình luận: ${stats.totalComments}`);
  console.log(`Hôm nay: ${stats.commentsToday}`);
  console.log(`Tuần này: ${stats.commentsThisWeek}`);
  console.log(`Tháng này: ${stats.commentsThisMonth}`);

  // Hiển thị top movies
  stats.topCommentedMovies.forEach((movie, index) => {
    console.log(
      `${index + 1}. ${movie.movieTitle}: ${movie.commentCount} bình luận`
    );
  });
};
```

## 🔧 Sử Dụng Trong React

### Component Hiển Thị Bình Luận Mới Nhất

```jsx
import React, { useState, useEffect } from "react";

const LatestComments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestComments = async () => {
      try {
        const response = await fetch("/api/comments/latest?limit=5");
        const data = await response.json();
        setComments(data);
      } catch (error) {
        console.error("Lỗi khi lấy bình luận mới nhất:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestComments();
  }, []);

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="latest-comments">
      <h3>Bình Luận Mới Nhất</h3>
      {comments.map((comment) => (
        <div key={comment.id} className="comment-item">
          <div className="comment-header">
            <strong>{comment.userName}</strong>
            <span className="comment-movie">trên {comment.movie.title}</span>
            <time>{new Date(comment.createdAt).toLocaleString()}</time>
          </div>
          <p className="comment-content">{comment.comment}</p>
        </div>
      ))}
    </div>
  );
};

export default LatestComments;
```

### Component Quản Lý Bình Luận (Admin)

```jsx
import React, { useState, useEffect } from "react";

const AdminComments = () => {
  const [comments, setComments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    movieId: "",
    userId: "",
    dateFrom: "",
    dateTo: "",
  });

  const fetchComments = async () => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    try {
      const response = await fetch(`/api/comments/all?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      const data = await response.json();
      setComments(data.comments);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bình luận:", error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : value, // Reset về trang 1 khi thay đổi filter khác
    }));
  };

  return (
    <div className="admin-comments">
      <h2>Quản Lý Bình Luận</h2>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
        />

        <input
          type="number"
          placeholder="Movie ID"
          value={filters.movieId}
          onChange={(e) => handleFilterChange("movieId", e.target.value)}
        />

        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
        />

        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => handleFilterChange("dateTo", e.target.value)}
        />
      </div>

      {/* Comments List */}
      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment.id} className="comment-item">
            <div className="comment-info">
              <strong>{comment.user.full_name}</strong>
              <span>trên phim: {comment.movie.title}</span>
              <time>{new Date(comment.createdAt).toLocaleString()}</time>
            </div>
            <p>{comment.comment}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <span>
          Trang {pagination.currentPage} / {pagination.totalPages}
          (Tổng: {pagination.total} bình luận)
        </span>

        <button
          disabled={pagination.currentPage <= 1}
          onClick={() => handleFilterChange("page", pagination.currentPage - 1)}
        >
          Trước
        </button>

        <button
          disabled={pagination.currentPage >= pagination.totalPages}
          onClick={() => handleFilterChange("page", pagination.currentPage + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  );
};

export default AdminComments;
```

## 🚀 Performance Tips

### 1. Caching

```javascript
// Cache bình luận mới nhất trong 5 phút
const cacheKey = "latest-comments";
const cachedData = localStorage.getItem(cacheKey);
const cacheTime = localStorage.getItem(`${cacheKey}-time`);

if (
  cachedData &&
  cacheTime &&
  Date.now() - parseInt(cacheTime) < 5 * 60 * 1000
) {
  // Sử dụng data từ cache
  return JSON.parse(cachedData);
} else {
  // Fetch mới và lưu cache
  const data = await fetchLatestComments();
  localStorage.setItem(cacheKey, JSON.stringify(data));
  localStorage.setItem(`${cacheKey}-time`, Date.now().toString());
  return data;
}
```

### 2. Debounce cho Search

```javascript
import { debounce } from "lodash";

const debouncedSearch = debounce((searchTerm) => {
  handleFilterChange("search", searchTerm);
}, 500);

// Trong component
<input
  onChange={(e) => debouncedSearch(e.target.value)}
  placeholder="Tìm kiếm..."
/>;
```

## 🔒 Bảo Mật

- API `/all` và `/stats` chỉ dành cho admin
- API `/my` yêu cầu authentication
- API `/user/:userId` và `/latest` có thể truy cập public
- Tất cả đều có rate limiting

## 📊 Use Cases

1. **Trang chủ**: Hiển thị bình luận mới nhất
2. **Admin dashboard**: Quản lý và thống kê bình luận
3. **Profile người dùng**: Xem lịch sử bình luận
4. **Trang phim**: Hiển thị bình luận của phim đó
5. **Moderation**: Admin lọc và kiểm duyệt bình luận

Các API này giúp quản lý bình luận hiệu quả và cung cấp trải nghiệm người dùng tốt hơn!
