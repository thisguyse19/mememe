export type ApplePayTitheResult = 'paid' | 'cancelled' | 'unavailable'

export type ApplePayTitheDetails = {
  amount: number
  label?: string
}

function buildDetails(amount: number, label: string): PaymentDetailsInit {
  const value = amount.toFixed(2)
  return {
    total: {
      label: 'Church of the Empty Set',
      amount: { currency: 'USD', value },
    },
    displayItems: [
      { label, amount: { currency: 'USD', value } },
      { label: 'Void processing fee', amount: { currency: 'USD', value: '0.00' } },
      { label: 'Gary surcharge', amount: { currency: 'USD', value: '0.00' } },
    ],
  }
}

function applePayMethodData(): PaymentMethodData {
  return {
    supportedMethods: 'https://apple.com/apari',
    data: {
      version: 3,
      merchantIdentifier: 'merchant.com.mememe.void',
      merchantCapabilities: ['supports3DS'],
      supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
      countryCode: 'US',
    },
  }
}

async function attemptPayment(methods: PaymentMethodData[], details: PaymentDetailsInit): Promise<ApplePayTitheResult | 'next'> {
  try {
    const request = new PaymentRequest(methods, details)
    const canPay = await request.canMakePayment()
    if (!canPay) return 'next'

    const response = await request.show()
    await response.complete('success')
    return 'paid'
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
    return 'next'
  }
}

/** Try native Apple Pay / Payment Request. Returns unavailable if wallet sheet cannot open. */
export async function tryApplePayTithe({ amount, label = 'Cult tithe' }: ApplePayTitheDetails): Promise<ApplePayTitheResult> {
  if (typeof window === 'undefined' || typeof PaymentRequest === 'undefined') {
    return 'unavailable'
  }

  const details = buildDetails(amount, label)

  // 1) Apple Pay wallet (Safari / iOS)
  const apple = await attemptPayment([applePayMethodData()], details)
  if (apple !== 'next') return apple

  // 2) Generic wallet / card sheet (may still offer Apple Pay on some browsers)
  const wallet = await attemptPayment([{ supportedMethods: 'basic-card' }], details)
  if (wallet !== 'next') return wallet

  return 'unavailable'
}

export function canUseApplePay(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof PaymentRequest === 'undefined') return false
  const w = window as Window & { ApplePaySession?: { canMakePayments?: () => boolean } }
  return Boolean(w.ApplePaySession?.canMakePayments?.())
}
