import { Link } from 'react-router-dom'
import {
  BookOpen,
  Users,
  MessageSquare,
  Star,
  Shield,
  Search,
  ArrowRight,
  CheckCircle2,
  Zap,
  Globe,
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Users,
    color: 'bg-blue-100 text-primary dark:bg-blue-900/30 dark:text-blue-300',
    title: 'Subject Communities',
    description:
      'Join communities for your exact courses — Calculus, Organic Chemistry, Data Structures, and more. Find your people.',
  },
  {
    icon: MessageSquare,
    color: 'bg-emerald-100 text-secondary dark:bg-emerald-900/30 dark:text-emerald-300',
    title: 'Threaded Discussions',
    description:
      'Ask questions, get threaded answers, and nest replies. Every conversation stays organised and easy to follow.',
  },
  {
    icon: Star,
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    title: 'Reputation System',
    description:
      'Earn reputation points when your answers get upvoted. Build credibility and stand out when applying for internships.',
  },
  {
    icon: Search,
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    title: 'Instant Search',
    description:
      'Search posts inside any community before posting. Chances are someone already asked — and got answered.',
  },
  {
    icon: Shield,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
    title: 'Community Moderation',
    description:
      'Community owners keep things tidy. Report anything that doesn\'t belong and it\'ll be reviewed promptly.',
  },
  {
    icon: Zap,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
    title: 'Fast & Focused',
    description:
      'No algorithm, no ads, no noise. Just students helping students — the way study groups were always meant to work.',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Create your account',
    description: 'Sign up with your email or Google in under 30 seconds. No credit card, no course fees.',
  },
  {
    number: '02',
    title: 'Join your communities',
    description: 'Browse communities by subject or course. Join as many as you need — or start one yourself.',
  },
  {
    number: '03',
    title: 'Ask, answer, grow',
    description: 'Post questions, reply to classmates, upvote the best answers, and watch your reputation climb.',
  },
]

const STATS = [
  { value: '10k+', label: 'Students' },
  { value: '500+', label: 'Communities' },
  { value: '50k+', label: 'Questions answered' },
  { value: '4.9★', label: 'Average rating' },
]

