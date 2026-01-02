/**
 * AI Health Chatbot Screen
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/api/apiClient';

const AIChatbotScreen = ({ navigation }) => {
  const { user } = useUser();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hello! I'm your AI Health Assistant. I can help you with health questions, symptom analysis, medication info, and general wellness advice. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  const quickActions = [
    { id: 1, label: 'Check Symptoms', icon: '🩺' },
    { id: 2, label: 'Medicine Info', icon: '💊' },
    { id: 3, label: 'Health Tips', icon: '💡' },
    { id: 4, label: 'Diet Advice', icon: '🥗' },
  ];

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/chatbot/message', {
        message: userMessage.text,
        userId: user?._id,
      });

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: response.data.reply || "I'm sorry, I couldn't process that. Please try again.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: "I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    const prompts = {
      1: "I'd like to check my symptoms",
      2: "I need information about a medication",
      3: "Give me some health tips",
      4: "I need diet and nutrition advice",
    };
    setInputText(prompts[action.id] || action.label);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const renderMessage = (message) => {
    const isBot = message.type === 'bot';
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isBot ? styles.botMessage : styles.userMessage,
        ]}
      >
        {isBot && (
          <View style={styles.botAvatar}>
            <Text style={styles.botAvatarText}>🤖</Text>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isBot ? styles.botBubble : styles.userBubble,
            message.isError && styles.errorBubble,
          ]}
        >
          <Text style={[styles.messageText, isBot && styles.botText]}>
            {message.text}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.background, colors.backgroundCard]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>🤖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Health Assistant</Text>
            <Text style={styles.headerSubtitle}>Powered by Gemini AI</Text>
          </View>
        </View>
        <View style={styles.onlineIndicator} />
      </LinearGradient>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
        
        {isLoading && (
          <View style={[styles.messageContainer, styles.botMessage]}>
            <View style={styles.botAvatar}>
              <Text style={styles.botAvatarText}>🤖</Text>
            </View>
            <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.typingText}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickActionsContainer}
          contentContainerStyle={styles.quickActionsContent}
        >
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickAction}
              onPress={() => handleQuickAction(action)}
            >
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything about health..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <LinearGradient
              colors={inputText.trim() ? [colors.primary, colors.primaryDark] : [colors.surfaceBorder, colors.surfaceBorder]}
              style={styles.sendButtonGradient}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  backIcon: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerAvatarText: {
    fontSize: 24,
  },
  headerTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  botAvatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  botBubble: {
    backgroundColor: colors.backgroundCard,
    borderBottomLeftRadius: borderRadius.xs,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.xs,
  },
  errorBubble: {
    backgroundColor: colors.errorLight,
  },
  messageText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  botText: {
    color: colors.textPrimary,
  },
  timestamp: {
    ...typography.labelSmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  quickActionsContainer: {
    maxHeight: 100,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  quickActionsContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  quickAction: {
    backgroundColor: colors.backgroundCard,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  quickActionIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  quickActionLabel: {
    ...typography.labelMedium,
    color: colors.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.bodyMedium,
    color: colors.textPrimary,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 48,
    height: 48,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
  },
});

export default AIChatbotScreen;
