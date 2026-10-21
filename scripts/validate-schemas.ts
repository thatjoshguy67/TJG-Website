import { Schema } from '@sanity/schema';
import post from '../sanity/schemas/post';
import category from '../sanity/schemas/category';
import tag from '../sanity/schemas/tag';
const schema = Schema.compile({ name: 'tjg-blog', types: [post, category, tag] });
for (const name of ['post', 'category', 'tag']) if (!schema.get(name)) throw new Error(`Missing schema ${name}`);
console.log('All three Sanity schemas compile successfully.');

const body = schema.get('post').fields.find((field: { name: string }) => field.name === 'body').type;
const callout = body.of.find((member: { name: string }) => member.name === 'callout');
for (const name of ['tone', 'title', 'text', 'icon']) {
  if (!callout?.fields.some((field: { name: string }) => field.name === name)) throw new Error(`Missing callout field ${name}`);
}
console.log('Callout fields compile successfully.');
