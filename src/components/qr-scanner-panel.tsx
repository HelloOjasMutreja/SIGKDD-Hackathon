"use client";

import { useEffect, useRef, useState } from "react";

type ScanMode = "CHECKIN" | "MEAL";

type ScanResponse = {
  success: boolean;
  result: string;
  team?: {
    id: string;
    name: string;
    status: string;
    checkInStatus: boolean;
    mealClaims: number;
    qrEligible: boolean;
  };
};

type ScannerProps = {
  defaultMode?: ScanMode;
};

export function QrScannerPanel({ defaultMode = "CHECKIN" }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);

  const [mode, setMode] = useState<ScanMode>(defaultMode);
  const [mealSlot, setMealSlot] = useState("LUNCH");
  const [manualPayload, setManualPayload] = useState("");
  const [status, setStatus] = useState<"idle" | "scanning" | "error">("idle");
  const [message, setMessage] = useState("Start the camera or paste a scanned payload.");
  const [response, setResponse] = useState<ScanResponse | null>(null);

  async function stopCamera() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus("idle");
  }

  async function sendScan(payload: string) {
    setStatus("scanning");
    setMessage("Processing scan...");

    const res = await fetch("/api/organizer/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, mode, mealSlot: mode === "MEAL" ? mealSlot : undefined }),
    });

    const data = (await res.json()) as ScanResponse & { error?: string };
    if (!res.ok) {
      const errorMessage = data.error === "missing_token"
        ? "The QR payload is missing."
        : data.error === "missing_meal_slot"
          ? "Select a meal slot first."
          : data.error === "team_not_eligible"
            ? "The scanned team is not approved yet."
            : data.error === "duplicate_checkin"
              ? "This team has already checked in."
              : data.error === "duplicate_meal_claim"
                ? "This meal slot has already been claimed for the team."
                : data.error === "forbidden"
                  ? "Your role cannot perform this action."
                  : "Scan rejected.";
      setStatus("error");
      setMessage(errorMessage);
      setResponse(data);
      await stopCamera();
      return;
    }

    setStatus("idle");
    setMessage(data.result === "meal_recorded" ? "Meal recorded successfully." : "Check-in recorded successfully.");
    setResponse(data);
    await stopCamera();
  }

  async function startCamera() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setMessage("Camera access is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      detectorRef.current = (window as any).BarcodeDetector ? new (window as any).BarcodeDetector({ formats: ["qr_code"] }) : null;
      if (!detectorRef.current) {
        setStatus("error");
        setMessage("This browser does not support built-in QR detection. Use manual payload entry below.");
        return;
      }

      setStatus("scanning");
      setMessage("Camera ready. Point it at a team QR code.");
      timerRef.current = window.setInterval(async () => {
        if (!videoRef.current || !detectorRef.current) {
          return;
        }

        try {
          const detections = await detectorRef.current.detect(videoRef.current);
          const first = detections?.[0];
          if (first?.rawValue) {
            await sendScan(first.rawValue);
          }
        } catch {
          // Ignore frame-level detection failures.
        }
      }, 800);
    } catch {
      setStatus("error");
      setMessage("Camera permission was denied or unavailable.");
    }
  }

  async function handleManualSubmit() {
    if (!manualPayload.trim()) {
      setStatus("error");
      setMessage("Paste a QR payload or team QR URL first.");
      return;
    }

    await sendScan(manualPayload);
  }

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#17324d]">QR Scanner</h2>
            <p className="mt-1 text-sm text-[#4f647b]">Admin, core organizers, and check-in managers only.</p>
          </div>
          <div className="flex gap-2 text-xs font-semibold">
            <button onClick={() => setMode("CHECKIN")} className={`rounded-full border px-3 py-1.5 ${mode === "CHECKIN" ? "border-[#17324d] bg-[#17324d] text-white" : "border-[#cdd8e5] bg-white text-[#17324d]"}`}>Check-in</button>
            <button onClick={() => setMode("MEAL")} className={`rounded-full border px-3 py-1.5 ${mode === "MEAL" ? "border-[#17324d] bg-[#17324d] text-white" : "border-[#cdd8e5] bg-white text-[#17324d]"}`}>Meal</button>
          </div>
        </div>

        {mode === "MEAL" && (
          <label className="mt-4 block text-sm font-medium text-[#17324d]">
            <span>Meal Slot *</span>
            <select value={mealSlot} onChange={(event) => setMealSlot(event.target.value)} className="mt-1 w-full rounded-xl border border-[#cdd8e5] px-3 py-2 text-sm">
              <option value="BREAKFAST">Breakfast</option>
              <option value="LUNCH">Lunch</option>
              <option value="DINNER">Dinner</option>
            </select>
          </label>
        )}

        <div className="mt-4 overflow-hidden rounded-2xl border border-[#cdd8e5] bg-black">
          <video ref={videoRef} className="h-80 w-full object-cover" muted playsInline />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={startCamera} className="rounded-xl bg-[#17324d] px-4 py-2 text-sm font-semibold text-white">Start Camera</button>
          <button onClick={() => void stopCamera()} className="rounded-xl border border-[#cdd8e5] px-4 py-2 text-sm font-semibold text-[#17324d]">Stop Camera</button>
        </div>

        <p className={`mt-4 rounded-lg border px-3 py-2 text-sm ${status === "error" ? "border-red-300 bg-red-50 text-red-800" : "border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
          {message}
        </p>
      </section>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h3 className="text-base font-semibold text-[#17324d]">Manual Scan</h3>
          <p className="mt-1 text-sm text-[#4f647b]">Paste the QR payload or team verification URL if camera scanning is not available.</p>
          <textarea value={manualPayload} onChange={(event) => setManualPayload(event.target.value)} rows={5} className="mt-3 w-full rounded-xl border border-[#cdd8e5] px-3 py-2 text-sm" placeholder='{"teamId":"...","token":"..."} or /verify/... ' />
          <button onClick={() => void handleManualSubmit()} className="mt-3 rounded-xl bg-[#17324d] px-4 py-2 text-sm font-semibold text-white">Process Payload</button>
        </section>

        <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h3 className="text-base font-semibold text-[#17324d]">Scan Result</h3>
          {response?.team ? (
            <div className="mt-3 grid gap-2 text-sm text-[#4f647b]">
              <p><span className="font-semibold text-[#17324d]">Team:</span> {response.team.name}</p>
              <p><span className="font-semibold text-[#17324d]">Team ID:</span> {response.team.id}</p>
              <p><span className="font-semibold text-[#17324d]">Approval:</span> {response.team.status}</p>
              <p><span className="font-semibold text-[#17324d]">Check-in:</span> {response.team.checkInStatus ? "Already checked in" : "Not checked in"}</p>
              <p><span className="font-semibold text-[#17324d]">Meal claims:</span> {response.team.mealClaims}</p>
              <p><span className="font-semibold text-[#17324d]">Eligible:</span> {response.team.qrEligible ? "Yes" : "No"}</p>
              <p><span className="font-semibold text-[#17324d]">Result:</span> {response.result}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#4f647b]">No scan processed yet.</p>
          )}
        </section>
      </aside>
    </div>
  );
}
