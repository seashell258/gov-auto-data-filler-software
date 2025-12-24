import { app, shell } from 'electron';
import path from 'path';
import fs from 'fs';

export function getPdfFolderPath() {
  return path.join(
    app.getPath('desktop'),
    'B 模式的公告 pdf 存在這裡'
  );
}
