

export const ClasifyByGPT = async (
    cData: [string, string, string][]
):
    Promise<Map<string, { product: string, main: string; sub: string }>> => {  // product -> {product,main,sub}

    const products = cData.map(p => `${p[1]}`).join('\n') //只取cdata的第二項(產品名稱) 出來組合成字串
    console.log('c data 的 products 字串組合在一起:/n', products)
    // 在每次迴圈依據 product 去獲得。  
    
    //用 vercel server 去呼叫 api，避免 key 洩漏。
    const res = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: products }), // 你要傳給 server 的內容
    });

    const data = await res.json();
    console.log('gpt response via vervel server:', data)

    try {
        const content: string | null = data.choices[0].message.content;
        if (content === null) {
            throw new Error("OpenAI 回傳 content 為 null");
        }
        const parsed: { product: string, main: string; sub: string }[] = JSON.parse(content);
        
        // 印出每筆分類結果（用索引或用 product 名稱對應都可以）
        parsed.forEach(({ product, main, sub }) => {
            console.log(`產品：${product} → 主類別：${main}，次類別：${sub} `);
        });
        // 建立一個 product 對應分類的 map
        const classificationMap = new Map(parsed.map(item => [item.product, item]));
        console.log('classificationMap from clasifybygpt:', classificationMap)
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
    const enrichedData: [string, string, string, string, string][] =
        originalData.map(([date, product, cost]) => {
            const { main = '未分類', sub = '未分類' } = classificationMap.get(product) || {};//main沒有值的時候會用未分類字串代替
            return [date, product, cost, main, sub];  // <-- 回傳陣列
        });

    console.log('enrichedData', enrichedData)
    return enrichedData;

};