const TESTIMONIALS = [
  {
    quote: 'Scholr completely changed how I study for exams. I went from failing Organic Chem to a B+ last semester.',
    name: 'Priya S.',
    role: '3rd year Biology major',
    emoji: '🦉',
  },
  {
    quote: 'The threading makes it so easy to follow complex problem discussions. Way better than Discord or Reddit.',
    name: 'Marcus T.',
    role: 'Computer Science sophomore',
    emoji: '⚛️',
  },
  {
    quote: 'I love that my reputation score actually means something. It helped me land a TA position.',
    name: 'Jess W.',
    role: 'Math & Stats senior',
    emoji: '⭐',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function GradientBlob({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute rounded-full blur-3xl opacity-20 dark:opacity-10 pointer-events-none ${className}`}
    />
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-3xl sm:text-4xl font-extrabold text-primary dark:text-dark-primary tabular-nums">
        {value}
      </span>
      <span className="text-sm text-text-secondary dark:text-gray-400 font-medium">{label}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="overflow-x-hidden">

      {/* ════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[88vh] flex items-center justify-center px-4 sm:px-6 py-20">
        {/* Background decorations */}
        <GradientBlob className="w-[600px] h-[600px] bg-primary -top-32 -left-48" />
        <GradientBlob className="w-[400px] h-[400px] bg-secondary top-1/2 -right-32" />
        <GradientBlob className="w-[300px] h-[300px] bg-accent bottom-0 left-1/4" />

        {/* Subtle grid overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(rgba(31,58,138,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(31,58,138,0.03)_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(rgba(59,130,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.04)_1px,transparent_1px)]"
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 mb-6">
            <Globe className="w-3.5 h-3.5 text-primary dark:text-dark-primary" />
            <span className="text-xs font-semibold text-primary dark:text-dark-primary uppercase tracking-wide">
              Student-powered knowledge
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-text-primary dark:text-dark-text leading-tight mb-6">
            Study smarter with your{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary dark:text-dark-primary">whole campus</span>
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/30 dark:bg-accent/20 rounded -z-0"
              />
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-text-secondary dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Scholr is where students ask questions, share answers, and help each other
            master every subject — one upvote at a time.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              state={{ tab: 'signup' }}
              className="btn btn-primary btn-lg w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow"
            >
              Get started free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="btn btn-secondary btn-lg w-full sm:w-auto"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-4 text-xs text-text-secondary dark:text-gray-500">
            Free forever · No credit card · No ads
          </p>

          {/* Hero mockup card */}
          <div className="mt-14 max-w-2xl mx-auto">
            <div className="card shadow-card-hover overflow-hidden border border-border dark:border-gray-700 rounded-2xl">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-border dark:border-gray-700">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <span className="flex-1 mx-3 bg-white dark:bg-gray-700 rounded text-xs text-text-secondary dark:text-gray-400 px-3 py-1 text-left border border-border dark:border-gray-600">
                  scholr.app/c/organic-chemistry
                </span>
              </div>

              {/* Mock feed */}
              <div className="p-4 space-y-3 text-left">
                {[
                  { q: 'Why does SN2 reaction invert stereochemistry?', rep: 23, replies: 8, time: '12m ago' },
                  { q: 'Best way to memorise amino acid structures?', rep: 47, replies: 14, time: '1h ago' },
                  { q: 'Confused about resonance in benzene ring', rep: 11, replies: 5, time: '3h ago' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-border dark:border-gray-700">
                    <div className="w-7 h-7 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0 text-sm">
                      📚
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary dark:text-dark-text line-clamp-1">{item.q}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary dark:text-gray-400">
                        <span>⬆ {item.rep}</span>
                        <span>💬 {item.replies}</span>
                        <span>{item.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════════════════════════════ */}
      <section className="bg-primary dark:bg-dark-card border-y border-primary/80 dark:border-gray-700 py-10 px-4">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-white dark:text-dark-primary tabular-nums">
                {s.value}
              </span>
              <span className="text-sm text-blue-200 dark:text-gray-400 font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-20 px-4 sm:px-6 scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge-primary mb-3">Features</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary dark:text-dark-text mt-2">
              Everything a study group needs
            </h2>
            <p className="mt-3 text-text-secondary dark:text-gray-400 max-w-xl mx-auto">
              Built for real academic workflows — not social media.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="card-hover p-5 flex flex-col gap-3 group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.color} transition-transform duration-200 group-hover:scale-110`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-text-primary dark:text-dark-text">{f.title}</h3>
                <p className="text-sm text-text-secondary dark:text-gray-400 leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="py-20 px-4 sm:px-6 bg-primary/5 dark:bg-dark-card/60 scroll-mt-16"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge-success mb-3">How it works</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary dark:text-dark-text mt-2">
              Up and running in 3 steps
            </h2>
          </div>

          <div className="relative">
            {/* Connector line (desktop) */}
            <div
              aria-hidden="true"
              className="hidden sm:block absolute top-10 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-0.5 bg-gradient-to-r from-primary/30 via-secondary/50 to-primary/30"
            />

            <div className="grid sm:grid-cols-3 gap-8">
              {STEPS.map((step, i) => (
                <div key={step.number} className="flex flex-col items-center text-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                      <span className="text-3xl font-black text-white/20 select-none absolute">
                        {step.number}
                      </span>
                      <span className="text-2xl relative z-10">
                        {['🎓', '🏘️', '🚀'][i]}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-text-primary dark:text-dark-text text-lg">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-secondary dark:text-gray-400 leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge-warning mb-3">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary dark:text-dark-text mt-2">
              Students love Scholr
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card-hover p-5 flex flex-col gap-4">
                {/* Stars */}
                <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-text-primary dark:text-dark-text leading-relaxed flex-1">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-border dark:border-gray-700">
                  <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-lg shrink-0">
                    {t.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary dark:text-dark-text">{t.name}</p>
                    <p className="text-xs text-text-secondary dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
        <GradientBlob className="w-[500px] h-[500px] bg-primary -top-32 -right-48" />
        <GradientBlob className="w-[300px] h-[300px] bg-secondary -bottom-16 -left-24" />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="card p-8 sm:p-12 shadow-card-hover border border-border dark:border-gray-700">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary dark:text-dark-text mb-4">
              Ready to ace your courses?
            </h2>
            <p className="text-text-secondary dark:text-gray-400 mb-8 leading-relaxed">
              Join thousands of students already using Scholr to study smarter,
              get unstuck faster, and build their academic reputation.
            </p>

            {/* Feature checklist */}
            <ul className="flex flex-col gap-2 mb-8 text-left max-w-xs mx-auto">
              {[
                'Free forever — no hidden fees',
                'Join unlimited communities',
                'Google sign-in supported',
                'No algorithm, no ads',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-text-primary dark:text-dark-text">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/login"
                state={{ tab: 'signup' }}
                className="btn btn-primary btn-lg shadow-md hover:shadow-lg transition-shadow"
              >
                Create free account
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign in instead
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border dark:border-gray-700 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-text-primary dark:text-dark-text">Scholr</span>
          </div>
          <p className="text-sm text-text-secondary dark:text-gray-400 text-center">
            Built for students, by students. Study smarter together.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-text-secondary dark:text-gray-400 hover:text-primary no-underline transition-colors">
              Sign in
            </Link>
            <Link
              to="/login"
              state={{ tab: 'signup' }}
              className="text-sm text-text-secondary dark:text-gray-400 hover:text-primary no-underline transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
