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

## Installation
1. Download the latest release.zip from the GitHub repository
2. Extract the files to your vault's plugins folder:  
   `YourVault/.obsidian/plugins/tipa-obsidian-plugin/`
3. The folder should contain:
   - `main.js`
   - `manifest.json` 
   - `styles.css`
   - `versions.json`
4. Restart Obsidian
5. Go to Settings → Community plugins and enable "TIPA IPA Support"

## Usage

### Basic Usage

```markdown
Here is \tipa{["s@mTIN]} for something.

Or use the full form: \textipa{["h{@}loU]} for hello.

Narrow transcription: \nt{o}

Wide transcription: \wt{i}