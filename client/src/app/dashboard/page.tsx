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
import { SMSType, EmailType } from "@/utils/types";

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
  const [unhealthyThreshold, setUnhealthyThreshold] = useState(0.7);
  const [emailResults, setEmailResults] = useState<
    { success: boolean; subject: string; body: string; recipients: string[] }[]
  >([]);
  const [smsResults, setSmsResults] = useState<
    { success: boolean; phone: string; text: string }[]
  >([]);

  const emailContainerRef = useRef<HTMLDivElement | null>(null);
  const smsContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (emailContainerRef.current) {
      emailContainerRef.current.scrollTop =
        emailContainerRef.current.scrollHeight;
    }
  }, [emailResults]);

  useEffect(() => {
    if (smsContainerRef.current) {
      smsContainerRef.current.scrollTop = smsContainerRef.current.scrollHeight;
    }
  }, [smsResults]);

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
        setSmsQueueSizes(data.count);
      } else if (data.type === "email") {
        setEmailQueueSizes(data.count);
      }
    } catch (error) {
      console.log(error);
    }
  }

  function onEmailResult(payload: EmailType, success: boolean) {
    try {
      const { subject, body, recipients } = payload;
      setEmailResults((prev) => [
        ...prev,
        { success, subject, body, recipients },
      ]);
    } catch (error) {
      console.log(error);
    }
  }

  function onSmsResult(payload: SMSType, success: boolean) {
    try {
      const { phone, text } = payload;
      setSmsResults((prev) => [...prev, { success, phone, text }]);
    } catch (error) {
      console.error(error);
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
    socket.on("smsResult", (message) => {
      const { success, payload } = JSON.parse(message);
      onSmsResult(payload, success);
    });

    // Receiving emailResult
    socket.on("emailResult", (message) => {
      const { success, payload } = JSON.parse(message);
      onEmailResult(payload, success);
    });

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

  useEffect(() => {
    socket.emit("updateUnhealthyThreshold", unhealthyThreshold);
  }, [unhealthyThreshold]);

  return (
    <main className="flex flex-col items-center h-full justify-center gap-5 w-full">
      <div className="flex gap-5 w-full justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Email Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
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
          <CardFooter className="text-xxs font-mono">
            <div
              ref={emailContainerRef}
              className="bg-gray-300 text-gray-700  w-full h-8 overflow-scroll"
            >
              {emailResults.map((res, index) => {
                const { success, subject } = res;
                return (
                  <p
                    key={index}
                    className={success ? `bg-green-200` : `bg-red-200`}
                  >
                    {`${success ? "Sent" : "Failed to send"} email ${subject}`}
                  </p>
                );
              })}
            </div>
          </CardFooter>
        </Card>

        <Card className="w-1/3">
          <CardHeader>
            <div className="flex justify-between">
              <CardTitle>Test Email Providers</CardTitle>
              <Switch
                checked={sendingEmails}
                onCheckedChange={setSendingEmails}
              />
            </div>
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
              <Slider defaultValue={[100]} max={1000} step={1} disabled />

              <p>Healthy threshold</p>
              <div className="flex w-full justify-between text-xxs font-mono">
                <p>0</p>
                <p>0.9</p>
              </div>
              <Slider
                defaultValue={[0.7]}
                min={0.1}
                max={0.9}
                step={0.01}
                value={[unhealthyThreshold]}
                onValueChange={(value) => {
                  setUnhealthyThreshold(value[0]);
                }}
              />
            </div>
          </CardContent>
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
          <CardFooter className="text-xxs font-mono">
            <div
              ref={smsContainerRef}
              className="bg-gray-300 text-gray-700 w-full h-8 overflow-scroll"
            >
              {smsResults.map((res, index) => {
                const { success, phone, text } = res;
                return (
                  <p
                    key={index}
                    className={success ? `bg-green-200` : `bg-red-200`}
                  >
                    {`${success ? "Sent" : "Failed to send"} SMS to ${phone}`}
                  </p>
                );
              })}
            </div>
          </CardFooter>
        </Card>

        <Card className="w-1/3">
          <CardHeader>
            <div className="flex justify-between">
              <CardTitle>Test Email Providers</CardTitle>
              <Switch checked={sendingSms} onCheckedChange={setSendingSms} />
            </div>
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
              <Slider defaultValue={[100]} max={1000} step={1} disabled />

              <p>Healthy threshold</p>
              <div className="flex w-full justify-between text-xxs font-mono">
                <p>0</p>
                <p>0.9</p>
              </div>
              <Slider
                defaultValue={[0.7]}
                min={0.1}
                max={0.9}
                step={0.01}
                value={[unhealthyThreshold]}
                onValueChange={(value) => {
                  setUnhealthyThreshold(value[0]);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
