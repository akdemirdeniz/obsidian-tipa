import { Plugin, App, PluginSettingTab, Setting, MarkdownPostProcessorContext } from 'obsidian';

// Comprehensive TIPA to Unicode mapping based on the manual
const TIPA_TO_UNICODE: { [key: string]: string } = {
  // ===== SHORTCUT CHARACTERS (Table 2.2) =====
  // Numerals
  '0': 'u', '1': 'i', '2': 'a', '3': 'ɛ', '4': 'ɔ', '5': 'ɐ', '6': 'ɒ', '7': 'ɤ', '8': 'ɵ', '9': 'ɘ',
  
  // Uppercase letters
  'A': 'ɑ', 'B': 'β', 'C': 'ç', 'D': 'ð', 'E': 'ɛ', 'F': 'ɱ', 'G': 'ɣ', 'H': 'ɥ', 
  'I': 'ɪ', 'J': 'ɲ', 'K': 'ɬ', 'L': 'ʎ', 'M': 'ɯ', 'N': 'ŋ', 'O': 'ɔ', 'P': 'ʋ', 
  'Q': 'ɒ', 'R': 'ʁ', 'S': 'ʃ', 'T': 'θ', 'U': 'ʊ', 'V': 'ʑ', 'W': 'ʝ', 'X': 'χ', 
  'Y': 'ʏ', 'Z': 'ʒ',
  
  // Punctuation
  '@': 'ə', '!': 'ǀ', '"': 'ˈ', '%': 'ˌ', ':': 'ː', ';': 'ˑ', '?': 'ʔ',
  
  // ===== BASIC IPA SYMBOLS =====
  // Vowels
  '\\textturna': 'ɐ', '\\textscripta': 'ɑ', '\\textturnscripta': 'ɒ', '\\textopeno': 'ɔ',
  '\\textschwa': 'ə', '\\textepsilon': 'ɛ', '\\textreve': 'ɘ', '\\textrevepsilon': 'ɜ',
  '\\textturnv': 'ʌ', '\\textramshorns': 'ɤ', '\\textbaru': 'ʉ', '\\textupsilon': 'ʊ',
  
  // Consonants
  '\\texthtb': 'ɓ', '\\texthtd': 'ɗ', '\\texthtg': 'ɠ', '\\texthtbarlessj': 'ʄ',
  '\\textrtaild': 'ɖ', '\\textrtailt': 'ʈ', '\\textrtails': 'ʂ', '\\textrtailz': 'ʐ',
  '\\textrtailr': 'ɽ', '\\textrtailn': 'ɳ', '\\textltailn': 'ɲ', '\\textltailm': 'ɱ',
  '\\textbeltl': 'ɬ', '\\textlyoghlig': 'ɮ', '\\textturnr': 'ɹ', '\\textturnrrtail': 'ɻ',
  '\\textturnlonglegr': 'ɺ', '\\textfishhookr': 'ɾ', '\\textinvscr': 'ʁ',
  '\\textctc': 'ɕ', '\\textctj': 'ʑ', '\\textctz': 'ʓ', '\\textctesh': 'ɧ',
  '\\textdyoghlig': 'ʤ', '\\textteshlig': 'ʧ',
  
  // Greek letters and special symbols
  '\\textbeta': 'β', '\\texttheta': 'θ', '\\textphi': 'ɸ', '\\textchi': 'χ', 
  '\\textgamma': 'ɣ', '\\textyogh': 'ʒ', '\\textesh': 'ʃ', '\\textthorn': 'þ',
  
  // Small capitals
  '\\textscb': 'ʙ', '\\textscg': 'ɢ', '\\textsch': 'ʜ', '\\textsci': 'ɪ', '\\textscl': 'ʟ',
  '\\textscm': 'ᴍ', '\\textscn': 'ɴ', '\\textscr': 'ʀ', '\\textscy': 'ʏ', '\\textscu': 'ʊ',
  
  // ===== DIACRITICS AND ACCENTS =====
  '\\textprimstress': 'ˈ', '\\textsecstress': 'ˌ', '\\textlengthmark': 'ː',
  '\\texthalflength': 'ˑ', '\\textcorner': 'ʼ', '\\textsubring': '̥', '\\textsubwedge': '̬',
  '\\textsubbar': '̩', '\\textsubumlaut': '̈', '\\textsubtilde': '̃', '\\textsubdot': '̣',
  '\\textraising': '̝', '\\textlowering': '̞', '\\textadvancing': '̟', '\\textretracting': '̠',
  '\\textsyllabic': '̩', '\\textnonsyllabic': '̯',
  
  // ===== SUPRASEGMENTALS =====
  '\\textvertline': '|', '\\textdoublevertline': '‖', '\\textbottomtiebar': '‿',
  '\\textdownstep': '↓', '\\textupstep': '↑',
  
  // ===== TONE LETTERS =====
  '\\tone{11}': '˩', '\\tone{22}': '˨', '\\tone{33}': '˧', '\\tone{44}': '˦', '\\tone{55}': '˥',
  '\\tone{13}': '˩˧', '\\tone{15}': '˩˥', '\\tone{31}': '˧˩', '\\tone{35}': '˧˥', '\\tone{51}': '˥˩',
  '\\tone{53}': '˥˧',
  
  // ===== EXTENDED IPA =====
  '\\textdoublebarpipe': 'ǁ', '\\textdoublepipe': '‖', '\\textpipe': '|',
  
  // Common ligatures and combinations
  '\\textaolig': 'ꜵ', '\\textoelig': 'œ', '\\textscoelig': 'ɶ'
};

