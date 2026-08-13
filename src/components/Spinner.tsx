export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-accent-2 ${className}`}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
