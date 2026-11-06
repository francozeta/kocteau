import { jsonApiError } from "@/lib/validation/api-response";

function notFound() {
  return jsonApiError({
    status: 404,
    code: "API_ROUTE_NOT_FOUND",
    message: "The requested Kocteau API endpoint does not exist.",
    hint: "See https://kocteau.com/openapi.json for documented public read endpoints.",
  });
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
