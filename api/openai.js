import OpenAI from "openai";
import { productClassificationPrompt } from "../src/main/config/productClassificationPrompt.ts"

export default async function handler(req, res) {
  console.log('handler called', req.method, req.body);

  const { query } = req.body; // 從前端拿到的資料

  const apiKey = process.env.OPENAI_API_KEY;
  const openai = new OpenAI({ apiKey: apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "user", content: productClassificationPrompt(query)

      }],
    });

    res.status(200).json(response);
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: "OpenAI API call failed" });
  }
}
