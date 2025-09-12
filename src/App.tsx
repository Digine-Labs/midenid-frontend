
import './App.css'
import { Button } from '@/components/ui/button'
import SiteHeader from './components/site-header'

function App() {

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Miden ID</h1>
        <p className="text-muted-foreground">Miden Identity service</p>
        <div className="flex items-center justify-center gap-4">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
        </div>
        <p className="text-xs text-muted-foreground">Digine Labs 2025</p>
      </main>
    </div>
  )
}

export default App
