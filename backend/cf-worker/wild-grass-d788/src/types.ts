import { DateTime, Str } from "chanfana";
import { z } from "zod";

export const Task = z.object({
	name: Str({ example: "lorem" }),
	slug: Str(),
	description: Str({ required: false }),
	completed: z.boolean().default(false),
	due_date: DateTime(),
});

// Sử dụng định nghĩa từ Cloudflare Workers Types
export interface Env {
  MEDIA_BUCKET: R2Bucket;
  API_KEY?: string;
  CLOUDFLARE_DOMAIN: string;
  WORKER_DOMAIN: string;
  BACKEND_URL: string;
  WORKER_SECRET: string;
}
