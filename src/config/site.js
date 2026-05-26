const siteUrl = import.meta.env.VITE_SITE_URL || 'https://www.simplr.studio'
const wpSiteName = import.meta.env.VITE_WP_SITE_NAME || 'Simplr'

export const siteConfig = {
  name: wpSiteName,
  legalName: wpSiteName,
  siteUrl,
  description:
    'Editorial portfolio scaffold for Simplr with headless WordPress content, motion-led transitions, and search-ready structured data.',
  locale: 'en_GB',
  foundingDate: '2014-01-01',
  defaultSocialImage: '/social-card.svg',
  social: {
    instagram: 'https://www.instagram.com/',
    linkedin: 'https://www.linkedin.com/',
  },
  contact: {
    email: 'hello@simplr.co.za',
    phone: '+44 20 7946 0958',
    city: 'Cape Town',
    country: 'South Africa',
    address: 'Unit AS02, The Forum, Lifestyle House, Northbank Lane, Century City, South Africa'
  },
  transitions: {
    enabled: true,
    /*duration: 1,
    ease: 'power2.out',
    opacity: 0,
    y: 26,
    blur: 8,*/
  },
}

export const brandColors = {
  strategy: '#D5E09E',
  brandingDesign: '#F15941',
  webDesignDevelopment: '#C8BBFF',
  motion: '#705F07',
  templates: '#596BF0',
  coffee: '#300F1D'
}

export const wpConfig = {
  endpoint: import.meta.env.VITE_WPGRAPHQL_ENDPOINT || '',
  workContentType: import.meta.env.VITE_WORK_CONTENT_TYPE || 'WORK',
  thinkingContentType: import.meta.env.VITE_THINKING_CONTENT_TYPE || 'POST',
  workUriBase: import.meta.env.VITE_WORK_URI_BASE || '/work/',
  thinkingUriBase: import.meta.env.VITE_THINKING_URI_BASE || '/thinking/',
}

export const routeDefinitions = {
  home: {
    key: 'home',
    label: 'Home',
    path: '/',
    uri: '/',
    schemaType: 'WebPage',
    hiddenFromNavigation: true,
  },
  work: {
    key: 'work',
    label: 'Work',
    path: '/work',
    uri: '/work/',
    schemaType: 'CollectionPage',
  },
  about: {
    key: 'about',
    label: 'About',
    path: '/about',
    uri: '/about/',
    schemaType: 'AboutPage',
  },
  services: {
    key: 'services',
    label: 'Services',
    path: '/services',
    uri: '/services/',
    schemaType: 'ServicesPage',
  },
  thinking: {
    key: 'thinking',
    label: 'Thinking',
    path: '/thinking',
    uri: '/thinking/',
    schemaType: 'ArticlePage',
  },
  contact: {
    key: 'contact',
    label: 'Contact',
    path: '/contact',
    uri: '/contact/',
    schemaType: 'ContactPage',
  },
  est2014: {
    key: 'est2014',
    label: 'Est.',
    path: '/est-2014',
    uri: '/est-2014/',
    schemaType: 'AboutPage',
    count: '2014',
  },
}

export function buildNavigation(countOverrides = {}) {
  return Object.values(routeDefinitions)
    .filter(({ hiddenFromNavigation }) => !hiddenFromNavigation)
    .map(({ label, path, key, count = 0 }) => ({
      key,
      label,
      path,
      count: countOverrides[key] ?? count,
    }))
}

export const navigation = buildNavigation()

