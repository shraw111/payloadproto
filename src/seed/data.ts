/**
 * Demo content for a Nissan Ariya landing site. Claim wording is adapted from figures Nissan UK
 * publishes for the Ariya (checked Oct 2026: nissan.co.uk Ariya, range-charging and price-specifications pages),
 * but this library is a PROTOTYPE fixture, not Nissan's approved claims. The offer and testimonials are invented.
 */
export const claims: [string, string, string][] = [
  ['C-01', 'Zero tailpipe emissions.', 'None'],
  ['C-02', 'Up to 329 miles of range (WLTP, 87kWh Advance).', 'WLTP range figures are indicative and are for comparability purposes only. Actual real-world driving results may vary.'],
  ['C-03', 'Rapid charging from 0 to 80% in as little as 35 minutes.', 'Figures quoted use a 130 kW DC fast charger. 35 minutes on the 63kWh battery, 40 minutes on the 87kWh battery. Charging time may vary.'],
  ['C-04', 'ProPILOT Assist can help to make your drive feel smooth.', 'It is your responsibility to stay alert, drive safely and be in control of the vehicle at all times.'],
  ['C-05', 'Seats five.', 'None'],
  ['C-06', '466 litres of boot space with the seats up.', 'None'],
  ['C-07', 'NissanConnect Services keep you connected.', 'To use NissanConnect Services you need a compatible smartphone, a user account and a subscription.'],
  ['C-08', 'Charges from 10 to 100% in 6 hours 30 minutes at home.', 'Based on the 63kWh battery and an 11 kW AC charger.'],
  ['C-09', 'Heat pump fitted as standard.', 'None'],
  ['C-10', 'Battery warranty of 8 years or 100,000 miles, whichever comes first.', 'Covers battery capacity loss below 9 of 12 bars on the in-vehicle gauge. Terms and conditions apply.'],
  ['C-11', 'Vehicle-to-load lets you power devices from the battery.', 'A V2L connector is required and can be purchased at an additional cost.'],
  ['C-12', 'Choice of 63kWh or 87kWh battery.', 'None'],
  ['C-13', 'Maximum DC charging power of 130 kW.', 'Requires a CCS rapid charger rated at 130 kW or above.'],
  ['C-14', 'Charge at home overnight with a home wall box.', 'Wall box installation subject to a home survey.'],
]

/** Page disclaimer = the required disclaimers of the listed claims, de-duplicated, so it can never drift from the library. */
const disc = (...ids: string[]) =>
  [...new Set(ids.flatMap((id) => {
    const d = claims.find(([c]) => c === id)?.[2] ?? 'None'
    return d === 'None' ? [] : d.split(/(?<=[.!?])\s+/)
  }))].join(' ')

export const standardTerms = 'Subject to availability. Terms apply.'

export const dealers = [
  { name: 'Northgate Nissan', slug: 'northgate', domain: 'offers.northgate-nissan.example', address: '12 High Street, Northgate', phone: '01234 567890', hours: 'Mon–Sat 9am–6pm' },
  { name: 'Riverside Nissan', slug: 'riverside', domain: 'offers.riverside-nissan.example', address: '4 Quay Road, Riverside', phone: '01234 222333', hours: 'Mon–Sat 8.30am–6pm' },
  { name: 'Hillcrest Nissan', slug: 'hillcrest', domain: 'offers.hillcrest-nissan.example', address: '88 Ridge Way, Hillcrest', phone: '01234 444555', hours: 'Mon–Sun 9am–5pm' },
]

export const brandRules = {
  maxDealerDiscount: 2000,
  standardTerms,
  tone: 'Confident, calm and clear. Speak to the reader as "you". Short sentences. Facts before adjectives.',
  readingAge: '10 to 12',
  bannedWords: ['best', 'revolutionary', 'unbeatable', 'guaranteed', 'miracle', 'cheapest'],
  rules: [
    'Never compare with other brands or vehicles, by name or in general ("further than", "faster than", "best in class").',
    'Always pair any claim with its disclaimer on the same page.',
    'Calls to action: "Book a test drive", "Explore Ariya", "Find your Ariya". No pressure language ("hurry", "last chance").',
  ],
}

const offer = (cta: string) => ({
  blockType: 'offerBanner', offerText: '£1,500 charging credit with every new Ariya',
  terms: 'Retail customers only. Autumn offer ends 31 October.', ctaLabel: cta, ctaLink: '/ariya',
})

