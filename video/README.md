# FHE-Agent Shield Demo Video

This directory contains the Remotion component for generating the demo video.

## Video Script

The video covers:
1. **Title** (3s) - FHE-Agent Shield intro
2. **The Problem** (4s) - Plaintext vulnerability
3. **The Solution** (4s) - FHE encryption
4. **Demo Steps** (5s) - 5-step walkthrough
5. **Contracts** (4s) - 150 tests passing
6. **CTA** (4s) - Try it now

**Total Duration:** ~25 seconds

## Generate Video

### Prerequisites
```bash
# Install inference.sh CLI
curl -sL https://raw.githubusercontent.com/inference-sh/skills/refs/heads/main/cli-install.md | bash

# Login
infsh login
```

### Render
```bash
cd video

# Render the video
infsh app run infsh/remotion-render --input '{
  "code": '"$(cat FHEDemo.tsx | jq -Rs '.')"' ,
  "duration_seconds": 25,
  "fps": 30,
  "width": 1920,
  "height": 1080
}'
```

Or with Python:
```python
from inferencesh import inference

client = inference()

result = client.run({
    "app": "infsh/remotion-render",
    "input": {
        "code": open("FHEDemo.tsx").read(),
        "duration_seconds": 25,
        "fps": 30,
        "width": 1920,
        "height": 1080
    }
})

print(result["output"]["video"])
```

## Manual Recording Alternative

Instead of generating programmatically, you can:
1. Run `cd frontend && npm run dev`
2. Record screen using Loom, QuickTime, or OBS
3. Walk through the 5 demo steps
4. Stop recording

## Output Location
- Programmatic: Downloads from infsh to current directory
- Manual: Save recording as `demo-video.mp4`