# AI Chatbot Setup Guide

## Overview
The HealthSync Pro admin dashboard now includes an intelligent AI chatbot assistant that can help with healthcare administration tasks, system management, and provide insights.

## Supported AI Providers

### 1. Google Gemini Pro (Recommended)
- **Model**: gemini-pro
- **Cost**: Free tier available with generous limits
- **Setup**: Get API key from Google AI Studio

### 2. OpenAI GPT
- **Models**: gpt-3.5-turbo, gpt-4
- **Cost**: Pay-per-use pricing
- **Setup**: Get API key from OpenAI platform

## Configuration Steps

### Step 1: Get API Keys

#### For Google Gemini (Recommended):
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the generated key

#### For OpenAI:
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in to your account
3. Create a new API key
4. Copy the generated key

### Step 2: Configure Environment Variables

Add the following to your `backend/.env` file:

```env
# AI Chatbot Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

**Provider Options:**
- `gemini` - Use Google Gemini Pro (recommended)
- `openai` - Use OpenAI GPT-3.5-turbo

### Step 3: Restart the Backend Server

```bash
cd backend
npm run dev
```

## Features

### Core Capabilities
- **Healthcare Administration**: Guidance on patient management, appointment scheduling
- **System Insights**: Analysis of current statistics and performance metrics
- **Operational Support**: Best practices for clinic operations and staff management
- **Troubleshooting**: Help with common administrative issues
- **Report Generation**: Assistance with data analysis and reporting

### Smart Context Awareness
- Automatically receives current system statistics
- Adapts suggestions based on the active dashboard tab
- Maintains conversation history for better context

### Professional Features
- **Export Chat**: Download conversation history
- **Smart Suggestions**: Context-aware question suggestions
- **Minimize/Expand**: Flexible UI for better workflow
- **Real-time Status**: Shows AI provider status and configuration

## Usage Tips

### Best Practices
1. **Be Specific**: Ask detailed questions about your healthcare administration needs
2. **Use Context**: The AI knows your current system stats and active dashboard section
3. **Follow Up**: Ask follow-up questions for more detailed guidance
4. **Export Important Conversations**: Save valuable insights for future reference

### Example Questions
- "How can I improve appointment scheduling efficiency?"
- "What should I do about the pending receptionist approvals?"
- "Analyze my current system statistics and suggest improvements"
- "What reports should I generate for monthly review?"
- "How do I handle high appointment volumes?"

## Troubleshooting

### Common Issues

#### "Setup Required" Message
- Check that API keys are correctly added to `.env`
- Ensure the backend server has been restarted
- Verify the AI_PROVIDER setting matches your configured service

#### API Quota Exceeded
- Check your API usage limits
- Consider switching providers if needed
- Gemini Pro has generous free limits

#### Slow Responses
- This is normal for AI processing
- Gemini Pro is typically faster than OpenAI
- Check your internet connection

### Fallback Mode
If AI services are unavailable, the chatbot provides helpful fallback responses based on common healthcare administration topics.

## Security & Privacy

### Data Handling
- Conversations are not stored permanently
- No patient data should be shared in chat
- API keys are securely stored in environment variables
- All communication follows HIPAA compliance guidelines

### Best Practices
- Never share sensitive patient information
- Use the chatbot for administrative guidance only
- Regularly rotate API keys for security
- Monitor API usage and costs

## Cost Considerations

### Google Gemini Pro
- **Free Tier**: 60 requests per minute
- **Paid Plans**: Available for higher usage
- **Recommended**: For most healthcare administration use cases

### OpenAI
- **GPT-3.5-turbo**: ~$0.002 per 1K tokens
- **GPT-4**: Higher cost but better quality
- **Monitor Usage**: Set up billing alerts

## Support

For technical issues:
1. Check the chatbot status indicator
2. Review browser console for errors
3. Verify backend logs for API issues
4. Ensure environment variables are correctly set

The AI chatbot enhances your healthcare administration workflow by providing instant, intelligent assistance tailored to your system's needs.