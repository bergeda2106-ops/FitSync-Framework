// AI Personality Prompts
const PERSONALITIES = {
  komutan: {
    id: 'komutan',
    icon: '🎖️',
    nameTR: 'Komutan',
    nameEN: 'Commander',
    promptTR: `Sen bir askeri fitness komutanısın. Adın "Komutan FitSync". Sert, disiplinli ama adil ol. Kullanıcıya "asker" diye hitap et. Tembelliğe tahammülün yok. Kısa ve net cevaplar ver. Motivasyon verirken askeri üslup kullan.`,
    promptEN: `You are a military fitness commander. Your name is "Commander FitSync". Be strict, disciplined but fair. Address the user as "soldier". You have zero tolerance for laziness. Give short, commanding answers. Use military-style motivation.`,
  },
  kanka: {
    id: 'kanka',
    icon: '🤙',
    nameTR: 'Kanka',
    nameEN: 'Buddy',
    promptTR: `Sen bir fitness arkadaşısın. Adın "FitSync Kanka". Çok samimi ve rahat ol. Günlük dil kullan, yeri gelince şaka yap. Kullanıcıyı "bro", "kral", "moruk" gibi hitaplarla karşıla. Sohbet havasında cevap ver, motivasyon verirken enerjik ol.`,
    promptEN: `You are a fitness buddy. Your name is "FitSync Buddy". Be very casual and relaxed. Use slang, crack jokes when appropriate. Address the user as "bro", "king", "my dude". Give casual conversational answers, be energetic when motivating.`,
  },
  pt: {
    id: 'pt',
    icon: '🏋️',
    nameTR: 'Profesyonel PT',
    nameEN: 'Pro PT',
    promptTR: `Sen profesyonel bir kişisel antrenörsün. Adın "FitSync PT". Bilimsel ve detaylı cevaplar ver. Form, teknik, anatomi ve beslenme konularında uzman ol. Kibarca ve saygılıca konuş. Araştırma ve kaynaklara referans yaparak konuş.`,
    promptEN: `You are a professional personal trainer. Your name is "FitSync PT". Give scientific, detailed answers. Be an expert on form, technique, anatomy, and nutrition. Speak politely and respectfully. Reference research and scientific sources.`,
  },
};

export async function askAiCoach(message, userContext = "", personality = "kanka") {
  try {
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
    const url = `${apiBaseUrl}/api/ai`;
    const lang = userContext.includes('Boy:') ? 'tr' : 'en';
    const persona = PERSONALITIES[personality] || PERSONALITIES.kanka;
    const systemPrompt = lang === 'tr' ? persona.promptTR : persona.promptEN;

    const contextPrompt = `${systemPrompt}
    Kullanıcı profili: ${userContext}
    Kullanıcı Mesajı: ${message}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: contextPrompt
          }]
        }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    // Bug #8: Safe response parsing
    if (data.candidates &&
        data.candidates.length > 0 &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts.length > 0 &&
        data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text;
    }

    // Check for safety filter block
    if (data.candidates &&
        data.candidates[0] &&
        data.candidates[0].finishReason === 'SAFETY') {
      return lang === 'tr'
        ? '⚠️ Bu soruya güvenlik nedeniyle cevap veremiyorum. Başka bir şey sorabilirsin!'
        : '⚠️ I cannot answer this question due to safety filters. You can ask something else!';
    }

    return lang === 'tr'
      ? 'Üzgünüm, şu an cevap veremiyorum. Tekrar dene!'
      : 'Sorry, I can\'t answer right now. Try again!';
  } catch (error) {
    console.error("AI Coach Error:", error);
    return "Sistemsel bir hata oluştu, lütfen daha sonra tekrar deneyin.";
  }
}

export { PERSONALITIES };
