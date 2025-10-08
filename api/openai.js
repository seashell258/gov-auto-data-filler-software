import OpenAI from "openai";
import { productClassificationPrompt } from "src/main/config/productClassificationPrompt.js"

export default async function handler(req, res) {
  const { query } = req.body; // 從前端拿到的資料

  const apiKey = process.env.openai_api_key;
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
  }
}