export const fallbackPages = {
  home: {
    kicker: 'Independent creative systems',
    title: 'Strategy, identity, digital systems, and motion built to hold attention and survive scale.',
    intro:
      'This is the dedicated home page scaffold. Use it to frame the studio point of view, signal core offers, and direct visitors into Work, Services, and Thinking without forcing them into the archive first.',
    content:
      '<p>Simplr is scaffolded here as an editorial home page rather than a redirect. That gives you room for positioning, lead narrative, featured proof, and stronger first-impression SEO.</p><p>When WordPress is connected, this route can resolve from the site front page or a page exposed at the root URI, while preserving the same layout and schema support.</p>',
    services: [
      {
        title: 'Strategy',
        body: 'Positioning, proposition refinement, messaging systems, and category framing designed to make decisions easier across brand and product.',
        href: '/services',
        colorToken: 'strategy',
        items: ['Research synthesis', 'Audience definition', 'Messaging architecture'],
      },
      {
        title: 'Branding & Design',
        body: 'Identity systems, art direction, and interface thinking shaped as usable systems rather than one-off launch visuals.',
        href: '/services',
        colorToken: 'branding-design',
        items: ['Identity systems', 'Art direction', 'Interface direction'],
      },
      {
        title: 'Web Design & Development',
        body: 'Headless builds, component-led front ends, and publishing foundations that balance performance, editing flexibility, and long-term clarity.',
        href: '/services',
        colorToken: 'web-design-development',
        items: ['Headless WordPress', 'Design systems', 'Front-end implementation'],
      },
      {
        title: 'Motion',
        body: 'Motion systems that create continuity and emphasis without slowing the experience or diluting the hierarchy.',
        href: '/services',
        colorToken: 'motion',
        items: ['Transition systems', 'Launch motion', 'Narrative pacing'],
      },
      {
        title: 'Templates',
        body: 'Reusable campaign, editorial, and landing page frameworks so teams can publish with speed and without visual drift.',
        href: '/services',
        colorToken: 'templates',
        items: ['Launch frameworks', 'Content templates', 'Editorial systems'],
      },
    ],
    workShowcase: {
      kicker: 'Featured work',
      title: 'Selected projects, systems, and launch environments.',
      intro:
        'The homepage can feature a tighter edit of work while the full archive stays on the Work page. The data source is shared, so you are not maintaining two separate content models.',
    },
    clients: [
      'Atlas',
      'Northern Quarter',
      'Field Notes',
      'Orchard',
      'Baseline',
      'Assembly',
      'Monograph',
      'Contour',
    ],
    testimonials: [
      {
        quote:
          'Simplr brought rare editorial discipline to both the strategy and the build. The result felt clearer, faster, and easier for our team to extend.',
        name: 'Maya Chen',
        role: 'Marketing Director',
        company: 'Atlas',
      },
      {
        quote:
          'They do not just make a site look sharper. They make the whole system easier to use, publish, and defend internally.',
        name: 'Tom Hargreaves',
        role: 'Founder',
        company: 'Northern Quarter',
      },
      {
        quote:
          'What stood out was the precision. Messaging, interaction, structure, and SEO all felt like one joined-up decision rather than separate workstreams.',
        name: 'Elena Rossi',
        role: 'Product Lead',
        company: 'Field Notes',
      },
    ],
    faqs: [
      {
        question: 'What kinds of projects are the best fit?',
        answer:
          'The strongest fit is a business that needs strategic clarity and a digital system at the same time, whether that means repositioning, launching, or rebuilding a publishing environment.',
      },
      {
        question: 'Do you work inside WordPress?',
        answer:
          'Yes. The scaffold is built around headless WordPress via WPGraphQL, so editorial teams can keep a familiar CMS while the front end stays fast and flexible.',
      },
      {
        question: 'Can the site scale into campaigns and templates?',
        answer:
          'That is part of the point. The structure is set up so work archives, editorial content, and reusable launch or campaign templates can all live inside one coherent system.',
      },
      {
        question: 'Is SEO already considered in the build?',
        answer:
          'Yes. The scaffold includes canonicals, schema, social metadata, sitemap generation, robots, and llms.txt assets as part of the baseline.',
      },
    ],
    metrics: [
      { value: '5', label: 'Core capability areas' },
      { value: '2014', label: 'Established' },
      { value: 'WP + React', label: 'Publishing stack' },
    ],
  },
  work: {
    kicker: 'Selected engagement',
    title: 'Work that moves from idea to commercial traction.',
    intro:
      'A modular showcase for case studies, launches, and brand systems. Connect WordPress and the grid will hydrate from live entries immediately.',
    content:
      '<p>This page is scaffolded for a headless WordPress archive. Use it for projects, case studies, launches, or whichever custom post type sits behind your Work stream.</p>',
    sections: [
      {
        title: 'Built for proof, not placeholders',
        body: 'Cards support image-led storytelling, summary copy, metadata, and deep links into single entries so the archive can serve both browsers and evaluators.',
      },
      {
        title: 'Editorial by default',
        body: 'The layout favours generous hierarchy, semantic HTML, and crawlable internal linking rather than decorative animation-only presentation.',
      },
    ],
  },
  about: {
    kicker: 'Studio profile',
    title: 'A considered studio profile with room for story, method, and point of view.',
    intro:
      'About is treated as an editorial page rather than a generic agency bio. The default structure supports positioning, process, and credibility signals.',
    content:
      '<p>Simplr is set up here as a focused, strategy-led creative studio. Replace the fallback copy with WordPress page content and the template will preserve the same structure, hierarchy, and schema coverage.</p>',
    sections: [
      {
        title: 'Positioning',
        body: 'State clearly what the studio is hired for, what you refuse to do, and which kinds of organisations gain the most from the work.',
      },
      {
        title: 'Method',
        body: 'Use this area for discovery, strategy, messaging, design systems, or delivery detail so the page explains how outcomes are produced.',
      },
    ],
    metrics: [
      { value: '2014', label: 'Founded' },
      { value: 'Global', label: 'Client footprint' },
      { value: 'Lean', label: 'Core team model' },
    ],
  },
  services: {
    kicker: 'Capability map',
    title: 'A service page designed to feel specific, not padded.',
    intro:
      'Use this page to separate consulting, creative direction, brand systems, websites, campaigns, and ongoing support into clearly priced or clearly scoped offers.',
    content:
      '<p>The default service structure is intentionally tight: each offer is framed by business outcome, scope, and what a client can expect to receive.</p>',
    sections: [
      {
        title: 'Strategy and positioning',
        body: 'Narrative frameworks, category framing, proposition refinement, and messaging systems built for both human readers and machine summarisation.',
        items: ['Research synthesis', 'Audience mapping', 'Value proposition work', 'Messaging architecture'],
      },
      {
        title: 'Identity and digital systems',
        body: 'Visual systems, art direction, design tokens, and front-end foundations intended to scale across launches, campaigns, and content.',
        items: ['Identity systems', 'UI direction', 'Component libraries', 'Headless front ends'],
      },
      {
        title: 'Launch and optimisation',
        body: 'Production support, analytics readiness, structured data, and SEO/GEO implementation that turns a polished site into a discoverable one.',
        items: ['Launch plans', 'Technical SEO', 'Schema implementation', 'Editorial optimisation'],
      },
    ],
  },
  thinking: {
    kicker: 'Editorial stream',
    title: 'Thought pieces, notes, and perspective built for discovery.',
    intro:
      'Thinking is scaffolded as a content-led archive with article schema, canonical URLs, and dynamic entry routes that map cleanly to WordPress posts.',
    content:
      '<p>Use this archive for essays, commentary, release notes, and insight-led content. When connected to WordPress, the list and singles will resolve from live GraphQL data.</p>',
    sections: [
      {
        title: 'Search-ready content architecture',
        body: 'Templates prioritise semantic heading order, readable summaries, article metadata, and JSON-LD so each entry has a strong machine-readable footprint.',
      },
      {
        title: 'GEO-aware publishing',
        body: 'The build pipeline generates llms.txt assets and structured data to make the site easier for generative systems to parse and cite.',
      },
    ],
  },
  contact: {
    kicker: 'Open line',
    title: 'A direct contact page with clear next steps and context.',
    intro:
      'The contact template supports direct channels, engagement expectations, and business metadata so the page works for people, crawlers, and AI systems alike.',
    content:
      '<p>Use the live WordPress page to specify response time, project fit, workshop booking, or intake questions. The fallback layout already includes the structured data layer.</p>',
    contactMethods: [
      { label: 'Email', value: 'hello@simplr.studio', href: 'mailto:hello@simplr.studio' },
      { label: 'Phone', value: '+44 20 7946 0958', href: 'tel:+442079460958' },
      { label: 'Location', value: 'London, United Kingdom', href: 'https://maps.google.com/?q=London' },
    ],
    sections: [
      {
        title: 'Best for',
        body: 'Brand repositioning, digital identity systems, content strategy, headless rebuilds, and launch environments where discoverability matters from day one.',
      },
      {
        title: 'Useful context to include',
        body: 'Timeline, stage of business, internal team shape, existing platform constraints, and the commercial decision the work needs to unlock.',
      },
    ],
  },
  est2014: {
    kicker: 'Studio history',
    title: 'A timeline page for provenance, milestones, and long-form trust signals.',
    intro:
      'This page is ideal for telling the studio story without burying it in a generic About page. Use it for turning points, philosophy shifts, and notable launches.',
    content:
      '<p>Est. 2014 is scaffolded as a chronology. It is useful both for human readers looking for legitimacy signals and for machine readers inferring company history and expertise.</p>',
    timeline: [
      { year: '2014', title: 'Studio founded', body: 'Simplr starts as a lean practice focused on strategy-first creative delivery.' },
      { year: '2018', title: 'Systems become the offer', body: 'The work shifts toward reusable identity systems, content frameworks, and implementation detail.' },
      { year: '2022', title: 'Headless becomes standard', body: 'Publishing stacks move toward decoupled builds with editorial control kept inside WordPress.' },
      { year: '2026', title: 'Search expands to GEO', body: 'Discoverability work now balances classic SEO, structured data, and machine-readable editorial assets.' },
    ],
  },
}