// Special character mappings for the \* command
const ASTERISK_MAPPINGS: { [key: string]: string } = {
  'f': 'ɟ', 'k': 'ʞ', 'r': 'ɹ', 't': 'ʇ', 'w': 'ʍ',  // turned symbols
  'j': 'ʄ', 'n': 'ɲ', 'h': 'ħ', 'l': 'ɺ', 'z': 'ʐ'   // other symbols
};

// Mappings for \; command (small capitals)
const SMALLCAP_MAPPINGS: { [key: string]: string } = {
  'A': 'ᴀ', 'B': 'ʙ', 'E': 'ᴇ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ', 'L': 'ʟ',
  'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'R': 'ʀ', 'U': 'ᴜ', 'W': 'ᴡ', 'Y': 'ʏ'
};

// Mappings for \: command (retroflex)
const RETROFLEX_MAPPINGS: { [key: string]: string } = {
  'd': 'ɖ', 'l': 'ɭ', 'n': 'ɳ', 'r': 'ɽ', 's': 'ʂ', 'z': 'ʐ', 't': 'ʈ'
};

// Mappings for \! command (implosives/clicks)
const IMPLOSIVE_MAPPINGS: { [key: string]: string } = {
  'b': 'ɓ', 'd': 'ɗ', 'g': 'ɠ', 'j': 'ʄ', 'G': 'ʛ', 'o': 'ʘ'
};

interface TIPAPluginSettings {
  autoConvert: boolean;
  useCustomFont: boolean;
  enableSafeMode: boolean;
  inlineStyling: boolean;
}

const DEFAULT_SETTINGS: TIPAPluginSettings = {
  autoConvert: true,
  useCustomFont: true,
  enableSafeMode: false,
  inlineStyling: false
};

export default class TIPAPlugin extends Plugin {
  settings: TIPAPluginSettings;

