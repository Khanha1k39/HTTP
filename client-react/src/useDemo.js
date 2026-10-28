import { useState, useRef, useCallback } from 'react';
import { CONFIG, getImageNames } from './config';

/**
 * Tạo initial request list cho 1 protocol
 */
function makeRequests(names) {
  return names.map((name, index) => ({
    name,
    index,
    start: null,
    end: null,
    duration: null,
    timedOut: false,
    error: false,
  }));
}

function makeProtoState() {
  return { requests: [], startTime: null, endTime: null, loaded: 0, timedOut: 0 };
}

/**
 * Hook chứa toàn bộ logic demo: fetch ảnh, đo thời gian, track state
 */
export function useDemo() {
  const [running, setRunning]         = useState(false);
  const [mode, setMode]               = useState('compare');   // compare | h1only | h2only
  const [imageCount, setImageCount]   = useState(100);
  const [clientTimeout, setClientTimeout] = useState(0);       // ms, 0 = tắt
  const [serverDelay, setServerDelay] = useState(0);           // ms

  // Dùng useRef để track realtime request data (không trigger re-render liên tục)
  const h1Ref = useRef(makeProtoState());
  const h2Ref = useRef(makeProtoState());

  // State để trigger re-render cho waterfall / images / stats
  const [h1State, setH1State] = useState(makeProtoState());
  const [h2State, setH2State] = useState(makeProtoState());
  const [done, setDone]       = useState(false);

  // ── Reset ───────────────────────────────────────────────────────────────
  const reset = useCallback((count, currentMode) => {
    const names    = getImageNames(count ?? imageCount);
    const useMode  = currentMode ?? mode;
    const useH1    = useMode !== 'h2only';
    const useH2    = useMode !== 'h1only';

    const freshH1 = {
      ...makeProtoState(),
      requests: useH1 ? makeRequests(names) : [],
    };
    const freshH2 = {
      ...makeProtoState(),
      requests: useH2 ? makeRequests(names) : [],
    };

    h1Ref.current = { ...freshH1 };
    h2Ref.current = { ...freshH2 };
    setH1State({ ...freshH1 });
    setH2State({ ...freshH2 });
    setDone(false);
  }, [imageCount, mode]);

  // ── Load single image ───────────────────────────────────────────────────
  function loadImage(proto, base, req, protoRef, updateFn) {
    return new Promise((resolve) => {
      const delay  = serverDelay > 0 ? `&delay=${serverDelay}` : '';
      const url    = `${base}/assets/${req.name}?t=${Date.now()}&i=${req.index}${delay}`;
      const img    = new Image();
      let settled  = false;
      let tmoHandle = null;

      const settle = (result) => {
        if (settled) return;
        settled = true;
        if (tmoHandle) clearTimeout(tmoHandle);
        resolve(result);
      };

      // Client-side timeout
      if (clientTimeout > 0) {
        tmoHandle = setTimeout(() => {
          if (settled) return;
          img.src = '';

          const reqState = protoRef.current.requests[req.index];
          reqState.timedOut = true;
          reqState.end      = Date.now();
          reqState.duration = reqState.end - reqState.start;

          protoRef.current.loaded++;
          protoRef.current.timedOut = (protoRef.current.timedOut || 0) + 1;

          updateFn({ ...protoRef.current, requests: [...protoRef.current.requests] });
          settle({ success: false, timedOut: true });
        }, clientTimeout);
      }

      img.onload = () => {
        const reqState    = protoRef.current.requests[req.index];
        reqState.end      = Date.now();
        reqState.duration = reqState.end - reqState.start;
        reqState.src      = img.src;

        protoRef.current.loaded++;
        updateFn({ ...protoRef.current, requests: [...protoRef.current.requests] });
        settle({ success: true });
      };

      img.onerror = () => {
        const reqState    = protoRef.current.requests[req.index];
        reqState.end      = Date.now();
        reqState.duration = reqState.end - reqState.start;
        reqState.error    = true;

        protoRef.current.loaded++;
        updateFn({ ...protoRef.current, requests: [...protoRef.current.requests] });
        settle({ success: false });
      };

      // Set start time THEN assign src
      protoRef.current.requests[req.index].start = Date.now();
      img.src = url;
    });
  }

  // ── Run demo ────────────────────────────────────────────────────────────
  const run = useCallback(async () => {
    setRunning(true);
    setDone(false);

    const names  = getImageNames(imageCount);
    const useH1  = mode !== 'h2only';
    const useH2  = mode !== 'h1only';

    // Fresh state
    const freshH1 = { ...makeProtoState(), requests: useH1 ? makeRequests(names) : [] };
    const freshH2 = { ...makeProtoState(), requests: useH2 ? makeRequests(names) : [] };
    h1Ref.current = { ...freshH1 };
    h2Ref.current = { ...freshH2 };
    setH1State({ ...freshH1 });
    setH2State({ ...freshH2 });

    await new Promise(r => setTimeout(r, 80));

    // Live timer để update đồng hồ mỗi 50ms
    const intervals = [];
    if (useH1) {
      h1Ref.current.startTime = Date.now();
      setH1State(s => ({ ...s, startTime: h1Ref.current.startTime }));
      const iv = setInterval(() => {
        if (!h1Ref.current.endTime) {
          setH1State(s => ({ ...s, _tick: Date.now() }));
        } else {
          clearInterval(iv);
        }
      }, 50);
      intervals.push(iv);
    }
    if (useH2) {
      h2Ref.current.startTime = Date.now() + (useH1 ? 3 : 0);
      setH2State(s => ({ ...s, startTime: h2Ref.current.startTime }));
      const iv = setInterval(() => {
        if (!h2Ref.current.endTime) {
          setH2State(s => ({ ...s, _tick: Date.now() }));
        } else {
          clearInterval(iv);
        }
      }, 50);
      intervals.push(iv);
    }

    const runners = [];

    if (useH1) {
      runners.push((async () => {
        const promises = h1Ref.current.requests.map(req =>
          loadImage('h1', CONFIG.H1_BASE, req, h1Ref,
            (next) => setH1State({ ...next }))
        );
        await Promise.all(promises);
        h1Ref.current.endTime = Date.now();
        setH1State({ ...h1Ref.current });
      })());
    }

    if (useH2) {
      runners.push((async () => {
        const promises = h2Ref.current.requests.map(req =>
          loadImage('h2', CONFIG.H2_BASE, req, h2Ref,
            (next) => setH2State({ ...next }))
        );
        await Promise.all(promises);
        h2Ref.current.endTime = Date.now();
        setH2State({ ...h2Ref.current });
      })());
    }

    await Promise.all(runners);
    intervals.forEach(clearInterval);
    setDone(true);
    setRunning(false);
  }, [imageCount, mode, clientTimeout, serverDelay]);

  return {
    // config state
    mode, setMode,
    imageCount, setImageCount,
    clientTimeout, setClientTimeout,
    serverDelay, setServerDelay,
    // run state
    running, done,
    h1State, h2State,
    // actions
    run,
    reset: () => reset(),
  };
}