// claimIds are claim ids like C-03; the seed script resolves them to relationship ids.
export const pages = [
  {
    title: 'Offers home', slug: 'home',
    offer: { amount: 1500, endsAt: '2026-10-31T23:59:00.000Z', models: 'Nissan Ariya' },
    metaDescription: 'The Nissan Ariya is an electric crossover with zero tailpipe emissions. £1,500 charging credit with every new Ariya.',
    disclaimer: `${disc('C-03')} ${standardTerms}`,
    layout: [
      { blockType: 'hero', headline: 'Electric, made for every day', subheadline: 'Zero tailpipe emissions.', ctaLabel: 'Explore Ariya', ctaLink: '/ariya' },
      { blockType: 'productHighlight', productName: 'Nissan Ariya', body: 'Seats five. 466 litres of boot space with the seats up.', claimIds: ['C-05', 'C-06'] },
      { blockType: 'featureGrid', heading: 'Why drivers choose Ariya', items: [
        { text: 'Rapid charging from 0 to 80% in as little as 35 minutes.' }, { text: 'Choice of 63kWh or 87kWh battery.' }, { text: 'Heat pump fitted as standard.' } ] },
      offer('View offers'),
      { blockType: 'testimonial', layout: 'card', quote: 'I charge it overnight and forget the petrol station exists.', name: 'Dana', role: 'daily commuter' },
      { blockType: 'leadForm', heading: 'Book a test drive', buttonLabel: 'Request a call back' },
      { blockType: 'cta', heading: 'Ready to go electric?', buttonLabel: 'Book a test drive', buttonLink: '/ariya' },
    ],
  },
  {
    title: 'Ariya offer', slug: 'ariya',
    offer: { amount: 1500, endsAt: '2026-10-31T23:59:00.000Z', models: 'Nissan Ariya' },
    metaDescription: 'Meet the Nissan Ariya: up to 329 miles of range (WLTP, 87kWh Advance) and £1,500 charging credit with every new Ariya.',
    disclaimer: `${disc('C-02', 'C-04', 'C-13', 'C-14', 'C-10', 'C-11')} ${standardTerms}`,
    layout: [
      { blockType: 'hero', headline: 'Room to go the distance', subheadline: 'Up to 329 miles of range (WLTP, 87kWh Advance).', ctaLabel: 'Book a test drive', ctaLink: '/ariya' },
      { blockType: 'productHighlight', productName: 'Nissan Ariya', body: 'ProPILOT Assist can help to make your drive feel smooth. Maximum DC charging power of 130 kW.', claimIds: ['C-04', 'C-13'] },
      { blockType: 'faq', heading: 'Questions', items: [
        { question: 'How do I charge at home?', answer: 'Charge at home overnight with a home wall box.' },
        { question: 'Is there a battery warranty?', answer: 'Battery warranty of 8 years or 100,000 miles, whichever comes first.' },
        { question: 'Can I power devices from the car?', answer: 'Vehicle-to-load lets you power devices from the battery.' } ] },
      offer('View offers'),
      { blockType: 'testimonial', layout: 'quote', quote: 'Easy to live with, and charging at home just works.', name: 'Marcus', role: 'architect' },
      { blockType: 'leadForm', heading: 'Book a test drive', buttonLabel: 'Request a call back' },
      { blockType: 'cta', heading: 'Find your Ariya', buttonLabel: 'Book a test drive', buttonLink: '/ariya' },
    ],
  },
  {
    title: 'Autumn campaign', slug: 'autumn',
    offer: { amount: 1500, endsAt: '2026-10-31T23:59:00.000Z', models: 'Nissan Ariya' },
    metaDescription: 'Autumn is the season to switch. Drive the Nissan Ariya with zero tailpipe emissions and get £1,500 charging credit with every new Ariya.',
    disclaimer: `${disc('C-14', 'C-08', 'C-10')} ${standardTerms}`,
    layout: [
      { blockType: 'hero', headline: 'Autumn is the season to switch', subheadline: 'Zero tailpipe emissions.', ctaLabel: 'Book a test drive', ctaLink: '/ariya' },
      offer('Claim your £1,500'),
      { blockType: 'featureGrid', heading: 'Autumn, sorted', items: [
        { text: 'Charge at home overnight with a home wall box.' }, { text: 'Charges from 10 to 100% in 6 hours 30 minutes at home.' }, { text: 'Battery warranty of 8 years or 100,000 miles, whichever comes first.' } ] },
      { blockType: 'leadForm', heading: 'Book a test drive', buttonLabel: 'Request a call back' },
      { blockType: 'cta', heading: 'Autumn test drives are open', buttonLabel: 'Book a test drive', buttonLink: '/ariya' },
    ],
  },
]
