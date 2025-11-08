"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Loader2 } from "lucide-react";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map(msg => ({ role: msg.role, content: msg.content }))
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp || new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your message. Please try again.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const exampleQuestions = [
    "How many Angel Flights did I fly this year?",
    "What's my total flight time?",
    "Show me my recent flights to KBGR",
    "What maintenance is coming due?",
    "How many nautical miles have I flown?",
    "What's my longest flight this year?"
  ];

  const handleExampleClick = (question: string) => {
    setInputValue(question);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <CardTitle>Rob Air Assistant</CardTitle>
            <div className="text-xs text-robair-black/50">Online</div>
          </div>
        </CardHeader>

        {/* Chat Messages Area */}
        <CardContent className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            {/* Welcome Message */}
            <div className="flex space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-robair-green flex-shrink-0 mt-1">
                <Bot className="h-4 w-4 text-background" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="bg-robair-light rounded-lg p-3 max-w-md">
                  <p className="text-sm">
                    👋 Hi! I'm your Rob Air assistant. I have access to your flight data and can help answer questions about your aircraft, flights, and maintenance. What would you like to know?
                  </p>
                </div>
                <div className="text-xs text-robair-black/50">Just now</div>
              </div>
            </div>

            {/* Chat Messages */}
            {messages.map((message, index) => (
              <div key={index} className={`flex space-x-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-robair-green flex-shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-background" />
                  </div>
                )}
                <div className={`flex-1 space-y-2 ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                  <div className={`rounded-lg p-3 max-w-md ${
                    message.role === 'user'
                      ? 'bg-robair-green text-background ml-auto'
                      : 'bg-robair-light'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <div className="text-xs text-robair-black/50">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-robair-black flex-shrink-0 mt-1">
                    <User className="h-4 w-4 text-background" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-robair-green flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-background" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="bg-robair-light rounded-lg p-3 max-w-md">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-sm">Thinking...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Example Questions (show only if no messages yet) */}
            {messages.length === 0 && (
              <div className="space-y-3 pt-4">
                <p className="text-sm text-robair-black/70 font-medium">Try asking:</p>
                <div className="grid grid-cols-1 gap-2">
                  {exampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(question)}
                      className="text-left p-2 bg-robair-light/50 rounded-lg hover:bg-robair-light transition-colors text-sm"
                    >
                      "{question}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        {/* Chat Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your aircraft, flights, maintenance..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button onClick={sendMessage} disabled={isLoading || !inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}