export const fallbackCollections = {
  work: [
    {
      id: 'work-fallback-1',
      slug: 'northern-quarter-rebrand',
      uri: '/work/northern-quarter-rebrand/',
      title: 'Northern Quarter rebrand',
      excerpt: 'A category reset for a hospitality group that needed sharper language, faster campaign tooling, and a more scalable digital expression.',
      content:
        '<p>This fallback case study demonstrates the Work single template. Replace it with a WordPress custom post type entry and the route will resolve dynamically from GraphQL.</p><p>The layout is designed for narrative structure: context, intervention, system decisions, and outcome. It is intentionally readable, linkable, and SEO-safe.</p>',
      date: '2026-01-14T09:00:00.000Z',
      author: 'Simplr',
      image: {
        sourceUrl: '/social-card.svg',
        altText: 'Editorial branded placeholder image for a work entry',
      },
    },
    {
      id: 'work-fallback-2',
      slug: 'atlas-platform-launch',
      uri: '/work/atlas-platform-launch/',
      title: 'Atlas platform launch',
      excerpt: 'A product launch environment balancing motion, clarity, and a headless editorial workflow for ongoing updates.',
      content:
        '<p>Use singles like this for richer launch stories, documentation, or product narratives. The component stack supports structured data, canonical URLs, and image-led presentation without breaking semantics.</p>',
      date: '2025-11-03T09:00:00.000Z',
      author: 'Simplr',
      image: {
        sourceUrl: '/social-card.svg',
        altText: 'Editorial branded placeholder image for a launch entry',
      },
    },
    {
      id: 'work-fallback-3',
      slug: 'field-notes-commerce-system',
      uri: '/work/field-notes-commerce-system/',
      title: 'Field Notes commerce system',
      excerpt: 'An identity and front-end system built to keep editorial quality intact across an aggressive release calendar.',
      content:
        '<p>The Work archive can support any volume of content while preserving a clear information scent for users and crawlers. Swap in real entries as soon as the endpoint is available.</p>',
      date: '2025-06-21T09:00:00.000Z',
      author: 'Simplr',
      image: {
        sourceUrl: '/social-card.svg',
        altText: 'Editorial branded placeholder image for a commerce system entry',
      },
    },
  ],
  thinking: [
    {
      id: 'thinking-fallback-1',
      slug: 'designing-for-generative-discovery',
      uri: '/thinking/designing-for-generative-discovery/',
      title: 'Designing for generative discovery',
      excerpt: 'Why content models, structured data, and llms.txt deserve a place beside classic SEO in modern site planning.',
      content:
        '<p>This fallback article stands in for a WordPress post. The page template emits article schema, author metadata, canonical tags, and clean semantic content blocks for indexing.</p><p>For GEO, the important shift is not cosmetic. Pages need explicit entities, machine-readable context, and strong internal linking so summarisation systems can infer relevance correctly.</p>',
      date: '2026-02-05T09:00:00.000Z',
      author: 'Simplr',
      image: {
        sourceUrl: '/social-card.svg',
        altText: 'Editorial branded placeholder image for a thinking article',
      },
    },
    {
      id: 'thinking-fallback-2',
      slug: 'when-headless-is-worth-it',
      uri: '/thinking/when-headless-is-worth-it/',
      title: 'When headless is worth it',
      excerpt: 'A practical view of when decoupling WordPress actually improves speed, control, and long-term publishing flexibility.',
      content:
        '<p>Not every site needs a decoupled front end. This article template is intended for that kind of nuanced position, where clarity matters more than volume.</p>',
      date: '2025-12-11T09:00:00.000Z',
      author: 'Simplr',
      image: {
        sourceUrl: '/social-card.svg',
        altText: 'Editorial branded placeholder image for a headless article',
      },
    },
    {
      id: 'thinking-fallback-3',
      slug: 'motion-without-friction',
      uri: '/thinking/motion-without-friction/',
      title: 'Motion without friction',
      excerpt: 'How to use transition systems to strengthen continuity without slowing a content-heavy experience down.',
      content:
        '<p>GSAP is introduced here as a restrained enhancement. The scaffold defaults to a configurable fade-up transition rather than a full screen takeover, so readability still wins.</p>',
      date: '2025-08-30T09:00:00.000Z',
      author: 'Simplr',
      image: {
        sourceUrl: '/social-card.svg',
        altText: 'Editorial branded placeholder image for a motion article',
      },
    },
  ],
}