  async onload() {
    await this.loadSettings();
    
    console.log('Loading TIPA IPA Support plugin (Based on TIPA Manual 1.3)');

    // Register markdown post processor for Reading view
    this.registerMarkdownPostProcessor((element: HTMLElement, context: MarkdownPostProcessorContext) => {
      if (this.settings.autoConvert) {
        this.processTIPAContent(element);
      }
    });

    // Register code block processor for tipa
    this.registerMarkdownCodeBlockProcessor('tipa', (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      try {
        this.processTIPACodeBlock(source, el);
      } catch (error) {
        console.error('Error processing TIPA code block:', error);
        const errorEl = el.createEl('div');
        errorEl.setText(`Error processing TIPA: ${error.message}`);
        errorEl.addClass('tipa-error');
      }
    });

    // Add settings tab
    this.addSettingTab(new TIPASettingTab(this.app, this));

    // Add commands for common TIPA constructs
    this.addCommand({
      id: 'insert-tipa',
      name: 'Insert TIPA block',
      editorCallback: (editor) => {
        const cursor = editor.getCursor();
        editor.replaceRange('\\tipa{}', cursor);
        editor.setCursor({ line: cursor.line, ch: cursor.ch + 6 });
      }
    });

    this.addCommand({
      id: 'insert-narrow',
      name: 'Insert narrow transcription',
      editorCallback: (editor) => {
        const cursor = editor.getCursor();
        editor.replaceRange('\\nt{}', cursor);
        editor.setCursor({ line: cursor.line, ch: cursor.ch + 4 });
      }
    });

    this.addCommand({
      id: 'insert-wide',
      name: 'Insert wide transcription', 
      editorCallback: (editor) => {
        const cursor = editor.getCursor();
        editor.replaceRange('\\wt{}', cursor);
        editor.setCursor({ line: cursor.line, ch: cursor.ch + 4 });
      }
    });
  }

  private processTIPAContent(element: HTMLElement) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    const nodes: Text[] = [];
    let node: Text | null;
    while ((node = walker.nextNode() as Text)) {
      nodes.push(node);
    }

