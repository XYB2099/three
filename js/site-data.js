/* ============ 网站可编辑数据：默认值 + localStorage 读写 ============ */
/* 所有可编辑内容集中在此。管理员界面修改后会写入 localStorage，
   主页每次打开时读取并覆盖默认值。 */

const STORAGE_KEY = "xyb_site_data_v1";

/* 安全的存储封装：在 file:// 或隐私模式下 localStorage/sessionStorage 可能抛异常，
   统一捕获，保证脚本不会因此中断。 */
function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function storageSet(key, val) {
  try { localStorage.setItem(key, val); return true; } catch (e) { return false; }
}
function storageRemove(key) {
  try { localStorage.removeItem(key); } catch (e) { /* 忽略 */ }
}
function sessionGet(key) {
  try { return sessionStorage.getItem(key); } catch (e) { return null; }
}
function sessionSet(key, val) {
  try { sessionStorage.setItem(key, val); } catch (e) { /* 忽略 */ }
}
function sessionRemove(key) {
  try { sessionStorage.removeItem(key); } catch (e) { /* 忽略 */ }
}

/* HTML 属性转义（图片 src 等场景使用） */
function escAttr(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const DEFAULT_DATA = {
  name: "夏一博",
  nameEn: "Xia Yibo",
  role: { zh: "在校学生", en: "Student" },
  avatar: "", // 头像/照片：图片链接或 data URI，空则显示名字首字
  subtitle: {
    zh: "保持好奇，持续学习。这是一个关于我的主页。",
    en: "Stay curious, keep learning. This is a site about me."
  },
  about: {
    lead: {
      zh: "你好！我是夏一博，一名在校学生。",
      en: "Hi! I'm Xia Yibo, a student."
    },
    p1: {
      zh: "这里是一段关于我的介绍占位：专业方向、兴趣爱好，以及我正在学习的内容。",
      en: "Placeholder: your major, interests, and what you are learning."
    },
    p2: {
      zh: "这里可以补充第二段：最近在做什么、你的目标，或一句喜欢的话。",
      en: "A second paragraph: recent work, goals, or a quote you like."
    }
  },
  pets: [
    { name: { zh: "宠物一", en: "Pet One" }, desc: { zh: "宠物介绍占位。", en: "Placeholder pet description." }, image: "" },
    { name: { zh: "宠物二", en: "Pet Two" }, desc: { zh: "宠物介绍占位。", en: "Placeholder pet description." }, image: "" }
  ],
  sections: [], // 自定义板块：{ title: {zh,en}, body: {zh,en} }
  contact: {
    email: "your-email@example.com",
    github: "yourname",
    social: {
      label: { zh: "社交 / 其他", en: "Social / Other" },
      value: { zh: "你的社交链接", en: "Your social link" }
    }
  }
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

/* 深合并：以 DEFAULT_DATA 为基础，用已保存的数据覆盖（数组整体替换） */
function deepMerge(base, override) {
  const out = clone(base);
  for (const k in override) {
    if (isObject(base[k]) && isObject(override[k])) {
      out[k] = deepMerge(base[k], override[k]);
    } else {
      out[k] = override[k];
    }
  }
  return out;
}

/* 归一化：补齐旧数据可能缺失的字段，避免渲染时报错 */
function normalize(data) {
  const out = clone(data);
  out.pets = (out.pets || []).map((p) => ({
    name: p.name || { zh: "", en: "" },
    desc: p.desc || { zh: "", en: "" },
    image: p.image || ""
  }));
  out.sections = (out.sections || []).map((s) => ({
    title: s.title || { zh: "", en: "" },
    body: s.body || { zh: "", en: "" }
  }));
  return out;
}

function loadData() {
  let base = clone(DEFAULT_DATA);
  try {
    const raw = storageGet(STORAGE_KEY);
    if (raw) base = deepMerge(DEFAULT_DATA, JSON.parse(raw));
  } catch (e) {
    /* 忽略损坏数据 */
  }
  return normalize(base);
}

function saveData(data) {
  return storageSet(STORAGE_KEY, JSON.stringify(data));
}

function resetData() {
  storageRemove(STORAGE_KEY);
  return clone(DEFAULT_DATA);
}

/* 按当前语言取值，缺省回退到中文 */
function t(obj, lang) {
  if (obj && typeof obj === "object") {
    return obj[lang] != null ? obj[lang] : obj.zh;
  }
  return obj;
}

/* ============ 数据文件同步（data.json） ============ */
/* 网站打开时读取同目录的 data.json；管理员保存时导出 data.json，上传到 GitHub 即可全网更新。
   不需要任何账号或密钥，配合 GitHub Pages 使用。 */

function getFileData() {
  if (typeof fetch !== "function") return Promise.resolve(null);
  return fetch("data.json", { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (json) {
      return normalize(deepMerge(DEFAULT_DATA, json));
    })
    .catch(function () { return null; });
}

/* 把数据导出为 data.json 下载到本地 */
function downloadData(data) {
  try {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return true;
  } catch (e) {
    return false;
  }
}
