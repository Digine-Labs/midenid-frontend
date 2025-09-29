export default function About() {
  return (
    <main className="flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ minHeight: 'calc(100vh - 56px)' }}>
      <div className="w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl text-center">
        <div className="space-y-2 mb-6">
          <h1 className="luckiest-guy-regular text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            About Miden.ID
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            Decentralized identity on the Miden ecosystem.
          </p>
        </div>
        <div className="bg-card text-card-foreground p-4 sm:p-6 rounded-xl space-y-4 text-left">
          <p className="text-sm sm:text-base">
            Miden.ID is a decentralized identity system built on the Miden blockchain ecosystem.
            Create your unique .miden identity and connect seamlessly across the entire Miden network.
          </p>
          <p className="text-sm sm:text-base">
            Your Miden identity serves as your universal profile, enabling secure and private
            interactions throughout the decentralized web.
          </p>
        </div>
        <div className="min-h-[120px]">
          {/* Spacer to prevent layout shift */}
        </div>
      </div>
    </main>
  )
}