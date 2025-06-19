import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Send, Bot, Sparkles, Lightbulb, Wand as Wand2, Copy, Check } from 'lucide-react-native';
import { router } from 'expo-router';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

export default function AIAssistantScreen() {
  const { colors } = useTheme();
  const { user, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI prompt assistant. I can help you:\n\n• Generate creative prompts\n• Improve existing prompts\n• Suggest trending topics\n• Optimize for different AI models\n\nWhat would you like to create today?",
      isUser: false,
      timestamp: new Date(),
      suggestions: [
        "Generate a fantasy prompt",
        "Improve my existing prompt",
        "What's trending in AI art?",
        "Help with ChatGPT prompts"
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/auth');
    }
  }, [isLoggedIn]);

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI response - in production, this would call your AI service
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const responses = {
      fantasy: "Here's a fantasy prompt for you:\n\n\"Create a mystical forest where ancient trees have crystalline bark that glows with inner light. Ethereal creatures with translucent wings dance between floating islands connected by bridges of pure starlight. The air shimmers with magical particles, and in the distance, a castle made of clouds drifts slowly across a sky painted in aurora colors.\"\n\nWould you like me to adapt this for a specific AI model?",
      
      improve: "I'd be happy to help improve your prompt! To give you the best suggestions, could you share:\n\n• Your current prompt\n• What AI model you're using\n• What style you're aiming for\n• Any specific elements you want to emphasize\n\nThis will help me provide targeted improvements for better results.",
      
      trending: "Here are some trending AI art topics right now:\n\n🎨 **Visual Styles:**\n• Cyberpunk cityscapes\n• Minimalist geometric art\n• Retro-futuristic designs\n• Bioluminescent nature scenes\n\n🔥 **Popular Themes:**\n• AI-human collaboration\n• Climate change visualization\n• Space exploration\n• Ancient civilizations reimagined\n\nWould you like me to create a prompt for any of these?",
      
      chatgpt: "For ChatGPT prompts, here are some optimization tips:\n\n✨ **Structure:**\n• Be specific about the role/persona\n• Provide clear context\n• Include desired output format\n• Add examples when helpful\n\n🎯 **Example:**\n\"Act as a creative writing coach. Help me develop a short story about time travel. Provide a compelling opening paragraph, suggest 3 plot twists, and recommend character development techniques. Format your response with clear headings.\"\n\nWant me to help optimize a specific prompt?"
    };
    
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('fantasy') || lowerMessage.includes('magical')) {
      return responses.fantasy;
    } else if (lowerMessage.includes('improve') || lowerMessage.includes('better')) {
      return responses.improve;
    } else if (lowerMessage.includes('trending') || lowerMessage.includes('popular')) {
      return responses.trending;
    } else if (lowerMessage.includes('chatgpt') || lowerMessage.includes('gpt')) {
      return responses.chatgpt;
    } else {
      return "I understand you're looking for help with prompts! I can assist with:\n\n• Creating new prompts from scratch\n• Improving existing prompts\n• Adapting prompts for different AI models\n• Suggesting trending topics\n\nCould you be more specific about what you'd like to work on?";
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(userMessage.text);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      Alert.alert('Error', 'Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      // In a real app, you'd use Clipboard from @react-native-clipboard/clipboard
      // For web compatibility, we'll simulate it
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(text);
      }
      
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy text');
    }
  };

  const createPromptFromMessage = (text: string) => {
    // Navigate to create post with pre-filled prompt
    router.push({
      pathname: '/create-post',
      params: { prefilledPrompt: text }
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      paddingTop: Platform.OS === 'android' ? insets.top + 12 : insets.top + 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: colors.surfaceVariant,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    aiIcon: {
      backgroundColor: colors.primary + '20',
      borderRadius: 20,
      padding: 8,
    },
    messagesContainer: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    messageWrapper: {
      marginBottom: 16,
      alignItems: 'flex-start',
    },
    userMessageWrapper: {
      alignItems: 'flex-end',
    },
    messageBubble: {
      maxWidth: '80%',
      padding: 12,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userMessageBubble: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    messageText: {
      fontSize: 15,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      lineHeight: 22,
    },
    userMessageText: {
      color: colors.white,
    },
    messageActions: {
      flexDirection: 'row',
      marginTop: 8,
      gap: 8,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    actionButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      marginLeft: 4,
    },
    suggestionsContainer: {
      marginTop: 12,
      gap: 8,
    },
    suggestionButton: {
      backgroundColor: colors.primary + '10',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    suggestionText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingBottom: Platform.OS === 'ios' ? 12 + insets.bottom : 12 + insets.bottom,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    textInput: {
      flex: 1,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      maxHeight: 100,
      marginRight: 12,
      minHeight: 44,
    },
    sendButton: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 12,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 44,
      minHeight: 44,
    },
    sendButtonDisabled: {
      backgroundColor: colors.surfaceVariant,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
    },
    loadingText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginLeft: 8,
    },
    timestamp: {
      fontSize: 11,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 4,
      alignSelf: 'flex-end',
    },
  });

  if (!isLoggedIn) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Assistant</Text>
        <View style={styles.aiIcon}>
          <Bot size={20} color={colors.primary} />
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.isUser && styles.userMessageWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.isUser && styles.userMessageBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.isUser && styles.userMessageText,
                  ]}
                >
                  {message.text}
                </Text>
                
                {!message.isUser && (
                  <View style={styles.messageActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => copyToClipboard(message.text, message.id)}
                    >
                      {copiedMessageId === message.id ? (
                        <Check size={12} color={colors.success} />
                      ) : (
                        <Copy size={12} color={colors.textSecondary} />
                      )}
                      <Text style={styles.actionButtonText}>
                        {copiedMessageId === message.id ? 'Copied!' : 'Copy'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => createPromptFromMessage(message.text)}
                    >
                      <Wand2 size={12} color={colors.textSecondary} />
                      <Text style={styles.actionButtonText}>Create Post</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              
              <Text style={styles.timestamp}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>

              {/* Suggestions */}
              {message.suggestions && (
                <View style={styles.suggestionsContainer}>
                  {message.suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionButton}
                      onPress={() => handleSuggestionPress(suggestion)}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>AI is thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask me anything about prompts..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            textAlignVertical="top"
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Send
                size={20}
                color={
                  !inputText.trim() || isLoading ? colors.textSecondary : colors.white
                }
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}