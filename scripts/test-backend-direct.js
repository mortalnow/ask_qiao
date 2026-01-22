#!/usr/bin/env node

/**
 * Direct backend test - tests the AI services directly using API keys from .env
 * This bypasses the HTTP layer to test if the API keys work
 */

import dotenv from 'dotenv';
dotenv.config();

import * as openaiService from '../server/services/openai.js';
import * as geminiService from '../server/services/gemini.js';
import { config } from '../server/config.js';

// Colors for terminal output
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
	const hasGemini = !!config.googleAiApiKey;

	log(`OpenAI API Key: ${hasOpenAI ? '✅ Found' : '❌ Missing'}`, hasOpenAI ? 'green' : 'red');
	if (hasOpenAI) {
		log(`  Key preview: ${config.openaiApiKey.substring(0, 10)}...`, 'blue');
	}

	log(`Google AI API Key: ${hasGemini ? '✅ Found' : '❌ Missing'}`, hasGemini ? 'green' : 'red');
	if (hasGemini) {
		log(`  Key preview: ${config.googleAiApiKey.substring(0, 10)}...`, 'blue');
	}

	return { hasOpenAI, hasGemini };
}

async function testOpenAI() {
	log('\n🤖 Testing OpenAI service directly...', 'cyan');

	if (!config.openaiApiKey) {
		log('❌ OpenAI API key not configured', 'red');
		return false;
	}

	const testMessage = 'Say "Hello from OpenAI" in exactly 5 words.';
	log(`📤 Sending: "${testMessage}"`, 'yellow');

	return new Promise((resolve) => {
		let fullResponse = '';
		let hasError = false;

		openaiService.streamChat(
			[{ role: 'user', content: testMessage }],
			[], // files (empty array for testing)
			// onChunk
			(chunk) => {
				process.stdout.write(colors.green + chunk);
				fullResponse += chunk;
			},
			// onDone
			() => {
				process.stdout.write(colors.reset + '\n');
				if (!hasError) {
					log(`✅ OpenAI test completed! Response length: ${fullResponse.length} chars`, 'green');
					resolve(true);
				}
			},
			// onError
			(error) => {
				hasError = true;
				process.stdout.write(colors.reset + '\n');
				log(`❌ OpenAI error: ${error.message}`, 'red');
				if (error.stack) {
					log(`   Stack: ${error.stack}`, 'red');
				}
				resolve(false);
			}
		);
	});
}

async function testGemini() {
	log('\n🤖 Testing Gemini service directly...', 'cyan');

	if (!config.googleAiApiKey) {
		log('❌ Google AI API key not configured', 'red');
		return false;
	}

	const testMessage = 'Say "Hello from Gemini" in exactly 5 words.';
	log(`📤 Sending: "${testMessage}"`, 'yellow');

	return new Promise((resolve) => {
		let fullResponse = '';
		let hasError = false;

		geminiService.streamChat(
			[{ role: 'user', content: testMessage }],
			[], // files (empty array for testing)
			// onChunk
			(chunk) => {
				process.stdout.write(colors.green + chunk);
				fullResponse += chunk;
			},
			// onDone
			() => {
				process.stdout.write(colors.reset + '\n');
				if (!hasError) {
					log(`✅ Gemini test completed! Response length: ${fullResponse.length} chars`, 'green');
					resolve(true);
				}
			},
			// onError
			(error) => {
				hasError = true;
				process.stdout.write(colors.reset + '\n');
				log(`❌ Gemini error: ${error.message}`, 'red');
				if (error.stack) {
					log(`   Stack: ${error.stack}`, 'red');
				}
				resolve(false);
			}
		);
	});
}

async function main() {
	log('\n🧪 Testing Backend AI Services Directly\n', 'cyan');
	log('This test bypasses the HTTP layer and tests the services directly.\n', 'blue');

	const { hasOpenAI, hasGemini } = checkConfig();

	if (!hasOpenAI && !hasGemini) {
		log('\n❌ No API keys configured! Please check your .env file.', 'red');
		process.exit(1);
	}

	const results = {
		openai: false,
		gemini: false
	};

	if (hasOpenAI) {
		results.openai = await testOpenAI();
	} else {
		log('\n⏭️  Skipping OpenAI test (no API key)', 'yellow');
	}

	if (hasGemini) {
		results.gemini = await testGemini();
	} else {
		log('\n⏭️  Skipping Gemini test (no API key)', 'yellow');
	}

	log('\n📊 Test Results:', 'cyan');
	if (hasOpenAI) {
		log(`  OpenAI: ${results.openai ? '✅ PASSED' : '❌ FAILED'}`, results.openai ? 'green' : 'red');
	}
	if (hasGemini) {
		log(`  Gemini: ${results.gemini ? '✅ PASSED' : '❌ FAILED'}`, results.gemini ? 'green' : 'red');
	}

	const allPassed = (!hasOpenAI || results.openai) && (!hasGemini || results.gemini);

	if (allPassed) {
		log('\n✨ All configured services are working!\n', 'green');
		process.exit(0);
	} else {
		log('\n❌ Some tests failed. Check the error messages above.\n', 'red');
		process.exit(1);
	}
}

main().catch(err => {
	log(`\n❌ Fatal error: ${err.message}`, 'red');
	if (err.stack) {
		log(`   Stack: ${err.stack}`, 'red');
	}
	process.exit(1);
});

