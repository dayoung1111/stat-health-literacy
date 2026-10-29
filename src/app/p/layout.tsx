export default function PatientLayout({ children }: LayoutProps<'/p'>) {
  return (
    <div className="min-h-screen bg-white px-4 text-zinc-900">
      <main className="mx-auto w-full max-w-md py-6">{children}</main>
    </div>
  );
}
