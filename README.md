# typescript-parser

`typescript-parser` is a Bun + TypeScript CLI that turns a ChatGPT data export into a clean, searchable Obsidian knowledge base.

It is designed as a general-purpose importer for anyone who wants to keep their ChatGPT conversations locally. The tool reads modern ChatGPT exports, including split `conversations-*.json` files, converts every conversation into Markdown, and organizes notes into common topic folders such as health, education, career, finance, programming, travel, and more.

## Who This Is For

Use this project if you want to:

- Back up ChatGPT conversations in a readable local format
- Import AI chats into an Obsidian vault
- Organize past conversations by common life and work themes
- Keep private exports out of public repositories
- Build a foundation for future search, summaries, embeddings, or local RAG workflows

## Features

- Loads all `conversations-*.json` files from an export directory
- Handles malformed JSON files and partially broken conversations without stopping the full run
- Generates Obsidian-compatible Markdown with YAML frontmatter
- Preserves Markdown content such as code blocks, tables, headings, links, and lists
- Routes conversations into common topic folders using keyword-based detection
- Copies `file_*.dat` and `file-*.dat` attachments into `output/Attachments/`
- Restores attachment names when `conversation_asset_file_names.json` is available
- Prints a clear processing summary after each run
- Works on macOS, Windows, and Linux

## Requirements

- [Bun](https://bun.sh/) 1.1 or newer

Check your Bun version:

```bash
bun --version
```

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/typescript-parser.git
cd typescript-parser
```

Install dependencies:

```bash
bun install
```

## Export ChatGPT Data

1. Open ChatGPT in your browser.
2. Go to Settings.
3. Open Data Controls.
4. Choose the option to export your data.
5. Download the export archive when it arrives.
6. Unzip the archive on your computer.

The export usually includes files like:

```txt
chat.html
conversation_asset_file_names.json
conversations-000.json
conversations-001.json
export_manifest.json
file_*.dat
```

The exact list can vary. The important files for this tool are the `conversations-*.json` files. Attachment files are optional, but they will be copied if present.

## Prepare Input

Place your unzipped export files inside:

```txt
export/
```

Example project layout:

```txt
typescript-parser/
  export/
    conversations-000.json
    conversations-001.json
    conversation_asset_file_names.json
    file_00000000000000000000000000000000.dat
```

Important: `export/*` is ignored by git because ChatGPT exports contain private data. Do not commit your export folder to a public repository.

## Run

Use the default folders:

```bash
bun run dev
```

Use custom folders:

```bash
bun run dev -- --input ./export --output ./output
```

Build and run the compiled CLI:

```bash
bun run build
bun run start
```

## CLI Options

| Option | Default | Description |
| --- | --- | --- |
| `--input` | `./export` | Folder containing ChatGPT export files |
| `--output` | `./output` | Folder where Markdown and attachments will be written |

Example:

```bash
bun run dev -- --input "/Users/me/Downloads/chatgpt-export" --output "./my-obsidian-import"
```

## Output

Markdown files are written to:

```txt
output/AI Chats/
```

Attachments are copied to:

```txt
output/Attachments/
```

Topic folders include:

```txt
Health
Education
Career
Finance
Business
Programming
AI
AI Tools
Language Learning
Travel
Home and Life
Creative
Legal
Other
```

Only folders with matching conversations are created. Conversations that do not match a known topic are saved under `Other`.

## Markdown Format

Each conversation becomes one Markdown file:

```md
---
title: "Conversation title"
created: "2026-01-01"
updated: "2026-01-01"
source: "chatgpt"
tags:
  - chatgpt
  - auto-imported
  - topic-name
---

# Conversation title

## Metadata

- Source: ChatGPT Export
- Created: 2026-01-01
- Updated: 2026-01-01
- Topic: [[AI Tools]]

---

## User

message...

## Assistant

message...
```

## Import Into Obsidian

1. Open your Obsidian vault folder.
2. Copy `output/AI Chats/` into the vault.
3. Copy `output/Attachments/` into the vault if you want attachments available.
4. Open Obsidian and let it index the new Markdown files.

Recommended vault structure:

```txt
Vault/
  AI Chats/
    Health/
    Education/
    Career/
    Finance/
    Business/
    Programming/
    AI/
    AI Tools/
    Language Learning/
    Travel/
    Home and Life/
    Creative/
    Legal/
    Other/
  Attachments/
```

## Topic Detection

Topic detection is intentionally simple and transparent. The parser scans each conversation title and message text for common keywords, then picks the first matching topic.

This makes the importer predictable and easy to customize. To change the categories or keywords, edit:

```txt
src/topics/detectTopic.ts
```

The current categories are broad enough for general exports:

- Health
- Education
- Career
- Finance
- Business
- Programming
- AI
- AI Tools
- Language Learning
- Travel
- Home and Life
- Creative
- Legal
- Other

Future versions can replace keyword matching with semantic tagging or embeddings.

## Error Handling

The parser is built to continue when part of an export is malformed:

- Broken JSON files are skipped and reported
- Conversations without readable messages are skipped
- Attachments are copied when available
- A final summary reports total JSON files, conversations, Markdown files, copied attachments, and failures

## Screenshots

Screenshots can be added here after importing generated notes into Obsidian.

```txt
docs/screenshots/
```

## Roadmap

- Semantic topic detection
- Conversation summaries
- Embedding generation
- Local vector search
- RAG-ready chunk export
- Obsidian backlink enrichment
- Attachment references inside Markdown
- Configurable topic presets

## Privacy

This project is intended for public GitHub use, but ChatGPT export files are private. The `.gitignore` excludes `export/*`, `output/`, `.env`, build artifacts, and dependencies.

Before publishing a repository, check:

```bash
git status --short --ignored
```

Your export and output folders should appear as ignored files, not staged files.
