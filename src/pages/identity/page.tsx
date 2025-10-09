export default function Identity() {
  return (
    <main className="flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ minHeight: 'calc(100vh - 56px)' }}>
      <div className="w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl text-center">
        <div className="space-y-2 mb-6">
          <h1 className="luckiest-guy-regular text-2xl sm:text-3xl md:text-4xl font-bold md:tracking-tight">
            Your Miden Identity
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            Manage your Miden identity and connected services.
          </p>
        </div>
        <div className="bg-card text-card-foreground p-4 sm:p-6 rounded-xl border bg-gray-50">
          <p className="text-muted-foreground text-sm sm:text-base">
            Profile management coming soon...
          </p>
        </div>
        <div className="min-h-[120px]">
          {/* Spacer to prevent layout shift */}
        </div>
      </div>
    </main>
  )
}