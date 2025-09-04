import { RefObject } from "react";
import { commonToastOptions } from "./errorMessageStyles";
import { toast } from "react-toastify";

export function formatTextAreaAndRespond(textRef: RefObject<HTMLTextAreaElement | null>) {
  const inputErrorMessages: string[] = [];
  const parsed: [string, string, string][] | [string, string] = []

  const lines = textRef!.current!.value.split('\n') //render 完成才能按按鈕，所以 current 正常使用都會存在
  for (let index = 0; index < lines.length; index++) { //有幾個換行就跑幾次迴圈
    const trimmed = lines[index].trim(); //一行一行 trim
    if (!trimmed) continue; // 空行跳過

    const parts = trimmed.split(','); //parts = [date,cost,product]
    if (parts.length != 3) {
      inputErrorMessages.push(`第 ${index + 1} 行發票有格式錯誤，透過逗號相隔出的資料不是三筆。錯誤資料如下: ${lines[index]} \n`);
    }
    for (const data of parts) {
      if (data.length === 0) {
        inputErrorMessages.push(`第 ${index + 1} 行發票有格式錯誤，一筆透過逗號相隔出的資料長度為0。錯誤資料如下: ${lines[index]} \n`);
      }
    }

    parsed.push(parts as [string, string, string]);
  }


  if (inputErrorMessages.length > 0) {

    toast.error(inputErrorMessages.join('\n') + "\n資料格式錯誤，請檢查資料哪裡錯誤，更新完之後再次按下更新資料的按紐。", {//跳通知讓使用者知道成功
      ...commonToastOptions,
      onClose: () => textRef.current?.focus(),
    });
    console.log('有 inputErrorMessages，但前後端資料都有送出，前端送出，這樣才能讓使用者填的資料能在切換模式之後仍然保持，不用重填。 但後端資料不會仰賴後續的進一步 checkDataAFormate 來檢查資料。後端就不用送出了?')
    return { ok: false, parsed }
  }
  console.log(' parsed後的 input:', parsed,)
  return { ok: true, parsed }
}