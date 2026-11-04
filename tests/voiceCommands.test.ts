import { describe, it, expect } from "vitest";
import {
  parseVoiceIntent,
  normalizeSpeech,
  extractTimerDuration,
} from "@/lib/voice/voiceCommands";

describe("Voice Intent Parser (Multilingual Hands-Free Cooking)", () => {
  describe("Normalization", () => {
    it("strips punctuation and lowers case", () => {
      expect(normalizeSpeech("  Next Step, please! ")).toBe("next step please");
      expect(normalizeSpeech("下一步，唔該！")).toBe("下一步 唔該");
      expect(normalizeSpeech("¿Siguiente paso?")).toBe("siguiente paso");
    });
  });

  describe("Timer Duration Extraction", () => {
    it("extracts minutes from English phrases", () => {
      expect(extractTimerDuration("set timer for 5 minutes")).toBe(300);
      expect(extractTimerDuration("timer 3 mins")).toBe(180);
      expect(extractTimerDuration("10 min")).toBe(600);
    });

    it("extracts seconds from English phrases", () => {
      expect(extractTimerDuration("45 seconds")).toBe(45);
      expect(extractTimerDuration("30 secs")).toBe(30);
    });

    it("extracts minutes and seconds from Chinese phrases", () => {
      expect(extractTimerDuration("計時5分鐘")).toBe(300);
      expect(extractTimerDuration("倒數 3 分鐘")).toBe(180);
      expect(extractTimerDuration("計時 45 秒")).toBe(45);
    });

    it("extracts durations from multilingual phrases", () => {
      expect(extractTimerDuration("5 minutos")).toBe(300);
      expect(extractTimerDuration("10 minuten")).toBe(600);
      expect(extractTimerDuration("3分")).toBe(180);
    });
  });

  describe("Next Step Intent across languages", () => {
    const nextPhrases = [
      "next",
      "next step",
      "go next",
      "I'm done",
      "proceed",
      "下一步",
      "搞掂",
      "完成",
      "下一個",
      "繼續",
      "siguiente",
      "siguiente paso",
      "listo",
      "étape suivante",
      "suivant",
      "weiter",
      "nächster schritt",
      "avanti",
      "prossimo",
      "次へ",
      "次のステップ",
      "다음",
      "다음 단계",
      "próximo passo",
    ];

    nextPhrases.forEach((phrase) => {
      it(`recognizes "${phrase}" as NEXT_STEP`, () => {
        expect(parseVoiceIntent(phrase).type).toBe("NEXT_STEP");
      });
    });
  });

  describe("Previous Step Intent across languages", () => {
    const prevPhrases = [
      "previous",
      "previous step",
      "go back",
      "back",
      "last step",
      "上一步",
      "返去",
      "返上一步",
      "回去",
      "anterior",
      "paso anterior",
      "volver",
      "précédent",
      "étape précédente",
      "zurück",
      "vorheriger schritt",
      "indietro",
      "precedente",
      "前へ",
      "戻る",
      "이전",
      "뒤로",
      "voltar",
    ];

    prevPhrases.forEach((phrase) => {
      it(`recognizes "${phrase}" as PREV_STEP`, () => {
        expect(parseVoiceIntent(phrase).type).toBe("PREV_STEP");
      });
    });
  });

  describe("Repeat Step Intent across languages", () => {
    const repeatPhrases = [
      "repeat",
      "read again",
      "say again",
      "what was that",
      "repeat step",
      "重複",
      "讀多次",
      "再講一次",
      "再說一次",
      "repetir",
      "otra vez",
      "leer de nuevo",
      "répéter",
      "relire",
      "wiederholen",
      "nochmal",
      "ripeti",
      "もう一度",
      "リピート",
      "다시",
      "다시 읽어줘",
    ];

    repeatPhrases.forEach((phrase) => {
      it(`recognizes "${phrase}" as REPEAT_STEP`, () => {
        expect(parseVoiceIntent(phrase).type).toBe("REPEAT_STEP");
      });
    });
  });

  describe("Timer Commands across languages", () => {
    it("recognizes START_TIMER commands", () => {
      expect(parseVoiceIntent("start timer").type).toBe("START_TIMER");
      expect(parseVoiceIntent("resume timer").type).toBe("START_TIMER");
      expect(parseVoiceIntent("開始計時").type).toBe("START_TIMER");
      expect(parseVoiceIntent("iniciar temporizador").type).toBe("START_TIMER");
      expect(parseVoiceIntent("démarrer le minuteur").type).toBe("START_TIMER");
      expect(parseVoiceIntent("タイマースタート").type).toBe("START_TIMER");
      expect(parseVoiceIntent("타이머 시작").type).toBe("START_TIMER");
    });

    it("recognizes PAUSE_TIMER commands", () => {
      expect(parseVoiceIntent("pause timer").type).toBe("PAUSE_TIMER");
      expect(parseVoiceIntent("stop timer").type).toBe("PAUSE_TIMER");
      expect(parseVoiceIntent("暫停計時").type).toBe("PAUSE_TIMER");
      expect(parseVoiceIntent("pausar temporizador").type).toBe("PAUSE_TIMER");
      expect(parseVoiceIntent("pause minuteur").type).toBe("PAUSE_TIMER");
      expect(parseVoiceIntent("timer anhalten").type).toBe("PAUSE_TIMER");
      expect(parseVoiceIntent("タイマーストップ").type).toBe("PAUSE_TIMER");
      expect(parseVoiceIntent("타이머 일시정지").type).toBe("PAUSE_TIMER");
    });

    it("recognizes RESET_TIMER commands", () => {
      expect(parseVoiceIntent("reset timer").type).toBe("RESET_TIMER");
      expect(parseVoiceIntent("重置計時").type).toBe("RESET_TIMER");
      expect(parseVoiceIntent("reiniciar temporizador").type).toBe("RESET_TIMER");
      expect(parseVoiceIntent("réinitialiser le minuteur").type).toBe("RESET_TIMER");
      expect(parseVoiceIntent("タイマーリセット").type).toBe("RESET_TIMER");
    });

    it("recognizes explicit SET_TIMER with extracted seconds", () => {
      const intent1 = parseVoiceIntent("set timer for 5 minutes");
      expect(intent1.type).toBe("SET_TIMER");
      expect(intent1.timerSeconds).toBe(300);

      const intent2 = parseVoiceIntent("計時3分鐘");
      expect(intent2.type).toBe("SET_TIMER");
      expect(intent2.timerSeconds).toBe(180);

      const intent3 = parseVoiceIntent("temporizador 10 minutos");
      expect(intent3.type).toBe("SET_TIMER");
      expect(intent3.timerSeconds).toBe(600);
    });
  });

  describe("Cooking Questions routing", () => {
    it("routes conversational queries and questions to QUESTION", () => {
      expect(parseVoiceIntent("How much salt should I put?").type).toBe("QUESTION");
      expect(parseVoiceIntent("Can I substitute butter with olive oil?").type).toBe("QUESTION");
      expect(parseVoiceIntent("點解啲汁仲未滾？").type).toBe("QUESTION");
      expect(parseVoiceIntent("可唔可以用黑豉油？").type).toBe("QUESTION");
      expect(parseVoiceIntent("¿Cómo sé cuando está cocido el pollo?").type).toBe("QUESTION");
      expect(parseVoiceIntent("Comment savoir si l'huile est assez chaude?").type).toBe("QUESTION");
      expect(parseVoiceIntent("鶏肉の焼き加減はどうやって確認しますか？").type).toBe("QUESTION");
    });
  });
});

