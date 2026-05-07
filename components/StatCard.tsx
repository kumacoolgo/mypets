export default function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="pet-card p-5">
      <div className="text-sm font-bold text-ink/60">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}
