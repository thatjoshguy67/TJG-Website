import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'hideFromBlogLists',
      title: 'Hide from blog lists',
      type: 'boolean',
      description: 'Keep the direct post URL available, but exclude this post from the blog index, search, and recent-post lists.',
      initialValue: false,
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'title', title: 'SEO Title', type: 'string' }),
        defineField({ name: 'description', title: 'SEO Description', type: 'text', rows: 3 }),
        defineField({ name: 'canonicalUrl', title: 'Canonical URL', type: 'url' }),
        defineField({
          name: 'openGraphImage',
          title: 'Open Graph Image',
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alt Text', type: 'string' }),
          ],
        }),
        defineField({ name: 'openGraphImageAlt', title: 'Open Graph Image Alt', type: 'string' }),
        defineField({ name: 'noIndex', title: 'No Index', type: 'boolean', initialValue: false }),
      ],
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),
    defineField({
      name: 'contentSource',
      title: 'Content Source',
      type: 'string',
      options: {
        list: [
          { title: 'Legacy HTML (migrated from WordPress)', value: 'legacyHtml' },
          { title: 'Portable Text (native Sanity)', value: 'portableText' },
        ],
      },
      initialValue: 'portableText',
    }),
    defineField({
      name: 'body',
      title: 'Body (Portable Text)',
      type: 'array',
      of: [
        defineField({
          name: 'callout', title: 'Callout', type: 'object',
          initialValue: { tone: 'info', title: '' },
          fields: [
            defineField({ name: 'tone', title: 'Tone', type: 'string', initialValue: 'info',
              options: { list: [{ title: 'Information', value: 'info' }, { title: 'Tip', value: 'tip' }, { title: 'Warning', value: 'warning' }] },
              validation: (rule) => rule.required().custom((value) => ['info', 'tip', 'warning'].includes(value || '') ? true : 'Choose a callout tone.') }),
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'text', title: 'Body', type: 'text', rows: 4,
              validation: (rule) => rule.required().custom((value) => typeof value === 'string' && value.trim().length > 0 ? true : 'Enter a callout message.') }),
            defineField({ name: 'icon', title: 'Icon (optional)', type: 'object', fields: [
              defineField({ name: 'name', title: 'Icon name', type: 'string', validation: (rule) => rule.max(100) }),
              defineField({ name: 'svg', title: 'SVG', type: 'text', rows: 5,
                description: 'Paste an SVG icon. Only inert shapes are displayed on the website.',
                validation: (rule) => rule.max(50000) }),
            ] }),
          ],
          preview: { select: { title: 'title', text: 'text', tone: 'tone' },
            prepare: ({ title, text, tone }) => ({ title: title || 'Callout', subtitle: `${tone || 'info'} — ${text || 'No message'}` }) },
        }),
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alt Text', type: 'string' }),
            defineField({ name: 'caption', title: 'Caption', type: 'string' }),
          ],
        },
        defineField({
          name: 'blogButton',
          title: 'Blog Button',
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'href', title: 'URL', type: 'url', validation: (rule) => rule.required() }),
            defineField({ name: 'iconName', title: 'Icon Name', type: 'string' }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'href' },
          },
        }),
        defineField({
          name: 'embed',
          title: 'Reusable Embed',
          type: 'object',
          fields: [
            defineField({
              name: 'embedKey',
              title: 'Embed Key',
              type: 'string',
              options: {
                list: [
                  'story-mindmap',
                  'gdd-results',
                  'story-results',
                  'google-doc-name',
                  'figma-ux-workflow',
                  'maps-embed',
                  'figma-prototype',
                  'figma-fmp-design',
                  'fmp-pitch-embed',
                  'fmp-mindmap',
                ],
              },
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { title: 'embedKey' },
          },
        }),
        defineField({
          name: 'legacyHtml',
          title: 'Legacy HTML Snippet',
          type: 'object',
          fields: [
            defineField({ name: 'html', title: 'HTML', type: 'text', rows: 6, validation: (rule) => rule.required() }),
          ],
          preview: {
            prepare() {
              return { title: 'Legacy HTML snippet' };
            },
          },
        }),
      ],
      hidden: ({ parent }) => parent?.contentSource === 'legacyHtml',
    }),
    defineField({
      name: 'legacyHtml',
      title: 'Legacy HTML Content',
      type: 'text',
      hidden: ({ parent }) => parent?.contentSource !== 'legacyHtml',
    }),
    defineField({
      name: 'wordCount',
      title: 'Word Count',
      type: 'number',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'featuredImage',
      date: 'publishedAt',
    },
    prepare({ title, media, date }) {
      return {
        title,
        media,
        subtitle: date ? new Date(date).toLocaleDateString() : 'No date',
      };
    },
  },
});
