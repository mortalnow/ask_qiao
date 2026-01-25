import OpenAI from 'openai';
import { config } from '../config.js';

let openai = null;

function getClient() {
  if (!openai && config.openaiApiKey) {
    openai = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return openai;
}

function getSkillGenerationModel() {
  if (config.openaiModel && config.openaiModel !== 'latest') {
    return config.openaiModel;
  }
  return 'gpt-4o';
}

/**
 * System prompt for skill generation
 */
const SKILL_GENERATION_PROMPT = `You are an expert at creating reusable "skills" for AI assistants. A skill is a portable set of instructions that can be prepended to any prompt to give the AI a specific capability or persona.

Given a structured prompt with [PERSONA], [TASK], and [CONTEXT] sections, your job is to:
1. Identify the core capability, expertise, or role being used
2. Generalize it into a reusable skill that can apply to similar tasks
3. Remove specific context details while keeping the useful patterns and instructions
4. Create clear, actionable guidelines the AI should follow

Output format (use exactly this structure):
---
name: [Short, descriptive name - 2-5 words, no quotes]
description: [One sentence explaining what this skill does - max 100 chars]
---

[Skill content in markdown - include:
- Role/expertise definition
- Key behaviors and approaches
- Output format guidelines
- Any important constraints or patterns]

Important:
- Keep the skill content focused and under 2000 characters
- Make it general enough to be useful across similar tasks
- Use clear headings and bullet points
- Don't include specific examples from the original context`;

/**
 * Generate a skill from a user prompt
 * @param {Object} prompt - The structured prompt { persona, task, context, format, references }
 * @returns {Object} - { name, description, content } or throws error
 */
export async function generateSkillFromPrompt(prompt) {
  const client = getClient();

  if (!client) {
    throw new Error('OpenAI API key not configured');
  }

  // Build the user message
  const userMessage = `Please analyze this structured prompt and create a reusable skill:

[PERSONA]
${prompt.persona || 'Not specified'}

[TASK]
${prompt.task || 'Not specified'}

[CONTEXT]
${prompt.context || 'Not specified'}
${prompt.format ? `\n[FORMAT]\n${prompt.format}` : ''}
${prompt.references ? `\n[REFERENCES]\n${prompt.references}` : ''}`;

  try {
    const response = await client.chat.completions.create({
      model: getSkillGenerationModel(),  // Use configured model if provided
      messages: [
        { role: 'system', content: SKILL_GENERATION_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the response
    return parseSkillResponse(content);
  } catch (err) {
    console.error('Skill generation error:', err);
    throw new Error(err.message || 'Failed to generate skill');
  }
}

/**
 * Parse the AI response into structured skill data
 */
function parseSkillResponse(content) {
  // Try to extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const skillContent = frontmatterMatch[2].trim();

    // Extract name and description
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    const descMatch = frontmatter.match(/^description:\s*(.+)$/m);

    const name = nameMatch
      ? nameMatch[1].trim().replace(/^["']|["']$/g, '')
      : 'Generated Skill';
    const description = descMatch
      ? descMatch[1].trim().replace(/^["']|["']$/g, '').substring(0, 500)
      : '';

    return {
      name,
      description,
      content: skillContent || content
    };
  }

  // Fallback: try to find a heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  const name = headingMatch ? headingMatch[1].trim() : 'Generated Skill';

  // Try to find first paragraph as description
  const paragraphMatch = content.match(/^(?!#)([^-\n].+)$/m);
  const description = paragraphMatch
    ? paragraphMatch[1].trim().substring(0, 500)
    : '';

  return {
    name,
    description,
    content
  };
}

/**
 * Validate a prompt has enough content to generate a skill
 */
export function validatePromptForGeneration(prompt) {
  const errors = [];

  if (!prompt.persona || prompt.persona.trim().length < 10) {
    errors.push('PERSONA must be at least 10 characters');
  }

  if (!prompt.task || prompt.task.trim().length < 10) {
    errors.push('TASK must be at least 10 characters');
  }

  // Context is optional for skill generation
  // if (!prompt.context || prompt.context.trim().length < 10) {
  //   errors.push('CONTEXT must be at least 10 characters');
  // }

  return {
    valid: errors.length === 0,
    errors
  };
}
