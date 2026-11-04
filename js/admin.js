/* ============ 管理员界面：密码校验 + 表单编辑/保存 ============ */
const PW = "xyb201099";
const AUTH_KEY = "xyb_admin_auth";

let data;
try {
  data = (typeof loadData === "function") ? loadData() : null;
} catch (e) {
  data = null;
}
if (!data) {
  data = {
    name: "", nameEn: "", role: { zh: "", en: "" }, avatar: "",
    subtitle: { zh: "", en: "" },
    about: { lead: { zh: "", en: "" }, p1: { zh: "", en: "" }, p2: { zh: "", en: "" } },
    pets: [], sections: [],
    contact: { email: "", github: "", social: { label: { zh: "", en: "" }, value: { zh: "", en: "" } } }
  };
}

const gate = document.getElementById("gate");
const editor = document.getElementById("editor");
const pwInput = document.getElementById("pw-input");
const pwError = document.getElementById("pw-error");
const form = document.getElementById("admin-form");
const toast = document.getElementById("saved-toast");

/* ============ 工具 ============ */
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setPath(obj, path, value) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    if (cur[k] == null || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k];
  }
  cur[path[path.length - 1]] = value;
}

function syncFromForm() {
  document.querySelectorAll("#admin-form [data-path]").forEach((el) => {
    setPath(data, el.getAttribute("data-path").split("."), el.value);
  });
}

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

/* ============ 表单字段生成 ============ */
function inputField(label, path, value, { textarea = false, span = false } = {}) {
  const id = "f-" + path.replace(/[^a-zA-Z0-9]/g, "-");
  const control = textarea
    ? `<textarea id="${id}" class="admin__field-input" data-path="${path}" rows="3">${esc(value)}</textarea>`
    : `<input id="${id}" class="admin__field-input" data-path="${path}" type="text" value="${esc(value)}" />`;
  const cls = span ? "admin__field admin__field--span" : "admin__field";
  return `<label class="${cls}" for="${id}"><span class="admin__field-label">${esc(label)}</span>${control}</label>`;
}

/* 图片字段：文本输入框承载值（URL 或 data URI），文件上传与预览联动 */
function imageField(label, path, value) {
  const id = "f-" + path.replace(/[^a-zA-Z0-9]/g, "-");
  return `<div class="admin__field admin__field--span admin__image-field" data-image-path="${path}">
    <span class="admin__field-label">${esc(label)}</span>
    <div class="admin__image-row">
      <div class="admin__image-preview" data-preview>
        ${value ? `<img src="${esc(value)}" alt="" />` : `<span class="admin__image-empty">无图片</span>`}
      </div>
      <div class="admin__image-controls">
        <input type="file" class="admin__image-file" accept="image/*" />
        <input id="${id}" type="text" class="admin__field-input" data-path="${path}" value="${esc(value)}" placeholder="粘贴图片链接，或点上方选择本地图片" />
        <button type="button" class="admin__image-clear">清除图片</button>
      </div>
    </div>
  </div>`;
}

function refreshPreview(field) {
  const preview = field.querySelector("[data-preview]");
  const val = (field.querySelector("[data-path]").value || "").trim();
  preview.innerHTML = val
    ? `<img src="${esc(val)}" alt="" />`
    : `<span class="admin__image-empty">无图片</span>`;
}

function section(title, inner) {
  return `<section class="admin__section"><h2 class="admin__section-title">${esc(title)}</h2><div class="admin__grid">${inner}</div></section>`;
}

