import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export function HobbyLanding() {
  return (
    <main className="mesh-shift relative z-0 mx-auto flex max-w-5xl flex-col gap-16 px-5 pb-32 pt-14 sm:gap-24 sm:px-8 sm:pt-20 lg:pt-28">
      <header className="flex flex-col items-center text-center">
        <motion.p
          className="glass-pill mb-6 rounded-full px-4 py-1.5 text-xs font-medium tracking-[0.2em] text-white/70 uppercase sm:text-[0.7rem]"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Personal hobby lab
        </motion.p>
        <motion.h1
          className="max-w-3xl text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl lg:text-6xl"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0}
        >
          <span className="text-gradient">Quiet corners</span>
          <span className="text-white/90"> for experiments, notes, and small joys.</span>
        </motion.h1>
        <motion.p
          className="mt-6 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
        >
          A calm landing space inspired by soft glass, depth, and light — built to grow into
          projects, galleries, and tools over time.
        </motion.p>
      </header>

      <section
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Highlights"
      >
        {[
          {
            title: 'Curated projects',
            body: 'Hand-picked builds and prototypes worth revisiting, with room for richer storytelling later.',
          },
          {
            title: 'Motion & depth',
            body: 'Layered gradients and glass surfaces keep the page feeling alive without shouting.',
          },
          {
            title: 'Ready to scale',
            body: 'React and Vite make it straightforward to add routing, data, and deployment targets.',
          },
        ].map((card, i) => (
          <motion.article
            key={card.title}
            className="glass-panel rounded-3xl p-6 sm:p-7"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            custom={i + 2}
          >
            <h2 className="text-lg font-medium tracking-tight text-white">{card.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/55 sm:text-[0.95rem]">{card.body}</p>
          </motion.article>
        ))}
      </section>

      <footer className="flex flex-col items-center gap-3 text-center text-xs text-white/35 sm:text-sm">
        <p>Built with care. More soon.</p>
        <p className="max-w-md leading-relaxed">
          If the light feels a little warmer at the edges, you are in the right place.
        </p>
      </footer>
    </main>
  )
}
