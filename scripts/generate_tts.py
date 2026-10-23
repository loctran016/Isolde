"""Generates audio/<id>.mp3 for every clip in tts-manifest.json that is not published yet."""
import json
import os
import shutil
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


def dereference_hf_cache():
    """onnxruntime refuses model data that sits behind a symlink pointing outside the model folder,
    which is exactly how the Hugging Face cache stores files. Replace those links with real files."""
    hub = Path(
        os.environ.get("HF_HUB_CACHE")
        or os.environ.get("HUGGINGFACE_HUB_CACHE")
        or Path(os.environ.get("HF_HOME") or Path.home() / ".cache" / "huggingface") / "hub"
    )
    n = 0
    for p in hub.glob("models--*/snapshots/**/*"):
        if p.is_symlink():
            target = p.resolve()
            if target.is_file():
                p.unlink()
                shutil.copy2(target, p)
                n += 1
    print(f"replaced {n} cached symlinks with real files in {hub}")


def load_model():
    make = lambda: Vieneu() if PRECISION == "fp32" else Vieneu(precision=PRECISION)
    try:
        return make()
    except Exception as e:
        if "External data path" not in str(e):
            raise
        print("onnxruntime refused the symlinked cache; replacing the links with real files and retrying...")
        dereference_hf_cache()
        return make()


tts = load_model()

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
