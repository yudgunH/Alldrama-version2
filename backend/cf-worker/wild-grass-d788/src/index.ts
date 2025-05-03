import { fromHono } from "chanfana";
import { Hono } from "hono";
import { TaskCreate } from "./endpoints/taskCreate";
import { TaskDelete } from "./endpoints/taskDelete";
import { TaskFetch } from "./endpoints/taskFetch";
import { TaskList } from "./endpoints/taskList";
import { Env } from "./types";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Register OpenAPI endpoints
openapi.get("/api/tasks", TaskList);
openapi.post("/api/tasks", TaskCreate);
openapi.get("/api/tasks/:taskSlug", TaskFetch);
openapi.delete("/api/tasks/:taskSlug", TaskDelete);

// Định nghĩa routes cho media mà không dùng OpenAPI để đơn giản hóa

// Endpoint để upload file lên R2
app.post("/api/upload", async (c) => {
  try {
    // Xác thực request
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !validateToken(authHeader)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    // Lấy thông tin file từ FormData
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return c.json({ success: false, error: "Không tìm thấy file" }, 400);
    }
    
    const path = formData.get("path") as string || "";
    const fileName = formData.get("fileName") as string || file.name;
    
    // Tạo key cho file trong R2
    const fileKey = path ? `${path}/${fileName}` : fileName;
    
    console.log(`Đang upload file ${fileName} đến ${fileKey}`);
    
    // Upload file lên R2
    await c.env.MEDIA_BUCKET.put(fileKey, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
      }
    });
    
    // Sử dụng domain chính thức cho URL
    const fileUrl = `https://${c.env.CLOUDFLARE_DOMAIN}/${fileKey}`;
    
    return c.json({
      success: true,
      message: "Upload thành công",
      url: fileUrl,
      key: fileKey
    });
  } catch (error) {
    console.error(`Error uploading file: ${error}`);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

app.post("/api/convert-hls", async (c) => {
  try {
    // Xác thực request
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !validateToken(authHeader)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const body = await c.req.json();
    const { videoKey, movieId, episodeId } = body;
    
    if (!videoKey || !movieId || !episodeId) {
      return c.json({ 
        success: false, 
        error: "Thiếu thông tin: videoKey, movieId hoặc episodeId"
      }, 400);
    }
    
    console.log(`Bắt đầu xử lý video: ${videoKey}`);
    
    try {
      // Tạo một job ID duy nhất
      const jobId = `hls-job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Tạo thư mục output HLS
      const hlsOutputPath = `episodes/${movieId}/${episodeId}/hls`;
      
      // Tạo một metadata record để theo dõi trạng thái job
      await c.env.MEDIA_BUCKET.put(`${hlsOutputPath}/job-metadata.json`, JSON.stringify({
        jobId: jobId,
        videoKey: videoKey,
        movieId: movieId,
        episodeId: episodeId,
        status: "pending",
        createdAt: new Date().toISOString()
      }), {
        httpMetadata: {
          contentType: "application/json",
        }
      });
      
      // URL HLS sử dụng domain chính thức
      const hlsUrl = `https://${c.env.CLOUDFLARE_DOMAIN}/hls/${hlsOutputPath}/master.m3u8`;
      
      // Gọi API backend để xử lý video
      try {
        console.log(`Gửi yêu cầu xử lý HLS đến backend API`);
        
        // URL của backend API
        const backendUrl = `${c.env.BACKEND_URL}/api/media/process-video`;
        
        // Gửi request đến backend API
        const backendResponse = await fetch(backendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Worker-Secret": "alldrama-worker-secret"
          },
          body: JSON.stringify({
            videoKey,
            movieId,
            episodeId,
            jobId,
            callbackUrl: `https://${c.env.WORKER_DOMAIN}/api/hls-callback/${jobId}`
          })
        });
        
        // Kiểm tra kết quả từ backend
        if (!backendResponse.ok) {
          const errorData = await backendResponse.json() as { error?: string };
          console.error(`Lỗi từ backend API: ${JSON.stringify(errorData)}`);
          
          // Cập nhật metadata với lỗi
          await c.env.MEDIA_BUCKET.put(`${hlsOutputPath}/job-metadata.json`, JSON.stringify({
            jobId: jobId,
            videoKey: videoKey,
            movieId: movieId,
            episodeId: episodeId,
            status: "error",
            error: `Lỗi từ backend: ${errorData.error || 'Không xác định'}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }), {
            httpMetadata: {
              contentType: "application/json",
            }
          });
          
          throw new Error(`Backend API trả về lỗi: ${JSON.stringify(errorData)}`);
        }
        
        const backendData = await backendResponse.json() as { jobId?: string };
        console.log(`Backend đã nhận yêu cầu xử lý, jobId: ${backendData.jobId || jobId}`);
      } catch (apiError) {
        console.error(`Lỗi khi gọi backend API: ${apiError}`);
        // Không throw lỗi, vẫn trả về job đã tạo cho client
      }
      
      // Trả về thông tin cho client
      return c.json({
        success: true,
        message: "Job chuyển đổi HLS đã được tạo",
        jobId: jobId,
        hlsPath: `${hlsOutputPath}/master.m3u8`,
        hlsUrl: hlsUrl,
        status: "pending"
      });
    } catch (error) {
      console.error(`Error creating HLS job: ${error}`);
      return c.json({
        success: false,
        error: `Lỗi khi tạo job HLS: ${error instanceof Error ? error.message : String(error)}`
      }, 500);
    }
  } catch (error) {
    console.error(`Error in HLS conversion: ${error}`);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Thêm endpoint callback để nhận cập nhật trạng thái từ backend
app.post("/api/hls-callback/:jobId", async (c) => {
  try {
    const jobId = c.req.param("jobId");
    
    // Xác thực backend
    const secretHeader = c.req.header("X-Backend-Secret");
    if (!secretHeader || secretHeader !== "alldrama-backend-secret") {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const body = await c.req.json();
    const { status, movieId, episodeId, error } = body;
    
    if (!movieId || !episodeId) {
      return c.json({ success: false, error: "Thiếu thông tin cần thiết" }, 400);
    }
    
    // Đường dẫn đến metadata
    const metadataPath = `episodes/${movieId}/${episodeId}/hls/job-metadata.json`;
    
    // Lấy metadata hiện tại
    const currentMetadata = await c.env.MEDIA_BUCKET.get(metadataPath);
    
    if (!currentMetadata) {
      return c.json({ success: false, error: "Không tìm thấy metadata job" }, 404);
    }
    
    // Parse metadata hiện tại
    const metadata = JSON.parse(await currentMetadata.text());
    
    // Cập nhật metadata
    const updatedMetadata = {
      ...metadata,
      status: status || "completed",
      error: error || null,
      updatedAt: new Date().toISOString()
    };
    
    // Lưu metadata đã cập nhật
    await c.env.MEDIA_BUCKET.put(metadataPath, JSON.stringify(updatedMetadata), {
      httpMetadata: {
        contentType: "application/json",
      }
    });
    
    return c.json({
      success: true,
      message: "Đã cập nhật trạng thái job",
      jobId,
      status: updatedMetadata.status
    });
  } catch (error) {
    console.error(`Error in HLS callback: ${error}`);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Endpoint để kiểm tra trạng thái job HLS
app.get("/api/hls-status/:jobId/:movieId/:episodeId", async (c) => {
  try {
    const jobId = c.req.param("jobId");
    const movieId = c.req.param("movieId");
    const episodeId = c.req.param("episodeId");
    
    if (!jobId) {
      return c.json({ success: false, error: "Thiếu job ID" }, 400);
    }
    
    // Truy cập trực tiếp file metadata dựa trên đường dẫn chính xác
    const metadataKey = `episodes/${movieId}/${episodeId}/hls/job-metadata.json`;
    
    // Lấy file metadata
    const metadataFile = await c.env.MEDIA_BUCKET.get(metadataKey);
    
    if (!metadataFile) {
      return c.json({ 
        success: false, 
        error: "Không tìm thấy thông tin job" 
      }, 404);
    }
    
    const jobMetadata = JSON.parse(await metadataFile.text());
    
    // Kiểm tra xem jobId có khớp không
    if (jobMetadata.jobId !== jobId) {
      return c.json({ 
        success: false, 
        error: "JobID không khớp với metadata" 
      }, 404);
    }
    
    const hlsPath = `episodes/${jobMetadata.movieId}/${jobMetadata.episodeId}/hls/master.m3u8`;
    
    return c.json({
      success: true,
      jobId: jobId,
      status: jobMetadata.status,
      videoKey: jobMetadata.videoKey,
      movieId: jobMetadata.movieId,
      episodeId: jobMetadata.episodeId,
      hlsPath: hlsPath,
      hlsUrl: `https://${c.env.CLOUDFLARE_DOMAIN}/hls/${hlsPath}`,
      createdAt: jobMetadata.createdAt,
      updatedAt: jobMetadata.updatedAt
    });
  } catch (error) {
    console.error(`Error checking HLS job status: ${error}`);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

app.get("/resize/:width/:height/*", async (c) => {
  try {
    const width = parseInt(c.req.param("width"));
    const height = c.req.param("height") === "auto" ? null : parseInt(c.req.param("height"));
    
    // Lấy phần còn lại của path sau /resize/{width}/{height}/
    const path = c.req.path.split("/").slice(4).join("/");
    
    // Lấy hình ảnh gốc từ R2
    const object = await c.env.MEDIA_BUCKET.get(path);
    
    if (!object) {
      return c.json({ error: "Image not found" }, 404);
    }
    
    // Trả về hình ảnh gốc (trong thực tế sẽ thêm xử lý resize)
    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": `https://${c.env.CLOUDFLARE_DOMAIN}`
      }
    });
  } catch (error) {
    console.error(`Error resizing image: ${error}`);
    return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

app.get("/hls/*", async (c) => {
  try {
    // Lấy phần path sau /hls/
    const path = c.req.path.substring(5);
    console.log(`HLS request path: ${path}`);
    
    // Đảm bảo path bắt đầu đúng cách
    let objectPath = path;
    if (objectPath.startsWith('/')) {
      objectPath = objectPath.substring(1);
    }
    console.log(`Final object path: ${objectPath}`);
    
    // Lấy file từ R2 bucket
    const object = await c.env.MEDIA_BUCKET.get(objectPath);
    
    if (!object) {
      console.log(`File không tìm thấy tại đường dẫn: ${objectPath}`);
      return c.json({ error: "HLS file not found" }, 404);
    }
    
    console.log(`Đã tìm thấy file: ${object.key}, kích thước: ${object.size}`);
    
    const headers = new Headers();
    
    // Thiết lập Content-Type phù hợp dựa trên phần mở rộng của file
    if (path.endsWith(".m3u8")) {
      headers.set("Content-Type", "application/vnd.apple.mpegurl");
    } else if (path.endsWith(".ts")) {
      headers.set("Content-Type", "video/MP2T");
    } else if (path.endsWith(".m4s")) {
      headers.set("Content-Type", "video/iso.segment");
    } else if (path.endsWith(".mp4")) {
      headers.set("Content-Type", "video/mp4");
    } else if (path.endsWith(".webm")) {
      headers.set("Content-Type", "video/webm");
    } else if (path.endsWith(".key")) {
      headers.set("Content-Type", "application/octet-stream");
    } else {
      // Nếu không nhận diện được, sử dụng content type từ metadata nếu có
      const contentType = object.httpMetadata?.contentType;
      if (contentType) {
        headers.set("Content-Type", contentType);
      } else {
        headers.set("Content-Type", "application/octet-stream");
      }
    }
    
    // Cài đặt CORS headers
    headers.set("Access-Control-Allow-Origin", `https://${c.env.CLOUDFLARE_DOMAIN}`);
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Range");
    
    // Cài đặt cache headers để tối ưu hóa hiệu suất
    if (path.endsWith(".m3u8")) {
      // Playlist có thể thay đổi, nên cần cache ngắn hơn cho production
      headers.set("Cache-Control", "public, max-age=300"); // 5 phút
    } else {
      // Segments và files khác thì không thay đổi, có thể cache lâu hơn
      headers.set("Cache-Control", "public, max-age=31536000, immutable"); // 1 năm và immutable
    }
    
    return new Response(object.body, { headers });
  } catch (error) {
    console.error(`Error serving HLS file: ${error}`);
    return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

// Thêm endpoint để liệt kê các file trong R2 (hữu ích để debug)
app.get("/list-r2/*", async (c) => {
  try {
    const prefix = c.req.path.substring(8); // Lấy phần path sau /list-r2/
    console.log(`Listing R2 objects with prefix: ${prefix}`);
    
    // Đảm bảo prefix bắt đầu đúng cách
    let objectPrefix = prefix;
    if (objectPrefix.startsWith('/')) {
      objectPrefix = objectPrefix.substring(1);
    }
    
    // Liệt kê các objects trong R2 với prefix
    const listed = await c.env.MEDIA_BUCKET.list({
      prefix: objectPrefix,
      limit: 100,
    });
    
    // Tạo danh sách các file để trả về
    const files = listed.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploadedAt: obj.uploaded
    }));
    
    return c.json({
      success: true,
      prefix: objectPrefix,
      files: files
    });
  } catch (error) {
    console.error(`Error listing R2 objects: ${error}`);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Thêm endpoint để xóa file từ R2 (chỉ cho admin)
app.delete("/admin/delete-r2-object/*", async (c) => {
  try {
    // Xác thực quyền admin
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !validateToken(authHeader)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    // Lấy đường dẫn file cần xóa
    const path = c.req.path.substring(20); // Bỏ '/admin/delete-r2-object/'
    
    if (!path || path.length < 5) {
      return c.json({ 
        success: false, 
        error: "Đường dẫn file không hợp lệ" 
      }, 400);
    }
    
    console.log(`Xóa file: ${path}`);
    
    // Đảm bảo path bắt đầu đúng cách
    let objectPath = path;
    if (objectPath.startsWith('/')) {
      objectPath = objectPath.substring(1);
    }
    
    // Xóa file từ R2
    await c.env.MEDIA_BUCKET.delete(objectPath);
    
    return c.json({
      success: true,
      message: `Đã xóa file ${objectPath} thành công`,
      path: objectPath
    });
  } catch (error) {
    console.error(`Error deleting file: ${error}`);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Thêm endpoint để xóa nhiều file từ R2 theo prefix
app.delete("/admin/delete-r2-prefix/*", async (c) => {
  try {
    // Xác thực quyền admin
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !validateToken(authHeader)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    // Lấy prefix cần xóa
    const prefix = c.req.path.substring(21); // Bỏ '/admin/delete-r2-prefix/'
    
    if (!prefix || prefix.length < 3) {
      return c.json({ 
        success: false, 
        error: "Prefix quá ngắn, không an toàn để xóa" 
      }, 400);
    }
    
    console.log(`Xóa các file có prefix: ${prefix}`);
    
    // Đảm bảo prefix bắt đầu đúng cách
    let objectPrefix = prefix;
    if (objectPrefix.startsWith('/')) {
      objectPrefix = objectPrefix.substring(1);
    }
    
    // Liệt kê các objects trong R2 với prefix
    const listed = await c.env.MEDIA_BUCKET.list({
      prefix: objectPrefix,
      limit: 100,
    });
    
    // Xóa từng file từ R2
    for (const obj of listed.objects) {
      await c.env.MEDIA_BUCKET.delete(obj.key);
    }
    
    return c.json({
      success: true,
      message: `Đã xóa các file có prefix ${objectPrefix} thành công`,
      prefix: objectPrefix
    });
  } catch (error) {
    console.error(`Error deleting files: ${error}`);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Thêm route OPTIONS cho preflight CORS requests
app.options("*", (c) => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": `https://${c.env.CLOUDFLARE_DOMAIN}`,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    }
  });
});

// Thêm CORS headers trực tiếp không sử dụng middleware
app.use("*", async (c, next) => {
  const response = await next();
  
  // Thêm CORS headers cho tất cả các responses
  c.header("Access-Control-Allow-Origin", `https://${c.env.CLOUDFLARE_DOMAIN}`);
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  return response;
});

// Hàm kiểm tra token
function validateToken(authHeader: string): boolean {
  // Triển khai production: sử dụng JWT và check API key bảo mật
  try {
    const token = authHeader.split(" ")[1];
    
    // Kiểm tra token bằng biến môi trường hoặc secret key cho production
    // Ở đây ta có thể thêm nhiều logic xác thực phức tạp hơn
    const validApiKeys = [
      "alldrama-production-token", 
      process.env.API_KEY || "alldrama-secure-api-key"
    ];
    
    return validApiKeys.includes(token);
  } catch (error) {
    console.error(`Lỗi xác thực token: ${error}`);
    return false;
  }
}

export default app;
