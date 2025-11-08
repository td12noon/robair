import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, MessageCircle, Lightbulb } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-robair-green">
            <Bot className="h-6 w-6 text-background" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-robair-black">AI Assistant</h1>
            <p className="text-robair-black/70">
              Ask questions about your aircraft and get instant, intelligent answers
            </p>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
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
          <CardContent className="flex-1 overflow-auto p-6">
            <div className="space-y-4">
              {/* Welcome Message */}
              <div className="flex space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-robair-green">
                  <Bot className="h-4 w-4 text-background" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="bg-robair-light rounded-lg p-3 max-w-md">
                    <p className="text-sm">
                      👋 Hi! I'm your Rob Air assistant. I can help you with questions about your aircraft,
                      maintenance records, flight history, and more. What would you like to know?
                    </p>
                  </div>
                  <div className="text-xs text-robair-black/50">Just now</div>
                </div>
              </div>

              {/* Placeholder for future messages */}
              <div className="text-center py-8 text-robair-black/50">
                <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Start a conversation by typing a message below</p>
              </div>
            </div>
          </CardContent>

          {/* Chat Input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Ask about your aircraft, maintenance, flights..."
                className="flex-1"
                disabled
              />
              <Button disabled>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-robair-black/50 mt-2">
              AI chat will be enabled once OpenAI API is configured
            </p>
          </div>
        </Card>
      </div>

      {/* Example Questions */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5" />
              Example Questions
            </CardTitle>
            <CardDescription>
              Here are some examples of what you can ask the AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-robair-black">Maintenance Questions</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-robair-light rounded cursor-pointer hover:bg-robair-light/80">
                    "When was the last oil change?"
                  </div>
                  <div className="p-2 bg-robair-light rounded cursor-pointer hover:bg-robair-light/80">
                    "What maintenance is due this month?"
                  </div>
                  <div className="p-2 bg-robair-light rounded cursor-pointer hover:bg-robair-light/80">
                    "Show me propeller maintenance history"
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-robair-black">Flight Questions</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-robair-light rounded cursor-pointer hover:bg-robair-light/80">
                    "How many flights to LAX this year?"
                  </div>
                  <div className="p-2 bg-robair-light rounded cursor-pointer hover:bg-robair-light/80">
                    "What's my total flight time?"
                  </div>
                  <div className="p-2 bg-robair-light rounded cursor-pointer hover:bg-robair-light/80">
                    "Where did I fly last weekend?"
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-robair-green/10 rounded-lg">
                <Sparkles className="h-6 w-6 text-robair-green" />
              </div>
              <CardTitle>Smart Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              Get intelligent analysis of your flight patterns, maintenance trends, and aircraft performance.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-robair-green/10 rounded-lg">
                <MessageCircle className="h-6 w-6 text-robair-green" />
              </div>
              <CardTitle>Natural Language</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              Ask questions in plain English and get clear, helpful answers about your aircraft data.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-robair-green/10 rounded-lg">
                <Bot className="h-6 w-6 text-robair-green" />
              </div>
              <CardTitle>24/7 Available</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              Your AI assistant is always ready to help with aircraft information and aviation questions.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Setup Notice */}
      <Card className="border-dashed bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800">Setup Required</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700 mb-4">
            To enable the AI assistant, you'll need to configure your OpenAI API key in the environment variables.
          </p>
          <Button variant="outline">
            View Setup Instructions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}