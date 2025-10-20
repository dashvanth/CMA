"use client";

import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function AIPersona() {
  const [isListening, setIsListening] = useState(false);

  const listeningStyle = {
    boxShadow: `0 0 20px 5px hsl(var(--accent)), 0 0 40px 15px hsl(var(--accent) / 0.5), 0 0 60px 30px hsl(var(--accent) / 0.2)`,
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Button
        size="icon"
        className={cn(
          "rounded-full h-16 w-16 bg-primary/20 border-2 border-primary text-primary shadow-lg shadow-black/30 transition-all duration-500 hover:bg-primary/30 hover:shadow-xl hover:shadow-primary/20",
          isListening && "animate-pulse"
        )}
        style={isListening ? listeningStyle : {}}
        onClick={() => setIsListening(!isListening)}
        aria-label="Activate Voice Command"
      >
        <Mic className="h-8 w-8" />
      </Button>
    </div>
  );
}
