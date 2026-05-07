import Link from "next/link";

const items = [
  ["/admin", "概览"],
  ["/admin/settings", "系统设置"],
  ["/admin/ai-settings", "AI 设置"],
  ["/admin/users", "用户"],
  ["/admin/pets", "宠物"]
];

export default function AdminNav() {
  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {items.map(([href, label]) => (
        <Link key={href} className="btn-soft" href={href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
