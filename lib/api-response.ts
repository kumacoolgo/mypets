import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export function unauthorized(message = "请先登录") {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export function forbidden(message = "无权限访问") {
  return NextResponse.json({ ok: false, error: message }, { status: 403 });
}

export function notFound(message = "资源不存在") {
  return NextResponse.json({ ok: false, error: message }, { status: 404 });
}

export function serverError(message = "服务器错误") {
  return NextResponse.json({ ok: false, error: message }, { status: 500 });
}
