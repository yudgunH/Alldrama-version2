# API Thống Kê

## Danh sách API Thống Kê

### Lấy danh sách phim có nhiều lượt xem nhất

```
GET /api/stats/movies/top
```

**Mô tả**: Lấy danh sách phim có nhiều lượt xem nhất

**Query Parameters**:

- `limit`: Số lượng phim muốn lấy (mặc định: 10)

**Response (200 - OK)**:

```json
[
  {
    "id": 1,
    "title": "Tên phim 1",
    "views": 5000,
    "posterUrl": "https://example.com/poster1.jpg"
  },
  {
    "id": 2,
    "title": "Tên phim 2",
    "views": 4500,
    "posterUrl": "https://example.com/poster2.jpg"
  }
]
```

**Lỗi**:

- 500: Lỗi khi lấy danh sách phim xem nhiều nhất

### Lấy danh sách tập phim có nhiều lượt xem nhất

```
GET /api/stats/episodes/top
```

**Mô tả**: Lấy danh sách tập phim có nhiều lượt xem nhất

**Query Parameters**:

- `limit`: Số lượng tập phim muốn lấy (mặc định: 10)

**Response (200 - OK)**:

```json
[
  {
    "id": 1,
    "episodeNumber": 10,
    "views": 3000,
    "movieId": 1,
    "movie": {
      "title": "Tên phim 1",
      "posterUrl": "https://example.com/poster1.jpg"
    }
  },
  {
    "id": 2,
    "episodeNumber": 5,
    "views": 2800,
    "movieId": 2,
    "movie": {
      "title": "Tên phim 2",
      "posterUrl": "https://example.com/poster2.jpg"
    }
  }
]
```

**Lỗi**:

- 500: Lỗi khi lấy danh sách tập phim xem nhiều nhất

### Lấy thống kê lượt xem theo phim

```
GET /api/stats/movies/:id
```

**Mô tả**: Lấy thống kê chi tiết lượt xem của một phim cụ thể

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Path Parameters**:

- `id`: ID của phim

**Response (200 - OK)**:

```json
{
  "movie": {
    "id": 1,
    "title": "Tên phim",
    "totalViews": 5000
  },
  "episodeStats": [
    {
      "id": 1,
      "episodeNumber": 1,
      "views": 1200
    },
    {
      "id": 2,
      "episodeNumber": 2,
      "views": 1000
    },
    {
      "id": 3,
      "episodeNumber": 3,
      "views": 900
    }
  ],
  "totalEpisodeViews": 3100,
  "dailyViews": [
    {
      "date": "2023-05-01T00:00:00.000Z",
      "count": "120"
    },
    {
      "date": "2023-05-02T00:00:00.000Z",
      "count": "150"
    },
    {
      "date": "2023-05-03T00:00:00.000Z",
      "count": "200"
    }
  ]
}
```

**Lỗi**:

- 401: Không được xác thực
- 404: Không tìm thấy phim
- 500: Lỗi khi lấy thống kê lượt xem phim

### Lấy thống kê lượt xem theo tập phim

```
GET /api/stats/episodes/:id
```

**Mô tả**: Lấy thống kê chi tiết lượt xem của một tập phim cụ thể

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Path Parameters**:

- `id`: ID của tập phim

**Response (200 - OK)**:

```json
{
  "episode": {
    "id": 1,
    "movieId": 1,
    "episodeNumber": 1,
    "title": "Tên phim",
    "totalViews": 1200
  },
  "dailyViews": [
    {
      "date": "2023-05-01T00:00:00.000Z",
      "count": "40"
    },
    {
      "date": "2023-05-02T00:00:00.000Z",
      "count": "50"
    },
    {
      "date": "2023-05-03T00:00:00.000Z",
      "count": "70"
    }
  ],
  "hourlyViews": [
    {
      "hour": "20",
      "count": "200"
    },
    {
      "hour": "21",
      "count": "180"
    },
    {
      "hour": "22",
      "count": "150"
    }
  ],
  "percentOfMovieViews": 24
}
```

**Lỗi**:

- 401: Không được xác thực
- 404: Không tìm thấy tập phim
- 500: Lỗi khi lấy thống kê lượt xem tập phim
