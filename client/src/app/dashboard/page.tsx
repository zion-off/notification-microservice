"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { socket } from "@/websocket";
import Chart from "@/components/chart";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { sendEmail, sendSMS } from "@/utils/requests";

export default function Dashboard() {
  const router = useRouter();
  const [emailStats, setEmailStats] = useState([{ healthy: true, window: [] }]);
  const [emailQueueSizes, setEmailQueueSizes] = useState([0, 0, 0]);
  const [smsStats, setSmsStats] = useState([{ healthy: true, window: [] }]);
  const [smsQueueSizes, setSmsQueueSizes] = useState([0, 0, 0]);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [emailRate, setEmailRate] = useState(0);
  const [smsRate, setSmsRate] = useState(0);

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

  function updateQueueSizes(sizes: string) {
    try {
      const data = JSON.parse(sizes);
      if (data.type === "sms") {
        setSmsQueueSizes(data.jobCounts);
      } else if (data.type === "email") {
        setEmailQueueSizes(data.jobCounts);
      }
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
    socket.on("queueSize", updateQueueSizes);
    socket.emit("setup");

    return () => {
      socket.off("emailStats", onEmailStats);
      socket.off("smsStats", onSmsStats);
      socket.off("queueSize", updateQueueSizes);
    };
  }, []);

  const emailIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const smsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (sendingEmails) {
      emailIntervalRef.current = setInterval(() => {
        sendEmail();
      }, Math.round(60000 / emailRate));
    } else {
      if (emailIntervalRef.current) {
        clearInterval(emailIntervalRef.current);
        emailIntervalRef.current = null;
      }
    }
    return () => {
      if (emailIntervalRef.current) {
        clearInterval(emailIntervalRef.current);
      }
    };
  }, [sendingEmails, emailRate]);

  useEffect(() => {
    if (sendingSms) {
      smsIntervalRef.current = setInterval(() => {
        sendSMS();
      }, Math.round(60000 / smsRate));
    } else {
      if (smsIntervalRef.current) {
        clearInterval(smsIntervalRef.current);
        smsIntervalRef.current = null;
      }
    }

    return () => {
      if (smsIntervalRef.current) {
        clearInterval(smsIntervalRef.current);
      }
    };
  }, [sendingSms, smsRate]);

  return (
    <main className="flex flex-col items-center h-full justify-center gap-5 w-full">
      <div className="flex gap-5 w-full justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Email Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex">
              <div className="flex flex-col gap-5">
                {emailStats.map((provider, index) => (
                  <Chart
                    key={index}
                    window={provider.window}
                    healthy={provider.healthy}
                    size={emailQueueSizes[index]}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-1/3">
          <CardHeader>
            <CardTitle>Test Email Providers</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-3">
              <p>Emails per minute</p>
              <div className="flex w-full justify-between text-xxs font-mono">
                <p>0</p>
                <p>1000</p>
              </div>
              <Slider
                defaultValue={[100]}
                max={1000}
                step={1}
                value={[emailRate]}
                onValueChange={(value) => {
                  setEmailRate(value[0]);
                }}
              />

              <p>Window size</p>
              <div className="flex w-full justify-between text-xxs font-mono">
                <p>0</p>
                <p>1000</p>
              </div>
              <Slider defaultValue={[100]} max={1000} step={1} />

              <p>Failure threshold</p>
              <div className="flex w-full justify-between text-xxs font-mono">
                <p>0</p>
                <p>0.9</p>
              </div>
              <Slider defaultValue={[0.7]} min={0.1} max={0.9} step={0.01} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Switch
              checked={sendingEmails}
              onCheckedChange={setSendingEmails}
            />
          </CardFooter>
        </Card>
      </div>

      <div className="flex gap-5 w-full justify-center">
        <Card>
          <CardHeader>
            <CardTitle>SMS Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex">
              <div className="flex flex-col gap-5">
                {smsStats.map((provider, index) => (
                  <Chart
                    key={index}
                    window={provider.window}
                    healthy={provider.healthy}
                    size={smsQueueSizes[index]}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-1/3">
          <CardHeader>
            <CardTitle>Test SMS Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 text-xs">
              <p>Texts per minute</p>
              <div className="flex w-full justify-between text-xxs font-mono">
                <p>0</p>
                <p>1000</p>
              </div>
              <Slider
                defaultValue={[100]}
                max={1000}
                step={1}
                value={[smsRate]}
                onValueChange={(value) => {
                  setSmsRate(value[0]);
                }}
              />

              <p>Window size</p>
              <div className="flex w-full justify-between text-xxs font-mono">
                <p>0</p>
                <p>1000</p>
              </div>
              <Slider defaultValue={[100]} max={1000} step={1} />

              <p>Failure threshold</p>
              <div className="flex w-full justify-between text-xxs font-mono">
                <p>0</p>
                <p>0.9</p>
              </div>
              <Slider defaultValue={[0.7]} min={0.1} max={0.9} step={0.01} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Switch checked={sendingSms} onCheckedChange={setSendingSms} />
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
