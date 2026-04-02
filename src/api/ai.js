export async function askAiCoach(message, userContext = "") {
  try {
    // Call our Python Backend instead of Google directly!
    const url = `http://localhost:5000/api/ai`;
    
    const contextPrompt = `Sen bir fitness rehberi ve aynı zamanda antrenmanda kullanıcının kafasını dağıtacak, sohbet edecek komik, samimi bir arkadaşsın (Gym Buddy). Adın "FitSync AI". Çok resmi olma, yeri gelince günlük dilde konuş, motivasyon ver, aynı zamanda sporda aralarda sohbet edip stres atabileceği bir dost ol.
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
    
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text;
    }
    
    return "Üzgünüm, şu an cevap veremiyorum.";
  } catch (error) {
    console.error("AI Coach Error:", error);
    return "Sistemsel bir hata oluştu, lütfen daha sonra tekrar deneyin.";
  }
}
