"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, Sparkles, HelpCircle, X, Globe, AlertCircle } from "lucide-react";
import { parseVoiceIntent, ParsedVoiceIntent } from "@/lib/voice/voiceCommands";
import { playAcknowledgeChime, playQuestionChime } from "@/lib/voice/soundEffects";

export interface CookingVoiceAssistantProps {
  currentStepIndex: number;
  totalSteps: number;
  stepTitle: string;
  stepText: string;
  recipeTitle: string;
  isTimerRunning: boolean;
  onNextStep: () => void;
  onPrevStep: () => void;
  onRepeatStep: () => void;
  onStartTimer: (seconds?: number) => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  defaultLanguage?: string;
  isZh?: boolean;
}

const SUPPORTED_VOICE_LANGS = [
  { code: "auto", label: "Auto (Device / 系統語言)" },
  { code: "en-US", label: "English (US / UK / Global)" },
  { code: "zh-HK", label: "粵語 / Cantonese (HK)" },
  { code: "zh-CN", label: "普通話 / Mandarin (CN)" },
  { code: "zh-TW", label: "國語 / Mandarin (TW)" },
  { code: "es-ES", label: "Español (Spanish)" },
  { code: "fr-FR", label: "Français (French)" },
  { code: "de-DE", label: "Deutsch (German)" },
  { code: "it-IT", label: "Italiano (Italian)" },
  { code: "ja-JP", label: "日本語 (Japanese)" },
  { code: "ko-KR", label: "한국어 (Korean)" },
  { code: "pt-BR", label: "Português (Portuguese)" },
];

