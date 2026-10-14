# Mac media worker

The render computer for this slice remains the owner's MacBook Pro, M3 Pro, 18 GB unified memory. Hostinger KVM 2 stays the online application and database. On 14 October 2026 the owner moved preferred editing of Muse clips to the VPS and withdrew the assumption that the 5 TB library is Google Drive. That later decision is in `docs/AFFIGROVE_STRATEGIC_DECISIONS.md`. This Mac checkpoint is unchanged until the owner accepts it. The clip-joining command added to `assemble.py` is the same FFmpeg assembler, not a new editor.

Cursor Cloud can build the queue and the worker source. It cannot install software on the Mac, and it cannot honestly report a Mac render.

## What the OS does

The owner opens Systems and issues a worker credential. The token is shown once. The database stores only its SHA-256 hash. Revoking the worker rejects the next poll.

Queueing a post builds the job spec on the server from the stored plan row. The spec contains the Page, the hook, the narration lines, the visual direction, a British Kokoro voice name, the Drive folder path, and a 1080×1920, 30 fps, 30–40 second output profile. It does not contain assignee names, finance, passwords, or a shell command. Polls and carousels are refused. A brief with unresolved notes is refused.

The worker polls `POST /api/worker/v1/poll` with `Authorization: Bearer`. The Mac opens the connection. No inbound port is required. One job can be leased at a time, for ten minutes. A heartbeat extends the lease. If the Mac sleeps or drops offline, the lease expires and the job returns to the queue. The job row is not deleted.

`POST /api/worker/v1/complete` accepts a measured result. An https URL moves the job to `READY_FOR_APPROVAL`. Anything else, including a finished local file with nowhere to put it, stays `AWAITING_STORAGE`. The operator ready queue changes only after the owner approves, which copies that https URL onto the task. The task is not marked scheduled or published.

While the campaign is in build mode, the ready buffer is plan days 1–3. After launch it is the next three London dates. The owner overview and Systems show the last heartbeat and a short buffer. There is no mailer, so this screen is the alert. Existing approved files stay visible if the Mac is off. New jobs wait.

A future GPU computer is another poller. The operator screens do not change.

## What the Mac worker does

`worker/atos_worker` uses the Python standard library and the system `ffmpeg`. It does not vendor MoneyPrinterTurbo or ComfyUI.

- Original scenes are PNG files the owner places in the asset root for that content ID. The worker does not call Pexels, Pixabay, or a generative video API.
- Narration is a supplied WAV, or Kokoro MLX when `ATOS_ENABLE_TTS=1` and the package imports. There is no American fallback.
- Assembly is image animation: a slow zoom or pan, a concat, burned subtitles from an SRT file, AAC, and faststart. Music stays off until a licensed file is attached on the spec. The spec's music mode is `none` today.
- Captions are written to an ASS file with a 1080×1920 play area, 92px type, and a bottom margin of 280px. They are not placed in a shell string. `ffmpeg` is started with `shell=False`.
- On Darwin the encoder arguments are `h264_videotoolbox`, 6 Mbps, with software fallback allowed. Elsewhere they are `libx264`, `veryfast`, CRF 20. The Linux path is how this repository checks the filter graph. It is not the Mac benchmark.
- The worker validates 1080×1920 H.264. A production Reel must land between 30 and 40 seconds.
- Drive upload is not implemented. The worker must not report a URL it did not receive from an approved upload. After a verified upload, intermediates are removed. Until then the MP4 stays in the work directory and the job stays `AWAITING_STORAGE`.
- Before a render it waits when free disk or available memory is under 4 GB. On the Mac it also waits when `pmset -g therm` reports serious or critical pressure, and it runs `caffeinate -i -t 900` only during that render. It does not change macOS security settings.
- One render at a time. The process lock plus the server slot both enforce that.

## Licences and dependencies

| Candidate | Licence checked | Decision |
| --- | --- | --- |
| MoneyPrinterTurbo | MIT, Copyright 2024 Harry | Do not vendor. Stock footage and bundled music are not clearance for these Pages. |
| ComfyUI | GPL-3.0 | Do not vendor or import. Too heavy beside speech and encode on 18 GB, and the GPL would cover a combined work. |
| Kokoro MLX 0.1.2 | MIT, Copyright 2025 Soroush Yousefpour | Install later, from the GitHub source the owner pins. Requires Python 3.10, 3.11, or 3.12 and `mlx>=0.31.1`. |
| Kokoro-82M weights | Separate from the inference code | Read the weight card before `from_pretrained`. Do not download them in CI. |
| FFmpeg | The owner's system build | Not bundled. Homebrew on the Mac. Call it as a separate process. |

