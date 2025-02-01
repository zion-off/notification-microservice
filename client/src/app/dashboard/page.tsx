"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Reorder } from "motion/react";
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
import { Button } from "@/components/ui/button";
import { sendEmail, sendSMS } from "@/utils/requests";
import { SMSType, EmailType } from "@/utils/types";

type ProviderType = {
  id: number;
  provider_type: string;
  provider_name: string;
  provider_key: string;
  priority: number;
};

export default function Dashboard() {
  const router = useRouter();
  const [emailStats, setEmailStats] = useState([
    { name: "", healthy: true, window: [] },
  ]);
  const [emailQueueSizes, setEmailQueueSizes] = useState([0, 0, 0]);
  const [smsStats, setSmsStats] = useState([
    { name: "", healthy: true, window: [] },
  ]);
  const [smsQueueSizes, setSmsQueueSizes] = useState([0, 0, 0]);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [emailRate, setEmailRate] = useState(1);
  const [smsRate, setSmsRate] = useState(1);
  const [unhealthyThreshold, setUnhealthyThreshold] = useState(0.7);
  const [emailResults, setEmailResults] = useState<
    { success: boolean; subject: string; body: string; recipients: string[] }[]
  >([]);
  const [smsResults, setSmsResults] = useState<
    { success: boolean; phone: string; text: string }[]
  >([]);
  const [emailProviders, setEmailProviders] = useState<ProviderType[]>([]);
  const [smsProviders, setSmsProviders] = useState<ProviderType[]>([]);

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

  function onInitialEmailList(providers: ProviderType[]) {
    setEmailProviders(providers);
  }

  function onInitialSmsList(providers: ProviderType[]) {
    setSmsProviders(providers);
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

    // Receiving smsResult
    socket.on("smsResult", (message) => {
      const { success, payload } = JSON.parse(message);
      onSmsResult(payload, success);
    });

    // Receiving emailResult
    socket.on("emailResult", (message) => {
      const { success, payload } = JSON.parse(message);
      onEmailResult(payload, success);
    });

    socket.on("initialEmailProviderOrder", (message) => {
      const initialPriorities = JSON.parse(message);
      onInitialEmailList(initialPriorities);
    });

    socket.on("initialSmsProviderOrder", (message) => {
      const initialPriorities = JSON.parse(message);
      onInitialSmsList(initialPriorities);
    });

    return () => {
      socket.off("emailStats", onEmailStats);
      socket.off("smsStats", onSmsStats);
      socket.off("queueSize", updateQueueSizes);
    };
  }, []);

  function updateEmailProviders(newOrder: ProviderType[]) {
    const reordered = [];
    for (const [index, provider] of newOrder.entries()) {
      reordered[index] = provider;
      reordered[index].priority = index + 1;
    }
    setEmailProviders(reordered);
    socket.emit("emailPriority", JSON.stringify({ emailProviders: reordered }));
    console.log(reordered);
  }

  function updateSmsProviders(newOrder: ProviderType[]) {
    const reordered = [];
    for (const [index, provider] of newOrder.entries()) {
      reordered[index] = provider;
      reordered[index].priority = index + 1;
    }
    setSmsProviders(reordered);
    socket.emit("smsPriority", JSON.stringify({ smsProviders: reordered }));
  }

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
                    name={provider.name}
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
            <div className="flex justify-between items-center">
              <CardTitle>Test Email Providers</CardTitle>
              <div className="flex gap-2 items-center">
                <Send
                  onClick={sendEmail}
                  className="cursor-pointer rounded-sm bg-input p-1 size-5 cursor-pointer rounded-sm bg-input p-1 size-5 fill-neutral-400 stroke-neutral-400 hover:bg-neutral-300 hover:stroke-neutral-500 hover:fill-neutral-500"
                />
                <Switch
                  checked={sendingEmails}
                  onCheckedChange={setSendingEmails}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-3">
              <p>Emails per minute</p>
              <div className="flex w-full justify-between text-xxs font-mono">
                <p>1</p>
                <p>1000</p>
              </div>
              <Slider
                defaultValue={[100]}
                min={1}
                max={1000}
                step={1}
                value={[emailRate]}
                onValueChange={(value) => {
                  setEmailRate(value[0]);
                }}
              />

              <p>Healthy threshold</p>
              <div className="flex w-full justify-between text-xxs font-mono">
                <p>0.1</p>
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
              <Reorder.Group
                axis="y"
                values={emailProviders}
                onReorder={updateEmailProviders}
              >
                <div className="flex flex-col h-full gap-2 py-2 justify-between">
                  {emailProviders.map((item) => (
                    <Reorder.Item key={item.id} value={item}>
                      <div className=" shadow-sm cursor-move rounded-sm p-2 bg-neutral-100">
                        <span>{item.provider_name}</span>
                      </div>
                    </Reorder.Item>
                  ))}
                </div>
              </Reorder.Group>
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
                    name={provider.name}
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
            <div className="flex justify-between items-center">
              <CardTitle>Test SMS Providers</CardTitle>

              <div className="flex gap-2 items-center">
                <Send
                  onClick={sendSMS}
                  className="cursor-pointer rounded-sm bg-input p-1 size-5 fill-neutral-400 stroke-neutral-400 hover:bg-neutral-300 hover:stroke-neutral-500 hover:fill-neutral-500"
                />
                <Switch checked={sendingSms} onCheckedChange={setSendingSms} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 text-xs">
              <p>Texts per minute</p>
              <div className="flex w-full justify-between text-xxs font-mono">
                <p>1</p>
                <p>1000</p>
              </div>
              <Slider
                defaultValue={[100]}
                min={1}
                max={1000}
                step={1}
                value={[smsRate]}
                onValueChange={(value) => {
                  setSmsRate(value[0]);
                }}
              />

              <p>Healthy threshold</p>
              <div className="flex w-full justify-between text-xxs font-mono">
                <p>0.1</p>
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

              <Reorder.Group
                axis="y"
                values={smsProviders}
                onReorder={updateSmsProviders}
              >
                <div className="flex flex-col h-full gap-2 py-2 justify-between">
                  {smsProviders.map((item) => (
                    <Reorder.Item key={item.id} value={item}>
                      <div className=" shadow-sm cursor-move rounded-sm p-2 bg-neutral-100">
                        <span>{item.provider_name}</span>
                      </div>
                    </Reorder.Item>
                  ))}
                </div>
              </Reorder.Group>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
