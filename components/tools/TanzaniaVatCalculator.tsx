'use client'

import { AfricaVatCalculator } from './AfricaVatCalculator'

export default function TanzaniaVatCalculator(props: { locale: string }) {
  return <AfricaVatCalculator {...props} defaultCountry="TZ" />
}
