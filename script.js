/**
 * LIQUID SECURITY PASS ARCHITECTURE (ANIMATED ENGINE)
 */
class PasswordService {
  static CHAR_POOLS = {
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lower: "abcdefghijklmnopqrstuvwxyz",
    number: "0123456789",
    symbol: "!@#$%^&*()_+=-[]{}|;:',.<>?/"
  };

  static generate({ length, options }) {
    let pool = "";
    let poolSize = 0;

    Object.keys(options).forEach(key => {
      if (options[key]) {
        pool += this.CHAR_POOLS[key];
        poolSize += this.CHAR_POOLS[key].length;
      }
    });

    if (!pool) return { password: "", entropy: 0 };

    const randomArray = new Uint32Array(length);
    window.crypto.getRandomValues(randomArray);

    let password = "";
    for (let i = 0; i < length; i++) {
      password += pool[randomArray[i] % pool.length];
    }

    return { password, entropy: this.calculateEntropy(length, poolSize) };
  }

  static calculateEntropy(length, poolSize) {
    return length === 0 || poolSize === 0 ? 0 : Math.floor(length * Math.log2(poolSize));
  }

  static evaluatePasswordStrength(password) {
    if (!password) return { text: "", label: "" };

    let poolSize = 0;
    if (/[A-Z]/.test(password)) poolSize += this.CHAR_POOLS.upper.length;
    if (/[a-z]/.test(password)) poolSize += this.CHAR_POOLS.lower.length;
    if (/[0-9]/.test(password)) poolSize += this.CHAR_POOLS.number.length;
    if (/[^A-Za-z0-9]/.test(password)) poolSize += this.CHAR_POOLS.symbol.length;

    const entropy = this.calculateEntropy(password.length, poolSize);

    if (entropy < 40) return { text: "Weak 🔴", label: "weak" };
    if (entropy < 65) return { text: "Medium 🟡", label: "medium" };
    return { text: "Strong 🟢", label: "strong" };
  }
}

class UIManager {
  constructor() {
    this.tabs = document.querySelectorAll(".tab-trigger");
    this.panels = document.querySelectorAll(".tab-panel");
    this.modal = document.getElementById("settingsModal");
    this.slider = document.getElementById("lengthSlider");
    this.sliderVal = document.getElementById("lengthValue");
    
    this.initStaticListeners();
  }

  initStaticListeners() {
    this.tabs.forEach(tab => tab.addEventListener("click", () => this.switchTab(tab)));
    this.slider.addEventListener("input", () => this.syncSlider());
    this.syncSlider();
  }

  switchTab(selectedTab) {
    const target = selectedTab.getAttribute("data-tab-target");
    
    this.tabs.forEach(t => {
      const active = t === selectedTab;
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", active);
    });

    this.panels.forEach(p => {
      const isTarget = p.id === target;
      p.classList.toggle("active", isTarget);
      if (isTarget) {
        // Trigger a CSS reflow to re-run entry animations cleanly
        p.style.animation = 'none';
        p.offsetHeight; 
        p.style.animation = null;
      }
    });
  }

  syncSlider() {
    const value = parseInt(this.slider.value, 10);
    const min = parseInt(this.slider.min, 10) || 6;
    const max = parseInt(this.slider.max, 10) || 64;
    const pct = ((value - min) / (max - min)) * 100;

    this.slider.style.background = `linear-gradient(90deg, rgba(116,125,255,0.6) ${pct}%, rgba(0,0,0,0.4) ${pct}%)`;
    this.sliderVal.textContent = value;
  }

  toggleModal() {
    if (this.modal.open) {
      this.modal.classList.add("modal-closing");
      this.modal.addEventListener("animationend", () => {
        this.modal.close();
        this.modal.classList.remove("modal-closing");
      }, { once: true });
    } else {
      this.modal.showModal();
    }
  }

  /**
   * High-Tech Scramble Animation Effect
   */
  animateTextReveal(inputElement, finalPassword, onComplete) {
    const chars = "!@#$%^&*()_+=-[]{}|;:',.<>/?0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let iterations = 0;
    const maxIterations = finalPassword.length;
    clearInterval(this.scrambleInterval);

    this.scrambleInterval = setInterval(() => {
      inputElement.value = finalPassword
        .split("")
        .map((letter, index) => {
          if (index < iterations) {
            return finalPassword[index];
          }
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join("");

      if (iterations >= maxIterations) {
        clearInterval(this.scrambleInterval);
        inputElement.value = finalPassword;
        if (onComplete) onComplete();
      }
      
      iterations += 1 / 2; // Speeds up or slows down duration cycle
    }, 25);
  }

  async copyToClipboard(text, element) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      const prev = element.textContent;
      element.textContent = "✅";
      element.style.transform = "scale(1.3)";
      setTimeout(() => {
        element.textContent = prev;
        element.style.transform = "scale(1)";
      }, 1200);
    } catch (err) {
      console.error(err);
    }
  }

  renderStrength(targetElement, evaluation) {
    targetElement.textContent = evaluation.text;
    targetElement.className = evaluation.label ? `status-pill ${evaluation.label}` : "";
    
    // Add pop scale animation bounce when strength calculates
    targetElement.style.animation = 'none';
    targetElement.offsetHeight;
    targetElement.style.animation = 'popScale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
  }
}

class App {
  constructor() {
    this.ui = new UIManager();
    this.bindEvents();
  }

  getGeneratorSettings() {
    return {
      length: parseInt(this.ui.slider.value, 10),
      options: {
        upper: document.querySelector('[data-set="upper"]').checked,
        lower: document.querySelector('[data-set="lower"]').checked,
        number: document.querySelector('[data-set="number"]').checked,
        symbol: document.querySelector('[data-set="symbol"]').checked,
      }
    };
  }

  bindEvents() {
    const outField = document.getElementById("passwordOutput");
    const testField = document.getElementById("testInput");

    document.addEventListener("click", (e) => {
      const action = e.target.closest("[data-action]")?.getAttribute("data-action");
      if (action === "toggle-settings") this.ui.toggleModal();
      if (action === "copy") this.ui.copyToClipboard(outField.value, e.target);
    });

    document.getElementById("generateBtn").addEventListener("click", () => {
      const settings = this.getGeneratorSettings();
      const result = PasswordService.generate(settings);

      if (!result.password) {
        alert("Please activate at least one character dataset.");
        return;
      }

      // Chain the text scramble to the strength check
      this.ui.animateTextReveal(outField, result.password, () => {
        const evaluation = PasswordService.evaluatePasswordStrength(result.password);
        this.ui.renderStrength(document.getElementById("genStrength"), evaluation);
      });
    });

    testField.addEventListener("input", () => {
      const evaluation = PasswordService.evaluatePasswordStrength(testField.value);
      this.ui.renderStrength(document.getElementById("testStrength"), evaluation);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => new App());