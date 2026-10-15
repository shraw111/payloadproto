import type { Block } from 'payload'

/** The cleaned content model (demo/stored/model-fixed.json), written out as Payload blocks. */
export const Hero: Block = {
  slug: 'hero',
  fields: [
    { name: 'headline', type: 'text', required: true },
    { name: 'subheadline', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'ctaLabel', type: 'text' },
    { name: 'ctaLink', type: 'text' },
  ],
}

export const ProductHighlight: Block = {
  slug: 'productHighlight',
  fields: [
    { name: 'productName', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'claims', type: 'relationship', relationTo: 'claims', hasMany: true },
  ],
}

export const FeatureGrid: Block = {
  slug: 'featureGrid',
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'text', type: 'textarea' },
      ],
    },
  ],
}

export const OfferBanner: Block = {
  slug: 'offerBanner',
  fields: [
    { name: 'offerText', type: 'text', required: true },
    { name: 'terms', type: 'textarea' },
    { name: 'ctaLabel', type: 'text' },
    { name: 'ctaLink', type: 'text' },
  ],
}

export const Testimonial: Block = {
  slug: 'testimonial',
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    { name: 'name', type: 'text' },
    { name: 'role', type: 'text' },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'card',
      options: [
        { label: 'Card', value: 'card' },
        { label: 'Quote', value: 'quote' },
      ],
    },
  ],
}

export const Faq: Block = {
  slug: 'faq',
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'question', type: 'text' },
        { name: 'answer', type: 'textarea' },
      ],
    },
  ],
}

export const Cta: Block = {
  slug: 'cta',
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'buttonLabel', type: 'text' },
    { name: 'buttonLink', type: 'text' },
  ],
}

export const LeadForm: Block = {
  slug: 'leadForm',
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'buttonLabel', type: 'text' },
  ],
}

/** Counts down to the offer's end date (taken from the page's offer group). */
export const Countdown: Block = {
  slug: 'countdown',
  fields: [
    { name: 'label', type: 'text' },
    { name: 'target', type: 'select', defaultValue: 'ends', options: [{ label: 'Offer ends', value: 'ends' }, { label: 'Event starts', value: 'event' }] },
  ],
}

export const allBlocks: Block[] = [Hero, ProductHighlight, FeatureGrid, OfferBanner, Testimonial, Faq, Cta, LeadForm, Countdown]
