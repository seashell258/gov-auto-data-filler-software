import { promises } from "dns";
import {Page,Browser} from "playwright"

export type AutoFillerContext = {
  executablePath: string;
  isDev: boolean;
  failedRows?: string[];
  page: Page;
  //browser: Browser; 好像其實不會用到 browser只是拿來開page的，但我已經開在函數裡封裝開 page 的流程了。
}


export interface IAutoFiller<T> {
  initialize(context:AutoFillerContext): Promise<void>
  /**
   * 執行主要的 dom操作 (自動填表流程)。
   */
  startAutoFill(params: T): Promise<any>; //@Todo 回傳是 failedrows 其實可以改成都要回傳同一格式，用不同的方式去處理
  // 但就比較次要

  //getFailedRows():T[];


}