British voices the spec can name: `bf_alice`, `bf_emma`, `bf_isabella`, `bf_lily`, `bm_daniel`, `bm_fable`, `bm_george`, `bm_lewis`. Page defaults, unheard until the Mac plays them: Back in the Game `bf_alice`, After Hours `bf_isabella`, Single Parent Stories `bf_lily`, Still Got It `bf_emma`, Casual By Choice `bm_george`.

## Install on the Mac, after approval

1. Install Homebrew `ffmpeg` and confirm `ffmpeg -hide_banner -encoders` lists `h264_videotoolbox`.
2. Use the system Python 3.11 or 3.12. Do not add a Linux Docker VM for this worker.
3. Copy this repository. From `worker/`, run `python3 -m atos_worker assemble-check /tmp/atos-technical-check.mp4` and confirm 1080×1920. That file is still not a Page asset.
4. On Systems, issue a credential named for this Mac. Store the token in `~/.config/atos/worker-token` with mode `600`. Do not put it in the shell history or the plist as a literal.
5. Set `ATOS_BASE_URL` to the HTTPS origin of the OS. `http://127.0.0.1` is allowed only when the OS is on the same Mac.
6. Put original PNGs at `$ATOS_ASSET_ROOT/UK-SGIUK-001/*.png`. Do not download stock.
7. Leave `ATOS_ENABLE_TTS` unset until Kokoro is approved. A supplied `narration.wav` is the other accepted voice.
8. Run `python3 -m atos_worker poll` in a terminal for the first proof. Install `worker/launchd/com.affiliatetraffic.mediaworker.plist` only after that proof is accepted. Replace every `REPLACE_WITH_OWNER` path first. Load it with `launchctl bootstrap gui/$UID` for the current user. Do not disable SIP or Gatekeeper to make it run.

## Benchmark procedure

Run this on the Mac, once, for UK-SGIUK-001 only.

1. Note the London time, the power adapter state, and that no other image model or speech model is loaded.
2. Queue UK-SGIUK-001 from Systems if it is not already queued.
3. Start `poll` and let it take the lease.
4. Record wall-clock render seconds, peak memory (Activity Monitor or the result's `peakRssBytes`), temporary disk, and whether any external API was called. `externalApiCostCents` stays null when no API was called. Do not write 0 and call it a measured invoice.
5. Play the MP4. Check the hook in the first two seconds, British narration, subtitle size and safe area, spelling, scene pacing for a UK audience aged 30–65, and that the story is clearly fictional rather than a testimonial.
6. Write the pass or fail in the job notes. Do not approve the URL until Drive has a real https file and the duration conflict below is accepted.
7. Only after a pass, repeat one Reel for each of the other four Pages. Throughput is accepted Reels per hour from those five measurements.

`assemble-check` on Linux does not satisfy steps 4–7.

## Known limitations

- The proof profile is 30–40 seconds. The PDF row for UK-SGIUK-001 says 20–35 seconds. The spec keeps both. The owner decides which duration is the calendar asset.
- No original scenes are generated here. The worker fails the job if the PNGs are missing.
- Kokoro is not installed, so this environment cannot speak the line.
- Subtitles use DejaVu Sans at 92px on a 1080×1920 caption canvas, with a dark box and a 280px bottom margin. The Mac may substitute a locally installed face. Check readability on a phone, not only in `ffprobe`.
- VideoToolbox is selected only when `platform.system()` is Darwin. This cloud machine encodes with libx264.
- Unified memory is shared with the display. One heavy job is the safeguard. The worker does not measure die temperature beyond `pmset` on the Mac.
- The ready-buffer alert is on-screen text. Nobody is emailed.
- Owner JavaScript still contains the historical plan assignee. The worker spec does not.
- Operators must not be given the worker token.

## Owner approval checkpoint

Do not merge, deploy, install launchd, buy hardware, connect production credentials, or start the other four Pages until Shahzeb accepts all of the following:

1. Kokoro MLX may be installed on the Mac, pinned to the GitHub revision he names, after he has read the weight licence.
2. The first proof may run 30–40 seconds even though the PDF says 20–35, or he chooses to keep 20–35 and the profile changes before the render.
3. Music stays silent, or he attaches one file whose licence covers commercial Facebook use.
4. Google Drive OAuth may be added later, in a separate change, with a limited scope. It is not part of this approval by default.
5. The Still Got It MP4 from the Mac is watched and either accepted or sent back. A Linux technical check is not that decision.

Until then the campaign stays in build mode.
