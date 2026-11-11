/* essay-overlays.js —— 预览弹层 essay-preview（产品方案 v2：批改历史抽屉、发送遮罩、发送确认弹窗已删除，旧版在 demo/_unused/essay-overlays.v1.js）
   DOM 与 class 取自作文批改助手真实源码（CorrectionPreviewOverlay.vue / CorrectionPreviewDoc），样式见 css/essay-overlays.css。
   内容 = 老师批注 / 老师总评 / 详细点评 / 全文润色 / 诊断建议；导出三个按钮只 fake 提示。 */
(function () {
  var ICON = 'assets/essay/src/icons/';
  var ASSET = 'assets/essay/src/';

  /* ---------------- 小工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function inline(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }
  /* 很小的 Markdown → HTML：## / ### / > / - / 1. / 粗体 / 段落；够把批改文本渲染成"Vditor 预览"那套标签 */
  function md(t) {
    var lines = String(t == null ? '' : t).replace(/\r/g, '').split('\n');
    var out = [], list = null, m;
    function close() { if (list) { out.push('</' + list + '>'); list = null; } }
    lines.forEach(function (raw) {
      var l = raw.replace(/\s+$/, '');
      if (!l.trim()) { close(); return; }
      if ((m = l.match(/^###\s+(.*)$/))) { close(); out.push('<h3>' + inline(m[1]) + '</h3>'); }
      else if ((m = l.match(/^##\s+(.*)$/))) { close(); out.push('<h2>' + inline(m[1]) + '</h2>'); }
      else if ((m = l.match(/^>\s?(.*)$/))) { close(); out.push('<blockquote>\n<p>' + inline(m[1]) + '</p>\n</blockquote>'); }
      else if ((m = l.match(/^[-*]\s+(.*)$/))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push('<li>' + inline(m[1]) + '</li>'); }
      else if ((m = l.match(/^\d+[.、]\s*(.*)$/))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push('<li>' + inline(m[1]) + '</li>'); }
      else { close(); out.push('<p>' + inline(l) + '</p>'); }
    });
    close();
    return out.join('\n');
  }
  /* 演示数据里"详细点评/诊断建议"是按行写的白话文本，预览时整理成真实的 h3 / h2 + 正文结构 */
  function prepDetail(t) {
    return String(t || '').split('\n').map(function (l) {
      var m = l.match(/^(第[一二三四五六七八九十]+段)[：:]\s*(.*)$/);
      return m ? '### ' + m[1] + '\n' + (m[2] || '') : l;
    }).join('\n');
  }
  function prepAdvice(t) {
    return String(t || '').split('\n').map(function (l) {
      var m = l.match(/^(优势能力|待提升能力|薄弱能力|生活中练习|生活中如何练习)[：:]\s*(.*)$/);
      return m ? '## ' + m[1] + '\n' + (m[2] || '') : l;
    }).join('\n');
  }
  /* 预览文档页眉的"年级·单元"：真实是 [periodName, unitName].filter(Boolean).join('·')。
     演示数据里作文属于 (课程, 课节)：课程名取 D.COURSES（"三年级下·AI作文课" → "三年级（下册）"），单元写课节名（"第3课 写日记"）。 */
  function gradeUnitOf(e) {
    var D = window.__ctx.D || {}, c = (D.COURSES || {})[e && e.course], g = String((c && c.title) || '').split('·')[0], m = g.match(/^(.+?年级)([上下])$/);
    if (m) g = m[1] + '（' + m[2] + '册）';
    var l = ((D.LESSONS || {})[e && e.course] || []).find(function (x) { return x.id === (e && e.lesson); });
    return [g, l && l.name].filter(Boolean).join('·');
  }

  /* ---------------- 全文润色（演示用固定文案，围绕演示作文） ---------------- */
  function table(head, rows) {
    return '<table>\n<thead>\n<tr>\n' + head.map(function (h) { return '<th>' + h + '</th>\n'; }).join('') +
      '</tr>\n</thead>\n<tbody>\n' +
      rows.map(function (r) { return '<tr>\n' + r.map(function (c) { return '<td>' + c + '</td>\n'; }).join('') + '</tr>\n'; }).join('') +
      '</tbody>\n</table>\n';
  }
  function polishOf(minText) { return [
    {
      h: '(1) 结构梳理', subs: [
        { h: '当前结构一览', html: table(['段落', '功能', '内容概括'], [
          ['第1段', '开头', '点出班里有个“棋王”，引出下文'],
          ['第2段', '外貌', '写眼睛和酒窝，介绍人物特点'],
          ['第3段', '事例', '讲他给同桌讲数学题的事'],
          ['第4段', '结尾', '总结“棋王”爱下棋、也爱帮人']
        ]) },
        { h: '结构问题', html: md('1. 第2段外貌描写比较短，**缺少动作细节**，人物形象还不够立体。\n2. 第3段“帮同桌”的过程写得太快，**详略不当**，最打动人的部分没有写透。\n3. 结尾直接下结论，**没有呼应开头**的“他是谁”。') },
        { h: '每段改写方向', html: table(['段落', '改写方向'], [
          ['第1段', '保留开门见山，再加一句悬念：“你猜他是谁？”'],
          ['第2段', '在外貌后补一个习惯动作，比如摆棋子时的神情'],
          ['第3段', '把“怎么讲题”分成两三步写，突出耐心'],
          ['第4段', '呼应开头，回到“棋王”这个称呼']
        ]) }
      ]
    },
    {
      h: '(2) 最小改动版', mod: true, html: md(minText)
    },
    {
      h: '(3) 习作升格版', html: md(
        '我们班有一位公认的“棋王”，书包里永远装着一副磨得发亮的小象棋。\n\n' +
        '他笑起来眼睛眯成一条缝，嘴角陷出一个浅浅的酒窝。可一到棋盘前，他就收起笑容，先搓搓手，才轻轻落下第一颗棋子。\n\n' +
        '那天，同桌被一道数学题难住，眉头拧成了结。他没有急着报答案，而是把草稿纸推过去，先问：“你卡在哪一步？”再一步一步写给同桌看，像在棋盘上耐心地走每一招。\n\n' +
        '原来“棋王”不只会赢棋，更懂得替别人多想一步。你猜到他是谁了吗？\n\n' +
        '**修改说明**\n\n- 增加动作和比喻，强化画面感\n- 用“讲题”一个场面写透“爱帮助同学”\n- 结尾呼应开头，点明人物特点')
    }
  ]; }

  /* ---------------- 老师批注合成图（画布现画一张，当 marknote 导出的合成图占位） ----------------
     外观与批改页画布占位（essay-review.js / essay-correction.css 的 .x-paper / .x-circle / .x-note）保持一致：
     田字格（格线 rgba(239,68,68,.3)、虚线十字 .16）、红圈 #ef4444、右侧便签（--essay-primary-soft 底、#ffc8ba 描边、橙色 AI 小标）。
     真实预览里这是 marknote.exportAllPageCanvases() 的合成图，外观不可考，这里只是示意。 */
  var paperCache = {};
  var NOTE_TEXTS = ['开头直接点题，很好。', '这里可以补一个动作细节。', '过程写得有点快，建议写具体。'];
  var NOTE_PHRASES = ['棋王', '眼睛笑起来眯成一条缝', '一步一步讲给同桌听'];
  var PUNCT = '，。、；：！？,.;:!?';
  function rr(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
    g.closePath();
  }
  function wrapNote(g, text, firstW, restW) {
    var lines = [], cur = '', w = firstW;
    for (var i = 0; i < text.length; i++) {
      var t = cur + text[i];
      if (g.measureText(t).width > w && cur) { lines.push(cur); cur = text[i]; w = restW; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function drawPaper(title, paras, annotN) {
    var key = title + '|' + annotN + '|' + paras.join('');
    if (paperCache[key]) return paperCache[key];
    var S = 2, cell = 28, cols = 20, PAD = 24, PW = cols * cell;
    /* 先排版，算出行数 */
    var layout = [], row = 1, col;
    paras.forEach(function (p, pi) {
      col = 2; layout[pi] = [];
      for (var j = 0; j < p.length; j++) {
        if (col >= cols) { row++; col = 0; }
        layout[pi].push({ ch: p[j], col: col, row: row });
        col++;
      }
      row++;
    });
    var rows = Math.max(20, row + 1);
    var W = 880, H = PAD * 2 + rows * cell;
    var c = document.createElement('canvas');
    c.width = W * S; c.height = H * S;
    var g = c.getContext('2d');
    g.scale(S, S);
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    var ox = PAD, oy = PAD;
    /* 田字格：外框+格线 .3，格内虚线十字 .16 */
    g.lineWidth = 1;
    g.strokeStyle = 'rgba(239,68,68,0.3)';
    for (var r = 0; r <= rows; r++) { g.beginPath(); g.moveTo(ox, oy + r * cell + .5); g.lineTo(ox + PW, oy + r * cell + .5); g.stroke(); }
    for (var k = 0; k <= cols; k++) { g.beginPath(); g.moveTo(ox + k * cell + .5, oy); g.lineTo(ox + k * cell + .5, oy + rows * cell); g.stroke(); }
    g.strokeStyle = 'rgba(239,68,68,0.16)'; g.setLineDash([3, 3]);
    for (r = 0; r < rows; r++) { g.beginPath(); g.moveTo(ox, oy + r * cell + cell / 2); g.lineTo(ox + PW, oy + r * cell + cell / 2); g.stroke(); }
    for (k = 0; k < cols; k++) { g.beginPath(); g.moveTo(ox + k * cell + cell / 2, oy); g.lineTo(ox + k * cell + cell / 2, oy + rows * cell); g.stroke(); }
    g.setLineDash([]);
    var FONT = '"Noto Sans CJK SC","PingFang SC",sans-serif';
    g.fillStyle = '#262626';
    /* 题目：首行居中、粗体 */
    g.font = '700 ' + Math.round(cell * 0.66) + 'px ' + FONT;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    var tt = title || '', tc = Math.max(0, Math.floor((cols - tt.length) / 2));
    for (var i = 0; i < tt.length && tc + i < cols; i++) g.fillText(tt[i], ox + (tc + i) * cell + cell / 2, oy + cell / 2 + 1);
    /* 正文：逗号句号等标点靠格子左下角 */
    g.font = '400 ' + Math.round(cell * 0.66) + 'px ' + FONT;
    layout.forEach(function (pl) {
      pl.forEach(function (it) {
        if (PUNCT.indexOf(it.ch) > -1) {
          g.textAlign = 'left'; g.textBaseline = 'alphabetic';
          g.fillText(it.ch, ox + it.col * cell + 2, oy + (it.row + 1) * cell - 3);
        } else {
          g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(it.ch, ox + it.col * cell + cell / 2, oy + it.row * cell + cell / 2 + 1);
        }
      });
    });
    /* 红圈 + 右侧便签（AI 批注固定落在页面右侧 note 区，没有序号圆点） */
    if (annotN > 0 && paras.length) {
      var targets = [];
      NOTE_PHRASES.forEach(function (ph, ni) {
        for (var pi = 0; pi < paras.length; pi++) {
          var at = paras[pi].indexOf(ph);
          if (at > -1) { targets.push({ pi: pi, from: at, to: at + ph.length - 1, text: NOTE_TEXTS[ni], hot: ni === 0 }); return; }
        }
        /* 找不到固定词句时退化为该段前几个字 */
        var pj = Math.min(ni, paras.length - 1);
        targets.push({ pi: pj, from: 0, to: Math.min(7, paras[pj].length - 1), text: NOTE_TEXTS[ni], hot: ni === 0 });
      });
      targets = targets.slice(0, annotN);
      var nx = ox + PW + 24, nw = W - nx - PAD, minY = oy;
      targets.forEach(function (t) {
        var items = layout[t.pi].slice(t.from, t.to + 1); if (!items.length) return;
        /* 按行分段画红圈 */
        var byRow = {};
        items.forEach(function (it) { (byRow[it.row] = byRow[it.row] || []).push(it); });
        g.strokeStyle = '#ef4444';
        Object.keys(byRow).forEach(function (rk) {
          var seg = byRow[rk], x1 = ox + seg[0].col * cell, x2 = ox + (seg[seg.length - 1].col + 1) * cell;
          var cx = (x1 + x2) / 2, cy = oy + (+rk) * cell + cell / 2 + 1, rx = (x2 - x1) / 2 + cell * 0.32, ry = cell * 0.56;
          g.lineWidth = t.hot ? 3 : 2;
          g.beginPath(); g.ellipse(cx, cy, rx, ry, -0.017, 0, Math.PI * 2);
          if (t.hot) { g.fillStyle = 'rgba(239,68,68,0.06)'; g.fill(); }
          g.stroke();
        });
        /* 便签 */
        var firstRow = items[0].row;
        g.font = '400 13px ' + FONT;
        var chipW = 22, lines = wrapNote(g, t.text, nw - 24 - chipW - 6, nw - 24);
        var bh = 16 + lines.length * 20, by = Math.max(minY, oy + firstRow * cell - 2);
        minY = by + bh + 12;
        g.fillStyle = '#fff1ed'; g.strokeStyle = t.hot ? '#ff6641' : '#ffc8ba'; g.lineWidth = 1;
        rr(g, nx + .5, by + .5, nw - 1, bh - 1, 8); g.fill(); g.stroke();
        /* 小箭头 */
        g.save(); g.translate(nx - 1, by + 17); g.rotate(Math.PI / 4);
        g.fillStyle = '#fff1ed'; g.strokeStyle = t.hot ? '#ff6641' : '#ffc8ba';
        g.fillRect(-5, -5, 10, 10);
        g.beginPath(); g.moveTo(-5, -5); g.lineTo(-5, 5); g.lineTo(5, 5); g.stroke();
        g.restore();
        g.fillStyle = '#fff1ed'; g.fillRect(nx + 1, by + 1, 3, bh - 2);
        /* AI 小标 */
        g.fillStyle = '#ff6641'; rr(g, nx + 12, by + 10, chipW, 16, 8); g.fill();
        g.fillStyle = '#fff'; g.font = '400 11px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('AI', nx + 12 + chipW / 2, by + 18.5);
        g.fillStyle = '#262626'; g.font = '400 13px ' + FONT; g.textAlign = 'left'; g.textBaseline = 'middle';
        lines.forEach(function (ln, li) { g.fillText(ln, li === 0 ? nx + 12 + chipW + 6 : nx + 12, by + 8 + li * 20 + 10 + 0.5); });
      });
    }
    var url = c.toDataURL('image/png');
    paperCache[key] = url;
    return url;
  }

  /* 图片作文的批注合成图：手写稿纸占位（与批改页画布 / 校对页同一份排版，见 essay-home.js 的 XHW）+ 红圈 + 右侧便签；每张图一页 */
  function drawHand(title, allParas, annotN, pageIdx) {
    var key = 'hw|' + pageIdx + '|' + title + '|' + annotN + '|' + allParas.join('');
    if (paperCache[key]) return paperCache[key];
    var X = window.XHW, pg = X.pages(allParas)[pageIdx] || X.pages(allParas)[0], lay = X.layout(pg.paras, title);
    var S = 2, PW = 560, PH = 747, PAD = 24, W = 880, H = PH + PAD * 2, per = 18;
    var c = document.createElement('canvas');
    c.width = W * S; c.height = H * S;
    var g = c.getContext('2d');
    g.scale(S, S);
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    var ox = PAD, oy = PAD, rh = PH * X.RH / 100;
    g.fillStyle = '#fff'; g.fillRect(ox, oy, PW, PH);
    g.strokeStyle = '#dfe5ee'; g.lineWidth = 1;
    for (var r = 1; r * rh <= PH; r++) { g.beginPath(); g.moveTo(ox, oy + r * rh - .5); g.lineTo(ox + PW, oy + r * rh - .5); g.stroke(); }
    g.strokeStyle = 'rgba(239,68,68,0.28)'; g.beginPath(); g.moveTo(ox + PW * 0.06, oy); g.lineTo(ox + PW * 0.06, oy + PH); g.stroke();
    function blocks(left, w, chars, row, dark) {
      var unit = PW * w / 100 / Math.max(chars, 1), x0 = ox + PW * left / 100;
      g.fillStyle = dark ? 'rgba(80,80,80,0.7)' : 'rgba(110,110,110,0.55)';
      for (var i = 0; i < chars; i++) g.fillRect(x0 + i * unit, oy + row * rh + rh * 0.2, unit * 0.68, rh * 0.56);
    }
    if (pageIdx === 0 && title) blocks(lay.titleRow.left, lay.titleRow.w, lay.titleRow.chars, 0, true);
    lay.rows.forEach(function (x) { blocks(x.left, x.w, x.chars, x.row, false); });
    g.fillStyle = '#808080'; g.font = '400 12px "Noto Sans CJK SC","PingFang SC",sans-serif'; g.textAlign = 'right'; g.textBaseline = 'alphabetic';
    g.fillText('学生拍照提交的手写作文', ox + PW - 12, oy + PH - 10);
    /* 红圈 + 便签 */
    var nx = ox + PW + 24, nw = W - nx - PAD, minY = oy;
    for (var i = 0; i < Math.min(annotN, NOTE_TEXTS.length); i++) {
      var para = NOTE_PHRASES[i], pi = [0, 1, 2][i], li = pi - pg.offset;
      if (li < 0 || li >= pg.paras.length) continue;
      var txt = X.PARA_INDENT + pg.paras[li], k = Math.max(txt.indexOf(para), 0);
      var row = lay.starts[li] + Math.floor(k / per), col = k % per, len = Math.min(para.length, per - col);
      var x1 = ox + PW * (8 + col / per * 84) / 100, x2 = x1 + PW * len / per * 84 / 100, cy = oy + row * rh + rh / 2;
      g.strokeStyle = '#ef4444'; g.lineWidth = i === 0 ? 3 : 2;
      g.beginPath(); g.ellipse((x1 + x2) / 2, cy, (x2 - x1) / 2 + 6, rh * 0.62, -0.017, 0, Math.PI * 2); g.stroke();
      var by = Math.max(minY, oy + row * rh - 4);
      g.font = '400 13px "Noto Sans CJK SC","PingFang SC",sans-serif';
      var chipW = 22, lines = wrapNote(g, NOTE_TEXTS[i], nw - 24 - chipW - 6, nw - 24), bh = 16 + lines.length * 20;
      minY = by + bh + 12;
      g.fillStyle = '#fff1ed'; g.strokeStyle = i === 0 ? '#ff6641' : '#ffc8ba'; g.lineWidth = 1;
      rr(g, nx + .5, by + .5, nw - 1, bh - 1, 8); g.fill(); g.stroke();
      g.fillStyle = '#ff6641'; rr(g, nx + 12, by + 10, chipW, 16, 8); g.fill();
      g.fillStyle = '#fff'; g.font = '400 11px "Noto Sans CJK SC","PingFang SC",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('AI', nx + 12 + chipW / 2, by + 18.5);
      g.fillStyle = '#262626'; g.font = '400 13px "Noto Sans CJK SC","PingFang SC",sans-serif'; g.textAlign = 'left';
      lines.forEach(function (ln, li2) { g.fillText(ln, li2 === 0 ? nx + 12 + chipW + 6 : nx + 12, by + 8 + li2 * 20 + 10 + 0.5); });
    }
    var url = c.toDataURL('image/png');
    paperCache[key] = url;
    return url;
  }

  /* ================= essay-preview：预览弹层 ================= */
  Vue.component('essay-preview', {
    data: function () { return { ICON: ICON, ASSET: ASSET, exporting: null }; },
    computed: {
      show: function () { return !!this.ctx.S.preview && !!H.ev(this.ctx.S.cur); },
      e: function () { return H.ev(this.ctx.S.cur) || { txt: {}, title: '', course: '', lesson: '' }; },
      gradeUnit: function () { return gradeUnitOf(this.e); },
      stuName: function () { var s = H.stu(this.e.sid); return s ? s.name : ''; },
      /* 老师批注：文字作文 = 一张田字格合成图；图片作文 = 手写稿纸占位，每张图一页 */
      papers: function () {
        if (!this.show) return [];
        var P = (this.ctx.D && this.ctx.D.PARAS) || [], e = this.e;
        if (e.form === 'image') return [0, 1].map(function (i) { return drawHand(e.title, P, e.annot || 0, i); });
        return [drawPaper(e.title, P, e.annot || 0)];
      },
      sections: function () {
        var t = this.e.txt || {}, out = [];
        function has(s) { return s && String(s).trim(); }
        if (has(t['总评'])) out.push({ title: '老师总评', html: md(t['总评']) });
        if (has(t['详细点评'])) out.push({ title: '详细点评', html: md(prepDetail(t['详细点评'])) });
        out.push({ title: '全文润色', polish: polishOf(t['全文润色']) });
        if (has(t['诊断建议'])) out.push({ title: '诊断建议', html: md(prepAdvice(t['诊断建议'])) });
        return out;
      }
    },
    watch: {
      /* 真实：打开时 body overflow:hidden；x-preview-open 只给 css 里"预览中提示条抬层级"用（见 essay-overlays.css 末尾） */
      show: {
        immediate: true,   /* 组件挂载时预览已经是打开状态（刷新/联调注入）也要同步 body */
        handler: function (v) { document.body.style.overflow = v ? 'hidden' : ''; document.body.classList.toggle('x-preview-open', !!v); }
      }
    },
    mounted: function () {
      var self = this;
      this._k = function (ev) { if (ev.key === 'Escape' && self.show && !self.ctx.S.dlg) self.$act('closePreview'); };
      document.addEventListener('keydown', this._k);
    },
    beforeDestroy: function () { document.removeEventListener('keydown', this._k); document.body.style.overflow = ''; document.body.classList.remove('x-preview-open'); },
    methods: {
      /* 真实：点导出 -> 被点的按钮文案变「导出中…」、三个导出按钮 disabled（「关闭预览」不受影响）-> 完成后提示「PDF 已导出」「Word 已导出」「图片已导出」。
         demo 不生成文件：按钮短暂进入"导出中…"，动作立即回传（fake，只弹提示条，文案取真实成功提示）。 */
      exportAs: function (type, doneText) {
        var self = this;
        if (this.exporting) return;
        this.exporting = type;
        this.$act('fake', { m: doneText, kind: 'success' });   /* kind：真实是成功提示；父页面若只取 m 则按普通提示显示 */
        setTimeout(function () { self.exporting = null; }, 700);
      }
    },
    template:
      '<div v-if="show" class="correction-preview-overlay" role="dialog" aria-modal="true">' +
      '<header class="preview-toolbar">' +
      '<div class="toolbar-brand">' +
      '<span class="brand-logo"><span class="essay-icon" style="width: 20px; height: 20px;" aria-hidden="true"><img :src="ICON + \'pen-icon.svg\'" alt=""></span></span>' +
      '<span class="brand-title">作文批改助手</span>' +
      '</div>' +
      '<div class="toolbar-actions">' +
      '<button type="button" class="toolbar-btn" :disabled="!!exporting" @click="exportAs(\'pdf\', \'PDF 已导出\')"><span class="essay-icon" style="width: 14px; height: 14px;" aria-hidden="true"><img :src="ICON + \'download.svg\'" alt=""></span> {{ exporting === \'pdf\' ? \'导出中…\' : \'导出为pdf\' }}</button>' +
      '<button type="button" class="toolbar-btn" :disabled="!!exporting" @click="exportAs(\'word\', \'Word 已导出\')"><span class="essay-icon" style="width: 14px; height: 14px;" aria-hidden="true"><img :src="ICON + \'download.svg\'" alt=""></span> {{ exporting === \'word\' ? \'导出中…\' : \'导出为word\' }}</button>' +
      '<button type="button" class="toolbar-btn" :disabled="!!exporting" @click="exportAs(\'image\', \'图片已导出\')"><span class="essay-icon" style="width: 14px; height: 14px;" aria-hidden="true"><img :src="ICON + \'download.svg\'" alt=""></span> {{ exporting === \'image\' ? \'导出中…\' : \'导出为图片\' }}</button>' +
      '<button type="button" class="toolbar-btn toolbar-btn--close" @click="$act(\'closePreview\')"><span class="essay-icon" style="width: 14px; height: 14px;" aria-hidden="true"><img :src="ICON + \'icon-close.svg\'" alt=""></span> 关闭预览</button>' +
      '</div>' +
      '</header>' +
      '<div class="preview-scroll">' +
      '<article class="preview-doc" style="--doc-brand-logo-size: 40px; --doc-brand-logo-gap: 24px; --doc-content-padding-top: 48px; --doc-content-padding-right: 56px; --doc-content-padding-bottom: 64px; --doc-content-padding-left: 56px; --essay-doc-section-margin-bottom: 48px; --essay-doc-grade-unit-font-size: 20px; --essay-doc-grade-unit-margin-bottom: 12px; --essay-doc-grade-unit-color: #737373; --essay-doc-meta-margin-bottom: 40px; --essay-doc-meta-font-size: 26px; --essay-doc-meta-item-gap: 12px; --essay-doc-marknote-page-gap: 28px; --essay-doc-section-heading-size: 28px; --essay-doc-section-heading-margin-bottom: 28px; --essay-doc-subsection-heading-size: 26px; --essay-doc-subsection-heading-margin-bottom: 24px; --essay-doc-subsubsection-heading-size: 24px; --essay-doc-subsubsection-heading-margin-bottom: 16px; --essay-doc-annotation-font-size: 24px; --essay-doc-annotation-marker-size: 32px; --essay-doc-body-font-size: 24px; --essay-doc-body-line-height: 40px; --essay-doc-body-paragraph-gap: 16px; --essay-doc-blockquote-font-size: 20px; --essay-doc-subsection-follow-margin-top: 36px; --essay-doc-subsection-follow-padding-top: 36px; --essay-doc-markdown-hr-margin: 20px;">' +
      '<img class="correction-brand-logo doc-brand-logo" style="width: 40px; height: 40px;" :src="ASSET + \'brand-shaonian-dedao-3x.png\'" alt="少年得到">' +
      '<header class="doc-meta"><div class="doc-meta-main">' +
      '<p v-if="gradeUnit" class="grade-unit">{{ gradeUnit }}</p>' +
      '<p class="student-name">学生姓名：{{ stuName }}</p>' +
      '<p class="essay-title">作文题目：<span class="book-title-mark book-title-mark--open">《</span><span class="book-title-inner">{{ e.title }}</span><span class="book-title-mark book-title-mark--close">》</span></p>' +
      '</div></header>' +
      '<section class="doc-section">' +
      '<h2 class="section-heading">老师批注</h2>' +
      '<div v-if="papers.length" class="marknote-page-list"><img v-for="(u, i) in papers" :key="i" class="marknote-page-image x-composite" :src="u" alt=""></div>' +
      '<p v-else class="annotation-empty">暂无批改画布</p>' +
      '</section>' +
      '<section v-for="s in sections" :key="s.title" class="doc-section">' +
      '<h2 class="section-heading">{{ s.title }}</h2>' +
      '<div v-if="!s.polish" class="subsection-block"><div class="essay-md-content essay-md-preview preview-md-block vditor-reset" v-html="s.html"></div></div>' +
      '<template v-else>' +
      '<div v-for="(b, bi) in s.polish" :key="b.h" class="subsection-block" :class="{\'subsection-block--follow\': bi > 0}">' +
      '<h3 class="subsection-heading">{{ b.h }}</h3>' +
      '<template v-if="b.subs">' +
      '<div v-for="c in b.subs" :key="c.h" class="subsubsection-block"><h4 class="subsubsection-heading">{{ c.h }}</h4><div class="essay-md-content essay-md-preview preview-md-block vditor-reset" v-html="c.html"></div></div>' +
      '</template>' +
      '<div v-else class="essay-md-content essay-md-preview preview-md-block vditor-reset" :class="{\'is-modification-strong\': b.mod}" v-html="b.html"></div>' +
      '</div>' +
      '</template>' +
      '</section>' +
      '</article>' +
      '</div>' +
      '</div>'
  });
})();
