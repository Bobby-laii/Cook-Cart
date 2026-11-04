export type VoiceIntentType =
  | "NEXT_STEP"
  | "PREV_STEP"
  | "REPEAT_STEP"
  | "START_TIMER"
  | "PAUSE_TIMER"
  | "RESET_TIMER"
  | "SET_TIMER"
  | "QUESTION"
  | "UNKNOWN";

export interface ParsedVoiceIntent {
  type: VoiceIntentType;
  rawText: string;
  cleanedText: string;
  timerSeconds?: number;
  confidence?: number;
}

/**
 * Normalizes speech input by trimming, stripping standard punctuation,
 * and converting to lower case for uniform multilingual matching.
 */
export function normalizeSpeech(raw: string): string {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .replace(/[¿¡.,/#!$%^&*;:{}=\-_`~()?"'，。！？、：；]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts minutes/seconds from phrases like:
 * "set timer for 5 minutes", "timer 3 mins", "計時5分鐘", "5 minutes timer", "10 min"
 */
export function extractTimerDuration(normalized: string): number | null {
  // Chinese format: 計時 5 分鐘 / 5 分 / 30 秒
  const zhMinMatch = normalized.match(/(\d+)\s*(?:個)?分鐘?/);
  if (zhMinMatch) {
    const mins = parseInt(zhMinMatch[1], 10);
    if (!isNaN(mins) && mins > 0) return mins * 60;
  }
  const zhSecMatch = normalized.match(/(\d+)\s*秒(?:鐘)?/);
  if (zhSecMatch) {
    const secs = parseInt(zhSecMatch[1], 10);
    if (!isNaN(secs) && secs > 0) return secs;
  }

  // Western format: "5 minutes", "5 min", "5 mins", "30 seconds", "30 sec"
  const minMatch = normalized.match(/(\d+)\s*(?:minutes?|mins?|minuten|minutos|minuti|분)/);
  if (minMatch) {
    const mins = parseInt(minMatch[1], 10);
    if (!isNaN(mins) && mins > 0) return mins * 60;
  }

  const secMatch = normalized.match(/(\d+)\s*(?:seconds?|secs?|sekunden|segundos|secondi|초)/);
  if (secMatch) {
    const secs = parseInt(secMatch[1], 10);
    if (!isNaN(secs) && secs > 0) return secs;
  }

  return null;
}

/**
 * Multilingual keyword definitions for hands-free kitchen voice control.
 * Supports: English, Cantonese/Traditional Chinese, Simplified Chinese,
 * Spanish, French, German, Italian, Japanese, Korean, Portuguese.
 */
const NEXT_PATTERNS = [
  // English
  /(?:^|\s)(next|next step|forward|step forward|continue|done|finished|go next|next please|i'm done|im done|proceed)(?:\s|$)/i,
  // Chinese (Traditional & Simplified / Cantonese)
  /(下一步|下一個|行下一步|搞掂|完成|下步|繼續|做完|下一节|继续|下个步骤)/,
  // Spanish
  /(?:^|\s)(siguiente|siguiente paso|próximo|proximo|continuar|listo|hecho|adelante)(?:\s|$)/i,
  // French
  /(?:^|\s)(suivant|étape suivante|etape suivante|continuer|terminé|termine|fini|suivant s'il vous plaît|suivant svp)(?:\s|$)/i,
  // German
  /(?:^|\s)(weiter|nächster schritt|naechster schritt|nächste|naechste|fertig|fortfahren)(?:\s|$)/i,
  // Italian
  /(?:^|\s)(avanti|prossimo|prossimo passo|continua|fatto|successivo)(?:\s|$)/i,
  // Japanese
  /(次へ|次|次のステップ|つぎ|完了|できた|進む|すすめ)/,
  // Korean
  /(다음|다음 단계|다음단계|완료|넘어가|끝)/,
  // Portuguese
  /(?:^|\s)(próximo|proximo|próximo passo|proximo passo|avançar|avancar|concluído|concluido|pronto)(?:\s|$)/i,
];

const PREV_PATTERNS = [
  // English
  /(?:^|\s)(previous|previous step|back|go back|step back|last step|step backward|return)(?:\s|$)/i,
  // Chinese
  /(上一步|上一個|返去|返上一步|回去|上步|前一步|上个步骤)/,
  // Spanish
  /(?:^|\s)(anterior|paso anterior|atrás|atras|volver|regresar)(?:\s|$)/i,
  // French
  /(?:^|\s)(précédent|precedent|étape précédente|etape precedente|retour|revenir|en arrière|en arriere)(?:\s|$)/i,
  // German
  /(?:^|\s)(zurück|zurueck|vorheriger schritt|vorherige|voriger schritt)(?:\s|$)/i,
  // Italian
  /(?:^|\s)(indietro|precedente|passo precedente|torna indietro)(?:\s|$)/i,
  // Japanese
  /(前へ|戻る|もどる|前のステップ|まえ)/,
  // Korean
  /(이전|뒤로|이전 단계|이전단계)/,
  // Portuguese
  /(?:^|\s)(anterior|passo anterior|voltar|retornar)(?:\s|$)/i,
];

const REPEAT_PATTERNS = [
  // English
  /(?:^|\s)(repeat|read again|say again|what was that|read step|pardon|repeat step|read aloud|say it again|again|what did you say)(?:\s|$)/i,
  // Chinese
  /(重複|讀多次|講多次|再講一次|再說一次|唸一次|重新讀|讀一次|重複一次|再念一遍|念一遍|再读一遍)/,
  // Spanish
  /(?:^|\s)(repetir|leer de nuevo|otra vez|repite|qué dijiste|que dijiste|repite el paso)(?:\s|$)/i,
  // French
  /(?:^|\s)(répéter|repeter|relire|dis encore|répète|repete|lire à nouveau|lire a nouveau)(?:\s|$)/i,
  // German
  /(?:^|\s)(wiederholen|nochmal|noch einmal|vorlesen|wiederhole)(?:\s|$)/i,
  // Italian
  /(?:^|\s)(ripeti|leggi di nuovo|ancora|rileggi|cosa hai detto)(?:\s|$)/i,
  // Japanese
  /(もう一度|もういちど|リピート|もう一回|読み上げて|もう一回言って)/,
  // Korean
  /(다시|다시 읽어줘|반복|다시 말해줘)/,
  // Portuguese
  /(?:^|\s)(repetir|ler de novo|outra vez|repita|diga novamente)(?:\s|$)/i,
];

const RESET_TIMER_PATTERNS = [
  /(?:^|\s)(reset timer|restart timer|clear timer)(?:\s|$)/i,
  /(重置計時|重新計時|還原計時|重設計時|重置|重新倒数|重设计时)/,
  /(?:^|\s)(reiniciar temporizador|restablecer temporizador|reiniciar timer)(?:\s|$)/i,
  /(?:^|\s)(réinitialiser le minuteur|reinitialiser le minuteur|remettre à zéro)(?:\s|$)/i,
  /(?:^|\s)(timer zurücksetzen|timer neustarten)(?:\s|$)/i,
  /(?:^|\s)(azzera timer|reimposta timer|resetta timer)(?:\s|$)/i,
  /(タイマーリセット|初めから)/,
  /(타이머 리셋|타이머 초기화)/,
  /(?:^|\s)(zerar temporizador|zerar timer)(?:\s|$)/i,
];

const PAUSE_TIMER_PATTERNS = [
  /(?:^|\s)(pause timer|stop timer|pause countdown|hold timer|freeze timer|timer pause|stop countdown)(?:\s|$)/i,
  /(暫停計時|停止計時|停一停|暫停|停鐘|暫停倒數|暂停计时|暂停|停止计时)/,
  /(?:^|\s)(pausar temporizador|detener temporizador|parar timer|pausar timer|detén el temporizador)(?:\s|$)/i,
  /(?:^|\s)(pause minuteur|mettre en pause|arrêter le minuteur|arreter le minuteur)(?:\s|$)/i,
  /(?:^|\s)(timer anhalten|timer stoppen|timer pausieren|uhr stoppen)(?:\s|$)/i,
  /(?:^|\s)(metti in pausa|ferma timer|pausa timer|arresta timer)(?:\s|$)/i,
  /(タイマーストップ|タイマー停止|一時停止|止めて)/,
  /(타이머 일시정지|타이머 멈춰|일시 정지|멈춰)/,
  /(?:^|\s)(pausar temporizador|parar temporizador|pausar timer)(?:\s|$)/i,
];

const START_TIMER_PATTERNS = [
  /(?:^|\s)(start timer|resume timer|start countdown|play timer|run timer|timer start|begin timer|unpause timer)(?:\s|$)/i,
  /(開始計時|開計時|繼續計時|倒數|開鐘|啟動計時|开始计时|开始倒数|启动计时)/,
  /(?:^|\s)(iniciar temporizador|iniciar cuenta|comenzar timer|reanudar temporizador|empezar temporizador)(?:\s|$)/i,
  /(?:^|\s)(démarrer le minuteur|demarrer le minuteur|lancer le minuteur|reprendre le minuteur)(?:\s|$)/i,
  /(?:^|\s)(timer starten|timer fortsetzen|countdown starten)(?:\s|$)/i,
  /(?:^|\s)(avvia timer|fai partire il timer|riprendi timer)(?:\s|$)/i,
  /(タイマースタート|タイマー開始|測って|カウントダウン開始)/,
  /(타이머 시작|타이머 재개|카운트다운 시작)/,
  /(?:^|\s)(iniciar timer|começar temporizador|comecar temporizador)(?:\s|$)/i,
];

/**
 * Checks if a string contains question markers across multiple languages.
 */
function isQuestionPhrase(text: string): boolean {
  if (text.endsWith("?") || text.endsWith("？")) return true;
  // Multilingual question starters
  const qStarters = [
    /\b(how|what|can i|could i|should i|why|when|is it|is this|where|do i|how much|how many|substitute|replace)\b/i,
    /(點樣|點解|點解要|可唔可以|要幾耐|要加幾多|係咪|怎樣|怎么|如何|能不能|可不可以|多少|为什么|代替|替換)/,
    /\b(cómo|como|qué|que|puedo|cuánto|cuanto|por qué|porque|se puede)\b/i,
    /\b(comment|pourquoi|est-ce que|puis-je|combien|peut-on|est ce)\b/i,
    /\b(wie|was|kann ich|warum|wann|wie viel|wieviel)\b/i,
    /\b(come|cosa|posso|perché|perche|quanto|quanti)\b/i,
    /(どうやって|なぜ|どうして|どのくらい|代用|できますか|ですか)/,
    /(어떻게|왜|얼마나|할 수 있나요|되나요|대체)/,
  ];
  return qStarters.some((pattern) => pattern.test(text));
}

/**
 * Parses user speech transcript into a categorized Intent.
 * Prioritizes high-urgency kitchen commands (timer, next, prev, repeat)
 * before routing to AI question asking.
 */
export function parseVoiceIntent(rawText: string): ParsedVoiceIntent {
  const cleaned = normalizeSpeech(rawText);
  if (!cleaned) {
    return { type: "UNKNOWN", rawText, cleanedText: cleaned };
  }

  // 1. Explicit Duration / Timer setting ("set timer 5 min", "計時3分鐘")
  const duration = extractTimerDuration(cleaned);
  const mentionsTimerWord =
    /(timer|minute|minuten|minuto|second|sekunde|計時|倒數|秒|分|タイマー|타이머|temporizador|minuteur)/i.test(
      cleaned
    );

  if (
    duration &&
    duration > 0 &&
    (mentionsTimerWord || /^(set|start|give me|開|設)/i.test(cleaned))
  ) {
    return {
      type: "SET_TIMER",
      rawText,
      cleanedText: cleaned,
      timerSeconds: duration,
    };
  }

  // 2. Timer Control Commands
  if (RESET_TIMER_PATTERNS.some((p) => p.test(cleaned))) {
    return { type: "RESET_TIMER", rawText, cleanedText: cleaned };
  }
  if (PAUSE_TIMER_PATTERNS.some((p) => p.test(cleaned))) {
    return { type: "PAUSE_TIMER", rawText, cleanedText: cleaned };
  }
  if (START_TIMER_PATTERNS.some((p) => p.test(cleaned))) {
    return { type: "START_TIMER", rawText, cleanedText: cleaned };
  }

  // 3. Step Navigation Commands
  if (REPEAT_PATTERNS.some((p) => p.test(cleaned))) {
    return { type: "REPEAT_STEP", rawText, cleanedText: cleaned };
  }
  if (NEXT_PATTERNS.some((p) => p.test(cleaned))) {
    return { type: "NEXT_STEP", rawText, cleanedText: cleaned };
  }
  if (PREV_PATTERNS.some((p) => p.test(cleaned))) {
    return { type: "PREV_STEP", rawText, cleanedText: cleaned };
  }

  // 4. Questions or general queries
  if (isQuestionPhrase(cleaned) || cleaned.length > 10) {
    return { type: "QUESTION", rawText, cleanedText: cleaned };
  }

  // 5. Short unrecognized input
  return { type: "QUESTION", rawText, cleanedText: cleaned };
}
