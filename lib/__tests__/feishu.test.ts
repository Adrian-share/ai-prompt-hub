import { extractCategories } from '../feishu';
import { Prompt } from '../types';

describe('extractCategories', () => {
  const createPrompt = (category: string): Prompt => ({
    id: `id-${category}`,
    title: `Title ${category}`,
    description: 'Description',
    content: 'Content',
    category,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  it('should extract unique categories from prompts', () => {
    const prompts: Prompt[] = [
      createPrompt('Writing'),
      createPrompt('Coding'),
      createPrompt('Writing'),
      createPrompt('Marketing'),
    ];

    const categories = extractCategories(prompts);
    expect(categories).toEqual(['Coding', 'Marketing', 'Writing']);
  });

  it('should return sorted categories', () => {
    const prompts: Prompt[] = [
      createPrompt('Zebra'),
      createPrompt('Apple'),
      createPrompt('Mango'),
    ];

    const categories = extractCategories(prompts);
    expect(categories).toEqual(['Apple', 'Mango', 'Zebra']);
  });

  it('should return empty array for empty prompts', () => {
    expect(extractCategories([])).toEqual([]);
  });

  it('should skip prompts with empty category', () => {
    const prompts: Prompt[] = [
      createPrompt('Valid'),
      createPrompt(''),
      createPrompt('Another'),
    ];

    const categories = extractCategories(prompts);
    expect(categories).toEqual(['Another', 'Valid']);
  });
});
