import { motion } from 'framer-motion'

export function HobbyLanding() {
  return (
    <main className="relative z-0 flex min-h-dvh flex-col items-center justify-center px-6 pb-28 text-center">
      <motion.h1
        className="text-3xl font-medium tracking-tight text-blue-50/95 sm:text-4xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        Hi, I&apos;m Jordan.
      </motion.h1>
      <motion.p
        className="mt-4 text-base text-blue-200/45 sm:text-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
        did you expect anything else?
      </motion.p>
    </main>
  )
}
