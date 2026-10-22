"""Generates audio/<id>.mp3 for every clip in tts-manifest.json that is not published yet."""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

MANIFEST = Path("tts-manifest.json")
STORE = Path("audio-store/audio")  # published by earlier runs (checked out from gh-pages)
OUT = Path("tts-out/audio")        # only the NEW files; the publish step adds them to gh-pages
MAX_NEW = int(os.environ.get("TTS_MAX_NEW", "800"))
PRECISION = os.environ.get("TTS_PRECISION", "fp32")  # "int8" is ~2x faster but needs a CPU with VNNI

data = json.loads(MANIFEST.read_text(encoding="utf-8"))
voice, items = data["voice"], data["items"]

todo = [(cid, text) for cid, text in items.items() if not (STORE / f"{cid}.mp3").exists()]
print(f"{len(items)} clips needed, {len(items) - len(todo)} already published, {len(todo)} to generate")
if not todo:
    sys.exit(0)

# A very large first run is split over several runs: whatever is missing falls back to the browser voice
todo = todo[:MAX_NEW]
OUT.mkdir(parents=True, exist_ok=True)

from vieneu import Vieneu  # imported late, so a run with nothing to do never loads the model

tts = Vieneu() if PRECISION == "fp32" else Vieneu(precision=PRECISION)

for n, (cid, text) in enumerate(todo, 1):
    wav = Path(tempfile.gettempdir()) / f"{cid}.wav"
    try:
        audio = tts.infer(text, voice=voice)
        tts.save(audio, str(wav))
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav),
             "-ac", "1", "-ar", "24000", "-b:a", "48k", str(OUT / f"{cid}.mp3")],
            check=True,
        )
        print(f"[{n}/{len(todo)}] {cid}")
    except Exception as e:  # one bad clip must not stop the run
        print(f"[{n}/{len(todo)}] skipped {cid}: {e}")
    finally:
        wav.unlink(missing_ok=True)
