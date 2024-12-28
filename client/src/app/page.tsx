"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { socket } from "@/websocket";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [connecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // called by button
  function connect() {
    if (!socket.connected) {
      setIsConnecting(true);
      socket.connect();
      setIsConnecting(false);
    }
  }

  useEffect(() => {
    // called by socketio upon connection
    function onConnect() {
      toast({
        title: "Connected!",
        description: "Redirecting to dashboard...",
        duration: 1000,
      });
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    }

    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect);
    };
  }, []);

  return (
    <div className="flex flex-col h-full justify-center items-center gap-2">
      <p>Connect to server to get started.</p>
      <Button
        onClick={connect}
        className={`w-1/4 ${connecting ? "animate-pulse" : ""}`}
      >
        Connect
      </Button>
    </div>
  );
}
