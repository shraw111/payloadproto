/**
 * Demo content for a Nissan Ariya landing site. Every figure, claim and disclaimer here is an
 * ILLUSTRATIVE placeholder written for the prototype. None of it is official Nissan information.
 */
export const claims: [string, string, string][] = [
  ['C-01', 'Zero tailpipe emissions.', 'None'],
  ['C-02', 'Up to 300 miles of range on a full charge (WLTP).', 'Official WLTP figure. Real-world range varies.'],
  ['C-03', 'Rapid charging from 10 to 80% in about 30 minutes.', 'Based on a 130 kW charger under ideal conditions. Charging times vary.'],
  ['C-04', 'Driver assistance features are available on selected trims.', 'Driver assistance does not replace driver attention.'],
  ['C-05', 'Spacious cabin for five.', 'None'],
  ['C-06', 'Flat-floor cabin with space to spare.', 'None'],
  ['C-07', 'Over-the-air software updates.', 'Requires a connected services subscription.'],
  ['C-08', 'Regenerative braking recovers energy as you slow down.', 'None'],
  ['C-09', 'Heat pump available to warm the cabin efficiently.', 'Availability varies by trim.'],
  ['C-10', 'Battery warranty included.', 'Terms and mileage limits apply.'],
  ['C-11', 'Advanced safety features as standard.', 'Features vary by trim.'],
  ['C-12', 'Quiet, smooth electric drive.', 'None'],
  ['C-13', 'Recycled materials used in the cabin.', 'Content varies by trim.'],
  ['C-14', 'Charge at home overnight with a home wall box.', 'Wall box installation subject to a home survey.'],
  ['C-15', 'Room for the weekly shop and more.', 'None'],
]

export const brandRules = {
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
  terms: 'Retail customers only. Spring offer ends 31 May.', ctaLabel: cta, ctaLink: '/ariya',
})

// claimIds are claim ids like C-03; the seed script resolves them to relationship ids.
export const pages = [
  {
    title: 'Home', slug: 'home',
    metaDescription: 'The Nissan Ariya is an electric crossover with zero tailpipe emissions and rapid charging. £1,500 charging credit with every new Ariya.',
    disclaimer: 'Based on a 130 kW charger under ideal conditions. Charging times vary. Requires a connected services subscription.',
    layout: [
      { blockType: 'hero', headline: 'Electric, made for every day', subheadline: 'Zero tailpipe emissions.', ctaLabel: 'Explore Ariya', ctaLink: '/ariya' },
      { blockType: 'productHighlight', productName: 'Nissan Ariya', body: 'Zero tailpipe emissions. Flat-floor cabin with space to spare.', claimIds: ['C-01', 'C-06'] },
      { blockType: 'featureGrid', heading: 'Why drivers choose Ariya', items: [
        { text: 'Rapid charging from 10 to 80% in about 30 minutes.' }, { text: 'Quiet, smooth electric drive.' }, { text: 'Over-the-air software updates.' } ] },
      offer('View offers'),
      { blockType: 'testimonial', layout: 'card', quote: 'I charge it overnight and forget the petrol station exists.', name: 'Dana', role: 'daily commuter' },
      { blockType: 'cta', heading: 'Ready to go electric?', buttonLabel: 'Book a test drive', buttonLink: '/ariya' },
    ],
  },
  {
    title: 'Nissan Ariya', slug: 'ariya',
    metaDescription: 'Meet the Nissan Ariya: up to 300 miles of range on a full charge (WLTP), a flat-floor cabin and £1,500 charging credit.',
    disclaimer: 'Official WLTP figure. Real-world range varies. Driver assistance does not replace driver attention. Availability varies by trim. Wall box installation subject to a home survey. Terms and mileage limits apply.',
    layout: [
      { blockType: 'hero', headline: 'One charge. A full week of commuting.', subheadline: 'Up to 300 miles of range on a full charge (WLTP).', ctaLabel: 'Book a test drive', ctaLink: '/ariya' },
      { blockType: 'productHighlight', productName: 'Nissan Ariya', body: 'Driver assistance features are available on selected trims. Heat pump available to warm the cabin efficiently.', claimIds: ['C-04', 'C-09'] },
      { blockType: 'faq', heading: 'Questions', items: [
        { question: 'How do I charge at home?', answer: 'Charge at home overnight with a home wall box.' },
        { question: 'Is there a battery warranty?', answer: 'Battery warranty included.' },
        { question: 'How many people fit?', answer: 'Spacious cabin for five.' } ] },
      offer('View offers'),
      { blockType: 'testimonial', layout: 'quote', quote: 'Quiet, quick to charge, and easy to live with.', name: 'Marcus', role: 'architect' },
      { blockType: 'cta', heading: 'Find your Ariya', buttonLabel: 'Book a test drive', buttonLink: '/ariya' },
    ],
  },
  {
    title: 'Spring campaign', slug: 'spring',
    metaDescription: 'Spring is the season to switch. Drive the Nissan Ariya with zero tailpipe emissions and get £1,500 charging credit with every new Ariya.',
    disclaimer: 'Wall box installation subject to a home survey. Terms and mileage limits apply.',
    layout: [
      { blockType: 'hero', headline: 'Spring is the season to switch', subheadline: 'Zero tailpipe emissions.', ctaLabel: 'Book a test drive', ctaLink: '/ariya' },
      offer('Claim your £1,500'),
      { blockType: 'featureGrid', heading: 'Spring, sorted', items: [
        { text: 'Charge at home overnight with a home wall box.' }, { text: 'Regenerative braking recovers energy as you slow down.' }, { text: 'Battery warranty included.' } ] },
      { blockType: 'cta', heading: 'Spring test drives are open', buttonLabel: 'Book a test drive', buttonLink: '/ariya' },
    ],
  },
]
