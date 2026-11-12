/* =====================================================================
 * main-ai.js —— AI 作文课工作台（产品方案 v2：4.2–4.5）：ai-panel
 * 浮层选到 AI 作文课后，一站式工作台把"期段页签 + 工作台"整体换成本组件。
 * MVP 只有「学员列表」一个页签（页签条由工作台渲染）；学员只在课节的学员列表里看作文、批改。
 *
 * DOM / class 复用 main-workbench.js 里的真实写法：
 *   筛选区 = .filter-and-cards-section > .filter-header > .student-search-wrapper（小号控件）
 *   统计行 = .list-header-inline；表格 = el-table（stripe / highlight-current-row / max-height 700）
 *   学员列 = .student-info；"状态 + 下方灰字 + 文字按钮" = 真实"能力测评状态"列；操作列 = .operation-buttons
 *   抽屉 = el-drawer + 真实订单信息抽屉的 student-list-order-drawer / order-detail-card 系列 class
 * 新增元素 class 一律 x- 前缀，样式见 css/main-ai.css "新增（产品方案 v2）"之后。
 * 数据全部来自 ctx.STU / ctx.E / ctx.D；动作：openEssay{id}、fake{m}。
 * ===================================================================== */
(function () {
  function C(opts, tpl) {
    var c = Vue.compile(tpl, { whitespace: 'condense' });
    opts.render = c.render;
    opts.staticRenderFns = c.staticRenderFns;
    return opts;
  }
  var FAKE = '示意：该功能本次不涉及';
  var PENDING = '#ff8000', GRADED = '#07c160';          /* 沿用班课作文批改里已有的色值 */
  var RANK = { '已完课': 0, '已学习': 1, '未学习': 2 };

  var STUDENT_COL =
    '<el-table-column label="学员" width="200" fixed="left">' +
      '<template slot-scope="scope">' +
        '<div class="student-info">' +
          '<div class="student-name">' +
            '<el-button type="text" @click="openStu(scope.row)" style="padding: 0; margin-right: 4px; color: #303133;"> {{ scope.row.name }} </el-button>' +
            '<el-tag v-if="scope.row.refunded" size="mini" type="danger" class="x-ai-refund-tag">已退费</el-tag>' +
          '</div>' +
          '<div class="student-id">' +
            '<el-button type="text" @click="openStu(scope.row)" style="padding: 0; margin-right: 4px;"> {{ scope.row.sid }} </el-button>' +
            '<i class="el-icon-document-copy copy-icon" style="cursor: pointer; color: #409EFF;" @click.stop="copy"></i>' +
          '</div>' +
          '<div class="student-phone">' +
            '<el-tooltip placement="top" :open-delay="1000" :content="scope.row.phone">' +
              '<span style="cursor: pointer; color: #ff5f2e; margin-right: 4px;" @click="openFollow(scope.row)"> {{ mask(scope.row.phone) }} </span>' +
            '</el-tooltip>' +
            '<i class="el-icon-document-copy copy-icon" style="cursor: pointer; color: #409EFF;" @click.stop="copy"></i>' +
          '</div>' +
        '</div>' +
      '</template>' +
    '</el-table-column>';

  var LIST_TABLE =
    '<el-table :stripe="true" :data="listPage" max-height="700px" :highlight-current-row="true" :row-class-name="rowClass" key="x-ai-table-list" @selection-change="onSel">' +
      '<el-table-column type="selection" width="55" fixed="left"></el-table-column>' +
      STUDENT_COL +
      '<el-table-column prop="cls" label="班级" width="130"></el-table-column>' +
      '<el-table-column label="课程完成" width="120"><template slot-scope="scope">' +
        '<span class="x-ai-done">{{ scope.row.done }}</span><span class="x-ai-done-total"> / {{ lessons.length }} 节</span>' +
      '</template></el-table-column>' +
      '<el-table-column label="本课节学习次数" width="130"><template slot-scope="scope">{{ scope.row.st.times }}</template></el-table-column>' +
      '<el-table-column label="最近学习时间" width="140"><template slot-scope="scope">{{ scope.row.st.last || \'-\' }}</template></el-table-column>' +
      '<el-table-column label="是否完课" width="100"><template slot-scope="scope">{{ scope.row.st.state === \'已完课\' ? \'是\' : \'否\' }}</template></el-table-column>' +
      '<el-table-column label="视频学习时长（首次）" width="170"><template slot-scope="scope">{{ scope.row.st.times ? scope.row.vmin + \'分钟\' : \'-\' }}</template></el-table-column>' +
      '<el-table-column label="写作步骤进度" width="120"><template slot-scope="scope">{{ scope.row.stepText }}</template></el-table-column>' +
      '<el-table-column label="互动题完成情况" width="130"><template slot-scope="scope">{{ scope.row.st.qa }}</template></el-table-column>' +
      '<el-table-column label="互动题答题正确率" width="150"><template slot-scope="scope">{{ scope.row.st.acc == null ? \'-\' : scope.row.st.acc + \'%\' }}</template></el-table-column>' +
      '<el-table-column label="学习时长（首次）" width="150"><template slot-scope="scope">{{ scope.row.st.times ? scope.row.st.once + \'分钟\' : \'-\' }}</template></el-table-column>' +
      '<el-table-column label="作文" width="110" align="center">' +
        '<template slot-scope="scope">' +
          '<el-button v-if="scope.row.essay" type="text" size="small" style="padding: 0;" @click="viewEssay(scope.row.essay)">查看</el-button>' +
          '<span v-else>-</span>' +
        '</template>' +
      '</el-table-column>' +
      '<el-table-column label="提交状态" width="100"><template slot-scope="scope">{{ scope.row.submitted ? \'是\' : \'否\' }}</template></el-table-column>' +
      '<el-table-column label="提交时间" width="170"><template slot-scope="scope">{{ scope.row.submitted ? scope.row.essay.submit : \'--\' }}</template></el-table-column>' +
      '<el-table-column label="操作" width="220" fixed="right" align="center">' +
        '<template slot-scope="scope"><div class="operation-buttons">' +
          '<el-button v-if="scope.row.submitted" type="text" size="mini" class="x-ai-go" @click="goGrade(scope.row.essay)"> 查看批改结果 </el-button>' +
          '<el-tooltip v-else content="学生还没有提交作文" placement="top"><span><el-button type="text" size="mini" disabled> 查看批改结果 </el-button></span></el-tooltip>' +
          '<el-button v-if="scope.row.reported" type="text" size="mini" @click="viewReport(scope.row.essay)"> 查看批改报告 </el-button>' +
          '<el-tooltip v-else content="批改报告还没有生成" placement="top"><span><el-button type="text" size="mini" disabled> 查看批改报告 </el-button></span></el-tooltip>' +
        '</div></template>' +
      '</el-table-column>' +
    '</el-table>';

  function searchBox(label, inner) {
    return '<div class="student-search-wrapper"><span class="search-label">' + label + '</span>' + inner + '</div>';
  }
  function pager(totalExpr, sizeProp, curProp) {
    return '<div class="pagination" v-if="' + totalExpr + ' > 0">' +
      '<el-pagination background :page-size="' + sizeProp + '" :page-sizes="[10, 20, 50, 100, 200]" :current-page="' + curProp + '" ' +
        'layout="sizes,total, prev, pager, next" :total="' + totalExpr + '" @size-change="onSize" @current-change="onPage"></el-pagination>' +
    '</div>';
  }

  /* 抽屉里一个"信息行" */
  function row(label, expr) {
    return '<div class="order-detail-card__row"><span class="order-detail-card__label">' + label + '</span>' +
      '<span class="order-detail-card__value">' + expr + '</span></div>';
  }

  var TEMPLATE =
  '<div class="workbench-container tab-content x-ai-panel">' +

    /* ================= 学员列表 ================= */
    '<div>' +
      '<div class="filter-and-cards-section x-ai-filter-card">' +
        '<div class="filter-header x-ai-filter">' +
          searchBox('课节：',
            '<el-select v-model="lf.lesson" size="small" style="width: 200px;" placeholder="请选择课节">' +
              '<el-option v-for="l in lessons" :key="l.id" :label="l.open ? l.name : l.name + \'（未开课）\'" :value="l.id" :disabled="!l.open"></el-option>' +
            '</el-select>') +
          searchBox('是否完课：',
            '<el-select v-model="lf.done" size="small" style="width: 110px;">' +
              '<el-option label="全部" value="all"></el-option>' +
              '<el-option label="是" value="yes"></el-option>' +
              '<el-option label="否" value="no"></el-option>' +
            '</el-select>') +
          searchBox('提交状态：',
            '<el-select v-model="lf.submit" size="small" style="width: 110px;">' +
              '<el-option label="全部" value="all"></el-option>' +
              '<el-option label="是" value="yes"></el-option>' +
              '<el-option label="否" value="no"></el-option>' +
            '</el-select>') +
          searchBox('批改报告：',
            '<el-select v-model="lf.report" size="small" style="width: 130px;">' +
              '<el-option label="全部" value="all"></el-option>' +
              '<el-option label="已生成" value="yes"></el-option>' +
              '<el-option label="未生成" value="no"></el-option>' +
            '</el-select>') +
          searchBox('学生ID/手机号/姓名：',
            '<el-input v-model="lf.nameInput" placeholder="输入学生ID/手机号或姓名，按回车查询" size="small" style="width: 300px;" ' +
              '@keyup.enter.native="applyListName" @clear="applyListName" clearable></el-input>') +
        '</div>' +
      '</div>' +
      '<div class="list-section">' +
        '<div class="table-container">' +
          '<div class="list-header-inline">' +
            '<div class="list-info"><span>符合筛选条件的约有{{ listRows.length }}条</span><span>，已选中{{ sel.length }}条</span></div>' +
            '<div class="list-actions">' +
              '<el-button @click="clearList">清空筛选条件</el-button>' +
              '<el-button @click="doExport">导出</el-button>' +
            '</div>' +
          '</div>' +
          '<div class="table-content"><div class="student-list-container">' +
            LIST_TABLE +
            pager('listRows.length', 'lf.size', 'lf.page') +
          '</div></div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    /* ================= 抽屉：批改结果（全局组件 essay-result-drawer） ================= */
    '<essay-result-drawer :essay-id="repId" :mode="repMode" :visible.sync="repShow" @grade="goGrade"></essay-result-drawer>' +
    '<follow-drawer :row="followRow" :visible.sync="followShow"></follow-drawer>' +

  '</div>';

  var DRAWER_TPL =
    '<el-drawer :title="repTitle" :visible="visible" @update:visible="$emit(\'update:visible\', $event)" direction="rtl" size="480px" append-to-body custom-class="student-list-order-drawer x-ai-report-drawer">' +
      '<div class="order-detail-drawer-body" v-if="repE">' +
        '<div class="order-detail-card"><div class="order-detail-card__rows">' +
          row('学生', '{{ repStu ? repStu.name : \'-\' }}') +
          row('作文标题', '{{ repE.title }}') +
          row('课节', '{{ lessonName(repE.course, repE.lesson) }}') +
          row('是否提交', '{{ isDraft ? \'否（当前为草稿）\' : \'是（当前为最终提交版）\' }}') +
          row('提交时间', '{{ isDraft ? \'--\' : repE.submit }}') +
          '<template v-if="mode === \'report\' && repE.status === \'graded\'">' +
            row('批改老师', '{{ teacherName(repE.gradedBy) }}') +
            row('批改时间', '{{ repE.gradedAt }}') +
          '</template>' +
        '</div></div>' +

        /* 手机外框里嵌学生端（C 端）页面：作文内容 / 批改报告 */
        '<div class="x-ai-phone-wrap">' +
          '<div class="x-ai-phone"><iframe class="x-ai-phone-frame" :src="frameSrc" frameborder="0"></iframe></div>' +
          '<div class="x-ai-paper-cap">{{ mode === \'report\' ? \'学生端批改报告页（班课以 from=cm 方式嵌入）\' : \'学生端作文页（C 端渲染）· \' + (isDraft ? \'草稿\' : \'最终提交版\') }}</div>' +
        '</div>' +
      '</div>' +
    '</el-drawer>';

  /* 抽屉：mode=essay → 学生作文内容（草稿 / 最终提交版）；mode=report → 学生端批改报告。学员列表与学员档案「作文批改」共用 */
  Vue.component('essay-result-drawer', C({
    props: { essayId: String, visible: Boolean, mode: { type: String, default: 'essay' } },
    computed: {
      D: function () { return this.ctx.D || {}; },
      paras: function () { return this.D.PARAS || []; },
      repE: function () { var id = this.essayId; return id ? (this.ctx.E || []).filter(function (e) { return e.id === id; })[0] || null : null; },
      isDraft: function () { return !!this.repE && this.repE.status === 'draft'; },
      repStu: function () {
        var e = this.repE;
        if (!e) return null;
        var all = (this.ctx.STU || []).filter(function (s) { return s.sid === e.sid; });
        return all.filter(function (s) { return s.course === e.course; })[0] || all[0] || null;
      },
      repGrade: function () {
        var e = this.repE, C = (this.D.COURSES || {})[e && e.course];
        return C ? String(C.title).slice(0, 3) : '-';
      },
      repTitle: function () { return this.mode === 'report' ? '批改报告' : '作文内容'; },
      frameSrc: function () {
        var e = this.repE;
        if (!e) return '';
        var t = e.txt || {};
        var data = {
          view: this.mode, draft: this.isDraft, name: this.repStu ? this.repStu.name : '', grade: this.repGrade,
          unit: this.lessonName(e.course, e.lesson), title: e.title,
          paras: this.isDraft ? (this.D.DRAFT_PARAS || this.paras.slice(0, 2)) : this.paras,
          '总评': t['总评'], '详细点评': t['详细点评'], '全文润色': t['全文润色'], '诊断建议': t['诊断建议']
        };
        return 'student-report.html#' + encodeURIComponent(JSON.stringify(data));
      }
    },
    methods: {
      lessonName: function (ck, id) {
        var l = ((this.D.LESSONS || {})[ck] || []).filter(function (x) { return x.id === id; })[0];
        return l ? l.name : '-';
      },
      teacherName: function (k) { return ((this.D.TEACHERS || {})[k] || {}).name || '-'; }
    }
  }, DRAWER_TPL));

  Vue.component('ai-panel', C({
    props: {
      courseKey: String,      /* 课程 key：'ai3' | 'ai4' */
      viewer: String,         /* 浮层所选教辅 key：'wang' | 'li' */
      classIds: Array         /* 浮层所选班级（班级名） */
    },
    data: function () {
      var ctx = window.__ctx || {}, D = ctx.D || {}, ls = (D.LESSONS || {})[this.courseKey] || [];
      /* 默认课节 = 最近一个已开课的课节；不提供"全部课节" */
      var def = ls.length ? ls[0].id : '';
      ls.forEach(function (l) { if (l.open) def = l.id; });
      return {
        lf: { lesson: def, done: 'all', submit: 'all', report: 'all', nameInput: '', name: '', page: 1, size: 50 },
        repShow: false, repId: null, repMode: 'essay', sel: [], followShow: false, followRow: null, hlSid: ''
      };
    },
    created: function () {},
    computed: {
      D: function () { return this.ctx.D || {}; },
      lessons: function () { return (this.D.LESSONS || {})[this.courseKey] || []; },
      paras: function () { return this.D.PARAS || []; },
      /* 学员 = 浮层所选班级下、当前课程里的学员 */
      courseStu: function () {
        var ids = this.classIds || [];
        return (this.ctx.STU || []).filter(function (s) { return s.course === this.courseKey && ids.indexOf(s.cls) !== -1; }, this);
      },
      /* ---- 汇总卡片已去掉 ---- */
      cards: function () { return {}; },
      /* ---- 学员列表：每课节每学员 1 篇作文；草稿 = 学生没提交；批改报告在老师「完成批改」后生成并发给学生 ---- */
      listAll: function () {
        var allLs = (this.D.LESSONS || {})[this.courseKey] || [], ctx = this.ctx, L = this.lf.lesson;
        var lesson = allLs.filter(function (l) { return l.id === L; })[0] || {};
        return this.courseStu.map(function (s, idx) {
          var essay = (ctx.E || []).filter(function (e) { return e.sid === s.sid && e.course === s.course && e.lesson === L; })[0] || null;
          var st = s.study[L] || { times: 0, last: null, state: '未学习', video: 0, qa: '0/5', once: 0, total: 0, steps: '0/5', acc: null };
          var submitted = !!essay && essay.status !== 'draft';
          return {
            idx: idx, sid: s.sid, name: s.name, phone: s.phone, cls: s.cls, refunded: s.refunded, course: s.course,
            st: st, essay: essay, submitted: submitted, reported: !!essay && essay.status === 'graded',
            vmin: Math.round(st.video * 0.12),
            stepText: (parseInt(st.steps) || 0) + '/' + (lesson.stepTotal || 5),
            done: allLs.filter(function (l) { return s.study[l.id] && s.study[l.id].state === '已完课'; }).length
          };
        });
      },
      listRows: function () {
        var f = this.lf;
        var rows = this.listAll.filter(function (r) {
          if (f.done !== 'all' && (r.st.state === '已完课') !== (f.done === 'yes')) return false;
          if (f.submit !== 'all' && r.submitted !== (f.submit === 'yes')) return false;
          if (f.report !== 'all' && r.reported !== (f.report === 'yes')) return false;
          var kw = (f.name || '').trim();
          if (kw && r.name.indexOf(kw) === -1 && String(r.sid).indexOf(kw) === -1 && String(r.phone).indexOf(kw) === -1) return false;
          return true;
        });
        /* 已提交未出报告的在前（提交早的在前，先到先看）；其余按学习状态 已完课 > 已学习 > 未学习 */
        return rows.sort(function (a, b) {
          var pa = a.submitted && !a.reported ? 0 : 1, pb = b.submitted && !b.reported ? 0 : 1;
          if (pa !== pb) return pa - pb;
          if (pa === 0 && a.essay.submit !== b.essay.submit) return a.essay.submit < b.essay.submit ? -1 : 1;
          var ra = RANK[a.st.state], rb = RANK[b.st.state];
          if (ra !== rb) return ra - rb;
          return a.idx - b.idx;
        });
      },
      listPage: function () { var s = (this.lf.page - 1) * this.lf.size; return this.listRows.slice(s, s + this.lf.size); }
    },
    watch: {
      'lf.lesson': function () { this.lf.page = 1; },
      /* 浮层里改班级：课节回到默认、回第一页 */
      classIds: function () { this.resetLesson(); this.lf.page = 1; },
      'lf.done': function () { this.lf.page = 1; },
      'lf.submit': function () { this.lf.page = 1; },
      'lf.report': function () { this.lf.page = 1; },
      'lf.name': function () { this.lf.page = 1; }
    },
    methods: {
      fake: function () { this.$act('fake', { m: FAKE }); },
      copy: function () { this.$message({ message: '复制成功', type: 'success' }); },
      mask: function (p) { p = String(p || ''); return p.length === 11 ? p.substring(0, 3) + '****' + p.substring(7) : p; },
      lessonName: function (ck, id) {
        var l = ((this.D.LESSONS || {})[ck] || []).filter(function (x) { return x.id === id; })[0];
        return l ? l.name : '-';
      },
      onSel: function (rows) { this.sel = rows; },
      openStu: function (row) { this.$emit('open-student', { sid: row.sid, name: row.name, cls: row.cls, phone: row.phone }); },
      /* 点手机号：打开该学员的跟进抽屉（学情数据页签展示 AI 作文课数据） */
      openFollow: function (row) { this.followRow = { sid: row.sid, name: row.name, phone: row.phone, cls: row.cls, course: row.course }; this.followShow = true; },
      rowClass: function (o) { return o.row.sid === this.hlSid ? 'x-ai-hl' : ''; },
      /* 小铃铛「作文求助」点开：定位到发起求助学生的作文草稿 */
      applyFocus: function (f) {
        if (!f) return;
        var self = this, lf = this.lf;
        lf.done = 'all'; lf.submit = 'all'; lf.report = 'all'; lf.nameInput = ''; lf.name = ''; lf.page = 1;
        lf.lesson = f.lesson; this.hlSid = f.sid;
        this.repMode = 'essay'; this.repId = f.essayId; this.repShow = true;
        this.$nextTick(function () { var el = document.querySelector('.x-ai-hl'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' }); });
      },
      doExport: function () { this.$message({ message: '已导出当前筛选结果 ' + this.listRows.length + ' 条（Excel，字段同列表各列）', type: 'success' }); },
      onSize: function (n) { this.lf.size = n; this.lf.page = 1; },
      onPage: function (n) { this.lf.page = n; },
      applyListName: function () { this.lf.name = this.lf.nameInput; },
      clearList: function () {
        var f = this.lf;
        f.done = 'all'; f.submit = 'all'; f.report = 'all'; f.nameInput = ''; f.name = ''; this.hlSid = '';
        this.resetLesson();
      },
      resetLesson: function () {
        var ls = this.lessons, def = ls.length ? ls[0].id : '';
        ls.forEach(function (l) { if (l.open) def = l.id; });
        this.lf.lesson = def;
      },
      /* 作文列「查看」：C 端渲染的作文内容（草稿 / 最终提交版） */
      viewEssay: function (e) { this.repMode = 'essay'; this.repId = e.id; this.repShow = true; },
      /* 操作列「查看批改报告」：学生端批改报告页（C 端样式） */
      viewReport: function (e) { this.repMode = 'report'; this.repId = e.id; this.repShow = true; },
      /* 操作列「查看批改结果」：新页签打开作文批改助手；所选教辅不是登录人时只读 */
      goGrade: function (e) { this.repShow = false; this.$act('openEssay', { id: e.id, ro: this.viewer !== (this.ctx.S || {}).me }); }
    }
  }, TEMPLATE));
})();
