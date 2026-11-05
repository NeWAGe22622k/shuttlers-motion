import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { fontsReady } from "../config/brand";

let done = false;
fontsReady.then(() => {
  done = true;
});

/** True once Google Sans is loaded, so measureText() never caches fallback-font metrics. */
export const useFontsReady = () => {
  const [ready, setReady] = useState(done);
  const [handle] = useState(() => (done ? null : delayRender("Waiting for Google Sans")));
  useEffect(() => {
    if (ready) return;
    fontsReady.then(() => {
      setReady(true);
      if (handle !== null) continueRender(handle);
    });
  }, [handle, ready]);
  return ready;
};
