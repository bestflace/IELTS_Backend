import { buildR2FileUrl, getR2Client, getR2Config } from "../../config/r2";

export { buildR2FileUrl, getR2Client, getR2Config };

export function getR2Bucket(): string {
  return getR2Config().bucket;
}
