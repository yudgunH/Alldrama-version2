# Test API Endpoints và CORS

## 1. Test CORS cho convert-hls API

### Test với curl:

```bash
curl -I -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  https://media.alldrama.tech/api/convert-hls
```

**Expected Response Headers:**

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, HEAD
Access-Control-Allow-Headers: Content-Type, Authorization, Range, X-Worker-Secret
```

## 2. Test video-uploaded endpoint

### Test OPTIONS:

```bash
curl -I -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  https://alldramaz.com/api/media/episodes/1/1/video-uploaded
```

### Test POST (should return 401 without auth):

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"videoKey": "test"}' \
  https://alldramaz.com/api/media/episodes/1/1/video-uploaded
```

## 3. Test với browser console

Open browser console on `http://localhost:3000` and run:

```javascript
// Test convert-hls
fetch("https://media.alldrama.tech/api/convert-hls", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer test-token",
  },
  body: JSON.stringify({
    videoKey: "episodes/16/42/original.mp4",
    movieId: 16,
    episodeId: 42,
  }),
})
  .then((response) => {
    console.log("convert-hls Status:", response.status);
    return response.json();
  })
  .then((data) => console.log("convert-hls Response:", data))
  .catch((error) => console.error("convert-hls Error:", error));

// Test video-uploaded
fetch("https://alldramaz.com/api/media/episodes/16/42/video-uploaded", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer test-token",
  },
  body: JSON.stringify({
    videoKey: "episodes/16/42/original.mp4",
  }),
})
  .then((response) => {
    console.log("video-uploaded Status:", response.status);
    return response.json();
  })
  .then((data) => console.log("video-uploaded Response:", data))
  .catch((error) => console.error("video-uploaded Error:", error));
```

## 4. Troubleshooting

### If CORS still fails:

1. **Check browser network tab** for preflight OPTIONS request
2. **Verify response headers** include correct CORS headers
3. **Check domain spelling** - make sure using exact domains
4. **Clear browser cache** and try again

### If endpoints return 404:

1. **Backend restart** may be needed after adding new routes
2. **Check route registration** in mediaRoutes.ts
3. **Verify URL path** is exactly matching

### If authentication fails:

1. Use a **valid JWT token** instead of 'test-token'
2. Check token format: `Bearer {actual-jwt-token}`
3. Verify user has admin permissions
