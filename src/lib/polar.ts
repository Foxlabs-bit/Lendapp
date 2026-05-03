import { Polar } from '@polar-sh/sdk'

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.POLAR_ENV === 'production' ? 'production' : 'sandbox',
})

export const ORG_PRODUCT_IDS: Record<number, string> = {
  5:   process.env.POLAR_ORG_5_PRODUCT_ID!,
  10:  process.env.POLAR_ORG_10_PRODUCT_ID!,
  15:  process.env.POLAR_ORG_15_PRODUCT_ID!,
  25:  process.env.POLAR_ORG_25_PRODUCT_ID!,
  50:  process.env.POLAR_ORG_50_PRODUCT_ID!,
  100: process.env.POLAR_ORG_100_PRODUCT_ID!,
}
