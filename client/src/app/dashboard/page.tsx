"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { socket } from "@/websocket";
import Chart from "@/components/chart";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<number[][] | undefined>();

  useEffect(() => {
    function onStats(stats: string) {
      try {
        console.log(JSON.parse(stats));
        setStats(JSON.parse(stats));
      } catch (error) {
        console.log(error);
      }
    }

    socket.on("stats", onStats);
    return () => {
      socket.off("stats", onStats);
    };
  }, []);

  useEffect(() => {
    if (!socket.connected) {
      router.push("/");
    }
  }, [router, socket.connected]);

  return (
    <main>
      <Chart window={[0, 1, 1]} />
    </main>
  );
}
