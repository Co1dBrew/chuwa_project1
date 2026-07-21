import type { ImageStorage } from "./storage.js";
import { LocalImageStorage } from "./local-storage.js";

export const imageStorage: ImageStorage = new LocalImageStorage();
