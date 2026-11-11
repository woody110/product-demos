/* =====================================================================
 * main-summary.js —— 学员学情总结页 + 家长话术（V1.1 设计稿 第 3、4 节）
 * 组件 student-summary：只给教辅看；话术可编辑 / 重新生成 / 复制 / 发送给家长；发送走「企微群发」新建页（wechat-send-page，见 main-wechat.js）。
 * 话术状态存放在 workbench 持有的 store 里（按 学员+课程 存），页签切换不丢。
 * 数据全部来自 ctx.STU / ctx.E / ctx.D；样式见 css/main-summary.css。
 * 对外：window.XSum = { newEntry, runSend, derive }
 * ===================================================================== */
(function () {
  function C(opts, tpl) {
    var c = Vue.compile(tpl, { whitespace: 'condense' });
    opts.render = c.render;
    opts.staticRenderFns = c.staticRenderFns;
    return opts;
  }
  var MAX_REGEN = 3;
  var FAIL_REASON = '该家长企微好友已失效，请稍后重试';

  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return h; }
  function round1(n) { return Math.round(n * 10) / 10; }

  /* ---- 数据推导：某学员在某课程下的学习轨迹、作文情况 ---- */
  function derive(ctx, row) {
    var D = ctx.D || {};
    var stu = (ctx.STU || []).filter(function (s) { return s.sid === row.sid && s.course === row.course; })[0] || { study: {} };
    var lessons = (D.LESSONS || {})[row.course] || [];
    var seed = hash(row.sid) % 5;
    var learned = [], k = 0;
    lessons.forEach(function (l, i) {
      var st = stu.study[l.id];
      if (st && st.times > 0) {
        var rounds = Math.max(1.4, round1(3.6 + seed * 0.1 - k * 0.9));
        learned.push({ idx: i, id: l.id, name: l.name, st: st, rounds: rounds });
        k++;
      }
    });
    var doneCnt = lessons.filter(function (l) { var st = stu.study[l.id]; return st && st.state === '已完课'; }).length;
    var total = 0; learned.forEach(function (x) { total += x.st.total; });
    var avgRounds = learned.length ? round1(learned.reduce(function (a, x) { return a + x.rounds; }, 0) / learned.length) : 0;
    var essays = (ctx.E || []).filter(function (e) { return e.sid === row.sid && e.course === row.course; });
    function latest(kind) {
      var a = essays.filter(function (e) { return e.kind === kind; });
      a.sort(function (x, y) { return x.lesson < y.lesson ? 1 : x.lesson > y.lesson ? -1 : 0; });
      return a[0] || null;
    }
    var last = learned[learned.length - 1] || null;
    return {
      stu: stu, lessons: lessons, learned: learned, doneCnt: doneCnt, total: total,
      avgPer: learned.length ? Math.round(total / learned.length) : 0, avgRounds: avgRounds,
      lastNo: last ? last.idx + 1 : 0, lastTime: last ? last.st.last : '',
      first: latest('first'), second: latest('second'),
      noData: !learned.length
    };
  }

  /* ---- 话术生成：内部判断（错别字、断句、分层等）一律不进话术 ---- */
  function genText(d, row, ver, variant) {
    var name = row.name, f = d.first, s = d.second, v = variant % 3;
    var a;
    if (f) {
      a = [
        '这次《' + f.title + '》，' + name + '写“眼睛笑起来眯成一条缝”，一读就能想到画面——外貌抓得特别准。',
        '《' + f.title + '》这篇，' + name + '的开头很直接，一下子就让人知道写的是谁，用词也很生动。',
        name + '这次写《' + f.title + '》很用心，事例选得具体，能看出平时观察得很仔细。'
      ][v];
    } else {
      a = name + '这几节课学得很投入，视频和互动题完成得不错，AI 带练也能跟上节奏。';
    }
    var b;
    if (ver === 2 && f && s && s.status === 'graded') {
      b = [
        '订正稿比第一稿更具体：' + name + '补上了动作细节，结尾也呼应了开头（首稿“' + (f.level || '良') + '”，订正稿“' + (s.level || '良') + '”），进步很明显。',
        '和第一稿比，订正稿的细节丰富了不少，' + name + '听进了建议并认真改了（首稿“' + (f.level || '良') + '”，订正稿“' + (s.level || '良') + '”）。',
        '订正稿读起来更完整了，' + name + '把结尾和开头接上了，也多写了几处小动作（首稿“' + (f.level || '良') + '”，订正稿“' + (s.level || '良') + '”）。'
      ][v];
    } else if (d.learned.length >= 2) {
      var r0 = d.learned[0].rounds, rn = d.learned[d.learned.length - 1].rounds;
      b = [
        '比起上一篇，段落之间衔接自然多了，语言也更流畅了，能看出一直在进步。',
        name + '的语言越来越自然了，写一段话时衔接也更顺，能看出一直在进步。',
        '和刚开始相比，' + name + '现在自己组织一段话更顺了，表达也更完整了。'
      ][v];
    } else {
      b = name + '刚开始接触 AI 作文课，已经能跟着步骤完成练习，后面的课会越来越熟练。';
    }
    var c = [
      '建议每周帮孩子挑 3 件小事记进素材本（一句话即可），以后写事例就不愁没得写。',
      '在家可以让孩子每天用三句话说说今天遇到的一个人或一件事，说顺了再写下来。',
      '写完作文后，可以请孩子大声读一遍给您听，哪里读着不顺，就是可以改的地方。'
    ][v];
    return a + '\n\n' + b + '\n\n' + c;
  }

  /* ---- 话术状态（每个学员+课程一份） ---- */
  function newEntry(row, ctx) {
    var d = derive(ctx, row);
    return {
      ver: 1, text: genText(d, row, 1, 0), edited: false, regen: 0, keepOld: false,
      editing: false, draft: '',
      status: 'none', sentAt: '', failReason: '', showReason: false, failCount: 0,
      failFirst: !!d.stu.failFirst, lesson: d.lastNo,
      lastPayload: null, timedAt: ''
    };
  }

  /* 提交发送（来自企微群发页的确认）：发送中 → 已发送 / 发送失败 */
  function runSend(entry, payload, now) {
    entry.lastPayload = payload || entry.lastPayload;
    var p = entry.lastPayload || {};
    if (p.mode === 'timed') { entry.status = 'scheduled'; entry.timedAt = p.time || ''; return; }
    entry.status = 'sending'; entry.showReason = false;
    setTimeout(function () {
      if (entry.failFirst && entry.failCount === 0) {
        entry.failCount++; entry.status = 'failed'; entry.failReason = FAIL_REASON;
      } else {
        entry.status = 'sent'; entry.sentAt = now || '';
      }
    }, 1500);
  }

  window.XSum = { newEntry: newEntry, runSend: runSend, derive: derive, genText: genText };

  /* ---- 兜底：企微群发新建页（main-wechat.js 未加载时用，加载了就用真实的） ---- */
  if (!Vue.options.components['wechat-send-page']) {
    Vue.component('wechat-send-page', {
      props: ['student', 'content'],
      template: '<div style="padding:24px"><p>企微群发·新建（占位）：{{ student.name }}</p><pre style="white-space:pre-wrap">{{ content }}</pre>' +
        '<el-button @click="$emit(\'cancel\')">取消</el-button> <el-button type="primary" @click="$emit(\'submit\', { content: content, mode: \'now\' })">确认发送</el-button></div>'
    });
  }

  var LEVEL_COLOR = { '优': 'x-sm-lv-a', '良': 'x-sm-lv-b', '中': 'x-sm-lv-c' };

  var TEMPLATE =
  '<div class="x-sm-page" v-if="d">' +
    '<div class="x-sm-top"><span class="x-sm-top-title">学情总结 · {{ row.name }}</span><span class="x-sm-top-who">教辅 · {{ teacher }}</span></div>' +

    /* ================= 页头摘要 ================= */
    '<div class="x-sm-card x-sm-head">' +
      '<span class="x-sm-avatar">{{ row.name.charAt(0) }}</span>' +
      '<div class="x-sm-head-info">' +
        '<div class="x-sm-name">{{ row.name }}<span v-if="row.refunded" class="x-sm-chip x-sm-chip-red">已退费</span></div>' +
        '<div class="x-sm-sub">{{ row.cls }} · ID {{ row.sid }}</div>' +
      '</div>' +
      '<div class="x-sm-tags">' +
        '<span class="x-sm-chip x-sm-chip-green">完课 {{ d.doneCnt }}/{{ d.lessons.length }}</span>' +
        '<span class="x-sm-chip" :class="secondTag.cls">{{ secondTag.text }}</span>' +
        '<span v-if="d.first && d.first.level" class="x-sm-chip x-sm-lv" :class="lvCls(d.first.level)">首次 {{ d.first.level }}</span>' +
        '<span v-if="d.second && d.second.status === \'graded\' && d.second.level" class="x-sm-chip x-sm-lv" :class="lvCls(d.second.level)">订正 {{ d.second.level }}</span>' +
        '<span v-else-if="d.second && d.second.status === \'pending\'" class="x-sm-chip x-sm-chip-orange">订正 待批改</span>' +
      '</div>' +
      '<div class="x-sm-meta"><div>AI 自动生成 · <b>每节课结束更新</b></div><div>第 {{ d.lastNo }} 课结束 · {{ d.lastTime }}</div></div>' +
    '</div>' +

    '<div class="x-sm-grid">' +
      /* ================= 上课留痕 ================= */
      '<div class="x-sm-card">' +
        '<div class="x-sm-title"><i class="x-sm-ic x-sm-ic-blue"></i>上课留痕<span class="x-sm-hint">学习数据，每节课结束同步</span></div>' +
        '<div class="x-sm-lessons">' +
          '<div v-for="(l, i) in d.lessons" :key="l.id" class="x-sm-ls" :class="lessonCls(l)">' +
            '<div class="x-sm-ls-no">课{{ i + 1 }}</div>' +
            '<div class="x-sm-ls-v">{{ lessonVal(l) }}</div>' +
          '</div>' +
        '</div>' +
        '<div class="x-sm-tagrow">' +
          '<span v-for="t in traceTags" :key="t.text" class="x-sm-chip" :class="t.cls">{{ t.text }}</span>' +
        '</div>' +
        '<div class="x-sm-stat"><i class="el-icon-time"></i>总用时 <b>{{ d.total }}</b> 分钟 · 平均 <b>{{ d.avgPer }}</b> 分钟/课</div>' +
        '<div class="x-sm-stat"><i class="el-icon-chat-dot-round"></i>每段平均交互 <b>{{ d.avgRounds }}</b> 轮（含重说）</div>' +
      '</div>' +

      /* ================= 能力变化（曲线） ================= */
      '<div class="x-sm-card x-sm-curve-card">' +
        '<div class="x-sm-title"><i class="x-sm-ic x-sm-ic-red"></i>能力变化<span class="x-sm-hint">截止到第 {{ d.lastNo }} 课 · 每节课结束更新</span></div>' +
        '<div v-if="curve.n < 2" class="x-sm-empty">数据不足，暂不展示（至少学满 2 节课）</div>' +
        '<template v-else>' +
          '<div class="x-sm-legend">' +
            '<span v-for="a in curve.series" :key="a.name" class="x-sm-lg" :class="{ off: hidden[a.name] }" @click="toggle(a.name)"><i :style="{ background: a.color }"></i>{{ a.name }}<b>{{ a.last }}</b></span>' +
          '</div>' +
          '<svg class="x-sm-svg" :viewBox="\'0 0 \' + curve.W + \' \' + curve.H" preserveAspectRatio="xMidYMid meet">' +
            '<g v-for="b in curve.bands" :key="b.name"><rect :x="curve.L" :y="b.y" :width="curve.W - curve.L - curve.R" :height="b.h" :fill="b.fill"/><text :x="curve.L - 8" :y="b.y + b.h / 2 + 4" text-anchor="end" font-size="12" :fill="b.color">{{ b.name }}</text></g>' +
            '<g v-for="t in curve.xs" :key="t.x"><line :x1="t.x" :y1="curve.T" :x2="t.x" :y2="curve.H - curve.B" stroke="#ebeef5" stroke-dasharray="3 3"/><text :x="t.x" :y="curve.H - 8" text-anchor="middle" font-size="12" fill="#909399">{{ t.label }}</text></g>' +
            '<g v-for="a in curve.series" v-show="!hidden[a.name]" :key="a.name">' +
              '<polyline :points="a.points" fill="none" :stroke="a.color" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>' +
              '<circle v-for="(pt, i) in a.pts" :key="i" :cx="pt.x" :cy="pt.y" :r="i === a.pts.length - 1 ? 4.5 : 3" :fill="i === a.pts.length - 1 ? a.color : \'#fff\'" :stroke="a.color" stroke-width="2"><title>{{ a.name }} · {{ pt.label }} · {{ pt.v }} 分（{{ pt.lv }}）</title></circle>' +
            '</g>' +
          '</svg>' +
          '<div class="x-sm-note x-sm-note-green"><i class="el-icon-success"></i>{{ curve.text }}</div>' +
        '</template>' +
      '</div>' +

    '</div>' +

  '</div>';

  Vue.component('student-summary', C({
    props: ['row', 'viewer', 'entry'],
    data: function () { return { hidden: {} }; },
    computed: {
      d: function () { return this.row ? derive(this.ctx, this.row) : null; },
      teacher: function () { var t = ((this.ctx.D || {}).TEACHERS || {})[this.viewer]; return t ? t.name : ''; },
      paras: function () { return String(this.entry.text || '').split('\n\n').filter(function (x) { return x.trim(); }); },
      left: function () { return MAX_REGEN - this.entry.regen; },
      secondTag: function () {
        var s = this.d.second;
        if (!s) return { text: '订正作文 未提交', cls: 'x-sm-chip-gray' };
        if (s.status === 'graded') return { text: '订正作文 已批改', cls: 'x-sm-chip-green' };
        return { text: '订正作文 已上传', cls: 'x-sm-chip-blue' };
      },
      traceTags: function () {
        var out = [], d = this.d;
        d.learned.forEach(function (x) {
          if (x.st.times >= 2) out.push({ text: '第 ' + (x.idx + 1) + ' 课 · 反复学 ' + x.st.times + ' 遍', cls: 'x-sm-chip-blue' });
          else if (x.st.state !== '已完课') out.push({ text: '第 ' + (x.idx + 1) + ' 课 · 仅过 1 次', cls: 'x-sm-chip-orange' });
        });
        var once = d.learned.filter(function (x) { return x.st.times === 1 && x.st.state === '已完课'; }).length;
        if (once) out.push({ text: '其余课节 · 一次通过', cls: 'x-sm-chip-green' });
        return out;
      },
      /* 能力曲线：每个已学课节一个点（0-100 分，对应 优 ≥85 / 良 70-84 / 中 <70），截止到当前课节；示意数据 */
      curve: function () {
        var l = this.d.learned, n = l.length;
        var W = 560, H = 250, L = 40, R = 34, T = 12, B = 30;
        var names = ['观察细致', '语言表达', '结构安排', '细节描写', '结尾呼应'];
        var colors = ['#409eff', '#07c160', '#e6a23c', '#ff5f2e', '#9b59b6'];
        var f = this.d.first, s2 = this.d.second;
        var LVV = { '中': 62, '良': 77, '优': 90 };
        var top = ((s2 && s2.status === 'graded' && s2.level) || (f && f.level) || '良');
        var seed = hash(this.row.sid) % 7;
        var off = [2, 0, -1, -3, -4], gain = [6, 10, 9, 16, 18];
        var y = function (v) { return T + (H - T - B) * (100 - v) / 60; };       // 40..100
        var xAt = function (k) { return n === 1 ? L : L + (W - L - R) * k / (n - 1); };
        var series = names.map(function (nm, i) {
          var end = Math.min(98, Math.max(45, LVV[top] + off[i] + (seed % 3) - 1));
          var start = Math.max(40, end - gain[i] - (seed % 4));
          var pts = [];
          for (var k = 0; k < n; k++) {
            var t = n === 1 ? 1 : k / (n - 1);
            var wob = Math.sin((k + i + seed) * 1.7) * 2.2 * (k === n - 1 ? 0 : 1);
            var v = Math.round(Math.min(99, Math.max(40, start + (end - start) * t + wob)));
            pts.push({ x: xAt(k), y: y(v), v: v, lv: v >= 85 ? '优' : v >= 70 ? '良' : '中', label: '第 ' + (l[k].idx + 1) + ' 课' });
          }
          return { name: nm, color: colors[i], pts: pts, points: pts.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' '), first: pts[0].v, lastV: pts[n - 1].v, last: pts[n - 1].lv };
        });
        var bands = [
          { name: '优', y: y(100), h: y(85) - y(100), fill: '#f0faf3', color: '#07c160' },
          { name: '良', y: y(85), h: y(70) - y(85), fill: '#f3f8ff', color: '#409eff' },
          { name: '中', y: y(70), h: y(40) - y(70), fill: '#fff8ef', color: '#ff8000' }
        ];
        var xs = l.map(function (it, k) { return { x: xAt(k), label: '第 ' + (it.idx + 1) + ' 课' }; });
        var sorted = series.slice().sort(function (a, b) { return b.lastV - a.lastV; });
        var gains = series.slice().sort(function (a, b) { return (b.lastV - b.first) - (a.lastV - a.first); });
        return {
          n: n, W: W, H: H, L: L, R: R, T: T, B: B, series: series, bands: bands, xs: xs,
          text: '优势能力：' + sorted[0].name + '、' + sorted[1].name + '；相对待提升：' + sorted[4].name + '、' + sorted[3].name + '；进步最明显：' + gains[0].name
        };
      },
      /* 订正作文已批改且话术还是首版 → 提示有新版本 */
      showNew: function () {
        var s = this.d.second;
        return !!(s && s.status === 'graded' && this.d.first && this.entry.ver === 1 && !this.entry.keepOld);
      },
      /* 发送前的置灰规则 */
      sendBlock: function () {
        if (this.row.refunded) return '退费学员不可发送';
        if (this.viewer !== (this.ctx.S || {}).me) return '登录人不是所选教辅，不可发送';
        if (!String(this.entry.text || '').trim()) return '话术内容为空';
        return '';
      }
    },
    methods: {
      toggle: function (n) { this.$set(this.hidden, n, !this.hidden[n]); },
      lvCls: function (lv) { return LEVEL_COLOR[lv] || 'x-sm-lv-b'; },
      lessonCls: function (l) {
        var st = this.d.stu.study[l.id];
        if (!l.open) return 'x-sm-ls-off';
        if (!st || !st.times) return 'x-sm-ls-none';
        return st.state === '已完课' ? 'x-sm-ls-done' : 'x-sm-ls-part';
      },
      lessonVal: function (l) {
        var st = this.d.stu.study[l.id];
        if (!l.open || !st || !st.times) return '—';
        return '✓' + st.steps;
      },
      startEdit: function () { this.entry.draft = this.entry.text; this.entry.editing = true; },
      saveEdit: function () {
        var t = String(this.entry.draft || '').trim();
        if (!t) { this.$message({ message: '话术内容不能为空', type: 'warning' }); return; }
        if (t !== this.entry.text) { this.entry.text = t; this.entry.edited = true; }
        this.entry.editing = false;
        this.$message({ message: '已保存', type: 'success' });
      },
      doRegen: function () {
        var e = this.entry;
        e.regen++;
        e.text = genText(this.d, this.row, e.ver, e.regen);
        e.edited = false;
        this.$message({ message: '已重新生成', type: 'success' });
      },
      regen: function () {
        var me = this;
        if (this.left <= 0) return;
        if (this.entry.edited) {
          this.$confirm('重新生成会覆盖当前编辑内容，确定重新生成吗？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
            .then(function () { me.doRegen(); }).catch(function () {});
        } else this.doRegen();
      },
      copy: function () {
        try { if (navigator.clipboard) navigator.clipboard.writeText(this.entry.text); } catch (e) {}
        this.$message({ message: '已复制', type: 'success' });
      },
      useNew: function () {
        var e = this.entry;
        e.ver = 2; e.text = genText(this.d, this.row, 2, e.regen); e.edited = false;
        this.$message({ message: '已替换为新版本', type: 'success' });
      },
      viewList: function () { this.$message({ message: '示意：跳到「企微群发」列表，查看这次发送的成功 / 失败情况', type: 'info' }); },
      /* 发送前校验：未加好友 → 弹窗；本课节已发过 → 二次确认；通过后打开「企微群发」新建页 */
      send: function () {
        var me = this, e = this.entry, d = this.d;
        if (d.stu.noFriend) {
          this.$alert('该学员家长未加老师好友，无法触达。', '无法触达用户', { confirmButtonText: '知道了' }).catch(function () {});
          return;
        }
        function go() { me.$emit('send', { row: me.row, content: String(e.text).split(me.row.name).join('[孩子姓名]') }); }
        if (e.status === 'sent' || e.status === 'scheduled') {
          this.$confirm('这节课的话术已于 ' + (e.sentAt || e.timedAt) + ' 发送过，确定再发？', '提示', { confirmButtonText: '确定再发', cancelButtonText: '取消', type: 'warning' })
            .then(go).catch(function () {});
        } else go();
      },
      retry: function () {
        runSend(this.entry, null, (this.ctx.D || {}).NOW);
        this.$message({ message: '重新发送中', type: 'info' });
      }
    }
  }, TEMPLATE));
})();