export function CookingVoiceAssistant({
  currentStepIndex,
  totalSteps,
  stepTitle,
  stepText,
  recipeTitle,
  isTimerRunning,
  onNextStep,
  onPrevStep,
  onRepeatStep,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  defaultLanguage,
  isZh = false,
}: CookingVoiceAssistantProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>("auto");
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [lastAction, setLastAction] = useState<string>("");
  const [chefResponse, setChefResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const shouldListenRef = useRef<boolean>(false);
  const restartTimeoutRef = useRef<any>(null);

  // Determine actual BCP 47 language code to pass to SpeechRecognition
  const getActiveLangCode = useCallback(() => {
    if (selectedLang !== "auto") return selectedLang;
    if (defaultLanguage && defaultLanguage.includes("zh")) return "zh-HK";
    if (typeof navigator !== "undefined" && navigator.language) return navigator.language;
    return "en-US";
  }, [selectedLang, defaultLanguage]);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(Boolean(SpeechRecognitionClass));
  }, []);

  // Speak a phrase aloud using SpeechSynthesis
  const speakText = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getActiveLangCode();
      utterance.rate = 0.95;

      utterance.onstart = () => {
        setIsSpeaking(true);
        isSpeakingRef.current = true;
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      };

      synth.speak(utterance);
    },
    [getActiveLangCode]
  );

  // Ask AI Chef a cooking question
  const askChefQuestion = useCallback(
    async (question: string) => {
      setIsThinking(true);
      setChefResponse(null);
      playQuestionChime();

      try {
        const prompt = `Recipe: "${recipeTitle}". Step ${currentStepIndex + 1}/${totalSteps}: "${stepTitle} - ${stepText}". User question: "${question}". Please provide a direct, practical, 1-2 sentence spoken reply suited for a cook with busy hands.`;

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: `voice_cook_${Date.now()}`,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.message || (isZh ? "我明白，請繼續保持穩定火候！" : "Keep steady heat, you're doing great!");
          setChefResponse(reply);
          speakText(reply);
        } else {
          // Graceful fallback for offline / unauthenticated users
          const fallback = isZh
            ? "保持適中火候，聞到香氣微金黃即刻翻面或轉慢火，隨時試味！"
            : "Keep moderate heat and watch for the aroma — once it smells fragrant and edges turn golden, you're right on track!";
          setChefResponse(fallback);
          speakText(fallback);
        }
      } catch (err) {
        const fallback = isZh
          ? "保持適中火候，隨時試味調整，你做得好好！"
          : "Keep heat steady and taste as you go — you're doing great!";
        setChefResponse(fallback);
        speakText(fallback);
      } finally {
        setIsThinking(false);
      }
    },
    [recipeTitle, currentStepIndex, totalSteps, stepTitle, stepText, speakText, isZh]
  );

  // Handle incoming recognized voice intent
  const handleVoiceCommand = useCallback(
    (intent: ParsedVoiceIntent) => {
      // Don't react to self-spoken words while the assistant is speaking aloud
      if (isSpeakingRef.current) return;

      switch (intent.type) {
        case "NEXT_STEP":
          setLastAction(isZh ? "執行：下一步" : "Action: Next Step");
          playAcknowledgeChime();
          onNextStep();
          break;

        case "PREV_STEP":
          setLastAction(isZh ? "執行：上一步" : "Action: Previous Step");
          playAcknowledgeChime();
          onPrevStep();
          break;

        case "REPEAT_STEP":
          setLastAction(isZh ? "執行：重讀此步驟" : "Action: Repeat Step");
          playAcknowledgeChime();
          onRepeatStep();
          speakText(stepText);
          break;

        case "START_TIMER":
          setLastAction(isZh ? "執行：開始計時" : "Action: Start Timer");
          playAcknowledgeChime();
          onStartTimer();
          break;

        case "PAUSE_TIMER":
          setLastAction(isZh ? "執行：暫停計時" : "Action: Pause Timer");
          playAcknowledgeChime();
          onPauseTimer();
          break;

        case "RESET_TIMER":
          setLastAction(isZh ? "執行：重置計時" : "Action: Reset Timer");
          playAcknowledgeChime();
          onResetTimer();
          break;

        case "SET_TIMER":
          setLastAction(
            isZh
              ? `執行：設定計時器 (${Math.round((intent.timerSeconds || 60) / 60)} 分鐘)`
              : `Action: Set Timer (${Math.round((intent.timerSeconds || 60) / 60)} min)`
          );
          playAcknowledgeChime();
          onStartTimer(intent.timerSeconds);
          break;

        case "QUESTION":
          setLastAction(isZh ? "向廚師提問中…" : "Asking Chef…");
          askChefQuestion(intent.rawText);
          break;

        default:
          break;
      }
    },
    [
      isZh,
      onNextStep,
      onPrevStep,
      onRepeatStep,
      onStartTimer,
      onPauseTimer,
      onResetTimer,
      stepText,
      speakText,
      askChefQuestion,
    ]
  );

  // Start continuous listening loop
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setErrorMessage(
        isZh
          ? "您的瀏覽器不支援語音識別。建議使用 Chrome、Edge 或 Safari。"
          : "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = getActiveLangCode();
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult && lastResult[0]) {
          const transcript = lastResult[0].transcript.trim();
          setLastTranscript(transcript);
          const parsed = parseVoiceIntent(transcript);
          handleVoiceCommand(parsed);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "no-speech") return; // Normal quiet pause in the kitchen
        if (event.error === "not-allowed") {
          setIsListening(false);
          shouldListenRef.current = false;
          setErrorMessage(
            isZh
              ? "麥克風權限已被拒絕。請在瀏覽器設定中開啟麥克風權限以使用免提助手。"
              : "Microphone access was denied. Please allow microphone permission to use hands-free mode."
          );
        }
      };

      recognition.onend = () => {
        // Automatically restart listening if hands-free mode is toggled ON
        if (shouldListenRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (shouldListenRef.current) {
              try {
                recognition.start();
              } catch {
                // If start fails, retry after brief backoff
              }
            }
          }, 300);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      shouldListenRef.current = true;
      recognition.start();
    } catch (e) {
      console.warn("Speech recognition failed to start:", e);
    }
  }, [getActiveLangCode, handleVoiceCommand, isZh]);

  // Stop listening
  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    clearTimeout(restartTimeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm text-stone-600 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-stone-400 shrink-0" />
        <div>
          <span className="font-bold text-stone-800">
            {isZh ? "免提語音助理" : "Hands-Free Voice Assistant"}
          </span>
          <p className="text-xs text-stone-500 mt-0.5">
            {isZh
              ? "此瀏覽器尚未支援 Web Speech 語音輸入，請使用 Chrome、Edge 或 Safari 體驗全免提烹飪操作。"
              : "Voice recognition isn't supported in this browser. Use Chrome, Edge, or Safari to cook hands-free."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 md:p-4 transition-all">
      {/* Top Controller Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Mic Activation Button (Greasy finger friendly >= 48px) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleListening}
            aria-pressed={isListening}
            className={`min-h-[48px] px-4 rounded-xl flex items-center gap-2.5 font-bold text-sm md:text-base transition-all select-none ${
              isListening
                ? "bg-[#2A4FBF] text-white ring-4 ring-[#F5C842]/40 shadow-sm"
                : "bg-stone-100 border-2 border-stone-300 text-stone-900 hover:border-[#2A4FBF]"
            }`}
          >
            <div className="relative">
              {isListening ? (
                <>
                  <Mic className="w-5 h-5 text-white animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#F5C842] animate-ping" />
                </>
              ) : (
                <MicOff className="w-5 h-5 text-stone-500" />
              )}
            </div>
            <span>
              {isListening
                ? isZh
                  ? "免提監聽中…"
                  : "Hands-Free Listening…"
                : isZh
                ? "開啟免提語音"
                : "Enable Hands-Free Voice"}
            </span>
          </button>

          {/* Spoken language selector */}
          <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-300 rounded-xl px-2.5 h-[48px] text-xs md:text-sm text-stone-800">
            <Globe className="w-4 h-4 text-stone-500 shrink-0" />
            <select
              value={selectedLang}
              onChange={(e) => {
                setSelectedLang(e.target.value);
                if (isListening) {
                  stopListening();
                  setTimeout(() => startListening(), 200);
                }
              }}
              className="bg-transparent border-none text-stone-900 font-medium focus:outline-none cursor-pointer pr-1"
              title={isZh ? "選擇語音識別語言" : "Select spoken language"}
            >
              {SUPPORTED_VOICE_LANGS.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-stone-50 text-stone-900">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cheat sheet guide & status */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="min-h-[48px] px-3 rounded-xl border border-stone-200 bg-stone-100 hover:border-stone-400 text-stone-700 flex items-center gap-1.5 text-xs md:text-sm font-medium"
            title={isZh ? "查看支援的語音指令" : "View supported voice commands"}
          >
            <HelpCircle className="w-4 h-4 text-stone-500" />
            <span>{isZh ? "語音指令清單" : "Spoken Commands"}</span>
          </button>
        </div>
      </div>

      {/* Error alert if mic was blocked */}
      {errorMessage && (
        <div className="mt-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl p-2.5 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Live Speech Feedback Stream */}
      {(isListening || lastTranscript || chefResponse || isThinking || isSpeaking) && (
        <div className="mt-3 pt-3 border-t border-stone-200/80 space-y-2 text-sm">
          {/* Transcript bubble */}
          {lastTranscript && (
            <div className="flex items-start gap-2 text-stone-700 bg-stone-100 p-2.5 rounded-xl border border-stone-200">
              <span className="text-xs font-bold text-stone-500 shrink-0 uppercase tracking-wide mt-0.5">
                {isZh ? "你說：" : "Heard:"}
              </span>
              <span className="font-medium text-stone-900">“{lastTranscript}”</span>
              {lastAction && (
                <span className="ml-auto inline-block text-xs font-bold px-2 py-0.5 rounded-md bg-[#2A4FBF]/10 text-[#2A4FBF]">
                  {lastAction}
                </span>
              )}
            </div>
          )}

          {/* AI Chef Thought / Response Bubble */}
          {isThinking && (
            <div className="flex items-center gap-2 text-xs font-medium text-stone-700 bg-stone-100 p-2.5 rounded-xl border border-stone-200">
              <Sparkles className="w-4 h-4 text-brand-500 animate-spin" />
              <span>{isZh ? "廚師正在組織答覆…" : "Chef is formulating answer…"}</span>
            </div>
          )}

          {chefResponse && (
            <div className="flex items-start gap-2 text-stone-900 bg-stone-100 p-3 rounded-xl border-2 border-[#2A4FBF]/40">
              <div className="w-6 h-6 rounded-full bg-[#2A4FBF] text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                🧑‍🍳
              </div>
              <div className="flex-1 text-sm leading-relaxed">
                <span className="font-bold text-[#2A4FBF] mr-1.5">
                  {isZh ? "廚師回答：" : "Chef:"}
                </span>
                <span>{chefResponse}</span>
              </div>
              {isSpeaking && (
                <Volume2 className="w-4 h-4 text-[#2A4FBF] animate-pulse shrink-0 mt-1" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Voice Cheat Sheet Drawer */}
      {showHelp && (
        <div className="mt-3 pt-3 border-t border-stone-200 text-xs text-stone-700 space-y-2 bg-stone-100 p-3.5 rounded-xl border border-stone-200">
          <div className="flex items-center justify-between pb-1 border-b border-stone-200">
            <span className="font-bold text-stone-900 text-sm">
              {isZh ? "免提語音指令指南" : "Hands-Free Voice Commands Guide"}
            </span>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="p-1 text-stone-500 hover:text-stone-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
              <span className="font-bold text-stone-800">
                {isZh ? "👉 下一步 (Next Step)" : "👉 Next Step"}
              </span>
              <p className="text-stone-500 mt-0.5">
                &ldquo;Next&rdquo;, &ldquo;Next step&rdquo;, &ldquo;下一步&rdquo;, &ldquo;搞掂&rdquo;, &ldquo;Siguiente&rdquo;, &ldquo;Suivant&rdquo;, &ldquo;次へ&rdquo;
              </p>
            </div>
            <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
              <span className="font-bold text-stone-800">
                {isZh ? "👈 上一步 (Previous Step)" : "👈 Previous Step"}
              </span>
              <p className="text-stone-500 mt-0.5">
                &ldquo;Previous&rdquo;, &ldquo;Back&rdquo;, &ldquo;上一步&rdquo;, &ldquo;返去&rdquo;, &ldquo;Anterior&rdquo;, &ldquo;Retour&rdquo;, &ldquo;戻る&rdquo;
              </p>
            </div>
            <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
              <span className="font-bold text-stone-800">
                {isZh ? "🔁 重讀此步驟 (Repeat)" : "🔁 Repeat Current Step"}
              </span>
              <p className="text-stone-500 mt-0.5">
                &ldquo;Repeat&rdquo;, &ldquo;Read again&rdquo;, &ldquo;重複&rdquo;, &ldquo;讀多次&rdquo;, &ldquo;Repetir&rdquo;, &ldquo;Répéter&rdquo;, &ldquo;もう一度&rdquo;
              </p>
            </div>
            <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
              <span className="font-bold text-stone-800">
                {isZh ? "⏱️ 計時器控制 (Timers)" : "⏱️ Timer Controls"}
              </span>
              <p className="text-stone-500 mt-0.5">
                &ldquo;Start timer&rdquo;, &ldquo;Pause timer&rdquo;, &ldquo;Reset timer&rdquo;, &ldquo;開始計時&rdquo;, &ldquo;暫停計時&rdquo;, &ldquo;計時5分鐘&rdquo;
              </p>
            </div>
          </div>
          <div className="bg-[#2A4FBF]/5 border border-[#2A4FBF]/20 p-2.5 rounded-lg text-stone-700">
            <span className="font-bold text-[#2A4FBF]">
              {isZh ? "💡 隨時提問廚師：" : "💡 Ask Cooking Questions Anytime:"}
            </span>
            <span className="ml-1 text-stone-600">
              {isZh
                ? "直接講「要加幾多生抽？」、「可用牛油代替嗎？」、「點樣知熟未？」，廚師會即時用語音解答！"
                : "Ask 'How much salt?', 'Can I use olive oil?', 'How do I know it is browned?', and Chef answers aloud!"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

