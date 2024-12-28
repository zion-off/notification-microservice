"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { socket } from "@/websocket";
import Chart from "@/components/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Dashboard() {
  const router = useRouter();
  const [emailStats, setEmailStats] = useState([{ healthy: true, window: [] }]);
  const [smsStats, setSmsStats] = useState([{ healthy: true, window: [] }]);

  function onEmailStats(stats: string) {
    try {
      setEmailStats(JSON.parse(stats).emailStats);
    } catch (error) {
      console.log(error);
    }
  }

  function onSmsStats(stats: string) {
    try {
      setSmsStats(JSON.parse(stats).smsStats);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (!socket.connected) {
      router.push("/");
      return;
    }

    socket.on("emailStats", onEmailStats);
    socket.on("smsStats", onSmsStats);
    socket.emit("setup");

    return () => {
      socket.off("emailStats", onEmailStats);
      socket.off("smsStats", onSmsStats);
    };
  }, []);

  return (
    <main className="flex flex-col items-center h-full justify-center gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Email Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex">
            {/* queues */}
            <div className="flex flex-col gap-5">
              {emailStats.map((provider, index) => (
                <Chart
                  key={index}
                  window={provider.window}
                  healthy={provider.healthy}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SMS Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex">
            {/* queues */}
            <div className="flex flex-col gap-5">
              {smsStats.map((provider, index) => (
                <Chart
                  key={index}
                  window={provider.window}
                  healthy={provider.healthy}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
