export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
        </div>
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
