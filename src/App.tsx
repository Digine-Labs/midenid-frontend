
import './App.css'
import SiteHeader from './components/site-header'

function App() {

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <SiteHeader />
      <main className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <div className="w-full max-w-3xl text-center">
          <div className="space-y-2 mb-6">
            <h1 className="luckiest-guy-regular text-4xl font-bold tracking-tight">Choose your Miden name</h1>
            <p className="text-muted-foreground text-lg">
              Your profile, seamlessly connecting you to the entire Miden ecosystem.
            </p>
          </div>
          <div className="w-full relative">
            <input
              type="text"
              placeholder="e.g. Joe"
              className="w-full h-20 rounded-xl border border-input bg-background pl-6 pr-36 text-lg placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring hover:border-primary/60"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-2 pr-4">
              <span className="h-8 w-px bg-input mr-3" />
              <span className="text-base font-medium text-muted-foreground">.miden</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
