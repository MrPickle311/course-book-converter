import { useState } from 'react';
import { Button } from './ui/button';
import { AuthForm } from './AuthForm';

export function Landing() {
  const [showAuth, setShowAuth] = useState(false);

  if (showAuth) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/15" />
            <span className="font-semibold">PDF Course Generator</span>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowAuth(true)}>Get started free</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4">
        <section className="py-20 md:py-24 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="max-w-xl mx-auto md:mx-0 text-center md:text-left space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              The fastest way to learn from your technical PDFs
            </h1>
            <p className="text-muted-foreground text-lg">
              Upload a book, pick a chapter, and study bite‑size notes with quick practice tasks. No setup. Works in minutes.
            </p>
            <div className="flex items-center md:justify-start justify-center gap-3">
              <Button size="lg" onClick={() => setShowAuth(true)}>Try for free</Button>
              <a href="#examples" className="text-sm text-primary underline underline-offset-4">See examples</a>
            </div>
            <p className="text-xs text-muted-foreground">No credit card required • Demo account available</p>

            <div className="mt-4 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-3 bg-muted/40 px-3 py-2 rounded-md">
                <span className="opacity-80">Trusted by learners from</span>
                <div className="flex items-center gap-3 opacity-70">
                  <span>Open Source</span>
                  <span>Startups</span>
                  <span>Universities</span>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden md:block" id="example">
            <div className="rounded-xl border border-border bg-muted/30 p-6">
              <div className="aspect-video rounded-lg bg-gradient-to-br from-muted to-background relative overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-3 gap-2 p-4 opacity-70">
                  <div className="rounded-md bg-white/40" />
                  <div className="rounded-md bg-white/30" />
                  <div className="rounded-md bg-white/20" />
                  <div className="rounded-md bg-white/20" />
                  <div className="rounded-md bg-white/40" />
                  <div className="rounded-md bg-white/30" />
                  <div className="rounded-md bg-white/30" />
                  <div className="rounded-md bg-white/20" />
                  <div className="rounded-md bg-white/40" />
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
                  <div className="inline-flex items-center gap-2 bg-black/5 rounded-md px-2 py-1">
                    <span className="font-medium">Demo preview</span>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-black/5 rounded-md px-2 py-1">
                    <span>Upload → TOC → Notes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-6 pb-12 md:pt-8 md:pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 text-center max-w-4xl mx-auto">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto font-semibold">1</div>
              <h3 className="font-semibold">Upload</h3>
              <p className="text-sm text-muted-foreground">Add your technical book in PDF format</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto font-semibold">2</div>
              <h3 className="font-semibold">Choose</h3>
              <p className="text-sm text-muted-foreground">Pick a chapter from the table of contents</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto font-semibold">3</div>
              <h3 className="font-semibold">Learn</h3>
              <p className="text-sm text-muted-foreground">Study short notes and quick tasks</p>
            </div>
          </div>
        </section>

        {/* What you can achieve */
        }
        <section className="pb-24 md:pb-280">
          <div className="max-w-4xl mx-auto text-center mb-8 md:mb-10">
            <h2 className="text-2xl font-semibold">What you can achieve</h2>
            <p className="text-sm text-muted-foreground">Summaries, guided lessons, and practice tasks generated from your PDFs.</p>
          </div>
          <div className="max-w-4xl mx-auto grid gap-6 md:gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-border p-4 bg-card/50">
              <h4 className="text-sm font-medium">Finish complex books faster</h4>
              <p className="mt-1 text-sm text-muted-foreground">Turn long chapters into concise notes and quick practice.</p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-card/50">
              <h4 className="text-sm font-medium">Understand and retain more</h4>
              <p className="mt-1 text-sm text-muted-foreground">Guided lessons and tasks reinforce key ideas as you read.</p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-card/50">
              <h4 className="text-sm font-medium">Streamline team onboarding</h4>
              <p className="mt-1 text-sm text-muted-foreground">Create consistent learning paths from your team’s PDFs.</p>
            </div>
          </div>
        </section>

        {/* Divider between achievements and examples */}
        <div className="max-w-5xl mx-auto border-t border-border/70 mb-24 md:mb-28" aria-hidden="true" />

        {/* Example tiles */}
        <section id="examples" className="mt-0 pt-10 md:pt-14 pb-32">
          <div className="max-w-5xl mx-auto mt-10 md:mt-14 grid gap-12 md:gap-16 md:grid-cols-2">
            {/* Course page example */}
            <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
              <div className="p-5 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Course page</h3>
                  <p className="text-sm text-muted-foreground">A clean page with chapter outline, notes, and tasks.</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary">Demo</span>
              </div>
              <div className="aspect-video bg-gradient-to-br from-muted to-background grid grid-cols-3 gap-2 p-4">
                <div className="rounded-md bg-white/40" />
                <div className="rounded-md bg-white/30" />
                <div className="rounded-md bg-white/20" />
                <div className="rounded-md bg-white/20" />
                <div className="rounded-md bg-white/40" />
                <div className="rounded-md bg-white/30" />
              </div>
            </div>

            {/* Chapter notes example */}
            <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
              <div className="p-5 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Chapter notes</h3>
                  <p className="text-sm text-muted-foreground">Bite‑size summaries with key ideas and examples.</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-600">New</span>
              </div>
              <div className="aspect-video bg-gradient-to-br from-muted to-background grid grid-rows-3 gap-2 p-4">
                <div className="rounded-md bg-white/40" />
                <div className="rounded-md bg-white/30" />
                <div className="rounded-md bg-white/20" />
              </div>
            </div>

            {/* Practice tasks example */}
            <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
              <div className="p-5 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Practice tasks</h3>
                  <p className="text-sm text-muted-foreground">Multiple choice, short answers, file uploads, and more.</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-600">Interactive</span>
              </div>
              <div className="aspect-video bg-gradient-to-br from-muted to-background grid grid-cols-4 gap-2 p-4">
                <div className="rounded-md bg-white/40 col-span-3" />
                <div className="rounded-md bg-white/20" />
                <div className="rounded-md bg-white/20" />
                <div className="rounded-md bg-white/30 col-span-2" />
                <div className="rounded-md bg-white/40" />
              </div>
            </div>

            {/* My library example */}
            <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
              <div className="p-5 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">My library</h3>
                  <p className="text-sm text-muted-foreground">All your uploaded books and generated courses in one place.</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-sky-500/10 text-sky-600">Library</span>
              </div>
              <div className="aspect-video bg-gradient-to-br from-muted to-background grid grid-cols-3 gap-2 p-4">
                <div className="rounded-md bg-white/40" />
                <div className="rounded-md bg-white/30" />
                <div className="rounded-md bg-white/20" />
                <div className="rounded-md bg-white/30" />
                <div className="rounded-md bg-white/20" />
                <div className="rounded-md bg-white/40" />
              </div>
            </div>

            {/* Progress tracker example */}
            <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
              <div className="p-5 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Progress tracker</h3>
                  <p className="text-sm text-muted-foreground">See completed chapters and time saved.</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-purple-500/10 text-purple-600">Stats</span>
              </div>
              <div className="aspect-video bg-gradient-to-br from-muted to-background grid grid-cols-6 gap-2 p-4">
                <div className="rounded-md bg-white/40 col-span-3" />
                <div className="rounded-md bg-white/20 col-span-3" />
                <div className="rounded-md bg-white/30 col-span-2" />
                <div className="rounded-md bg-white/20 col-span-4" />
              </div>
            </div>

            {/* Upload & TOC example */}
            <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
              <div className="p-5 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Upload & TOC</h3>
                  <p className="text-sm text-muted-foreground">Drag a PDF, get an instant table of contents.</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-black/10 text-foreground">Flow</span>
              </div>
              <div className="aspect-video bg-gradient-to-br from-muted to-background grid grid-cols-3 gap-2 p-4">
                <div className="rounded-md bg-white/40" />
                <div className="rounded-md bg-white/30" />
                <div className="rounded-md bg-white/20" />
                <div className="rounded-md bg-white/20" />
                <div className="rounded-md bg-white/30" />
                <div className="rounded-md bg-white/40" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}