/* ============ 静态内容 ============ */
function buildStatic() {
  const d = data;
  let h = "";
  h += section(
    "基本信息",
    imageField("头像 / 照片", "avatar", d.avatar) +
      inputField("中文名", "name", d.name) +
      inputField("英文名", "nameEn", d.nameEn) +
      inputField("身份（中文）", "role.zh", d.role.zh) +
      inputField("身份（英文）", "role.en", d.role.en) +
      inputField("副标题（中文）", "subtitle.zh", d.subtitle.zh, { textarea: true, span: true }) +
      inputField("副标题（英文）", "subtitle.en", d.subtitle.en, { textarea: true, span: true })
  );
  h += section(
    "关于我",
    inputField("首句（中文）", "about.lead.zh", d.about.lead.zh, { textarea: true, span: true }) +
      inputField("首句（英文）", "about.lead.en", d.about.lead.en, { textarea: true, span: true }) +
      inputField("段落 1（中文）", "about.p1.zh", d.about.p1.zh, { textarea: true, span: true }) +
      inputField("段落 1（英文）", "about.p1.en", d.about.p1.en, { textarea: true, span: true }) +
      inputField("段落 2（中文）", "about.p2.zh", d.about.p2.zh, { textarea: true, span: true }) +
      inputField("段落 2（英文）", "about.p2.en", d.about.p2.en, { textarea: true, span: true })
  );
  h += section(
    "联系方式",
    inputField("邮箱", "contact.email", d.contact.email) +
      inputField("GitHub 用户名", "contact.github", d.contact.github) +
      inputField("社交标签（中文）", "contact.social.label.zh", d.contact.social.label.zh) +
      inputField("社交标签（英文）", "contact.social.label.en", d.contact.social.label.en) +
      inputField("社交值（中文）", "contact.social.value.zh", d.contact.social.value.zh) +
      inputField("社交值（英文）", "contact.social.value.en", d.contact.social.value.en)
  );
  return h;
}

/* ============ 宠物动态列表 ============ */
function petCard(pet, i) {
  return `<div class="admin__pet" data-pet-index="${i}">
    <div class="admin__pet-head">
      <span class="admin__pet-title">宠物 ${i + 1}</span>
      <button type="button" class="admin__pet-remove" data-remove="${i}">删除</button>
    </div>
    <div class="admin__grid">
      ${imageField("图片", `pets.${i}.image`, pet.image)}
      ${inputField("名字（中文）", `pets.${i}.name.zh`, pet.name.zh)}
      ${inputField("名字（英文）", `pets.${i}.name.en`, pet.name.en)}
      ${inputField("描述（中文）", `pets.${i}.desc.zh`, pet.desc.zh, { textarea: true, span: true })}
      ${inputField("描述（英文）", `pets.${i}.desc.en`, pet.desc.en, { textarea: true, span: true })}
    </div>
  </div>`;
}

function renderPets() {
  const wrap = document.getElementById("pets-wrap");
  wrap.innerHTML =
    `<section class="admin__section"><h2 class="admin__section-title">宠物</h2>` +
    data.pets.map(petCard).join("") +
    `<button type="button" class="admin__add" id="add-pet">＋ 添加宠物</button>` +
    `</section>`;
}

/* ============ 更多板块动态列表 ============ */
function sectionCard(s, i) {
  return `<div class="admin__pet" data-section-index="${i}">
    <div class="admin__pet-head">
      <span class="admin__pet-title">板块 ${i + 1}</span>
      <button type="button" class="admin__pet-remove" data-remove-section="${i}">删除</button>
    </div>
    <div class="admin__grid">
      ${inputField("标题（中文）", `sections.${i}.title.zh`, s.title.zh)}
      ${inputField("标题（英文）", `sections.${i}.title.en`, s.title.en)}
      ${inputField("内容（中文，可多行）", `sections.${i}.body.zh`, s.body.zh, { textarea: true, span: true })}
      ${inputField("内容（英文，可多行）", `sections.${i}.body.en`, s.body.en, { textarea: true, span: true })}
    </div>
  </div>`;
}

function renderSections() {
  const wrap = document.getElementById("sections-wrap");
  wrap.innerHTML =
    `<section class="admin__section"><h2 class="admin__section-title">更多板块</h2>` +
    data.sections.map(sectionCard).join("") +
    `<button type="button" class="admin__add" id="add-section">＋ 添加板块</button>` +
    `</section>`;
}

function renderForm() {
  form.innerHTML = buildStatic() + `<div id="pets-wrap"></div><div id="sections-wrap"></div>`;
  renderPets();
  renderSections();
}

