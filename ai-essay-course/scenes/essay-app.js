/* essay-app.js —— 作文批改助手根组件 + 顶栏 + toast（产品方案 v2）
   DOM / class 取自 essay/src/App.vue、AppHeader.vue 与 Element Plus 2.2.36 的渲染结果
   （规格：/tmp/demo-spec/essay-home/dom-header-*.html、dom-toast.html）。
   v2：没有首页、没有"发送给学生"、没有批改历史。作文由班课侧带 id 直接进入某一篇，页面按 ctx.S.eview 三选一：
     'ocr' 图片校对页（essay-home.js）｜'grading' AI 批改中进度页（essay-home.js）｜'review' 批改页（essay-review.js）
   带 x- 前缀的 class 是产品方案新增元素，样式在 css/essay-header.css 末尾"新增（产品方案 v2）"之后。 */

var ESSAY_ICON = 'assets/essay/src/icons/';

/* ====================== 顶栏 ====================== */
Vue.component('essay-header', {
  template:
    '<header class="app-header" :class="{\'x-hd--ro\': !!ctx.S.ro, \'x-hd--ocr\': !isReview}">' +
      '<div class="header-left">' +
        '<div class="brand">' +
          '<span class="brand-logo">' +
            '<span class="essay-icon" style="width: 20px; height: 20px;" aria-hidden="true"><img :src="ic + \'pen-icon.svg\'" alt=""></span>' +
          '</span>' +
          '<span class="brand-title">作文批改助手</span>' +
        '</div>' +
        /* 「返回」= 关闭本页签、回班课 */
        '<button class="header-btn" type="button" title="返回" @click="$act(\'closeEssay\')">' +
          '<span class="essay-icon" style="width: 16px; height: 16px;" aria-hidden="true"><img :src="ic + \'arrow-left.svg\'" alt=""></span>' +
          '<span class="header-btn__label">返回</span>' +
        '</button>' +
      '</div>' +

      '<div v-if="e" class="header-meta">' +
        '<span class="header-meta__name">{{ studentName }}</span>' +
        '<span v-if="e.title" class="header-meta__title">《{{ e.title }}》</span>' +
        '<span v-if="ctx.S.ro" class="x-hd-ro-note" title="只读：当前登录账号与教辅老师不一致">只读：当前登录账号与教辅老师不一致</span>' +
      '</div>' +

      '<div class="header-right">' +
        '<template v-if="isReview && e">' +
          '<button class="action-btn action-btn--save" type="button" :disabled="lockSave" @click="$act(\'save\')">保存修改</button>' +
          '<button class="action-btn action-btn--done" type="button" :disabled="lockDone" @click="$act(\'finish\')">完成批改</button>' +
          '<button class="header-btn" type="button" title="预览" @click="$act(\'openPreview\')">' +
            '<span class="essay-icon" style="width: 14px; height: 14px;" aria-hidden="true"><img :src="ic + \'eye.svg\'" alt=""></span>' +
            '<span class="header-btn__label header-btn__label--hide-narrow">预览</span>' +
          '</button>' +
          '<button class="header-btn" type="button" title="导出为 PDF" @click="$act(\'fake\', {m: \'导出为 PDF\'})">' +
            '<span class="essay-icon" style="width: 14px; height: 14px;" aria-hidden="true"><img :src="ic + \'download.svg\'" alt=""></span>' +
            '<span class="header-btn__label header-btn__label--hide-medium">导出为pdf</span>' +
          '</button>' +
          '<button class="header-btn" type="button" title="导出为 word" @click="$act(\'fake\', {m: \'导出为 Word\'})">' +
            '<span class="essay-icon" style="width: 14px; height: 14px;" aria-hidden="true"><img :src="ic + \'download.svg\'" alt=""></span>' +
            '<span class="header-btn__label header-btn__label--hide-medium">导出为word</span>' +
          '</button>' +
          '<button class="header-btn" type="button" title="导出为图片" @click="$act(\'fake\', {m: \'导出为图片\'})">' +
            '<span class="essay-icon" style="width: 14px; height: 14px;" aria-hidden="true"><img :src="ic + \'download.svg\'" alt=""></span>' +
            '<span class="header-btn__label header-btn__label--hide-medium">导出为图片</span>' +
          '</button>' +
        '</template>' +
        '<div class="avatar" :title="teacher">{{ initial }}</div>' +
      '</div>' +
    '</header>',
  data: function () { return { ic: ESSAY_ICON }; },
  computed: {
    isReview: function () { return this.ctx.S.eview === 'review'; },
    /* 当前作文（走 ctx 以保持响应式） */
    e: function () {
      var c = this.ctx;
      if (!c.S.cur) return null;
      return (c.E || []).find(function (x) { return x.id === c.S.cur; }) || null;
    },
    studentName: function () {
      var s = this.e && this.H.stu(this.e.sid);
      return s ? s.name : '';
    },
    teacher: function () { return (this.ctx.D && this.ctx.D.TEACHER) || ''; },
    initial: function () { return this.teacher ? this.teacher.charAt(0) : '用'; },
    /* 只读（登录人 ≠ 归属教辅）：保存修改 / 完成批改置灰 */
    lockSave: function () { return !!this.ctx.S.ro; },
    /* 完成批改之后也置灰（避免重复点） */
    lockDone: function () { return !!this.ctx.S.ro || !!this.ctx.S.done; }
  }
});

