'use client'

import { AfricaVatCalculator } from './AfricaVatCalculator'

export default function RwandaVatCalculator(props: { locale: string }) {
  return <AfricaVatCalculator {...props} defaultCountry="RW" />
}