/* ============ 事件 ============ */
form.addEventListener("click", (e) => {
  const t = e.target;

  if (t.id === "add-pet") {
    syncFromForm();
    data.pets.push({ name: { zh: "", en: "" }, desc: { zh: "", en: "" }, image: "" });
    renderPets();
    return;
  }

  if (t.id === "add-section") {
    syncFromForm();
    data.sections.push({ title: { zh: "", en: "" }, body: { zh: "", en: "" } });
    renderSections();
    return;
  }

  if (t.getAttribute && t.getAttribute("data-remove") != null) {
    syncFromForm();
    data.pets.splice(Number(t.getAttribute("data-remove")), 1);
    renderPets();
    return;
  }

  if (t.getAttribute && t.getAttribute("data-remove-section") != null) {
    syncFromForm();
    data.sections.splice(Number(t.getAttribute("data-remove-section")), 1);
    renderSections();
    return;
  }

  if (t.classList && t.classList.contains("admin__image-clear")) {
    const field = t.closest(".admin__image-field");
    field.querySelector("[data-path]").value = "";
    refreshPreview(field);
  }
});

form.addEventListener("change", (e) => {
  if (e.target.classList && e.target.classList.contains("admin__image-file")) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const field = e.target.closest(".admin__image-field");
    const textInput = field.querySelector("[data-path]");
    const reader = new FileReader();
    reader.onload = () => {
      textInput.value = reader.result;
      refreshPreview(field);
    };
    reader.readAsDataURL(file);
  }
});

form.addEventListener("input", (e) => {
  if (e.target.matches && e.target.matches(".admin__image-field input[data-path]")) {
    refreshPreview(e.target.closest(".admin__image-field"));
  }
});

document.getElementById("btn-save").addEventListener("click", () => {
  syncFromForm();
  saveData(data);
  const json = JSON.stringify(data, null, 2);
  document.getElementById("data-output").value = json;
  document.getElementById("data-modal").hidden = false;
  downloadData(data); // 尝试自动下载；弹窗作为兜底，里面也能手动下载/复制
  showToast("已生成 data.json ✓");
});

document.getElementById("btn-download-json").addEventListener("click", () => {
  downloadData(data);
});

document.getElementById("btn-copy-json").addEventListener("click", () => {
  const ta = document.getElementById("data-output");
  const text = ta.value;
  function done() { showToast("已复制 ✓"); }
  function manual() {
    ta.focus();
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { showToast("复制失败，请手动全选复制"); }
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(manual);
  } else {
    manual();
  }
});

document.getElementById("btn-modal-close").addEventListener("click", () => {
  document.getElementById("data-modal").hidden = true;
});

document.getElementById("btn-reset").addEventListener("click", () => {
  if (!confirm("确定恢复为默认内容吗？当前编辑将丢失。")) return;
  data = resetData();
  renderForm();
  showToast("已恢复默认内容");
});

document.getElementById("btn-logout").addEventListener("click", () => {
  sessionRemove(AUTH_KEY);
  location.reload();
});

/* ============ 密码门 ============ */
function enter() {
  if (pwInput.value.trim() === PW) {
    sessionSet(AUTH_KEY, "1");
    showEditor();
  } else {
    pwError.textContent = "密码错误，请重试";
    pwInput.value = "";
    pwInput.focus();
  }
}
document.getElementById("pw-submit").addEventListener("click", enter);
pwInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") enter();
});

function showEditor() {
  gate.hidden = true;
  editor.hidden = false;
  window.scrollTo(0, 0);
  renderForm();
  /* 进入编辑器后，读取 data.json 里的最新数据再渲染一次 */
  if (typeof getFileData === "function") {
    getFileData().then(function (remote) {
      if (remote) {
        data = remote;
        renderForm();
      }
    });
  }
}

/* ============ 初始化 ============ */
if (sessionGet(AUTH_KEY) === "1") {
  showEditor();
} else {
  pwInput.focus();
}
