export type SecretDestination = {
  /** Shown in the status pill, e.g. "Bringing you to …" */
  label: string
  /** If set, browser navigates here after the unlock animation. */
  href?: string
}

/** Four-letter codes → destination metadata. */
export const SECRET_DESTINATIONS: Record<string, SecretDestination> = {
  test: { label: 'The Workshop' },
  poco: { label: 'Poco', href: 'https://thisguyse19.github.com/poco' },
}

export const CODE_LENGTH = 4
