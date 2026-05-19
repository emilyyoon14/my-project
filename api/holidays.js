export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") return res.status(200).end();
  
  const { year } = req.body;
  
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: `당신은 한국 임시 공휴일 정보를 JSON으로만 반환하는 봇입니다. 응답은 반드시 다음 형식의 JSON 배열만 출력하세요:
[{"date":"YYYY-MM-DD","name":"공휴일 이름"}, ...]
임시 공휴일이 없으면 빈 배열 []을 반환하세요.`,
        messages: [{ role: "user", content: `${year}년 대한민국 임시 공휴일을 JSON 배열로만 반환하세요.` }]
      })
    });
    
    const data = await response.json();
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    const match = text.match(/\[[\s\S]*?\]/);
    const holidays = match ? JSON.parse(match[0]) : [];
    res.status(200).json({ holidays });
  } catch (e) {
    res.status(500).json({ holidays: [] });
  }
}