    for (const node of nodes) {
      this.processTextNode(node);
    }
  }

  private processTextNode(node: Text) {
    const text = node.textContent;
    if (!text) return;

    let newText = text;

    // Process \tipa{} command (short form)
    newText = newText.replace(/\\tipa{([^}]*)}/g, (match, content) => {
      return this.convertTIPAToUnicode(content);
    });

    // Process \textipa{} command (full form)
    newText = newText.replace(/\\textipa{([^}]*)}/g, (match, content) => {
      return this.convertTIPAToUnicode(content);
    });

    // Process bracket notations \nt{}
    newText = newText.replace(/\\nt{([^}]*)}/g, (match, content) => {
      return '[' + this.convertTIPAToUnicode(content) + ']';
    });

    // Process slash notations \wt{}
    newText = newText.replace(/\\wt{([^}]*)}/g, (match, content) => {
      return '/' + this.convertTIPAToUnicode(content) + '/';
    });

    // Process inline $...$ notation
    newText = newText.replace(/\$([^$]+)\$/g, (match, content) => {
      return this.convertTIPAToUnicode(content);
    });

    // Process standalone commands like \textschwa, \tone{55}, etc.
    newText = this.processStandaloneCommands(newText);

    if (newText !== text) {
      // Create a simple span without block styling for inline content
      const span = document.createElement('span');
      span.className = 'tipa-inline';
      if (this.settings.useCustomFont) {
        span.addClass('tipa-phonetic-font');
      }
      if (this.settings.inlineStyling) {
        span.addClass('tipa-styled');
      }
      span.setText(newText);
      node.replaceWith(span);
    }
  }

  private processStandaloneCommands(text: string): string {
    let result = text;

    // Process standalone commands like \textschwa, \tone{55}, etc.
    for (const [command, unicode] of Object.entries(TIPA_TO_UNICODE)) {
      if (command.startsWith('\\text') || command.startsWith('\\tone')) {
        const regex = new RegExp(this.escapeRegExp(command), 'g');
        result = result.replace(regex, unicode);
      }
    }

    return result;
  }

  private processTIPACodeBlock(source: string, el: HTMLElement) {
    try {
      // For code blocks, we treat the content as being inside \textipa{}
      const content = source.trim();
      const converted = this.convertSimpleTIPAToUnicode(content);
      
      const pre = el.createEl('pre');
      const code = pre.createEl('code');
      code.setText(converted);
      code.addClass('tipa-block');
      if (this.settings.useCustomFont) {
        code.addClass('tipa-phonetic-font');
      }
    } catch (error) {
      console.error('Error in TIPA code block:', error);
      const errorEl = el.createEl('div');
      errorEl.setText(`TIPA Error: ${error.message}`);
      errorEl.addClass('tipa-error');
    }
  }

  private convertSimpleTIPAToUnicode(tipaString: string): string {
    let result = tipaString;
    
    // Handle shortcut characters first (most common case)
    for (const [key, value] of Object.entries(TIPA_TO_UNICODE)) {
      if (key.length === 1 && key !== '\\') {
        result = result.replace(new RegExp(this.escapeRegExp(key), 'g'), value);
      }
    }

    // Handle stress markers
    result = result.replace(/"/g, 'ˈ');
    result = result.replace(/%/g, 'ˌ');

    return result;
  }

  private convertTIPAToUnicode(tipaString: string): string {
    let result = tipaString;
    
    // Handle tone letters first
    result = result.replace(/\\tone{([^}]*)}/g, (match, numbers) => {
      const toneKey = `\\tone{${numbers}}`;
      return TIPA_TO_UNICODE[toneKey] || this.generateToneLetters(numbers);
    });

    // Handle special macros: \*, \;, \:, \!
    if (!this.settings.enableSafeMode) {
      result = this.processSpecialMacros(result);
    }

    // Handle text commands (full names)
    result = result.replace(/\\text([a-z]+){([^}]*)}/g, (match, command, content) => {
      const fullCommand = `\\text${command}`;
      const baseChar = this.convertTIPAToUnicode(content);
      return TIPA_TO_UNICODE[fullCommand] ? TIPA_TO_UNICODE[fullCommand] : baseChar;
    });

    // Handle standalone text commands
    result = result.replace(/\\text([a-zA-Z]+)/g, (match, command) => {
      const fullCommand = `\\text${command}`;
      return TIPA_TO_UNICODE[fullCommand] || match;
    });

    // Handle diacritics and accents
    result = this.processDiacritics(result);

    // Handle shortcut characters
    for (const [key, value] of Object.entries(TIPA_TO_UNICODE)) {
      if (key.length === 1 && key !== '\\') {
        result = result.replace(new RegExp(this.escapeRegExp(key), 'g'), value);
      }
    }

    // Handle superscripts
    result = result.replace(/\\super{([^}]*)}/g, (match, content) => {
      return this.convertToSuperscript(this.convertTIPAToUnicode(content));
    });

    return result;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private processSpecialMacros(input: string): string {
    let result = input;
    
    // Handle \* macro
    result = result.replace(/\\\*([a-zA-Z])/g, (match, char) => {
      return ASTERISK_MAPPINGS[char] || char;
    });

    // Handle \; macro (small capitals)
    result = result.replace(/\\;([A-Z])/g, (match, char) => {
      return SMALLCAP_MAPPINGS[char] || char.toLowerCase();
    });

    // Handle \: macro (retroflex)
    result = result.replace(/\\:([a-z])/g, (match, char) => {
      return RETROFLEX_MAPPINGS[char] || char;
    });

    // Handle \! macro (implosives/clicks)
    result = result.replace(/\\!([a-zA-Z])/g, (match, char) => {
      return IMPLOSIVE_MAPPINGS[char] || char;
    });

    return result;
  }

  private processDiacritics(input: string): string {
    let result = input;
    
    // Combining diacritics
    const diacriticMap: { [key: string]: string } = {
      '\\\'': '́',  // acute
      '\\`': '̀',   // grave
      '\\^': '̂',   // circumflex
      '\\"': '̈',   // diaeresis
      '\\~': '̃',   // tilde
      '\\=': '̄',   // macron
      '\\u': '̆',   // breve
      '\\.': '̇',   // dot
      '\\c': '̧',   // cedilla
      '\\k': '̨',   // ogonek
      '\\r': '̊',   // ring
      '\\v': '̌'    // caron
    };

    // Process combining diacritics with letters
    for (const [macro, combining] of Object.entries(diacriticMap)) {
      const regex = new RegExp(macro + '([a-zA-Zəæøɑɔɛɪʊʌɐɒɘɜɤɯʉʏ])', 'g');
      result = result.replace(regex, (match, letter) => {
        return letter + combining;
      });
    }

    return result;
  }

  private generateToneLetters(numbers: string): string {
    // Simple tone letter generation - can be enhanced
    const toneMap: { [key: string]: string } = {
      '55': '˥', '44': '˦', '33': '˧', '22': '˨', '11': '˩',
      '51': '˥˩', '53': '˥˧', '42': '˦˨', '31': '˧˩', '35': '˧˥',
      '24': '˨˦', '13': '˩˧', '15': '˩˥'
    };
    
    return toneMap[numbers] || `⁽${numbers}⁾`;
  }

  private convertToSuperscript(text: string): string {
    const superscriptMap: { [key: string]: string } = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
      '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
      'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
      'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
      'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ'
    };
    
    return text.split('').map(char => superscriptMap[char] || char).join('');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {
    console.log('Unloading TIPA IPA Support plugin');
  }
}

