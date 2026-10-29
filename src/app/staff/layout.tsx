export default function StaffLayout({ children }: LayoutProps<'/staff'>) {
  return (
    <div className="min-h-screen bg-stone-100 text-zinc-900">{children}</div>
  );
}