/* ====================== 根组件（App.vue 的外壳） ====================== */
Vue.component('essay-app', {
  template:
    '<div class="app-shell x-app-shell">' +
      '<essay-header/>' +
      '<main class="app-content">' +
        '<essay-ocr v-if="ctx.S.eview === \'ocr\'"/>' +
        '<essay-grading v-else-if="ctx.S.eview === \'grading\'"/>' +
        '<scene-review v-else/>' +
      '</main>' +
      '<essay-preview/>' +
    '</div>'
});


/* ====================== toast：Element Plus ElMessage 的真实 DOM / 定位 / 动效 ======================
   EP 2.2.36：offset 16；第 2 条起 top = 20 + 上一条的底边；duration 3000ms；鼠标移入暂停计时；
   进出场用 el-message-fade-*（opacity + translate(-50%,-100%)）。 */
(function () {
  var DURATION = 3000, FIRST_OFFSET = 16, SPACE = 20, z = 2001, list = [];
  var PATHS = {
    success: 'M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm-55.808 536.384-99.52-99.584a38.4 38.4 0 1 0-54.336 54.336l126.72 126.72a38.272 38.272 0 0 0 54.336 0l262.4-262.464a38.4 38.4 0 1 0-54.272-54.336L456.192 600.384z',
    info: 'M512 64a448 448 0 1 1 0 896.064A448 448 0 0 1 512 64zm67.2 275.072c33.28 0 60.288-23.104 60.288-57.344s-27.072-57.344-60.288-57.344c-33.28 0-60.16 23.104-60.16 57.344s26.88 57.344 60.16 57.344zM590.912 699.2c0-6.848 2.368-24.64 1.024-34.752l-52.608 60.544c-10.88 11.456-24.512 19.392-30.912 17.28a12.992 12.992 0 0 1-8.256-14.72l87.68-276.992c7.168-35.136-12.544-67.2-54.336-71.296-44.096 0-108.992 44.736-148.48 101.504 0 6.784-1.28 23.68.064 33.792l52.544-60.608c10.88-11.328 23.552-19.328 29.952-17.152a12.8 12.8 0 0 1 7.808 16.128L388.48 728.576c-10.048 32.256 8.96 63.872 55.04 71.04 67.84 0 107.904-43.648 147.456-100.416z',
    warning: 'M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm0 192a58.432 58.432 0 0 0-58.24 63.744l23.36 256.384a35.072 35.072 0 0 0 69.76 0l23.296-256.384A58.432 58.432 0 0 0 512 256zm0 512a51.2 51.2 0 1 0 0-102.4 51.2 51.2 0 0 0 0 102.4z',
    error: 'M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm0 393.664L407.936 353.6a38.4 38.4 0 1 0-54.336 54.336L457.664 512 353.6 616.064a38.4 38.4 0 1 0 54.336 54.336L512 566.336 616.064 670.4a38.4 38.4 0 1 0 54.336-54.336L566.336 512 670.4 407.936a38.4 38.4 0 1 0-54.336-54.336L512 457.664z'
  };

  function relayout() {
    var bottom = 0;
    list.forEach(function (m, i) {
      var top = (i === 0 ? FIRST_OFFSET : SPACE) + bottom;
      m.el.style.top = top + 'px';
      bottom = top + m.el.offsetHeight;
    });
  }

  function close(m) {
    if (m.closed) return;
    m.closed = true;
    clearTimeout(m.timer);
    m.el.classList.add('el-message-fade-leave-to');
    setTimeout(function () {
      if (m.el.parentNode) m.el.parentNode.removeChild(m.el);
      var i = list.indexOf(m);
      if (i > -1) list.splice(i, 1);
      relayout();
    }, 400);
  }

  window.__toast = function (msg, type) {
    if (msg === undefined || msg === null || msg === '') return;
    if (!PATHS[type]) type = 'info';
    var el = document.createElement('div');
    el.className = 'el-message el-message--' + type + ' el-message-fade-enter-from';
    el.setAttribute('role', 'alert');
    el.style.zIndex = ++z;
    el.innerHTML =
      '<i class="el-icon el-message__icon el-message-icon--' + type + '"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="' + PATHS[type] + '"></path></svg></i>' +
      '<p class="el-message__content"></p>';
    el.lastChild.textContent = String(msg);
    document.body.appendChild(el);

    var m = { el: el, timer: null, closed: false };
    list.push(m);
    relayout();
    void el.offsetWidth;                                   /* 触发进场过渡 */
    el.classList.remove('el-message-fade-enter-from');
    function start() { clearTimeout(m.timer); m.timer = setTimeout(function () { close(m); }, DURATION); }
    el.addEventListener('mouseenter', function () { clearTimeout(m.timer); });
    el.addEventListener('mouseleave', function () { if (!m.closed) start(); });
    start();
  };
})();
