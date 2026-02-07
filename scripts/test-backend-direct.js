#!/usr/bin/env node

/**
 * Direct backend test for ChatGPT service.
 * This bypasses HTTP and verifies OpenAI key + streaming path directly.
 */

import dotenv from 'dotenv';
dotenv.config();

import * as openaiService from '../server/services/openai.js';
import { config } from '../server/config.js';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkConfig() {
  log('\n📋 Checking API key configuration...', 'cyan');

  const hasOpenAI = !!config.openaiApiKey;
  log(`OpenAI API Key: ${hasOpenAI ? '✅ Found' : '❌ Missing'}`, hasOpenAI ? 'green' : 'red');

  if (hasOpenAI) {
    log(`  Key preview: ${config.openaiApiKey.substring(0, 10)}...`, 'blue');
  }

  return hasOpenAI;
}

async function testOpenAI() {
  log('\n🤖 Testing ChatGPT service directly...', 'cyan');

  if (!config.openaiApiKey) {
    log('❌ OpenAI API key not configured', 'red');
    return false;
  }

  const testMessage = 'Say "Hello from ChatGPT" in exactly 5 words.';
  log(`📤 Sending: "${testMessage}"`, 'yellow');

  return new Promise((resolve) => {
    let fullResponse = '';
    let hasError = false;

    openaiService.streamChat(
      [{ role: 'user', content: testMessage }],
      [],
      (chunk) => {
        process.stdout.write(colors.green + chunk);
        fullResponse += chunk;
      },
      () => {
        process.stdout.write(colors.reset + '\n');
        if (!hasError) {
          log(`✅ ChatGPT test completed! Response length: ${fullResponse.length} chars`, 'green');
          resolve(true);
        }
      },
      (error) => {
        hasError = true;
        process.stdout.write(colors.reset + '\n');
        log(`❌ ChatGPT error: ${error.message}`, 'red');
        resolve(false);
      }
    );
  });
}

async function main() {
  log('\n🧪 Testing Backend AI Service Directly\n', 'cyan');
  log('This test bypasses the HTTP layer and tests ChatGPT integration only.\n', 'blue');

  const hasOpenAI = checkConfig();
  if (!hasOpenAI) {
    log('\n❌ OPENAI_API_KEY is missing. Please check your .env file.\n', 'red');
    process.exit(1);
  }

  const passed = await testOpenAI();

  log('\n📊 Test Results:', 'cyan');
  log(`  ChatGPT: ${passed ? '✅ PASSED' : '❌ FAILED'}`, passed ? 'green' : 'red');

  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  log(`\n❌ Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
