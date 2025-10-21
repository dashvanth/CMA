"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Loader2 } from "lucide-react";

// --- UI Imports (from your existing /components/ui directory) ---
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// --- AI Flow Import (from the flow created in the previous step) ---
// NOTE: Ensure you have successfully created this file and updated '@/lib/types'
import {
  mindMapContextChat,
  MindMapContextChatOutput,
} from "@/ai/flows/mindmap-context-chat";

// --- Component Props Definition ---
interface ChatModalProps {
  // A function to open/close the modal (passed from parent)
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  // The raw source text used to generate the mind map (the RAG context)
  mindMapContext: string;
  // The main title of the mind map, for context in the header
  mindMapTitle: string;
}

// --- Message Interface for Chat History State ---
interface ChatMessage {
  id: number;
  role: "user" | "bot";
  content: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  setIsOpen,
  mindMapContext,
  mindMapTitle,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Handle sending a message to the Genkit flow
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !mindMapContext) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
    };

    // 1. Update state with the user's message
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 2. Call the server action (Genkit flow)
      const botResponse: MindMapContextChatOutput = await mindMapContextChat({
        userQuestion: userMessage.content,
        context: mindMapContext,
      });

      // 3. Update state with the AI's response
      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "bot",
        content: botResponse.text,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error fetching contextual chat response:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          content:
            "Sorry, an error occurred while connecting to the AI. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Chat Bubble Component
  const ChatBubble: React.FC<ChatMessage> = ({ role, content }) => {
    const isUser = role === "user";
    return (
      <div
        className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`flex max-w-[80%] items-start space-x-2 p-2 rounded-lg ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {/* Icon (only for bot for visual distinction) */}
          {!isUser && (
            <div className="flex-shrink-0 pt-1">
              <Bot className="h-4 w-4" />
            </div>
          )}
          {/* Message Content */}
          <p className="whitespace-pre-wrap text-sm">{content}</p>
          {/* Icon (only for user) */}
          {isUser && (
            <div className="flex-shrink-0 pt-1">
              <User className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Contextual AI Chat
          </DialogTitle>
          <p className="text-sm text-muted-foreground pt-1">
            Asking about: **{mindMapTitle || "Current Mind Map"}**
          </p>
        </DialogHeader>

        <Separator />

        {/* Chat History Area */}
        <ScrollArea ref={scrollRef} className="flex-1 p-4 h-full">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground pt-10">
                <p>Ask a question about the mind map content!</p>
                <p className="text-xs italic mt-1">
                  Try: "What is the relationship between X and Y?"
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <ChatBubble key={msg.id} {...msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm">AI is thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Form */}
        <form onSubmit={handleSend} className="flex space-x-2 p-4 pt-0">
          <Input
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || !mindMapContext}
            autoFocus
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !mindMapContext || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send Message</span>
          </Button>
        </form>
        {!mindMapContext && (
          <p className="text-xs text-red-500 text-center -mt-2">
            **Error:** Context is missing. Please generate a mind map first to
            enable the chat.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
