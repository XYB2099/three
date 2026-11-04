/* ============ 主界面逻辑：从数据渲染 + 语言切换 ============ */
let data = loadData();
let lang = storageGet("lang") || "zh";

/* 静态文案（非用户可编辑的部分） */
const I18N = {
  zh: {
    "nav.about": "关于我",
    "nav.pets": "宠物",
    "nav.contact": "联系",
    "hero.eyebrow": "// 你好，世界",
    "hero.cta1": "了解我",
    "hero.cta2": "联系我",
    "about.title": "关于我",
    "pets.title": "宠物",
    "pets.subtitle": "我的伙伴们",
    "contact.title": "联系方式",
    "contact.subtitle": "欢迎通过以下方式找到我",
    "contact.emailLabel": "邮箱",
    "contact.githubLabel": "GitHub",
    "footer.text": "用热爱构建",
    "footer.admin": "管理员设置"
  },
  en: {
    "nav.about": "About",
    "nav.pets": "Pets",
    "nav.contact": "Contact",
    "hero.eyebrow": "// Hello, world",
    "hero.cta1": "About Me",
    "hero.cta2": "Contact",
    "about.title": "About",
    "pets.title": "Pets",
    "pets.subtitle": "My companions",
    "contact.title": "Contact",
    "contact.subtitle": "Feel free to reach me",
    "contact.emailLabel": "Email",
    "contact.githubLabel": "GitHub",
    "footer.text": "Built with passion",
    "footer.admin": "Admin"
  }
};

/* ============ 渲染函数 ============ */
function renderHero() {
  document.getElementById("hero-name").textContent = data.name;
  document.getElementById("hero-name-en").textContent = data.nameEn;
  document.getElementById("hero-role").textContent = t(data.role, lang);
  document.getElementById("hero-subtitle").textContent = t(data.subtitle, lang);

  const avatar = document.getElementById("hero-avatar");
  if (data.avatar) {
    avatar.innerHTML = `<img src="${escAttr(data.avatar)}" alt="头像" />`;
  } else {
    avatar.textContent = (data.name || "夏").trim().charAt(0);
  }
}

function renderAbout() {
  document.getElementById("about-lead").textContent = t(data.about.lead, lang);
  document.getElementById("about-body").innerHTML =
    `<p>${t(data.about.p1, lang)}</p><p>${t(data.about.p2, lang)}</p>`;
}

function renderPets() {
  const grid = document.getElementById("pets-grid");
  grid.innerHTML = data.pets
    .map((pet) => {
      const img = pet.image
        ? `<div class="pet-card__img"><img src="${escAttr(pet.image)}" alt="${escAttr(t(pet.name, lang))}" /></div>`
        : "";
      return `
        <article class="pet-card">
          ${img}
          <h3 class="pet-card__name">${t(pet.name, lang)}</h3>
          <p class="pet-card__desc">${t(pet.desc, lang)}</p>
        </article>`;
    })
    .join("");
}

function renderCustomSections() {
  const container = document.getElementById("custom-sections");
  const sects = data.sections || [];
  container.innerHTML = sects
    .map((s, i) => {
      const paras = (t(s.body, lang) || "")
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => `<p>${line}</p>`)
        .join("");
      return `
        <section class="section">
          <div class="section__head">
            <span class="section__index">${String(3 + i).padStart(2, "0")}</span>
            <h2 class="section__title">${t(s.title, lang)}</h2>
          </div>
          <div class="custom-section__body">${paras}</div>
        </section>`;
    })
    .join("");

  const contactIndex = document.getElementById("contact-index");
  if (contactIndex) contactIndex.textContent = String(3 + sects.length).padStart(2, "0");
}

function renderContact() {
  const c = data.contact;
  const github = (c.github || "").replace(/^https?:\/\/github\.com\//i, "");
  const githubUrl = github ? "https://github.com/" + github : "#";
  const socialValue = t(c.social.value, lang);
  const socialUrl = /^https?:\/\//i.test(socialValue) ? socialValue : null;

  const socialItem = socialUrl
    ? `<a class="contact__item" href="${socialUrl}" target="_blank" rel="noopener">
        <span class="contact__meta">
          <span class="contact__label">${t(c.social.label, lang)}</span>
          <span class="contact__value">${socialValue}</span>
        </span>
      </a>`
    : `<div class="contact__item">
        <span class="contact__meta">
          <span class="contact__label">${t(c.social.label, lang)}</span>
          <span class="contact__value">${socialValue}</span>
        </span>
      </div>`;

  document.getElementById("contact-list").innerHTML =
    `<a class="contact__item" href="mailto:${c.email}">
      <span class="contact__meta">
        <span class="contact__label">${I18N[lang]["contact.emailLabel"]}</span>
        <span class="contact__value">${c.email}</span>
      </span>
    </a>
    <a class="contact__item" href="${githubUrl}" target="_blank" rel="noopener">
      <span class="contact__meta">
        <span class="contact__label">${I18N[lang]["contact.githubLabel"]}</span>
        <span class="contact__value">${githubUrl}</span>
      </span>
    </a>
    ${socialItem}`;
}

/* ============ 应用语言 ============ */
function applyLang() {
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (I18N[lang][key] != null) el.textContent = I18N[lang][key];
  });
  const ls = document.getElementById("lang-switch");
  if (ls) ls.classList.toggle("is-en", lang === "en");
  storageSet("lang", lang);
  renderHero();
  renderAbout();
  renderPets();
  renderCustomSections();
  renderContact();
}

/* 先渲染内容，保证主界面一定出现（后续交互失败不影响内容） */
applyLang();

/* 读取同目录 data.json（若存在），显示最新内容 */
if (typeof getFileData === "function") {
  getFileData().then(function (remote) {
    if (remote) {
      data = remote;
      storageSet(STORAGE_KEY, JSON.stringify(remote));
      applyLang();
    }
  });
}

/* ============ 语言切换 ============ */
const langSwitch = document.getElementById("lang-switch");
if (langSwitch) {
  langSwitch.addEventListener("click", () => {
    lang = lang === "zh" ? "en" : "zh";
    applyLang();
  });
}

/* ============ 移动端菜单 ============ */
const burger = document.getElementById("nav-burger");
const navLinks = document.getElementById("nav-links");
if (burger && navLinks) {
  burger.addEventListener("click", () => navLinks.classList.toggle("open"));
  navLinks.addEventListener("click", (e) => {
    if (e.target.tagName === "A") navLinks.classList.remove("open");
  });
}

/* ============ 滚动高亮导航 ============ */
const sections = document.querySelectorAll("section[id]");
const navAnchors = document.querySelectorAll(".nav__links a");
function highlightNav() {
  const pos = window.scrollY + 120;
  let current = "";
  sections.forEach((s) => {
    if (s.offsetTop <= pos) current = s.id;
  });
  navAnchors.forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === "#" + current);
  });
}
window.addEventListener("scroll", highlightNav, { passive: true });
highlightNav();

/* ============ 进入动画（可选，失败不影响内容） ============ */
try {
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".section, .hero").forEach((el) => {
      el.classList.add("reveal");
      revealObserver.observe(el);
    });
    /* 兜底：2 秒后强制全部显示，避免任何意外遮挡 */
    setTimeout(() => {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => el.classList.add("is-visible"));
    }, 2000);
  }
} catch (e) { /* 忽略 */ }

/* ============ 年份 ============ */
const yr = document.getElementById("year");
if (yr) yr.textContent = new Date().getFullYear();
