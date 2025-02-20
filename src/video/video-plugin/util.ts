import TCPlayer from "tcplayer.js";

import { APP_ID, LICENSE_URL } from "./constant";

interface PlayerParams {
  sign: string;
  videoFileId: string;
  onSuccess?: (poster: string) => void;
  onError?: () => void;
  videoId: string;
}

const createPlayer = (params: PlayerParams) => {
  const { sign, videoFileId, onSuccess, onError, videoId } = params;
  const obj = {
    psign: sign,
    appID: APP_ID,
    fileID: videoFileId,
    licenseUrl: LICENSE_URL,
  };
  const player = TCPlayer(videoId, obj);
  player.on("canplay", () => {});
  player.on("error", function () {
    onError?.();
  });

  return player;
};
export default createPlayer;
