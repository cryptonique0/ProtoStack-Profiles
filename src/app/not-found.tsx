export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Profile Not Found</h2>
      <p className="text-muted-foreground mb-8">
        The profile you're looking for doesn't exist or has been removed.
      </p>
      <a
        href="/"
        className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Go Home
      </a>
    </div>
  );
}
