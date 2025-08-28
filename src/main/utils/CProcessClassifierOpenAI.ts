import OpenAI from "openai";
import {productClassificationPrompt} from "../config/productClassificationPrompt.js"

export const ClasifyByGPT = async (
    cData: [string, string, string][]
): 
Promise<Map<string, { product:string, main: string; sub: string }>> => {  // product -> {product,main,sub}
    
    const products=cData.map(p => `- ${p}`).join('\n')
    // 在每次迴圈依據 product 去獲得。  //用 vercel server 隔離用戶與密文
    const openai = new OpenAI({ apiKey: 'holder' }); 

    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
            role: "user", content: productClassificationPrompt(products)

        }],
    });

    try {
        const content: string | null = response.choices[0].message.content;
        if (content === null) {
            throw new Error("OpenAI 回傳 content 為 null");
        }
        const parsed: { product: string, main: string; sub: string }[] = JSON.parse(content);
        // 印出每筆分類結果（用索引或用 product 名稱對應都可以）
        parsed.forEach(({ product, main, sub }) => {
            console.log(`產品：${product} → 主類別：${main}，次類別：${sub}`);
        });
        // 建立一個 product 對應分類的 map
        const classificationMap = new Map(parsed.map(item => [item.product, item]));
        return (classificationMap)

    } catch (e) {
        console.log('❌ openAI 可能回傳的不是合法 JSON，需要先清洗', e);
        throw new Error("不是 GPT 回傳的 error ， 觸發default error")
    }
}


export const mergeClassification = (
    originalData: [string, string, string][],
    classificationMap: Map<string, { product: string; main: string; sub: string }>
) => {
    // 合併進原始資料
    const enrichedData:[string, string, string, string, string][] = 
    originalData.map(([date, product, cost]) => {
        const { main = '未分類', sub = '未分類' } = classificationMap.get(product) || {};//main沒有值的時候會用未分類字串代替
        return [date, product, cost, main, sub];  // <-- 回傳陣列
    });

        return enrichedData;
    
};
