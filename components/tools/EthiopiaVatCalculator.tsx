'use client'

import { AfricaVatCalculator } from './AfricaVatCalculator'

export default function EthiopiaVatCalculator(props: { locale: string }) {
  return <AfricaVatCalculator {...props} defaultCountry="ET" />
}
