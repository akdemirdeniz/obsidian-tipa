# TIPA IPA Support for Obsidian

TIPA (TEX IPA) is a system for processing IPA (International Phonetic Alphabet) symbols in LATEX. This Obsidian plugin implements TIPA notation to Obsidian.

## Features

- Converts TIPA notation to Unicode phonetic symbols
- Supports `\textipa{}`, `\tipa{}`, `\nt{}`, and `\wt{}` commands
- Supports inline notation with `$...$`
- Supports code blocks
- Automatic rendering in both editing and reading modes (for code blocks)

## Restrictions

- Live preview support is non existent for inline syntax (`\textschwa` for example)

## Usage

### Basic Usage

```markdown
Here is \tipa{["s@mTIN]} for something.

Or use the full form: \textipa{["h{@}loU]} for hello.

Narrow transcription: \nt{o}

Wide transcription: \wt{i}