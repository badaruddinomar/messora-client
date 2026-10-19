export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
