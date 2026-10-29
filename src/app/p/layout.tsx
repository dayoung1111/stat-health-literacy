export default function PatientLayout({ children }: LayoutProps<'/p'>) {
  return (
    <div className="min-h-screen bg-stat-paper px-4 text-stat-ink">
      <main className="mx-auto w-full max-w-md py-6">{children}</main>
    </div>
  );
}
