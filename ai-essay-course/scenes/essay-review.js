/* essay-review.js —— 批改页 scene-review（E2a）
 * DOM / class 取自作文批改助手真实源码编译结果（/tmp/demo-spec/essay-correction/dom-*.html），Vue 2 只当模板引擎。
 * 真实结构：.correction-page > section.essay-editor(画布区) + aside.right-panel(380 面板：.tab-bar + .tab-body)
 * 产品方案 v2：作文由班课侧带 id 直接进入；本页 = 批改页（四页签右栏原样保留）。
 * 新增（x- 前缀）：完成批改后的成功提示条（el-alert success）、画布占位（marknote 本机未安装，外观为推断；图片作文用手写稿纸占位）。
 * 状态全部来自 this.ctx；动作用 this.$act(...)。 */
(function () {
  var IC = 'assets/essay/src/icons/';
  /* Element Plus success 图标（与 toast 同一份路径） */
  var OK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm-55.808 536.384-99.52-99.584a38.4 38.4 0 1 0-54.336 54.336l126.72 126.72a38.272 38.272 0 0 0 54.336 0l262.4-262.464a38.4 38.4 0 1 0-54.272-54.336L456.192 600.384z"></path></svg>';

  /* ---------------- 小型 Markdown 渲染（只为示意：Lute/Vditor 在 demo 里不可用） ---------------- */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function inl(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }
  function isTableLine(t) { return t.charAt(0) === '|'; }
  function cells(r) { return r.replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }); }
  /* label：'h2' | 'h3' | null；示意数据是「标签：内容」的逐行文本，按真实 Markdown 的标题 + 段落结构展示。
   * 一旦文本里已有 Markdown 标题（例如点过「保存」后的内容），就当作真正的 Markdown，不再按「标签：内容」拆行 */
  function mdToHtml(src, label) {
    if (label && /^#{1,3}\s/m.test(String(src || ''))) label = null;
    var lines = String(src || '').replace(/\r/g, '').split('\n'), out = [], i = 0, m;
    while (i < lines.length) {
      var t = lines[i].trim();
      if (!t) { i++; continue; }
      if ((m = /^(#{1,3})\s+(.*)$/.exec(t))) { out.push('<h' + m[1].length + '>' + inl(m[2]) + '</h' + m[1].length + '>'); i++; continue; }
      if (/^---+$/.test(t)) { out.push('<hr>'); i++; continue; }
      if (isTableLine(t)) {
        var rows = [];
        while (i < lines.length && isTableLine(lines[i].trim())) { rows.push(lines[i].trim()); i++; }
        rows = rows.filter(function (r) { return !/^\|[\s:|-]+\|?$/.test(r); });
        var head = cells(rows[0]);
        out.push('<table>\n<thead>\n<tr>\n' + head.map(function (c) { return '<th>' + inl(c) + '</th>'; }).join('\n') + '\n</tr>\n</thead>\n<tbody>\n' +
          rows.slice(1).map(function (r) { return '<tr>\n' + cells(r).map(function (c) { return '<td>' + inl(c) + '</td>'; }).join('\n') + '\n</tr>'; }).join('\n') + '\n</tbody>\n</table>');
        continue;
      }
      if (/^[-*]\s+/.test(t)) {
        var li = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) { li.push('<li>' + inl(lines[i].trim().replace(/^[-*]\s+/, '')) + '</li>'); i++; }
        out.push('<ul>\n' + li.join('\n') + '\n</ul>'); continue;
      }
      if (/^\d+\.\s+/.test(t)) {
        var ol = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) { ol.push('<li>' + inl(lines[i].trim().replace(/^\d+\.\s+/, '')) + '</li>'); i++; }
        out.push('<ol>\n' + ol.join('\n') + '\n</ol>'); continue;
      }
      if (/^>\s?/.test(t)) {
        var bq = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) { bq.push('<p>' + inl(lines[i].trim().replace(/^>\s?/, '')) + '</p>'); i++; }
        out.push('<blockquote>\n' + bq.join('\n') + '\n</blockquote>'); continue;
      }
      if (label && (m = /^([^：:，。！？\s]{1,8})[：:]\s*(.+)$/.exec(t))) {
        out.push('<' + label + '>' + inl(m[1]) + '</' + label + '>\n<p>' + inl(m[2]) + '</p>'); i++; continue;
      }
      out.push('<p>' + inl(t) + '</p>'); i++;
    }
    return out.join('\n');
  }

  /* ---------------- 编辑态：把可编辑区（模拟 Vditor 所见即所得）里的 DOM 序列化回 Markdown ---------------- */
  function inlineMd(node) {
    var s = '';
    Array.prototype.forEach.call(node.childNodes, function (n) {
      if (n.nodeType === 3) { s += n.nodeValue.replace(/\u00a0/g, ' '); return; }
      if (n.nodeType !== 1) return;
      var tn = n.tagName.toLowerCase();
      if (tn === 'strong' || tn === 'b') { var t = inlineMd(n); s += t.trim() ? '**' + t + '**' : t; }
      else if (tn === 'br') s += '\n';
      else s += inlineMd(n);
    });
    return s;
  }
  var BLOCK_TAGS = { P: 1, DIV: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1, UL: 1, OL: 1, BLOCKQUOTE: 1, TABLE: 1, HR: 1 };
  function blocksMd(root) {
    var out = [], loose = '';
    function flush() { if (loose.trim()) out.push(loose.trim()); loose = ''; }
    Array.prototype.forEach.call(root.childNodes, function (n) {
      if (n.nodeType === 3) { loose += n.nodeValue.replace(/\u00a0/g, ' '); return; }
      if (n.nodeType !== 1) return;
      var tn = n.tagName;
      if (!BLOCK_TAGS[tn]) { loose += inlineMd({ childNodes: [n] }); return; }
      flush();
      var m = /^H([1-6])$/.exec(tn);
      if (m) { var h = inlineMd(n).trim(); if (h) out.push(new Array(+m[1] + 1).join('#') + ' ' + h); }
      else if (tn === 'P') { var p = inlineMd(n).trim(); if (p) out.push(p); }
      else if (tn === 'DIV') { if (n.querySelector('p,div,h1,h2,h3,h4,h5,h6,ul,ol,table,blockquote')) out = out.concat(blocksMd(n)); else { var d = inlineMd(n).trim(); if (d) out.push(d); } }
      else if (tn === 'UL' || tn === 'OL') {
        var k = 0, items = [];
        Array.prototype.forEach.call(n.children, function (li) { var t = inlineMd(li).trim(); if (t) items.push((tn === 'OL' ? (++k) + '. ' : '- ') + t); });
        if (items.length) out.push(items.join('\n'));
      }
      else if (tn === 'BLOCKQUOTE') { var q = blocksMd(n); if (q.length) out.push(q.map(function (x) { return '> ' + x; }).join('\n')); }
      else if (tn === 'HR') out.push('---');
      else if (tn === 'TABLE') {
        var rows = Array.prototype.map.call(n.querySelectorAll('tr'), function (tr) {
          return Array.prototype.map.call(tr.children, function (c) { return inlineMd(c).trim().replace(/\|/g, '/'); });
        });
        if (rows.length) {
          var lines = ['| ' + rows[0].join(' | ') + ' |', '| ' + rows[0].map(function () { return '---'; }).join(' | ') + ' |'];
          rows.slice(1).forEach(function (r) { lines.push('| ' + r.join(' | ') + ' |'); });
          out.push(lines.join('\n'));
        }
      }
    });
    flush();
    return out;
  }
  function domToMd(root) { return blocksMd(root).join('\n\n'); }

  /* ---------------- 全文润色：内容示意（接口 polishText 的三个子页签） ----------------
   * 文案与「预览」弹层（essay-overlays.js 的 POLISH）逐字一致：预览里的全文润色就是这里三个子页签内容的汇总。
   * 真实接口数据里「最小改动版 / 习作升格版」第一行带同名 h2（预览汇总时会被剥掉），这里保留，和真实右栏一致。 */
  function polishTabs(P, minimalText) {
    if (!P || !P.length) return [];
    var t1 = '| 段落 | 功能 | 内容概括 |\n| --- | --- | --- |\n' + [
      ['第1段', '开头', '点出班里有个“棋王”，引出下文'],
      ['第2段', '外貌', '写眼睛和酒窝，介绍人物特点'],
      ['第3段', '事例', '讲他给同桌讲数学题的事'],
      ['第4段', '结尾', '总结“棋王”爱下棋、也爱帮人']
    ].map(function (r) { return '| ' + r.join(' | ') + ' |'; }).join('\n');
    var t2 = '1. 第2段外貌描写比较短，**缺少动作细节**，人物形象还不够立体。\n' +
      '2. 第3段“帮同桌”的过程写得太快，**详略不当**，最打动人的部分没有写透。\n' +
      '3. 结尾直接下结论，**没有呼应开头**的“他是谁”。';
    var t3 = '| 段落 | 改写方向 |\n| --- | --- |\n' + [
      ['第1段', '保留开门见山，再加一句悬念：“你猜他是谁？”'],
      ['第2段', '在外貌后补一个习惯动作，比如摆棋子时的神情'],
      ['第3段', '把“怎么讲题”分成两三步写，突出耐心'],
      ['第4段', '呼应开头，回到“棋王”这个称呼']
    ].map(function (r) { return '| ' + r.join(' | ') + ' |'; }).join('\n');
    /* 最小改动版：内容直接取这篇作文的「全文润色」（txt），保存后写回 */
    var mini = String(minimalText || '');
    var up = '## 习作升格版\n\n' +
      '我们班有一位公认的“棋王”，书包里永远装着一副磨得发亮的小象棋。\n\n' +
      '他笑起来眼睛眯成一条缝，嘴角陷出一个浅浅的酒窝。可一到棋盘前，他就收起笑容，先搓搓手，才轻轻落下第一颗棋子。\n\n' +
      '那天，同桌被一道数学题难住，眉头拧成了结。他没有急着报答案，而是把草稿纸推过去，先问：“你卡在哪一步？”再一步一步写给同桌看，像在棋盘上耐心地走每一招。\n\n' +
      '原来“棋王”不只会赢棋，更懂得替别人多想一步。你猜到他是谁了吗？\n\n' +
      '**修改说明**\n\n- 增加动作和比喻，强化画面感\n- 用“讲题”一个场面写透“爱帮助同学”\n- 结尾呼应开头，点明人物特点';
    return [
      { key: 'structure', label: '结构梳理', modules: [
        { key: 'overview', title: '当前结构一览', md: t1 },
        { key: 'issues', title: '结构问题', md: t2 },
        { key: 'rewrite', title: '每段改写方向', md: t3 }] },
      { key: 'minimal_revision', label: '最小改动版', strong: true, modules: [{ key: 'min', title: '最小改动版', md: mini }] },
      { key: 'upgraded_version', label: '习作升格版', modules: [{ key: 'up', title: '习作升格版', md: up }] }
    ];
  }

  /* ---------------- AI 逐段批注（示意文字）与红圈 ---------------- */
  var NOTES = [
    { txt: '开头直接点题，很好。', para: 0, sub: '“棋王”' },
    { txt: '这里可以补一个动作细节。', para: 1, sub: '眼睛笑起来眯成一条缝' },
    { txt: '过程写得有点快，建议写具体。', para: 2, sub: '一步一步讲给同桌听' }
  ];
  var PUNCT = '，。、；：！？,.;:!?';

  /* ================= 点评卡片 MarkdownPanelSection（DOM 与真实一致；编辑态用 contenteditable 占位 Vditor 所见即所得） ================= */
  Vue.component('essay-md-section', {
    props: { title: String, source: { type: String, default: '' }, editing: Boolean, readonly: Boolean, fill: Boolean, strong: Boolean, label: { type: String, default: '' }, initDraft: { type: String, default: null } },
    computed: {
      html: function () { return mdToHtml(this.source, this.label || null); }
    },
    watch: {
      editing: function (v) { if (v) this.enter(); }
    },
    mounted: function () { if (this.editing) this.enter(); },
    beforeDestroy: function () { clearTimeout(this._t); },
    methods: {
      /* 进入编辑：把当前内容渲染进可编辑区（与预览同样的标题/段落/列表结构），光标落在首个内容块末尾（与真实一致） */
      enter: function () {
        var self = this;
        this.$nextTick(function () {
          var ed = self.$refs.ed; if (!ed) return;
          var md = self.initDraft != null ? self.initDraft : self.source;
          /* Vditor 所见即所得的 DOM 里块与块之间没有换行文本；pre 是 pre-wrap，留着 \n 会多出空行 */
          ed.innerHTML = mdToHtml(md, self.label || null).replace(/>\s*\n\s*</g, '><') || '<p><br></p>';
          try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) { /* 忽略 */ }
          ed.focus();
          var first = ed.firstElementChild;
          if (first && window.getSelection) {
            var r = document.createRange(); r.selectNodeContents(first); r.collapse(false);
            var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
          }
        });
      },
      current: function () { return this.$refs.ed ? domToMd(this.$refs.ed) : ''; },
      onInput: function () {
        var self = this; clearTimeout(this._t);
        this._t = setTimeout(function () { self.$emit('draft', self.current()); }, 150);
      },
      onPaste: function (e) {
        var t = (e.clipboardData || window.clipboardData).getData('text');
        e.preventDefault();
        document.execCommand('insertText', false, t);
      },
      save: function () { clearTimeout(this._t); this.$emit('save', this.current()); }
    },
    template:
      '<div class="md-panel-section" :class="{ \'is-fill\': fill, \'is-modification-strong\': strong }">' +
        '<div class="section-title">' +
          '<span class="dot"></span>' +
          '<span class="title">{{ title }}</span>' +
          '<div class="actions" v-if="!editing && !readonly">' +
            '<button type="button" class="text-btn" @click="$emit(\'start\')">' +
              '<span class="essay-icon" style="width: 14px; height: 14px;" aria-hidden="true"><img src="' + IC + 'icon-edit.svg" alt=""></span>编辑</button>' +
            '<button type="button" class="text-btn" @click="$emit(\'copy\')">' +
              '<span class="essay-icon" style="width: 14px; height: 14px;" aria-hidden="true"><img src="' + IC + 'icon-copy.svg" alt=""></span>复制</button>' +
          '</div>' +
          '<div class="actions" v-else-if="!editing">' +
            '<button type="button" class="text-btn" @click="$emit(\'copy\')">' +
              '<span class="essay-icon" style="width: 14px; height: 14px;" aria-hidden="true"><img src="' + IC + 'icon-copy.svg" alt=""></span>复制</button>' +
          '</div>' +
          '<div class="actions" v-else>' +
            '<button type="button" class="btn ghost" @click="$emit(\'cancel\')">取消</button>' +
            '<button type="button" class="btn primary" @click="save">保存</button>' +
          '</div>' +
        '</div>' +
        '<div class="section-body" :class="{ \'is-editing\': editing }">' +
          '<div v-show="!editing" class="essay-md-content essay-md-preview vditor-reset" v-html="html"></div>' +
          '<div v-show="editing" class="essay-md-content vditor-host vditor">' +
            '<div class="vditor-content"><div class="vditor-wysiwyg" style="display: block;">' +
              '<pre ref="ed" class="vditor-reset" placeholder="" contenteditable="true" spellcheck="false" @input="onInput" @paste="onPaste"></pre>' +
            '</div></div>' +
          '</div>' +
        '</div>' +
      '</div>'
  });

  /* ================= 批改页 ================= */
  Vue.component('scene-review', {
    data: function () {
      return {
        tabs: ['总评', '详细点评', '全文润色', '诊断建议'],
        sub: 0,            // 全文润色子页签
        pEdit: null,       // 全文润色里正在编辑的卡片 key
        pOver: {},         // 全文润色里已保存的修改（演示用，仅本页）
        page: 0, tool: 'drag', hot: -1,
        loading: false,
        tools: ['drag', 'pencil', 'shape', 'type', 'eraser', '|', 'undo', 'redo', '|', 'zoom-out', 'zoom-in', 'rotate', '|', 'download']
      };
    },
    computed: {
      S: function () { return this.ctx.S || {}; },
      ev: function () { var c = this.ctx; return c.S && c.S.cur ? this.H.ev(c.S.cur) : null; },
      isRev: function () { return !!this.ev && this.ev.form === 'image'; },   /* 图片作文：画布是学生拍照的手写稿 */
      hasCanvas: function () { return !!this.ev && !!this.ev.hasResult; },
      loadError: function () { return this.ev ? '' : '缺少作文编号，无法加载批改结果'; },
      readonly: function () { return !!this.S.ro || !this.ev; },
      mainTab: function () { return this.S.tab || '总评'; },
      ready: function () { return !this.loading && this.hasCanvas; },
      cardKey: function () { return (this.ev ? this.ev.id : '-') + '|' + this.mainTab; },
      cardSource: function () {
        if (!this.ready || this.mainTab === '全文润色') return '';
        return (this.ev.txt && this.ev.txt[this.mainTab]) || '';
      },
      cardLabel: function () { return this.mainTab === '详细点评' ? 'h3' : (this.mainTab === '诊断建议' ? 'h2' : ''); },
      editingMain: function () { return this.S.editing != null && this.S.editing === this.mainTab; },
      polish: function () { return this.ready ? polishTabs((this.ctx.D || {}).PARAS || [], this.ev.txt && this.ev.txt['全文润色']) : []; },
      curPolish: function () { return this.polish[Math.min(this.sub, Math.max(this.polish.length - 1, 0))] || null; },
      /* ---- 画布：文本作文的田字格排版 ---- */
      grid: function () {
        var P = (this.ctx.D || {}).PARAS || [], cols = 20, out = [], title = this.ev ? this.ev.title : '';
        var tl = Math.min(title.length, cols - 2), st = Math.floor((cols - tl) / 2);
        for (var c = 0; c < cols; c++) out.push({ ch: c >= st && c < st + tl ? title.charAt(c - st) : '', t: true, p: false });
        var body = [], bases = [], rows0 = [];
        P.forEach(function (p) {
          if (body.length % cols) { while (body.length % cols) body.push(null); }
          rows0.push(1 + body.length / cols);
          bases.push(body.length + 2);
          body.push('', '');
          p.split('').forEach(function (ch) { body.push(ch); });
        });
        var rows = Math.max(20, 1 + Math.ceil(body.length / cols));
        while (out.length + body.length < rows * cols) body.push(null);
        body.forEach(function (ch) { out.push({ ch: ch || '', t: false, p: !!ch && PUNCT.indexOf(ch) >= 0 }); });
        return { cells: out, rows: rows, bases: bases, rows0: rows0, P: P };
      },
      annotN: function () { return this.ev ? Math.min(this.ev.annot || 0, NOTES.length) : 0; },
      textAnn: function () {
        var g = this.grid, cols = 20, prev = -3, list = [];
        for (var i = 0; i < this.annotN; i++) {
          var d = NOTES[i], p = g.P[d.para] || '', k = Math.max(p.indexOf(d.sub), 0);
          var idx = g.bases[d.para] + k, row = 1 + Math.floor(idx / cols), col = idx % cols;
          var len = Math.min(d.sub.length, cols - col), noteRow = Math.max(row, prev + 3);
          prev = noteRow;
          list.push({ txt: d.txt, c: { left: 'calc(var(--cell) * ' + col + ' - 4px)', top: 'calc(var(--cell) * ' + row + ' - 3px)', width: 'calc(var(--cell) * ' + len + ' + 8px)', height: 'calc(var(--cell) + 6px)' }, n: { top: 'calc(var(--cell) * ' + noteRow + ')' } });
        }
        return list;
      },
      /* 图片作文：红圈 / 便签按手写稿纸占位的排版换算（百分比，见 essay-home.js 的 XHW.layout）；每页只放落在该页的批注 */
      photoAnn: function () {
        var X = window.XHW, P = (this.ctx.D || {}).PARAS || [], pg = X.pages(P)[this.page] || X.pages(P)[0], lay = X.layout(pg.paras, this.ev ? this.ev.title : ''), list = [], prev = -10;
        for (var i = 0; i < this.annotN; i++) {
          var d = NOTES[i], li = d.para - pg.offset;
          if (li < 0 || li >= pg.paras.length) continue;
          var para = X.PARA_INDENT + pg.paras[li], k = Math.max(para.indexOf(d.sub), 0), per = 18;
          var row = lay.starts[li] + Math.floor(k / per), col = k % per, len = Math.min(d.sub.length, per - col);
          var top = Math.max(row * X.RH, prev + 8.5); prev = top;
          list.push({ txt: d.txt, c: { left: (8 + col / per * 84 - 1) + '%', top: (row * X.RH - 0.5) + '%', width: (len / per * 84 + 2) + '%', height: (X.RH + 1) + '%' }, n: { top: top + '%' } });
        }
        return list;
      },
      photoPage: function () { var X = window.XHW, P = (this.ctx.D || {}).PARAS || []; return X.pages(P)[this.page] || X.pages(P)[0]; },
      annList: function () { return this.isRev ? this.photoAnn : this.textAnn; },
      pages: function () { return this.isRev ? 2 : 1; },
      loadKey: function () { return this.S.cur || ''; }
    },
    watch: {
      loadKey: function () { this.page = 0; this.sub = 0; this.pEdit = null; this.startLoad(); }
    },
    mounted: function () { this.startLoad(); },
    beforeDestroy: function () { clearTimeout(this._t); },
    methods: {
      startLoad: function () {
        var self = this; clearTimeout(this._t); this.loading = true;
        this._t = setTimeout(function () { self.loading = false; }, 450);
      },
      icon: function (n) { return IC + 'tool-' + n + '.svg'; },
      rtab: function (t) { this.$act('rtab', { t: t }); },
      /* ---- 总评 / 详细点评 / 诊断建议（单卡片 fill） ---- */
      onStart: function () { this.$act('startEdit'); },
      onCancel: function () { this.$act('cancelEdit'); },
      onDraft: function (text) { this.$act('setDraft', { text: text }); },
      onSave: function (text) { this.$act('saveEdit', { text: text }); },
      onCopy: function (src) {
        if (!src) { if (window.__toast) window.__toast('暂无内容可复制', 'info'); return; }
        try { if (navigator.clipboard) navigator.clipboard.writeText(src).catch(function () {}); } catch (e) { /* file:// 下可能不可用，忽略 */ }
        this.$act('copy');
      },
      /* ---- 全文润色（多卡片，各卡片独立编辑，保存内容只保存在本页） ---- */
      pKey: function (tab, mod) { return (this.ev ? this.ev.id : '-') + '|' + tab.key + '|' + mod.key; },
      pSource: function (tab, mod) { var k = this.pKey(tab, mod); return mod.key === 'min' ? mod.md : (this.pOver[k] !== undefined ? this.pOver[k] : mod.md); },
      pEditing: function (tab, mod) { return this.S.editing === '全文润色' && this.pEdit === this.pKey(tab, mod); },
      pStart: function (tab, mod) { this.pEdit = this.pKey(tab, mod); this.$act('startEdit'); },
      pCancel: function () { this.pEdit = null; this.$act('cancelEdit'); },
      /* 最小改动版 = 这篇作文的「全文润色」，保存写回作文；结构梳理 / 习作升格版 是演示用固定内容，只在本页保存（提示一样） */
      pSave: function (tab, mod, text) {
        this.pEdit = null;
        if (mod.key === 'min') { this.$act('saveEdit', { text: text }); return; }
        this.$set(this.pOver, this.pKey(tab, mod), text);
        this.$act('cancelEdit');
        if (window.__toast) window.__toast('保存成功', 'success');
      },
      setSub: function (i) { if (this.S.editing) { this.pEdit = null; this.$act('cancelEdit'); } this.sub = i; },
      /* ---- 画布 ---- */
      addNote: function () { this.$act('fake', { m: '画布内「添加批注」：此处是画布占位示意' }); },
      pickTool: function (t) { this.tool = t; },
      goHome: function () { this.$act('closeEssay'); }
    },
    template:
      '<div class="x-review">' +
        /* ---- 完成批改后的成功提示条（新增，产品方案 4.6「完成批改后」）：el-alert success，右侧「关闭页签」 ---- */
        '<div class="x-done-bar" v-if="S.done && ev">' +
          '<div class="el-alert el-alert--success is-light" role="alert">' +
            '<i class="el-icon el-alert__icon">' + OK + '</i>' +
            '<div class="el-alert__content"><span class="el-alert__title">已完成批改。班课里的学员列表、作文批改列表已更新。</span></div>' +
            '<button type="button" class="el-button el-button--small el-button--primary x-done-act" @click="$act(\'closeEssay\')"><span>关闭页签</span></button>' +
          '</div>' +
        '</div>' +

        '<div class="correction-page">' +
          /* ---- ① 左：EssayEditor（加载中 / 加载失败 / 画布 / 暂无作文页 四选一） ---- */
          '<section class="essay-editor">' +
            '<div class="essay-loading editor-loading" role="status" aria-live="polite" v-if="loading">' +
              '<span class="essay-loading__spinner" aria-hidden="true"><span class="essay-icon" style="width: 36px; height: 36px;" aria-hidden="true"><img src="' + IC + 'spinner-container.svg" alt=""></span></span>' +
              '<div class="essay-loading__copy"><h3>加载批改结果</h3><p>请稍候</p></div>' +
            '</div>' +
            '<div class="fail-panel" v-else-if="loadError">' +
              '<span class="fail-panel__icon" aria-hidden="true"><span class="essay-icon" style="width: 16px; height: 16px;" aria-hidden="true"><img src="' + IC + 'fail-close.svg" alt=""></span></span>' +
              '<div class="fail-panel__copy"><h3>加载批改结果失败</h3><p>{{ loadError }}</p></div>' +
              '<button type="button" class="el-button el-button--primary fail-panel__btn" @click="goHome"><span>关闭页签</span></button>' +
            '</div>' +
            '<template v-else-if="hasCanvas">' +
              /* EssayAnnotator 占位（marknote workbench：缩略图 + 画布 + 底栏） */
              '<div class="editor-annotator" :class="{ \'is-readonly\': readonly }">' +
                '<div class="x-mn">' +
                  '<div class="x-mn__main">' +
                    '<div class="x-mn__thumbs">' +
                      '<button type="button" class="x-thumb" v-for="n in pages" :key="n" :class="{ \'is-current\': page === n - 1 }" @click="page = n - 1">' +
                        '<span class="x-thumb__page" :class="isRev ? \'x-thumb__page--hw\' : \'x-thumb__page--text\'"></span>' +
                        '<span class="x-thumb__no">{{ n }}</span>' +
                      '</button>' +
                    '</div>' +
                    '<div class="x-mn__stage">' +
                      /* 订正任务：学生手写照片 */
                      '<div class="x-sheet x-sheet--photo" v-if="isRev">' +
                        '<div class="x-photo-wrap">' +
                          '<div class="x-photo x-photo--hw"><essay-handwrite :paras="photoPage.paras" :title="ev.title" :show-title="page === 0"/></div>' +
                          '<span class="x-circle x-circle--photo" v-for="(a, i) in annList" :key="\'c\' + i" :class="{ \'is-hot\': hot === i }" :style="a.c"></span>' +
                        '</div>' +
                        '<div class="x-notes">' +
                          '<div class="x-note" v-for="(a, i) in annList" :key="\'n\' + i" :class="{ \'is-hot\': hot === i }" :style="a.n" @mouseenter="hot = i" @mouseleave="hot = -1"><span class="x-note__tag">AI</span>{{ a.txt }}</div>' +
                        '</div>' +
                      '</div>' +
                      /* 文本作文：田字格 + 右侧便签 */
                      '<div class="x-sheet" v-else>' +
                        '<div class="x-paper">' +
                          '<div class="x-grid">' +
                            '<div class="x-cell" v-for="(c, i) in grid.cells" :key="i" :class="{ \'is-title\': c.t, \'is-punct\': c.p }">{{ c.ch }}</div>' +
                            '<span class="x-circle" v-for="(a, i) in annList" :key="\'c\' + i" :class="{ \'is-hot\': hot === i }" :style="a.c"></span>' +
                          '</div>' +
                        '</div>' +
                        '<div class="x-notes">' +
                          '<div class="x-note" v-for="(a, i) in annList" :key="\'n\' + i" :class="{ \'is-hot\': hot === i }" :style="a.n" @mouseenter="hot = i" @mouseleave="hot = -1"><span class="x-note__tag">AI</span>{{ a.txt }}</div>' +
                        '</div>' +
                      '</div>' +
                    '</div>' +
                  '</div>' +
                  '<div class="x-mn__bar">' +
                                        '<div class="x-tools">' +
                      '<template v-for="(t, i) in tools">' +
                        '<span class="x-tools__sep" v-if="t === \'|\'" :key="\'s\' + i"></span>' +
                        '<button type="button" class="x-tool" v-else :key="t" :class="{ \'is-active\': tool === t }" @click="pickTool(t)"><img :src="icon(t)" alt=""></button>' +
                      '</template>' +
                    '</div>' +
                    '<button type="button" class="btn primary x-add-note" @click="addNote">添加批注</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</template>' +
            '<div class="fail-panel" v-else>' +
              '<span class="fail-panel__icon" aria-hidden="true"><span class="essay-icon" style="width: 16px; height: 16px;" aria-hidden="true"><img src="' + IC + 'fail-close.svg" alt=""></span></span>' +
              '<div class="fail-panel__copy"><h3>暂无作文页</h3><p>当前提交没有可展示的作文内容，请关闭页签后回班课重新打开</p></div>' +
              '<button type="button" class="el-button el-button--primary fail-panel__btn" @click="goHome"><span>关闭页签</span></button>' +
            '</div>' +
          '</section>' +

          /* ---- ② 右：RightPanel ---- */
          '<aside class="right-panel">' +
            '<div class="tab-bar">' +
              '<button type="button" class="tab" v-for="t in tabs" :key="t" :class="{ \'is-active\': mainTab === t }" @click="rtab(t)">{{ t }}</button>' +
            '</div>' +
            '<div class="tab-body">' +
              '<div class="polish-panel" v-if="mainTab === \'全文润色\'">' +
                '<template v-if="polish.length">' +
                  '<div class="sub-tabs">' +
                    '<button type="button" class="sub-tab" v-for="(t, i) in polish" :key="t.key" :class="{ \'is-active\': curPolish === t }" @click="setSub(i)">{{ t.label }}</button>' +
                  '</div>' +
                  '<div class="body" :key="curPolish.key">' +
                    '<essay-md-section v-for="mod in curPolish.modules" :key="pKey(curPolish, mod)" :title="mod.title" :fill="curPolish.modules.length === 1" :strong="!!curPolish.strong" :readonly="readonly"' +
                      ' :source="pSource(curPolish, mod)" :editing="pEditing(curPolish, mod)"' +
                      ' @start="pStart(curPolish, mod)" @cancel="pCancel" @draft="onDraft" @save="pSave(curPolish, mod, $event)" @copy="onCopy(pSource(curPolish, mod))"/>' +
                  '</div>' +
                '</template>' +
                '<div class="empty-state" v-else>暂无全文润色内容</div>' +
              '</div>' +
              '<div class="panel-fill-root" v-else>' +
                '<essay-md-section :key="cardKey" :title="mainTab" fill :readonly="readonly" :label="cardLabel" :source="cardSource" :editing="editingMain" :init-draft="S.draft"' +
                  ' @start="onStart" @cancel="onCancel" @draft="onDraft" @save="onSave" @copy="onCopy(cardSource)"/>' +
              '</div>' +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</div>'
  });
})();
