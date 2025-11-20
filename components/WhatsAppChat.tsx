import React, { useState, useEffect, useRef } from 'react';
import { getBusinessSettings, BusinessSettings } from '../services/businessSettings';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'business';
  timestamp: Date;
}

interface WhatsAppChatProps {
  phoneNumber?: string;
  businessName?: string;
  useBusinessSettings?: boolean;
}

const WhatsAppChat: React.FC<WhatsAppChatProps> = ({ phoneNumber, businessName, useBusinessSettings = false }) => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (useBusinessSettings) {
      getBusinessSettings().then(setSettings);
    }
  }, [useBusinessSettings]);

  // Get values from settings or props
  // WhatsApp always uses mobile_number (not phone_number/1300)
  const displayPhoneNumber = useBusinessSettings && settings?.mobile_number 
    ? settings.mobile_number.replace(/\D/g, '') 
    : phoneNumber || '61481943940';
  const displayBusinessName = useBusinessSettings && settings?.business_name 
    ? settings.business_name 
    : businessName || 'Peres Systems';

  useEffect(() => {
    if (displayBusinessName) {
      setMessages([{
        id: '1',
        text: `Hello! Welcome to ${displayBusinessName}. How can we help you today?`,
        sender: 'business',
        timestamp: new Date(),
      }]);
    }
  }, [displayBusinessName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      // Use relative URL if VITE_API_URL is not set (works with nginx proxy)
      // Otherwise use the configured API URL
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const apiUrl = API_BASE_URL ? `${API_BASE_URL}/api/whatsapp/send` : '/api/whatsapp/send';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: displayPhoneNumber || '61481943940',
          message: inputMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to send message' }));
        throw new Error(errorData.detail || 'Failed to send message');
      }

      const data = await response.json();
      
      // Check if message was actually sent or just logged
      if (data.status === 'logged') {
        const loggedReply: Message = {
          id: (Date.now() + 1).toString(),
          text: data.message || 'Thank you for your message! We\'ll get back to you shortly via email or phone.',
          sender: 'business',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, loggedReply]);
      } else if (data.reply) {
        // Add business reply if provided
        const businessReply: Message = {
          id: (Date.now() + 1).toString(),
          text: data.reply,
          sender: 'business',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, businessReply]);
      } else {
        // Auto-reply if no immediate response
        const autoReply: Message = {
          id: (Date.now() + 1).toString(),
          text: data.message || 'Thank you for your message! We\'ll get back to you shortly.',
          sender: 'business',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, autoReply]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      
      // Extract more specific error information
      // Check most specific errors first, then generic ones
      let displayMessage = 'Sorry, we couldn\'t send your message. Please try the contact form or email us.';
      
      if (errorMessage.includes('expired') || errorMessage.includes('Session has expired')) {
        displayMessage = 'WhatsApp access token has expired. Please contact support to refresh the token.';
      } else if (errorMessage.includes('not in allowed list') || errorMessage.includes('131030')) {
        displayMessage = 'Your phone number needs to be added to the allowed list. Please contact us via email.';
      } else if (errorMessage.includes('Rate limit') || errorMessage.includes('rate limit')) {
        displayMessage = 'Too many messages sent. Please wait a moment and try again.';
      } else if (errorMessage.includes('Invalid OAuth') || errorMessage.includes('invalid token') || errorMessage.includes('Error validating access token')) {
        displayMessage = 'WhatsApp authentication error. Please contact support.';
      } else if (errorMessage.includes('not configured') || (errorMessage.includes('API') && errorMessage.includes('not configured'))) {
        displayMessage = 'WhatsApp is not configured yet. Please use the contact form or email us instead.';
      } else if (errorMessage.length > 0 && errorMessage !== 'Failed to send message') {
        // Show the actual error if it's informative
        displayMessage = `Error: ${errorMessage}. Please try the contact form or email us.`;
      }
      
      const errorReply: Message = {
        id: (Date.now() + 1).toString(),
        text: displayMessage,
        sender: 'business',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transform hover:scale-110 transition-all duration-200 ease-in-out"
          aria-label="Open WhatsApp chat"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            1
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200">
          {/* Chat Header */}
          <div className="bg-green-500 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">{displayBusinessName}</h3>
                <p className="text-xs text-green-100">Typically replies within minutes</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                disabled={isSending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isSending}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                {isSending ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Messages are sent via WhatsApp Business API
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default WhatsAppChat;

