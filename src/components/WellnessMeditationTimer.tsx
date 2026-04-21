import { Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const durationOptions = [2, 5, 7, 10] as const;

type ToneKind = 'start' | 'minute' | 'end';
type ToneStep = {
  frequency: number;
  duration: number;
  delay: number;
  waveform: OscillatorType;
  peakGain: number;
  sweepTo?: number;
};

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const tonePatterns: Record<ToneKind, ToneStep[]> = {
  start: [
    { frequency: 196, duration: 0.72, delay: 0, waveform: 'sine', peakGain: 0.07 },
    { frequency: 246.94, duration: 0.56, delay: 0.34, waveform: 'sine', peakGain: 0.05 },
  ],
  minute: [
    { frequency: 196, duration: 0.72, delay: 0, waveform: 'sine', peakGain: 0.07 },
    { frequency: 246.94, duration: 0.56, delay: 0.34, waveform: 'sine', peakGain: 0.05 },
  ],
  end: [
    { frequency: 523.25, duration: 0.18, delay: 0, waveform: 'sine', peakGain: 0.08 },
    { frequency: 659.25, duration: 0.12, delay: 0.1, waveform: 'sine', peakGain: 0.055 },
  ],
};

export default function WellnessMeditationTimer() {
  const [selectedMinutes, setSelectedMinutes] = useState<(typeof durationOptions)[number]>(5);
  const [volumeLevel, setVolumeLevel] = useState(60);
  const [remainingSeconds, setRemainingSeconds] = useState(5 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const selectedDurationSeconds = selectedMinutes * 60;
  const volumeMultiplier = volumeLevel / 100;

  const ensureAudioContext = async () => {
    if (typeof window === 'undefined') {
      return null;
    }

    const AudioContextConstructor =
      window.AudioContext ??
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextConstructor) {
      return null;
    }

    if (audioContextRef.current === null) {
      audioContextRef.current = new AudioContextConstructor();
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  };

  const playTone = async (tone: ToneKind) => {
    const audioContext = await ensureAudioContext();

    if (!audioContext) {
      return;
    }

    const tonePattern = tonePatterns[tone];

    tonePattern.forEach(({ frequency, duration, delay, waveform, peakGain, sweepTo }) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const startAt = audioContext.currentTime + delay;
      const endAt = startAt + duration;

      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(frequency, startAt);
      if (typeof sweepTo === 'number') {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(sweepTo, 1), endAt);
      }
      gainNode.gain.setValueAtTime(0.0001, startAt);
      gainNode.gain.exponentialRampToValueAtTime(peakGain * volumeMultiplier, startAt + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(startAt);
      oscillator.stop(endAt + 0.02);
    });
  };

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      return;
    }

    intervalRef.current = window.setInterval(() => {
      setRemainingSeconds((previousSeconds) => {
        if (previousSeconds <= 1) {
          return 0;
        }

        return previousSeconds - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) {
      setRemainingSeconds(selectedDurationSeconds);
    }
  }, [selectedDurationSeconds]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    if (remainingSeconds === 0) {
      setIsRunning(false);
      void playTone('end');
      return;
    }

    if (remainingSeconds !== selectedDurationSeconds && remainingSeconds % 60 === 0) {
      void playTone('minute');
    }
  }, [isRunning, remainingSeconds, selectedDurationSeconds]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }

      if (audioContextRef.current !== null) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  const handleSelectDuration = (minutes: (typeof durationOptions)[number]) => {
    setSelectedMinutes(minutes);
  };

  const handleStart = () => {
    if (remainingSeconds === 0) {
      setRemainingSeconds(selectedDurationSeconds);
    }

    setIsRunning(true);
    void playTone('start');
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(selectedDurationSeconds);
  };

  const progressPercent = ((selectedDurationSeconds - remainingSeconds) / selectedDurationSeconds) * 100;

  return (
    <section className="rounded-2xl border border-outline-variant/60 bg-white p-3 shadow-sm lg:w-1/2">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-xl font-headline font-bold text-on-surface">Meditation Timer</h2>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-1.5 text-on-surface shadow-sm">
            <Volume2 size={14} />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Sound</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={volumeLevel}
              onChange={(event) => setVolumeLevel(Number(event.target.value))}
              className="meditation-volume-slider h-1.5 w-20"
              aria-label="Meditation sound volume"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-lime-300/80 bg-lime-100/70 p-3">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {durationOptions.map((minutes) => {
            const isSelected = minutes === selectedMinutes;

            return (
              <button
                key={minutes}
                type="button"
                onClick={() => handleSelectDuration(minutes)}
                disabled={isRunning}
                className={`rounded-full px-3 py-1.5 text-xs font-headline font-bold transition-all ${
                  isSelected
                    ? 'bg-lime-300 text-on-surface shadow-md'
                    : 'bg-white text-lime-700 hover:bg-lime-100'
                } ${isRunning ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {minutes} min
              </button>
            );
          })}
        </div>

        <div className="rounded-[1.5rem] bg-white px-4 py-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Time remaining</div>
          <div className="mt-2 text-4xl font-headline font-extrabold tracking-tight text-on-surface sm:text-5xl">
            {formatTime(remainingSeconds)}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full bg-lime-300 transition-[width] duration-700"
              style={{ width: `${Math.max(progressPercent, 0)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-on-surface-variant">
            <span>{isRunning ? 'Session in progress' : remainingSeconds === 0 ? 'Session complete' : 'Ready to begin'}</span>
            <span>{selectedMinutes} minute program</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {isRunning ? (
              <button
                type="button"
                onClick={handlePause}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-headline font-bold text-on-primary transition-colors hover:bg-primary/90"
              >
                <Pause size={15} />
                Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-lime-300 px-3 py-2.5 text-sm font-headline font-bold text-on-surface transition-colors hover:bg-lime-400"
              >
                <Play size={15} />
                {remainingSeconds === 0 ? 'Start again' : 'Start timer'}
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant/70 bg-white px-3 py-2.5 text-sm font-headline font-bold text-on-surface transition-colors hover:bg-surface-container-low"
            >
              <RotateCcw size={15} />
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}