export const claims: [string, string, string][] = [
  ['C-01', '24-hour relief from hay fever symptoms.', 'Always read the label.'],
  ['C-02', 'Starts relieving symptoms within 1 hour.', 'Individual results may vary. Always read the label.'],
  ['C-03', 'Non-drowsy formula.', 'Most people in clinical studies did not feel drowsy. Always read the label.'],
  ['C-04', 'Relieves sneezing, runny nose and itchy, watery eyes.', 'Always read the label.'],
  ['C-05', 'One tablet a day for adults and children 12 and over.', 'Always read the label.'],
  ['C-06', 'Also relieves year-round allergies to dust and pet dander.', 'Always read the label.'],
  ['C-07', 'Small, easy-to-swallow tablets.', 'None'],
  ['C-08', 'Lactose-free and gluten-free.', 'None'],
  ['C-09', 'Can be taken with or without food.', 'Always read the label.'],
  ['C-10', 'Developed with allergy specialists.', 'None'],
  ['C-11', 'Trusted by over 1 million customers.', 'Based on units sold.'],
  ['C-12', 'Recommended by pharmacists.', 'Based on a survey of 500 pharmacists.'],
  ['C-13', 'Recyclable outer packaging.', 'None'],
  ['C-14', 'Relief that lasts through a full day outdoors.', 'Always read the label.'],
  ['C-15', 'Gentle enough to take every day of the season.', 'Always read the label. Do not exceed the stated dose.'],
]

export const brandRules = {
  tone: 'Calm, plain and reassuring. Speak to the reader as "you". Short sentences.',
  readingAge: '9 to 11',
  bannedWords: ['cure', 'miracle', 'guaranteed', 'instant', 'best', 'revolutionary'],
  rules: [
    'Never compare with other brands or products, by name or in general ("faster than", "better than").',
    'Always pair any claim with its disclaimer on the same page.',
    'Calls to action: "Shop Allergy 24", "Find your relief", "Shop now". No pressure language ("hurry", "last chance").',
  ],
}

const offer = (cta: string) => ({
  blockType: 'offerBanner', offerText: '15% off your first order',
  terms: 'New customers only. Spring offer ends 31 May.', ctaLabel: cta, ctaLink: '/allergy-24',
})

// claimIds are claim ids like C-03; the seed script resolves them to relationship ids.
export const pages = [
  {
    title: 'Home', slug: 'home',
    metaDescription: 'Halden Allergy 24 gives 24-hour relief from hay fever symptoms with one non-drowsy tablet a day. 15% off your first order.',
    disclaimer: 'Always read the label. Individual results may vary. Most people in clinical studies did not feel drowsy.',
    layout: [
      { blockType: 'hero', headline: 'Allergy relief that fits your day', subheadline: '24-hour relief from hay fever symptoms.', ctaLabel: 'Shop Allergy 24', ctaLink: '/allergy-24' },
      { blockType: 'productHighlight', productName: 'Halden Allergy 24', body: 'Non-drowsy formula. One tablet a day for adults and children 12 and over.', claimIds: ['C-03', 'C-05'] },
      { blockType: 'featureGrid', heading: 'Why people choose Halden', items: [
        { text: 'Starts relieving symptoms within 1 hour.' }, { text: 'Non-drowsy formula.' }, { text: 'Small, easy-to-swallow tablets.' } ] },
      offer('Shop now'),
      { blockType: 'testimonial', layout: 'card', quote: 'I take one in the morning and forget about my hay fever.', name: 'Priya', role: 'primary school teacher' },
      { blockType: 'cta', heading: 'Ready for a calmer spring?', buttonLabel: 'Find your relief', buttonLink: '/allergy-24' },
    ],
  },
  {
    title: 'Halden Allergy 24', slug: 'allergy-24',
    metaDescription: 'Non-drowsy Halden Allergy 24 relieves sneezing, runny nose and itchy eyes for 24 hours. 15% off your first order.',
    disclaimer: 'Always read the label. Most people in clinical studies did not feel drowsy.',
    layout: [
      { blockType: 'hero', headline: 'One tablet. A full day outdoors.', subheadline: 'Relief that lasts through a full day outdoors.', ctaLabel: 'Shop Allergy 24', ctaLink: '/allergy-24' },
      { blockType: 'productHighlight', productName: 'Halden Allergy 24', body: 'Relieves sneezing, runny nose and itchy, watery eyes. Can be taken with or without food.', claimIds: ['C-04', 'C-09'] },
      { blockType: 'faq', heading: 'Questions', items: [
        { question: 'Will it make me drowsy?', answer: 'It has a non-drowsy formula.' },
        { question: 'Who can take it?', answer: 'Adults and children 12 and over, one tablet a day.' },
        { question: 'Is it gluten-free?', answer: 'Yes, lactose-free and gluten-free.' } ] },
      offer('Shop now'),
      { blockType: 'testimonial', layout: 'quote', quote: 'Small tablets, no fuss, and I can garden all afternoon.', name: 'Tom', role: 'retired engineer' },
      { blockType: 'cta', heading: 'Find your relief', buttonLabel: 'Shop Allergy 24', buttonLink: '/allergy-24' },
    ],
  },
  {
    title: 'Spring campaign', slug: 'spring',
    metaDescription: 'Get ahead of pollen season with Halden Allergy 24: 24-hour relief, non-drowsy. New customers get 15% off their first order.',
    disclaimer: 'Always read the label. Do not exceed the stated dose. Based on a survey of 500 pharmacists.',
    layout: [
      { blockType: 'hero', headline: 'Get ahead of pollen season', subheadline: '24-hour relief from hay fever symptoms.', ctaLabel: 'Shop now', ctaLink: '/allergy-24' },
      offer('Claim your 15%'),
      { blockType: 'featureGrid', heading: 'Spring, sorted', items: [
        { text: 'Relief that lasts through a full day outdoors.' }, { text: 'Gentle enough to take every day of the season.' }, { text: 'Recommended by pharmacists.' } ] },
      { blockType: 'cta', heading: 'Pollen counts are rising', buttonLabel: 'Shop Allergy 24', buttonLink: '/allergy-24' },
    ],
  },
]