class TIPASettingTab extends PluginSettingTab {
  plugin: TIPAPlugin;

  constructor(app: App, plugin: TIPAPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    
    containerEl.createEl('h2', { text: 'TIPA IPA Support Settings' });
    containerEl.createEl('p', { 
      text: 'Based on TIPA Manual Version 1.3 by Rei Fukui' 
    });
    
    new Setting(containerEl)
      .setName('Auto-convert TIPA')
      .setDesc('Automatically convert TIPA notation in your notes')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoConvert)
        .onChange(async (value) => {
          this.plugin.settings.autoConvert = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Use phonetic font')
      .setDesc('Use a custom font that better displays phonetic symbols')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.useCustomFont)
        .onChange(async (value) => {
          this.plugin.settings.useCustomFont = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Safe mode')
      .setDesc('Disable special macros (\\*, \\;, \\:, \\!) that may conflict with other plugins')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableSafeMode)
        .onChange(async (value) => {
          this.plugin.settings.enableSafeMode = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Inline styling')
      .setDesc('Add background and border to inline TIPA text (disabling makes it look like normal text)')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.inlineStyling)
        .onChange(async (value) => {
          this.plugin.settings.inlineStyling = value;
          await this.plugin.saveSettings();
        }));

    // Usage examples from the manual
    containerEl.createEl('h3', { text: 'Usage Examples' });
    
    const examples = [
      '\\tipa{["s@mTIN]} → [ˈsʌmθɪŋ]',
      '\\tipa{/f@"nEtIks/} → /fəˈnɛtɪks/',
      '\\nt{o} → [o]',
      '\\wt{i} → /i/',
      '\\textipa{[h@"loU]} → [həˈloʊ]',
      '\\textprimstress → ˈ',
      '\\textschwa → ə', 
      '\\tone{55} → ˥',
      '\\tone{31} → ˧˩'
    ];
    
    const list = containerEl.createEl('ul');
    examples.forEach(example => {
      list.createEl('li', { text: example });
    });

    containerEl.createEl('h3', { text: 'Shortcut Characters' });
    const shortcutTable = containerEl.createEl('div');
    shortcutTable.addClass('tipa-shortcut-table');
    
    const shortcuts = [
      ['@ → ə', '! → ǀ', '" → ˈ', '% → ˌ'],
      ['0 → u', '1 → i', '2 → a', '3 → ɛ', '4 → ɔ'],
      ['5 → ɐ', '6 → ɒ', '7 → ɤ', '8 → ɵ', '9 → ɘ'],
      ['A → ɑ', 'B → β', 'C → ç', 'D → ð', 'E → ɛ'],
      ['S → ʃ', 'T → θ', 'U → ʊ', 'Z → ʒ', ': → ː']
    ];
    
    shortcuts.forEach(row => {
      const rowEl = shortcutTable.createEl('div');
      rowEl.addClass('tipa-shortcut-row');
      row.forEach(item => {
        const itemEl = rowEl.createEl('code');
        itemEl.setText(item);
        itemEl.addClass('tipa-shortcut-item');
      });
    });

    // Code block example
    containerEl.createEl('h3', { text: 'Code Block Usage' });
    const codeExample = containerEl.createEl('pre');
    codeExample.addClass('tipa-code-example');
    codeExample.setText('```tipa\n"h@loU w3:ld\n```\n\nWill render as:\nˈhəloʊ wɛːld');
  }
}