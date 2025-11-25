const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupAIChatbot() {
  console.log('🤖 HealthSync Pro AI Chatbot Setup\n');
  console.log('This script will help you configure AI providers for the chatbot.\n');

  try {
    // Check if .env exists
    const envPath = path.join(__dirname, 'backend', '.env');
    if (!fs.existsSync(envPath)) {
      console.log('❌ Backend .env file not found!');
      console.log('Please make sure you have a .env file in the backend directory.');
      process.exit(1);
    }

    // Read current .env
    let envContent = fs.readFileSync(envPath, 'utf8');

    console.log('Available AI Providers:');
    console.log('1. Google Gemini Pro (Recommended - Free tier available)');
    console.log('2. OpenAI GPT (Pay-per-use)');
    console.log('3. Both (Configure both providers)\n');

    const choice = await question('Choose your preferred provider (1-3): ');

    let provider = 'gemini';
    let needsGemini = false;
    let needsOpenAI = false;

    switch (choice) {
      case '1':
        provider = 'gemini';
        needsGemini = true;
        break;
      case '2':
        provider = 'openai';
        needsOpenAI = true;
        break;
      case '3':
        needsGemini = true;
        needsOpenAI = true;
        const defaultProvider = await question('Which should be the default provider? (gemini/openai): ');
        provider = defaultProvider.toLowerCase() === 'openai' ? 'openai' : 'gemini';
        break;
      default:
        console.log('Invalid choice. Using Gemini as default.');
        provider = 'gemini';
        needsGemini = true;
    }

    // Update AI_PROVIDER
    if (envContent.includes('AI_PROVIDER=')) {
      envContent = envContent.replace(/AI_PROVIDER=.*/, `AI_PROVIDER=${provider}`);
    } else {
      envContent += `\nAI_PROVIDER=${provider}`;
    }

    // Configure Gemini
    if (needsGemini) {
      console.log('\n📝 Configuring Google Gemini Pro:');
      console.log('1. Visit: https://makersuite.google.com/app/apikey');
      console.log('2. Sign in with your Google account');
      console.log('3. Create a new API key');
      console.log('4. Copy the generated key\n');

      const geminiKey = await question('Enter your Gemini API key (or press Enter to skip): ');
      
      if (geminiKey.trim()) {
        if (envContent.includes('GEMINI_API_KEY=')) {
          envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${geminiKey.trim()}`);
        } else {
          envContent += `\nGEMINI_API_KEY=${geminiKey.trim()}`;
        }
        console.log('✅ Gemini API key configured');
      } else {
        if (!envContent.includes('GEMINI_API_KEY=')) {
          envContent += '\nGEMINI_API_KEY=your_gemini_api_key_here';
        }
        console.log('⚠️  Gemini API key placeholder added - update it manually');
      }
    }

    // Configure OpenAI
    if (needsOpenAI) {
      console.log('\n📝 Configuring OpenAI:');
      console.log('1. Visit: https://platform.openai.com/api-keys');
      console.log('2. Sign in to your OpenAI account');
      console.log('3. Create a new API key');
      console.log('4. Copy the generated key\n');

      const openaiKey = await question('Enter your OpenAI API key (or press Enter to skip): ');
      
      if (openaiKey.trim()) {
        if (envContent.includes('OPENAI_API_KEY=')) {
          envContent = envContent.replace(/OPENAI_API_KEY=.*/, `OPENAI_API_KEY=${openaiKey.trim()}`);
        } else {
          envContent += `\nOPENAI_API_KEY=${openaiKey.trim()}`;
        }
        console.log('✅ OpenAI API key configured');
      } else {
        if (!envContent.includes('OPENAI_API_KEY=')) {
          envContent += '\nOPENAI_API_KEY=your_openai_api_key_here';
        }
        console.log('⚠️  OpenAI API key placeholder added - update it manually');
      }
    }

    // Write updated .env
    fs.writeFileSync(envPath, envContent);

    console.log('\n🎉 AI Chatbot configuration completed!');
    console.log('\nNext steps:');
    console.log('1. Restart your backend server: npm run dev');
    console.log('2. Test the chatbot in the admin dashboard');
    console.log('3. Run test script: node backend/test-chatbot.js');
    console.log('\nFor detailed setup instructions, see: AI_CHATBOT_SETUP.md');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run setup
setupAIChatbot();