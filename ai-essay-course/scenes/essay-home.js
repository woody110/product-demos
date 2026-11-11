/* essay-home.js —— 作文批改助手"首页"里被复用的两块（产品方案 v2：没有首页，作文由班课列表带 id 直接进入某一篇）
   · essay-ocr      图片作文先走的"文字识别 → 图片校对"页：DOM / class 取自作文批改助手真实 ImageReview（/tmp/demo-spec/essay-home/dom-home-right-states.html），
                    左原图 / 右识别文字可编辑；底部「开始批改」→ $act('startGrade')
   · essay-grading  文字作文 / 校对后的"AI 批改中"进度页：DOM 取自真实 ProgressState + EssayLoading
   · eh-icon        真实 EssayIcon.vue 的两种渲染（img / CSS mask）
   · essay-handwrite  新增（x- 前缀）：学生拍照提交的手写作文——没有图片文件，用 CSS 画手写稿纸占位（校对页左图、批改页画布共用）
   旧版首页（学生下拉 / 作文列表 / 分段 / 上传粘贴）整体移到 demo/_unused/essay-home.v1.js。
   状态全部来自 this.ctx（父页面快照），动作通过 this.$act 回传。 */
(function () {
  var IC = 'assets/essay/src/icons/';
  var PARA_INDENT = '　　';

  /* ---------------- 手写稿纸占位：排版（校对页与批改页画布共用，红圈位置也据此换算） ----------------
     坐标系：稿纸宽高比 3:4；横线行高 RH = 稿纸高度的 3.9%；第 0 行放题目，第 1 行留空，正文从第 2 行开始；
     每行约 18 个字，每个字画成一小块灰色笔迹。返回的 top / left / width 全是稿纸的百分比。 */
  var RH = 3.9, PER = 18, LEFT = 8, SPAN = 84;
  function layout(paras, title) {
    var rows = [], starts = [], r = 2;
    paras.forEach(function (p, pi) {
      starts.push(r);
      var n = Array.from(PARA_INDENT + p).length, lines = Math.ceil(n / PER);
      for (var i = 0; i < lines; i++) {
        var from = i * PER, cnt = Math.min(PER, n - from), indent = i === 0 ? 2 : 0;
        rows.push({ row: r, left: LEFT + (indent / PER) * SPAN, w: ((cnt - indent) / PER) * SPAN, chars: cnt - indent, pi: pi, first: i === 0 });
        r++;
      }
    });
    var t = Math.min(Array.from(title || '').length || 4, 12);
    return { rows: rows, starts: starts, titleRow: { left: LEFT + ((PER - t) / 2 / PER) * SPAN, w: (t / PER) * SPAN, chars: t }, total: r };
  }
  /* 图片作文分页：第 1 张放前一半段落，第 2 张放后一半（与校对页的"第1张/第2张"一致）；返回 [{ paras, offset }] 其中 offset = 该页第一段在全文里的段序号 */
  function pages(paras) {
    var cut = Math.max(1, Math.ceil(paras.length / 2));
    return [{ paras: paras.slice(0, cut), offset: 0 }, { paras: paras.slice(cut), offset: cut }];
  }
  window.XHW = { RH: RH, layout: layout, pages: pages, PARA_INDENT: PARA_INDENT };

  /* 图标：普通 img / tint(CSS mask) 两种，对应真实 EssayIcon.vue */
  Vue.component('eh-icon', {
    props: { name: String, size: { type: Number, default: 14 }, tint: Boolean },
    computed: {
      st: function () {
        var s = { width: this.size + 'px', height: this.size + 'px' };
        if (this.tint) s['--essay-icon'] = 'url("' + IC + this.name + '.svg")';
        return s;
      },
      src: function () { return IC + this.name + '.svg'; }
    },
    template: '<span v-if="tint" class="essay-icon essay-icon--mask" :style="st" :data-icon="name" aria-hidden="true"></span>' +
      '<span v-else class="essay-icon" :style="st" aria-hidden="true"><img :src="src" alt=""></span>'
  });

  /* 手写稿纸占位（新增）：横线稿纸 + 灰色笔迹块 + 小字说明。尺寸 100% 铺满父容器，行高按父容器高度的百分比。 */
  Vue.component('essay-handwrite', {
    props: { paras: { type: Array, default: function () { return []; } }, title: String, showTitle: { type: Boolean, default: true } },
    computed: {
      lay: function () { return layout(this.paras, this.title); },
      lines: function () {
        var out = [], lay = this.lay;
        if (this.showTitle && this.title) out.push({ k: 't', top: 0, left: lay.titleRow.left, w: lay.titleRow.w, chars: lay.titleRow.chars, title: true });
        lay.rows.forEach(function (x, i) { out.push({ k: 'r' + i, top: x.row * RH, left: x.left, w: x.w, chars: x.chars, title: false }); });
        return out;
      }
    },
    methods: {
      st: function (l) {
        /* 每个字 = 一小块灰色笔迹：按行宽平分成 chars 个小块，块之间留空 */
        var unit = l.w / Math.max(l.chars, 1);
        return { top: (l.top + RH * 0.2) + '%', left: l.left + '%', width: l.w + '%', height: (RH * 0.56) + '%',
          backgroundSize: unit / l.w * 100 + '% 100%' };
      }
    },
    template: '<div class="x-hw" role="img" aria-label="学生拍照提交的手写作文">' +
      '<span v-for="l in lines" :key="l.k" class="x-hw__line" :class="{ \'x-hw__line--title\': l.title }" :style="st(l)"></span>' +
      '<span class="x-hw__tip">学生拍照提交的手写作文</span>' +
      '</div>'
  });

  /* ====================== 图片校对页（取自旧首页右栏 right==='ocr'） ====================== */
  Vue.component('essay-ocr', {
    data: function () { return { page: 0 }; },
    computed: {
      S: function () { return this.ctx.S; },
      e: function () { void this.ctx; return this.S.cur ? this.H.ev(this.S.cur) : null; },
      title: function () { return this.e ? this.e.title : ''; },
      ro: function () { return !!this.S.ro; },
      pg: function () { return pages((this.ctx.D && this.ctx.D.PARAS) || []); },
      cur: function () { return this.pg[this.page] || this.pg[0]; },
      /* 识别文字：每段首行缩进两个全角空格（= 新段落） */
      pageParas: function () { return this.cur.paras.map(function (p) { return PARA_INDENT + p; }); }
    },
    template: '<div class="home-page">' +
      '<div class="review-pane">' +
      '<h3 class="review-title">图片文字识别结果</h3>' +
      '<p class="review-hint">请对照左侧原图核对识别内容是否一致；<em>如有识别缺漏或错误，可编辑修正</em>。首行缩进（两个全角空格）表示新段落，顶格表示与上一段合并（可跨图）。多张图片切换页码会保留修改，修正后再点击【开始批改】。</p>' +
      '<div class="page-tabs">' +
      '<button class="page-tab" :class="{active: page === 0}" type="button" @click="page = 0">第1张</button>' +
      '<button class="page-tab" :class="{active: page === 1}" type="button" @click="page = 1">第2张</button>' +
      '</div>' +
      '<div class="compare">' +
      '<div class="compare-image"><essay-handwrite :paras="cur.paras" :title="title" :show-title="page === 0"/></div>' +
      '<div class="compare-editor">' +
      '<div v-if="page === 0" class="review-title-input"><div class="el-input"><div class="el-input__wrapper"><input class="el-input__inner" type="text" maxlength="50" autocomplete="off" placeholder="暂未识别到作文标题，请手动输入" :value="title" :readonly="ro"></div></div></div>' +
      '<div class="para-editor vditor-host essay-md-content compare-text vditor"><div class="vditor-toolbar"></div><div class="vditor-content"><div class="vditor-wysiwyg">' +
      '<pre class="vditor-reset" placeholder="" :contenteditable="ro ? \'false\' : \'true\'" spellcheck="false"><p v-for="(p, i) in pageParas" :key="page + \'-\' + i" data-block="0">{{ p }}</p></pre>' +
      '</div></div></div>' +
      '</div></div>' +
      '<div class="review-footer"><button class="el-button el-button--primary start-btn" :class="{\'is-disabled\': ro}" :disabled="ro" :aria-disabled="ro ? \'true\' : \'false\'" type="button" @click="$act(\'startGrade\')"><span><eh-icon name="start-correct" :size="14"/>开始批改</span></button></div>' +
      '</div>' +
      '</div>'
  });

  /* ====================== AI 批改中进度页（取自旧首页右栏 right==='grading'；没有学生下拉与列表，铺满主区） ====================== */
  Vue.component('essay-grading', {
    template: '<div class="home-page">' +
      '<div class="essay-loading progress-state" role="status" aria-live="polite">' +
      '<span class="essay-loading__spinner" aria-hidden="true"><eh-icon name="spinner-container" :size="36"/></span>' +
      '<div class="essay-loading__copy"><h3>「AI 正在批改中，请稍候...」</h3><p>批改完成后将进入结果页</p></div></div>' +
      '</div>'
  });
})();
