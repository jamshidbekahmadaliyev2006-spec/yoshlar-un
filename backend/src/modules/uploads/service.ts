import path from 'path';
import fs from 'fs';
import { env } from '../../config/env';

export class UploadsService {
  static getUploadDir() {
    const dir = path.resolve(process.cwd(), env.UPLOAD_DIR);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }
}

