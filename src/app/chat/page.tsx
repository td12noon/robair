import { Bot } from "lucide-react";
import { ChatInterface } from "@/components/chat-interface";

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
      <ChatInterface />
    </div>
  );
}